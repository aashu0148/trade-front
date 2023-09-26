import React, { useEffect, useState } from "react";

import { getTodayTrades } from "apis/trade";

import styles from "./TradePage.module.scss";
import { getTimeFormatted } from "utils/util";

function TradePage({ socket }) {
  const [todayTrades, setTodayTrades] = useState([]);
  const [stockData, setStockData] = useState({});

  const fetchTodayTrades = async () => {
    const res = await getTodayTrades();

    if (!res) return;

    setTodayTrades(res.data);
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

    socket.on("stock-data", (data) => {
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
      <div className={styles.section}>
        <p className={styles.heading}>Today's trades</p>

        <table className={styles.table}>
          <tr>
            <th>Symbol</th>
            <th>Type</th>
            <th>Triggered at</th>
            <th>Target</th>
            <th>SL</th>
            <th>Time</th>
          </tr>
          {console.log(todayTrades)}
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
        <p className={styles.heading}>Last recorded data</p>

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
