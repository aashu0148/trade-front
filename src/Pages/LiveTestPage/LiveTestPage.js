import React, { useContext, useEffect, useRef, useState } from "react";
import { Pause, Play } from "react-feather";
import { toast } from "react-hot-toast";

import InputControl from "Components/InputControl/InputControl";
import InputSelect from "Components/InputControl/InputSelect/InputSelect";
import Button from "Components/Button/Button";
import Spinner from "Components/Spinner/Spinner";

import { getDateFormatted, getTimeFormatted } from "utils/util";
import { getBestStockPresets, getStocksData } from "apis/trade";
import { AppContext } from "App";

import styles from "./LiveTestPage.module.scss";

let timeout,
  chartSpeed = 100,
  currChartIndex = 200;
function LiveTestPage() {
  const candleSeries = useRef({});

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
  const [disabledButtons, setDisabledButtons] = useState({
    savePresetToDb: false,
    fetchStockData: false,
  });
  const [loadingPage, setLoadingPage] = useState(true);
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

  const pauseChart = () => {
    setChartDetails((prev) => ({ ...prev, running: false }));
    clearTimeout(timeout);
  };

  const playChart = () => {
    setChartDetails((prev) => ({ ...prev, running: true }));
    timeout = setTimeout(() => updateChartData(currChartIndex), chartSpeed);
  };

  function updateChartData(nextIndex) {
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

    timeout = setTimeout(() => updateChartData(nextIndex + 1), chartSpeed);
  }

  const handleClearChart = () => {
    const chartElem = document.querySelector("#chart");

    if (!chartElem) return;
    chartElem.innerHTML = "";
    candleSeries.current = null;
    currChartIndex = 200;

    clearTimeout(timeout);
    setChartDetails({});
  };

  const handleStartTest = () => {
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
            <Button onClick={handleStartTest}>Start chart</Button>
          )}
        </div>
      ) : (
        ""
      )}

      <div className={styles.chartOuter}>
        {chartDetails.built ? tooltipDiv : ""}
        <div
          id="chart"
          className={`${styles.chart} ${
            appContext.mobileView ? styles.shortChart : ""
          }`}
        />
      </div>
    </div>
  );
}

export default LiveTestPage;
