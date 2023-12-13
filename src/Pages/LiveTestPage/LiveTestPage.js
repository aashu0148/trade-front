import React, { useContext, useEffect, useRef, useState } from "react";
import { Pause, Play } from "react-feather";
import { toast } from "react-hot-toast";

import InputControl from "Components/InputControl/InputControl";
import InputSelect from "Components/InputControl/InputSelect/InputSelect";
import Button from "Components/Button/Button";
import Spinner from "Components/Spinner/Spinner";
import TradesModal from "Pages/CalendarPage/TradesModal/TradesModal";
import TradeApproveModal from "Pages/TradePage/TradeApproveModal/TradeApproveModal";

import {
  getDateFormatted,
  getTimeFormatted,
  generateUniqueString,
} from "utils/util";
import { takeTrades } from "utils/tradeUtil";
import { getBestStockPresets, getStocksData } from "apis/trade";
import { AppContext } from "App";

import styles from "./LiveTestPage.module.scss";

let timeout,
  chartSpeed = 50,
  currChartIndex = 200,
  isChartStrictlyPaused = false;
function LiveTestPage() {
  const candleSeries = useRef({});
  const vwapSeries = useRef({});
  const psarSeries = useRef({});
  const tradesRef = useRef([]);

  const appContext = useContext(AppContext);
  const [tooltipDetails, setTooltipDetails] = useState({
    style: {},
    data: {},
    close: "",
    index: "",
    date: "",
  });
  const [stocksData, setStocksData] = useState({});
  const [selectedStock, setSelectedStock] = useState({});
  const [stockPresets, setStockPresets] = useState({});
  const [loadingPage, setLoadingPage] = useState(true);
  const [tradesTaken, setTradesTaken] = useState([]);
  const [tradeToApprove, setTradeToApprove] = useState({});
  const [disabledButtons, setDisabledButtons] = useState({
    savePresetToDb: false,
    fetchStockData: false,
  });
  const [timeFrame, setTimeFrame] = useState({
    start: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });
  const [chartDetails, setChartDetails] = useState({
    built: false,
    running: false,
  });

  const availableStocks = [
    ...Object.keys(stocksData).map((key) => ({
      value: key,
      label: `${key} | ${
        stocksData[key]["5"].c[stocksData[key]["5"].c.length - 1]
      }`,
      data: stocksData[key],
    })),
  ].filter((item) => item.data["5"]?.c?.length);

  const handleApprovalDecision = (values, isApproved) => {
    const trade = {
      ...tradeToApprove,
      ...values,
      isApproved: isApproved ? true : false,
    };
    const tempTrades = [...tradesTaken];
    tempTrades[tempTrades.length - 1] = { ...trade };

    setTradeToApprove({});
    setTradesTaken(tempTrades);
    isChartStrictlyPaused = false;
    currChartIndex++;
    playChart();
  };

  const analyzeTakenTrades = () => {
    const checkTradeCompletion = (
      triggerPrice,
      priceData,
      target,
      sl,
      isSellTrade = false
    ) => {
      let statusNumber = 0,
        tradeHigh,
        tradeLow;
      if (
        !triggerPrice ||
        !target ||
        !sl ||
        !Array.isArray(priceData?.c) ||
        !priceData?.c?.length
      )
        return {
          statusNumber,
          tradeHigh,
          tradeLow,
        };

      tradeHigh = priceData.h[0];
      tradeLow = priceData.l[0];
      for (let i = 0; i < priceData.c.length; ++i) {
        const l = priceData.l[i];
        const h = priceData.h[i];

        if (h > tradeHigh) tradeHigh = h;
        else if (l < tradeLow) tradeLow = l;

        if (
          statusNumber == 0 &&
          ((isSellTrade && l < target) || (!isSellTrade && h > target))
        ) {
          statusNumber = 1;
        }
        if (
          statusNumber == 0 &&
          ((isSellTrade && h >= sl) || (!isSellTrade && l <= sl))
        ) {
          statusNumber = -1;
        }
      }

      return {
        statusNumber,
        tradeHigh,
        tradeLow,
      };
    };

    tradesRef.current.forEach((trade) => {
      if (
        trade.status == "profit" ||
        trade.status == "loss" ||
        trade.status == "unfinished"
      )
        return;

      const currTradeHigh = trade.tradeHigh || 0;
      const currTradeLow = trade.tradeLow || 9999999;
      const isSellTrade = trade.type.toLowerCase() == "sell";

      const data = selectedStock.data ? selectedStock.data["5"] : {};
      if (!data?.c?.length) return;

      const tradeTimeInSec = trade.time / 1000;
      const timeIndex = data.t.findIndex((t) => t >= tradeTimeInSec);
      if (timeIndex < 0) return;

      const { statusNumber, tradeHigh, tradeLow } = checkTradeCompletion(
        trade.startPrice,
        {
          c: data.c.slice(timeIndex, currChartIndex + 1),
          o: data.o.slice(timeIndex, currChartIndex + 1),
          h: data.h.slice(timeIndex, currChartIndex + 1),
          l: data.l.slice(timeIndex, currChartIndex + 1),
          t: data.t.slice(timeIndex, currChartIndex + 1),
        },
        trade.target,
        trade.sl,
        isSellTrade
      );

      const currentTime = data.t[currChartIndex + 1];
      const currentDate = new Date(currentTime * 1000).toLocaleDateString(
        "en-in"
      );

      const status =
        trade.date !== currentDate
          ? "unfinished"
          : statusNumber == 1
          ? "profit"
          : statusNumber == -1
          ? "loss"
          : "taken";

      if (status == trade.status) {
        if (tradeHigh !== currTradeHigh || tradeLow !== currTradeLow) {
          setTradesTaken((prev) =>
            prev.map((item) =>
              item._id == trade._id ? { ...item, tradeHigh, tradeLow } : item
            )
          );
        }
        return;
      }

      // update the trade status
      setTradesTaken((prev) =>
        prev.map((item) =>
          item._id == trade._id
            ? { ...item, tradeHigh, tradeLow, status }
            : item
        )
      );
    });
  };

  const takeTradeOnNewData = async () => {
    const preset = stockPresets[selectedStock.value] || {};
    const stockData = {
      5: {
        t: selectedStock.data["5"].t.slice(0, currChartIndex + 1),
        v: selectedStock.data["5"].v.slice(0, currChartIndex + 1),
        c: selectedStock.data["5"].c.slice(0, currChartIndex + 1),
        o: selectedStock.data["5"].o.slice(0, currChartIndex + 1),
        h: selectedStock.data["5"].h.slice(0, currChartIndex + 1),
        l: selectedStock.data["5"].l.slice(0, currChartIndex + 1),
      },
    };
    const { trades, indicators } = await takeTrades(stockData, preset, true);

    vwapSeries.current.update({
      time: stockData["5"].t[currChartIndex],
      value: indicators.vwap[currChartIndex],
    });
    psarSeries.current.update({
      time: stockData["5"].t[currChartIndex],
      value: indicators.psar[currChartIndex],
    });

    if (!trades.length) {
      // console.log(`🟡No trades to take!`);
      return;
    }

    const isAllowedToTakeThisTrade = () => {
      const unfinishedSimilarTrades = Array.from(tradesRef.current).filter(
        (item) =>
          item.status == "taken" &&
          (item.isApproved == true || item.isApproved == undefined)
      );

      return unfinishedSimilarTrades.length > 0 ? false : true;
    };

    const tradeObj = {
      _id: generateUniqueString(),
      name: selectedStock.value,
      symbol: selectedStock.value,
      ...trades[0],
      status: "taken",
      time: trades[0]?.time ? trades[0].time * 1000 : Date.now(),
    };
    tradeObj.date = new Date(tradeObj.time).toLocaleDateString("en-in");

    if (!isAllowedToTakeThisTrade()) return;

    setTradesTaken((prev) => [...prev, tradeObj]);
    pauseChart();
    setTradeToApprove(tradeObj);
    isChartStrictlyPaused = true;
    console.log("🟢Trade taken");
  };

  async function updateChartData(nextIndex) {
    currChartIndex = nextIndex;
    const selectedStockDataLength = selectedStock.data["5"]
      ? selectedStock.data["5"].c?.length || 0
      : 0;

    if (!selectedStockDataLength || selectedStockDataLength < nextIndex) {
      // stop the chart now
      setChartDetails({});
      return;
    }

    const data = {
      time: selectedStock.data["5"].t[nextIndex],
      high: selectedStock.data["5"].h[nextIndex],
      low: selectedStock.data["5"].l[nextIndex],
      open: selectedStock.data["5"].o[nextIndex],
      close: selectedStock.data["5"].c[nextIndex],
    };
    if (!candleSeries.current?.update) return;

    candleSeries.current.update(data);

    await takeTradeOnNewData();
    analyzeTakenTrades();

    if (!isChartStrictlyPaused)
      timeout = setTimeout(() => updateChartData(nextIndex + 1), chartSpeed);
  }

  function pauseChart() {
    setChartDetails((prev) => ({ ...prev, running: false }));
    clearTimeout(timeout);
  }

  function playChart() {
    if (isChartStrictlyPaused) return;

    setChartDetails((prev) => ({ ...prev, running: true }));
    timeout = setTimeout(() => updateChartData(currChartIndex), chartSpeed);
  }

  const handleClearChart = () => {
    const chartElem = document.querySelector("#chart");

    if (!chartElem) return;
    chartElem.innerHTML = "";
    candleSeries.current = null;
    currChartIndex = 200;

    clearTimeout(timeout);
    setChartDetails({});
    setTradeToApprove([]);
    setTradesTaken([]);
    isChartStrictlyPaused = false;
  };

  const handleStartChart = async () => {
    if (!selectedStock.data["5"]) return;

    const chartElem = document.querySelector("#chart");

    if (!chartElem) return;
    chartElem.innerHTML = "";

    const width = chartElem.clientWidth;
    const height = chartElem.clientHeight;

    const { createChart } = window.LightweightCharts;

    const chart = createChart(chartElem, {
      width,
      height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      pane: 0,
    });

    const stockData = {
      5: {
        t: selectedStock.data["5"].t.slice(0, currChartIndex + 1),
        v: selectedStock.data["5"].v.slice(0, currChartIndex + 1),
        c: selectedStock.data["5"].c.slice(0, currChartIndex + 1),
        o: selectedStock.data["5"].o.slice(0, currChartIndex + 1),
        h: selectedStock.data["5"].h.slice(0, currChartIndex + 1),
        l: selectedStock.data["5"].l.slice(0, currChartIndex + 1),
      },
    };
    const { indicators } = await takeTrades(stockData, {
      additionalIndicators: { vwap: true, psar: true, sma: true },
    });

    candleSeries.current = chart.addCandlestickSeries({
      pane: 0,
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    const timeArr = selectedStock.data["5"].t;
    candleSeries.current.setData(
      selectedStock.data["5"].c.slice(0, 201).map((item, i) => ({
        time: selectedStock.data["5"].t[i],
        high: selectedStock.data["5"].h[i],
        low: selectedStock.data["5"].l[i],
        open: selectedStock.data["5"].o[i],
        close: selectedStock.data["5"].c[i],
      }))
    );

    // update tooltip
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartElem.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartElem.clientHeight
      ) {
        setTooltipDetails((prev) => ({
          ...prev,
          style: { ...prev.style, opacity: 0 },
        }));
      } else {
        // time will be in the same format that we supplied to setData.
        // thus it will be YYYY-MM-DD
        const dateStr = param.time;
        const data = param.seriesPrices.get(candleSeries.current);
        const price = data?.value !== undefined ? data.value : data.close;

        const y = param.point.y;
        let left = param.point.x;
        if (left > chartElem.clientWidth) {
          left = param.point.x;
        }

        let top = y;
        if (top > chartElem.clientHeight) {
          top = y;
        }

        const style = {
          opacity: "1",
          top: top + "px",
          left: left + "px",
        };

        const index = timeArr.findIndex((item) => item == dateStr);

        setTooltipDetails({
          style,
          data,
          index,
          close: price,
          date: `${getDateFormatted(
            dateStr * 1000,
            true,
            true
          )} ${getTimeFormatted(dateStr * 1000)}`,
        });
      }
    });

    // vwap
    vwapSeries.current = chart.addLineSeries({
      priceFormat: { type: "price" },
      color: "orange",
      lineWidth: 2,
      pane: 0,
    });
    vwapSeries.current.setData(
      stockData["5"].c.map((_e, i) => ({
        time: stockData["5"].t[i],
        value: indicators.vwap ? indicators.vwap[i] : "",
      }))
    );

    // psar
    psarSeries.current = chart.addLineSeries({
      priceFormat: { type: "price" },
      color: "gray",
      lineWidth: 2,
      pane: 0,
    });
    psarSeries.current.setData(
      stockData["5"].c.map((_e, i) => ({
        time: stockData["5"].t[i],
        value: indicators.psar ? indicators.psar[i] : "",
      }))
    );

    chart.timeScale().fitContent();
    currChartIndex = 200;
    setChartDetails({
      running: true,
      built: true,
    });

    playChart();
  };

  const fetchStockData = async () => {
    if (timeFrame.start > timeFrame.end) {
      toast.error("start date must be smaller than end date");
      return;
    }
    if (
      timeFrame.end.getTime() - timeFrame.start.getTime() >
      320 * 24 * 60 * 60 * 1000
    ) {
      toast.error("Interval can not be greater than 1 year");
      return;
    }

    setDisabledButtons((prev) => ({ ...prev, fetchStockData: true }));
    const res = await getStocksData(
      timeFrame.start.getTime(),
      timeFrame.end.getTime()
    );
    setDisabledButtons((prev) => ({ ...prev, fetchStockData: false }));
    setLoadingPage(false);
    if (typeof res?.data !== "object" || !res?.data) return;

    toast.success("new stock data filled");
    setStocksData(res.data);
    setSelectedStock({});
  };

  const fetchBestStockPreset = async () => {
    const res = await getBestStockPresets();
    if (!Array.isArray(res?.data)) return;

    setStockPresets(
      res.data.reduce((acc, curr) => {
        acc[curr.symbol] = curr.preset;
        return acc;
      }, {})
    );
  };

  useEffect(() => {
    tradesRef.current = [...tradesTaken];
  }, [tradesTaken]);

  useEffect(() => {
    handleClearChart();
  }, [selectedStock]);

  useEffect(() => {
    fetchStockData();
    fetchBestStockPreset();

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const getTrimmedPrice = (txt) => {
    if (typeof txt == "number") return txt.toFixed(2);
    else return txt;
  };

  const tooltipDiv = (
    <div className={styles.tooltip} style={{ ...tooltipDetails.style }}>
      {["close", "open", "high", "low", "date"].map((item) => (
        <div className={styles.item} key={item}>
          <label>{item}</label>
          <span>
            {getTrimmedPrice(tooltipDetails[item] || tooltipDetails.data[item])}
          </span>
        </div>
      ))}
    </div>
  );

  return loadingPage ? (
    <div className="spinner-container">
      <Spinner />
    </div>
  ) : (
    <div className={styles.container}>
      <p className="heading">Test stock like its LIVE</p>

      <div className={`row ${styles.topBar}`}>
        <InputSelect
          placeholder="Select a stock"
          label="Select stock"
          options={availableStocks.map((item) => ({
            label: item.label,
            value: item.value,
          }))}
          value={
            selectedStock.value
              ? { label: selectedStock.label, value: selectedStock.value }
              : ""
          }
          onChange={(e) => {
            setSelectedStock(
              availableStocks.find((item) => item.value == e.value)
            );
          }}
        />

        <InputControl
          placeholder="Select start date"
          label="Start date"
          datePicker
          datePickerProps={{
            maxDate: new Date(),
          }}
          value={timeFrame.start}
          onChange={(date) =>
            setTimeFrame((prev) => ({ ...prev, start: date }))
          }
        />

        <InputControl
          placeholder="Select end date"
          label="End date"
          datePicker
          datePickerProps={{
            maxDate: new Date(),
          }}
          value={timeFrame.end}
          onChange={(date) => setTimeFrame((prev) => ({ ...prev, end: date }))}
        />

        <Button
          className={styles.button}
          onClick={fetchStockData}
          disabled={disabledButtons.fetchStockData}
          useSpinnerWhenDisabled
        >
          Fetch new data
        </Button>
      </div>

      {selectedStock?.data ? (
        <div className={styles.buttons}>
          {chartDetails.built ? (
            <>
              {chartDetails.running ? (
                <Button outlineButton onClick={pauseChart}>
                  <Pause />
                </Button>
              ) : (
                <Button onClick={playChart}>
                  <Play />
                </Button>
              )}

              <Button outlineButton onClick={handleClearChart}>
                Clear chart
              </Button>
            </>
          ) : (
            <Button onClick={handleStartChart}>Start chart</Button>
          )}
        </div>
      ) : (
        ""
      )}

      <div className={styles.body}>
        <div className={styles.chartOuter}>
          {chartDetails.built ? (
            <div className={styles.legends}>
              <label>
                VWAP:
                <span
                  className={styles.swatch}
                  style={{ backgroundColor: "orange" }}
                />
              </label>
              <label>
                PSAR:
                <span
                  className={styles.swatch}
                  style={{ backgroundColor: "gray" }}
                />
              </label>
            </div>
          ) : (
            ""
          )}

          {chartDetails.built ? tooltipDiv : ""}
          <div
            id="chart"
            className={`${styles.chart} ${
              appContext.mobileView ? styles.shortChart : ""
            }`}
          />
        </div>

        <div>
          <div className={styles.tradeDiv}>
            {tradeToApprove?.symbol ? (
              <TradeApproveModal
                className={styles.tradeForm}
                tradeDetails={tradeToApprove}
                lrp={
                  selectedStock.data && selectedStock.data["5"]
                    ? selectedStock.data["5"].c[currChartIndex]
                    : ""
                }
                onDecision={handleApprovalDecision}
                staticModal
                withoutChart
                withoutModal
              />
            ) : (
              ""
            )}
          </div>
        </div>
      </div>

      <TradesModal
        lrps={{
          [selectedStock.value]:
            selectedStock.data && selectedStock.data["5"]
              ? selectedStock.data["5"].c[currChartIndex]
              : "",
        }}
        className={styles.allTrades}
        trades={tradesTaken}
        showDateInCard
        withoutModal
        hideTime
      />
    </div>
  );
}

export default LiveTestPage;
