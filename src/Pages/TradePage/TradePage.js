import React, { useEffect, useRef, useState } from "react";

import { getTodayTrades } from "apis/trade";
import { getTimeFormatted } from "utils/util";
import bubbleSound from "assets/bubble.mp3";
import secSound from "assets/10 Sec.mp3";

import styles from "./TradePage.module.scss";

let lastTradesLength = 0;
function TradePage({ socket }) {
  const audioElem = useRef();

  const [todayTrades, setTodayTrades] = useState([]);
  const [stockData, setStockData] = useState({});

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
    });

    socket.on("stock-data", (data) => {
      if (!data?.date) return;

      setStockData(data);
    });
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
            <th>Symbol</th>
            <th>Type</th>
            <th>Trigger</th>
            <th>Target</th>
            <th>SL</th>
            <th>Time</th>
          </tr>
          {todayTrades.map((item) => (
            <tr key={item.symbol}>
              <td className={styles.name}>{item.name}</td>
              <td className={styles.type}>{item.type}</td>
              <td>{parseFloat(item.startPrice).toFixed(1)}</td>
              <td className={styles.target}>
                {parseFloat(item.target).toFixed(1)}
              </td>
              <td className={styles.sl}>{parseFloat(item.sl).toFixed(1)}</td>
              <td className={styles.time}>{getTimeFormatted(item.time)}</td>
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
          {parsedStockData.map((item) => (
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
