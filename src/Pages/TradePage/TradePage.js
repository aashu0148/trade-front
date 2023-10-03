import React, { useEffect, useRef, useState } from "react";

import { getTodayTrades } from "apis/trade";
import { getTimeFormatted } from "utils/util";
import { arrowDownIcon, arrowUpIcon } from "utils/svgs";
import bubbleSound from "assets/bubble.mp3";
import secSound from "assets/10 Sec.mp3";

import styles from "./TradePage.module.scss";

const randomColors = [
  "#EAE6CA",
  "#84C3BE",
  "#DC9D00",
  "#C93C20",
  "#84C3BE",
  "#C35831",
];
let lastTradesLength = 0;
function TradePage({ socket }) {
  const audioElem = useRef();

  const [todayTrades, setTodayTrades] = useState([]);
  const [stockData, setStockData] = useState({ date: "", data: {} });

  const fetchTodayTrades = async () => {
    const res = await getTodayTrades();

    if (!res?.data) return;

    const newTrades = res.data;
    setTodayTrades(newTrades);

    if (lastTradesLength && newTrades.length !== lastTradesLength) {
      console.log("NEW TRADE TAKEN");

      audioElem.current.src = secSound;
      audioElem.current.play();
    }
    lastTradesLength = newTrades.length;
  };

  const handleSocketEvents = () => {
    socket.on("joined", () => {
      console.log("🔵 trades room joined");
    });

    socket.on("left", () => {
      console.log("🔴 left trades room");
    });

    socket.on("trade-taken", () => {
      fetchTodayTrades();
    });

    socket.on("test", (data) => {
      console.log(data);

      if (Array.isArray(data) && data[0]?.analytic) {
        console.log(
          data
            .map((item) => ({
              symbol: item.symbol,
              MAIN: item.analytic.netSignal,
              PRICE: item.analytic.price,
              PP: item.analytic.possibleProfit,
              R: item.analytic.nearestResistance,
              S: item.analytic.nearestSupport,
              ...item.analytic.mainSignals,
              ...item.analytic.otherSignals,
            }))
            .map((item) =>
              Object.keys(item)
                .map((a) => `${a}: ${item[a]}`)
                .join(" | ")
                .slice(8)
                .replace("PRICE: ", "")
                .replaceAll("undefined", "_")
                .replace("MAIN: ", "")
                .replace("rsiSignal", "rsi")
                .replace("macdSignal", "macd")
                .replace("srSignal", "sr")
                .replace("bollingerBandSignal", "bb")
                .replace("smaSignal", "sma")
                .replace("psarSignal", "psar")
                .replace("willRSignal", "willR")
                .replace("mfiSignal", "mfi")
                .replace("vwapSignal", "vwap")
            )
        );
      }
    });

    socket.on("stock-data", (data) => {
      if (!data?.date) return;

      setStockData(data);
    });
  };

  const isGoingProfitable = (trade) => {
    const isBuyTrade = trade.type.toLowerCase() === "buy";
    const triggerPrice = parseFloat(trade.startPrice);
    const currPrice = stockData.data[trade.symbol]?.c
      ? stockData.data[trade.symbol].c[
          stockData.data[trade.symbol].c.length - 1
        ]
      : "";

    if (
      (isBuyTrade && currPrice >= triggerPrice) ||
      (!isBuyTrade && currPrice <= triggerPrice)
    )
      return true;

    return false;
  };

  useEffect(() => {
    fetchTodayTrades();
    if (socket) handleSocketEvents();
  }, [socket]);

  const parsedStockData =
    typeof stockData?.data == "object"
      ? Object.keys(stockData.data).map((item) => ({
          symbol: item,
          data: {
            t: stockData.data[item].t[stockData.data[item].t.length - 1],
            c: stockData.data[item].c[stockData.data[item].c.length - 1],
            l: stockData.data[item].l[stockData.data[item].l.length - 1],
            v: stockData.data[item].v[stockData.data[item].v.length - 1],
            h: stockData.data[item].h[stockData.data[item].h.length - 1],
            o: stockData.data[item].o[stockData.data[item].o.length - 1],
          },
        }))
      : [];

  return (
    <div className={styles.container}>
      <audio ref={audioElem} />

      <div className={styles.section}>
        <p className={styles.heading}>Today's trades</p>

        <table className={styles.table}>
          <tr>
            <th></th>
            <th>Symbol</th>
            <th>Type</th>
            <th>Trigger</th>
            <th>LRP</th>
            <th>Target</th>
            <th>SL</th>
            <th>Time</th>
            <th>Status</th>
          </tr>
          {todayTrades
            .sort((a, b) => (a.time < b.time ? -1 : 1))
            .map((item, i) => (
              <tr
                key={item.symbol + i}
                className={`${
                  item.status == "profit"
                    ? styles.profitTrade
                    : item.status == "loss"
                    ? styles.lossTrade
                    : isGoingProfitable(item)
                    ? styles.goingProfit
                    : styles.goingLoss
                }`}
              >
                <td
                  className={`${styles.icon} ${
                    isGoingProfitable(item) ? styles.green : styles.red
                  }`}
                >
                  {item.status === "profit" ? (
                    <span>🟢</span>
                  ) : item.status === "loss" ? (
                    <span>🔴</span>
                  ) : isGoingProfitable(item) ? (
                    arrowUpIcon
                  ) : (
                    arrowDownIcon
                  )}
                </td>
                <td className={styles.name}>{item.name}</td>
                <td className={styles.type}>{item.type}</td>
                <td>{parseFloat(item.startPrice).toFixed(1)}</td>
                <td>
                  {parseFloat(
                    stockData.data[item.symbol]?.c
                      ? stockData.data[item.symbol].c[
                          stockData.data[item.symbol].c.length - 1
                        ]
                      : ""
                  ).toFixed(1)}
                </td>
                <td className={styles.target}>
                  {parseFloat(item.target).toFixed(1)}
                </td>
                <td className={styles.sl}>{parseFloat(item.sl).toFixed(1)}</td>
                <td className={styles.time}>{getTimeFormatted(item.time)}</td>
                <td
                  className={`${styles.status} ${
                    item.status == "profit"
                      ? styles.green
                      : item.status == "loss"
                      ? styles.red
                      : ""
                  }`}
                >
                  {item.status}
                </td>
              </tr>
            ))}
        </table>
      </div>
      <div className={styles.section}>
        <p className={styles.heading}>
          Last recorded data (updates every 5 min)
        </p>

        <table className={styles.table}>
          <tr>
            <th>Symbol</th>
            <th>Price</th>
            <th>Time</th>
          </tr>
          {parsedStockData
            .sort((a, b) => (a.symbol < b.symbol ? -1 : 1))
            .map((item) => (
              <tr key={item.symbol}>
                <td className={styles.name}>{item.symbol}</td>
                <td className={styles.price}>{item.data.c}</td>
                <td className={styles.time}>
                  {getTimeFormatted(item.data.t * 1000)}
                </td>
              </tr>
            ))}
        </table>
      </div>
    </div>
  );
}

export default TradePage;
