import React, { useContext, useEffect, useRef, useState } from "react";
import { Pause, Play } from "react-feather";
import { toast } from "react-hot-toast";

import InputControl from "Components/InputControl/InputControl";
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
import { analyzeTradesForCompletion } from "utils/tradeMaintenanceUtil";

import styles from "./LiveMarketPage.module.scss";

let timeout,
  currentCandleIndex = 200,
  currentDayString,
  isStrictlyPaused = false;
function LiveMarketPage() {
  const tradesRef = useRef([]);

  const [stocksData, setStocksData] = useState({});
  const [stockPresets, setStockPresets] = useState({});
  const [loadingPage, setLoadingPage] = useState(true);
  const [tradesTaken, setTradesTaken] = useState([]);
  const [disabledButtons, setDisabledButtons] = useState({
    savePresetToDb: false,
    fetchStockData: false,
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [timeFrame, setTimeFrame] = useState({
    start: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });
  const [marketStatus, setMarketStatus] = useState({
    started: false,
    running: false,
  });
  const [tradesForApproval, setTradesForApproval] = useState([]);

  const handleApprovalDecision = ({ values, isApproved, trade: tradeObj }) => {
    const stockData = stocksData[tradeObj.symbol]["5"] || {};
    const prices = {
      high: stockData.h[currentCandleIndex - 1],
      low: stockData.l[currentCandleIndex - 1],
    };

    const trade = {
      ...tradeObj,
      ...values,
      isApproved: isApproved ? true : false,
    };

    if (trade.startPrice > prices.low && trade.startPrice < prices.high)
      trade.status = "taken";
    else {
      trade.status = "limit";
      trade.limitIndex = currentCandleIndex;
    }

    const newTradesForApproval = tradesForApproval.filter(
      (item) => item._id !== trade._id
    );
    setTradesForApproval(newTradesForApproval);
    setTradesTaken((prev) => [...prev, trade]);
    isStrictlyPaused = false;

    if (!newTradesForApproval.length) {
      playMarket();
    }
  };

  function pauseMarket() {
    setMarketStatus((prev) => ({ ...prev, running: false }));
    clearTimeout(timeout);
  }

  function playMarket() {
    if (isStrictlyPaused) return;

    setMarketStatus((prev) => ({ ...prev, running: true }));
    timeout = setTimeout(() => updateMarket(currentCandleIndex));
  }

  const getStockDataTillCurrentIndex = (
    symbol,
    dataLength = 1000,
    oneShort = false
  ) => {
    let startIdx = currentCandleIndex - dataLength;
    if (startIdx < 0) startIdx = 0;
    const endIdx = currentCandleIndex + (oneShort ? 0 : 1);

    const data = {
      5: {
        t: stocksData[symbol]["5"].t.slice(startIdx, endIdx),
        v: stocksData[symbol]["5"].v.slice(startIdx, endIdx),
        c: stocksData[symbol]["5"].c.slice(startIdx, endIdx),
        o: stocksData[symbol]["5"].o.slice(startIdx, endIdx),
        h: stocksData[symbol]["5"].h.slice(startIdx, endIdx),
        l: stocksData[symbol]["5"].l.slice(startIdx, endIdx),
      },
    };

    return data;
  };

  const updateMarket = async () => {
    const dateTimestamp =
      Object.values(stocksData)[0]["5"].t[currentCandleIndex];
    const dateStr = new Date(dateTimestamp * 1000).toLocaleDateString("en-in");

    if (dateStr !== currentDayString) {
      // next day started, stop the market
      handleStopMarket();
      return;
    }
    const analyzedTrades = analyzeTradesForCompletion(
      tradesRef.current,
      currentCandleIndex,
      stocksData
    );
    if (analyzedTrades?.length) setTradesTaken(analyzedTrades);

    const allSymbols = Object.keys(stocksData);

    const allTakenTrades = await Promise.all(
      allSymbols.map((s) => {
        const bestPresetForStock = stockPresets[s] || {};
        const data = getStockDataTillCurrentIndex(s, 400);

        return takeTrades(data, bestPresetForStock, true);
      })
    );

    const allTrades = allSymbols.map((s, i) => {
      const t = allTakenTrades[i].trades;

      return {
        symbol: s,
        trade: t.length ? t[0] : {},
        preset: stockPresets[s] || {},
      };
    });
    const trades = allTrades.filter((item) => item.trade?.startPrice);

    ++currentCandleIndex;
    if (!trades.length) {
      timeout = setTimeout(updateMarket, 300);
      return;
    }

    const isAllowedToTakeThisTrade = (trade) => {
      const unfinishedSimilarTrades = tradesRef.current.filter(
        (item) =>
          (item.status == "taken" &&
            item.symbol == trade.symbol &&
            (item.isApproved == true || item.isApproved == undefined)) ||
          (item.symbol == trade.symbol &&
            item.status == "limit" &&
            item.type == trade.type)
      );

      return unfinishedSimilarTrades.length > 0 ? false : true;
    };

    const newlyTakenTrades = [];
    for (let i = 0; i < trades.length; ++i) {
      const item = trades[i];

      const tradeObj = {
        _id: generateUniqueString(10),
        name: item.symbol,
        symbol: item.symbol,
        ...item.trade,
        status: "taken",
        time: item.trade?.time ? item.trade.time * 1000 : Date.now(),
        preset: item.preset,
      };
      tradeObj.date = new Date(tradeObj.time).toLocaleDateString("en-in");

      if (!isAllowedToTakeThisTrade(tradeObj)) continue;

      newlyTakenTrades.push(tradeObj);
    }

    if (newlyTakenTrades.length) {
      setTradesForApproval(newlyTakenTrades);
      pauseMarket();
      isStrictlyPaused = true;
    } else {
      timeout = setTimeout(updateMarket, 100);
    }
  };

  function handleStopMarket() {
    setMarketStatus({ running: false, started: false });
    setTradesForApproval([]);
    clearTimeout(timeout);
  }

  const handleStartMarket = () => {
    if (!selectedDate) return;

    const firstStock = Object.values(stocksData)[0];
    const dateStr = selectedDate.toLocaleDateString("en-in");

    const dateStartIndex = firstStock["5"].t.findIndex(
      (t) => new Date(t * 1000).toLocaleDateString("en-in") == dateStr
    );

    if (dateStartIndex < 0) {
      toast.error("Market holiday");
      return;
    }

    setTradesTaken([]);
    currentDayString = dateStr;
    currentCandleIndex = dateStartIndex;
    setMarketStatus({
      started: true,
      running: true,
    });

    timeout = setTimeout(updateMarket, 200);
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

  const getFormattedDateAndTime = (timestamp) => {
    return `${getTimeFormatted(timestamp)}, ${getDateFormatted(
      timestamp,
      true
    )}`;
  };

  useEffect(() => {
    tradesRef.current = [...tradesTaken];
  }, [tradesTaken]);

  useEffect(() => {
    if (!Object.keys(stocksData).length) fetchStockData();
    fetchBestStockPreset();

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const stocksLrps = Object.keys(stocksData).reduce((acc, key) => {
    acc[key] = stocksData[key]["5"].c[currentCandleIndex];
    return acc;
  }, {});

  return loadingPage ? (
    <div className="spinner-container">
      <Spinner />
    </div>
  ) : (
    <div className={styles.container}>
      <p className="heading">Test previous market days like its LIVE</p>

      <div className={`row ${styles.topBar}`}>
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

      {Object.keys(stocksData).length ? (
        <div className={styles.controls}>
          <InputControl
            placeholder="Choose date"
            label="Choose trading date"
            datePicker
            datePickerProps={{
              minDate: new Date(
                timeFrame.start.getTime() + 7 * 24 * 60 * 60 * 1000
              ),
              maxDate: new Date(),
            }}
            containerStyles={{ width: "400px", maxWidth: "100%" }}
            value={selectedDate}
            onChange={(date) => setSelectedDate(date)}
          />

          {marketStatus.started ? (
            <>
              {marketStatus.running ? (
                <Button
                  className={styles.button}
                  outlineButton
                  onClick={pauseMarket}
                >
                  <Pause />
                </Button>
              ) : (
                <Button className={styles.button} onClick={playMarket}>
                  <Play />
                </Button>
              )}

              <Button
                className={styles.button}
                onClick={handleStopMarket}
                useSpinnerWhenDisabled
              >
                Stop market
              </Button>
            </>
          ) : (
            <Button
              className={styles.button}
              onClick={handleStartMarket}
              useSpinnerWhenDisabled
            >
              Start market
            </Button>
          )}
        </div>
      ) : (
        ""
      )}

      {marketStatus.started && (
        <p className="title" style={{ textAlign: "center" }}>
          {getFormattedDateAndTime(
            Object.values(stocksData)[0]["5"].t[currentCandleIndex] * 1000
          )}
        </p>
      )}

      <div className={styles.approvalBox}>
        {tradesForApproval?.length ? (
          <TradeApproveModal
            bodyClassName={styles.formBody}
            className={styles.tradeForm}
            tradeDetails={tradesForApproval[0]}
            stockData={getStockDataTillCurrentIndex(
              tradesForApproval[0].symbol,
              700,
              true
            )}
            stockPreset={stockPresets[tradesForApproval[0].symbol]}
            lrp={stocksLrps[tradesForApproval[0].symbol]}
            onDecision={(values, isApproved) =>
              handleApprovalDecision({
                trade: tradesForApproval[0],
                values,
                isApproved,
              })
            }
            staticModal
            withoutModal
          />
        ) : (
          ""
        )}
      </div>

      <TradesModal
        lrps={stocksLrps}
        className={styles.allTrades}
        trades={tradesTaken}
        showDateInCard
        withoutModal
        hideTime
      />
    </div>
  );
}

export default LiveMarketPage;
