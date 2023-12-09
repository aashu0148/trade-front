import React, { useEffect, useRef, useState } from "react";
import { AlertCircle } from "react-feather";

import TradeApproveModal from "./TradeApproveModal/TradeApproveModal";
import StockDetailsModal from "./StockDetailsModal/StockDetailsModal";

import { getAllTrades, getBestStockPresets, getTodayTrades } from "apis/trade";
import { getRandomNumberBetween, getTimeFormatted } from "utils/util";
import { arrowDownIcon, arrowUpIcon } from "utils/svgs";
import bubbleSound from "assets/bubble.mp3";
import secSound from "assets/10 Sec.mp3";

import styles from "./TradePage.module.scss";

const colors = {
  red: "#fa3f35",
  green: "#21ac56",
  blue: "#27a5f3",
  primary: "#1c65db",
};
let lastTradesLength = 0;
function TradePage({ socket }) {
  const audioElem = useRef();

  const [todayTrades, setTodayTrades] = useState([]);
  const [stockData, setStockData] = useState({ date: "", data: {} });
  const [tradeToApprove, setTradeToApprove] = useState({});
  const [stockPresets, setStockPresets] = useState({});
  const [stockDetailModal, setStockDetailModal] = useState({
    symbol: "",
  });

  const fetchTodayTrades = async () => {
    const res = await getTodayTrades();

    if (!res?.data) return;

    const newTrades = res.data;
    const lastTrade = newTrades[newTrades.length - 1];
    setTodayTrades(newTrades);

    if (lastTradesLength && newTrades.length !== lastTradesLength) {
      console.log("NEW TRADE TAKEN");

      setTradeToApprove(lastTrade);
      setStockDetailModal({ symbol: lastTrade.symbol });
      audioElem.current.src = bubbleSound;
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

  const isGoingProfitable = (trade) => {
    const isBuyTrade = trade.type.toLowerCase() === "buy";
    const triggerPrice = parseFloat(trade.startPrice);
    const currPrice =
      stockData.data[trade.symbol] && stockData.data[trade.symbol]["5"]?.c
        ? stockData.data[trade.symbol]["5"].c[
            stockData.data[trade.symbol]["5"].c.length - 1
          ]
        : "";

    if (
      (isBuyTrade && currPrice >= triggerPrice) ||
      (!isBuyTrade && currPrice <= triggerPrice)
    )
      return true;

    return false;
  };

  // useEffect(() => {
  //   fetchTodayTrades();
  //   fetchBestStockPreset();
  //   if (socket) handleSocketEvents();
  // }, [socket]);

  useEffect(() => {
    fetchTodayTrades();
    // setInterval(fetchTodayTrades, 70 * 1000);
  }, []);

  const parsedStockData =
    typeof stockData?.data == "object"
      ? Object.keys(stockData.data).map((item) => ({
          symbol: item,
          data: {
            t: stockData.data[item]["5"].t[
              stockData.data[item]["5"].t.length - 1
            ],
            c: stockData.data[item]["5"].c[
              stockData.data[item]["5"].c.length - 1
            ],
            l: stockData.data[item]["5"].l[
              stockData.data[item]["5"].l.length - 1
            ],
            v: stockData.data[item]["5"].v[
              stockData.data[item]["5"].v.length - 1
            ],
            h: stockData.data[item]["5"].h[
              stockData.data[item]["5"].h.length - 1
            ],
            o: stockData.data[item]["5"].o[
              stockData.data[item]["5"].o.length - 1
            ],
          },
        }))
      : [];

  const getTradeCard = (trade = {}, lrp) => {
    const isBuyTrade = trade.type == "buy";

    const { startPrice: trigger, tradeHigh, tradeLow, target, sl } = trade;
    let targetPercent = isBuyTrade
      ? ((tradeHigh - trigger) / (target - trigger)) * 100
      : ((trigger - tradeLow) / (trigger - target)) * 100;
    if (!targetPercent) targetPercent = 0;
    if (targetPercent > 100) targetPercent = 100;

    let slPercent = isBuyTrade
      ? ((trigger - tradeLow) / (trigger - sl)) * 100
      : ((tradeHigh - trigger) / (sl - trigger)) * 100;

    if (!slPercent) slPercent = 0;
    if (slPercent > 100) slPercent = 100;

    const tradeBar = (
      <div className={styles.bar}>
        <div
          className={`${styles.piece} ${
            isBuyTrade ? styles.red : styles.green
          }`}
        >
          <div
            className={styles.inner}
            style={{
              width: `${
                (isBuyTrade && trade.status == "loss") ||
                (!isBuyTrade && trade.status == "profit")
                  ? 100
                  : lrp < trigger && !isBuyTrade
                  ? ((trigger - lrp) / (trigger - target)) * 100
                  : lrp < trigger && isBuyTrade
                  ? ((trigger - lrp) / (trigger - sl)) * 100
                  : 0
              }%`,
            }}
          />
        </div>
        <div
          className={`${styles.piece} ${
            isBuyTrade ? styles.green : styles.red
          }`}
        >
          <div
            className={styles.inner}
            style={{
              width: `${
                (isBuyTrade && trade.status == "profit") ||
                (!isBuyTrade && trade.status == "loss")
                  ? 100
                  : lrp > trigger && isBuyTrade
                  ? ((lrp - trigger) / (target - trigger)) * 100
                  : lrp > trigger && !isBuyTrade
                  ? ((lrp - trigger) / (sl - trigger)) * 100
                  : 0
              }%`,
            }}
          />
        </div>

        <div className={`${styles.stick}`} style={{ left: "50%" }}>
          <span>{trigger.toFixed(1)}</span>
        </div>

        <div
          className={`${styles.stick} ${
            isBuyTrade ? styles.redStick : styles.greenStick
          }`}
          style={{ left: "0%", background: "transparent" }}
        >
          <span>{(isBuyTrade ? sl : target).toFixed(1)}</span>
        </div>

        <div
          className={`${styles.stick} ${
            isBuyTrade ? styles.greenStick : styles.redStick
          }`}
          style={{ left: "100%", background: "transparent" }}
        >
          <span>{(isBuyTrade ? target : sl).toFixed(1)}</span>
        </div>

        {/* target stick */}
        {tradeHigh && tradeLow ? (
          <div
            className={`${styles.stick}  ${styles.greenStick}`}
            style={{
              left: `${
                isBuyTrade
                  ? 50 + (targetPercent / 100) * 50
                  : 50 - (targetPercent / 100) * 50
              }%`,
            }}
          >
            <label>{(isBuyTrade ? tradeHigh : tradeLow).toFixed(1)}</label>
          </div>
        ) : (
          ""
        )}

        {/* sl stick */}
        {tradeLow && tradeLow ? (
          <div
            className={`${styles.stick} ${styles.redStick}`}
            style={{
              left: `${
                isBuyTrade
                  ? 50 - (slPercent / 100) * 50
                  : 50 + (slPercent / 100) * 50
              }%`,
            }}
          >
            <label>{(isBuyTrade ? tradeLow : tradeHigh).toFixed(1)}</label>
          </div>
        ) : (
          ""
        )}
      </div>
    );

    return (
      <div
        className={`${styles.tradeCard} ${
          trade.status == "profit"
            ? styles.profitCard
            : trade.status == "loss"
            ? styles.lossCard
            : ""
        }`}
        key={trade._id}
      >
        {tradeBar}

        <div className={styles.top}>
          <p
            className={styles.type}
            style={{ color: isBuyTrade ? colors.green : colors.red }}
          >
            {trade.type}
          </p>

          <p className={styles.name}>{trade.name}</p>

          <p className={styles.price}>@{trigger.toFixed(2)}</p>
        </div>

        <p className={styles.time}>{getTimeFormatted(trade.time)}</p>
      </div>
    );
  };

  const getTradesTable = (trades = []) => {
    return (
      <table className={styles.table}>
        <tr>
          <th></th>
          <th>Symbol</th>
          <th>Type</th>
          <th>Trigger</th>
          <th>Target</th>
          <th>SL</th>
          <th>Trade High</th>
          <th>Trade Low</th>
          <th>Time</th>
        </tr>
        {trades
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
                  typeof item.isApproved !== "boolean" &&
                  Date.now() - item.time < 4 * 60 * 1000
                    ? ""
                    : isGoingProfitable(item)
                    ? styles.green
                    : styles.red
                }`}
              >
                {item.isApproved == undefined &&
                Date.now() - item.time < 4 * 60 * 1000 ? (
                  <div
                    className={styles.alert}
                    onClick={() => {
                      setStockDetailModal({ symbol: item.symbol });
                      setTradeToApprove(item);
                    }}
                  >
                    <AlertCircle />
                  </div>
                ) : item.status === "profit" ? (
                  <span>🟢</span>
                ) : item.status === "loss" ? (
                  <span>🔴</span>
                ) : isGoingProfitable(item) ? (
                  arrowUpIcon
                ) : (
                  arrowDownIcon
                )}
              </td>
              <td
                className={styles.name}
                onClick={() =>
                  setStockDetailModal({ symbol: item.symbol, show: true })
                }
              >
                {item.name}
                <span>
                  (
                  {parseFloat(
                    Object.keys(stockData.data[item.symbol] || {}).length
                      ? stockData.data[item.symbol]["5"].c[
                          stockData.data[item.symbol]["5"].c.length - 1
                        ]
                      : ""
                  ).toFixed(1)}
                  )
                </span>
              </td>
              <td
                className={`${styles.type} ${
                  item.type == "sell" ? styles.red : ""
                }`}
              >
                {item.type}
              </td>
              <td>{parseFloat(item.startPrice).toFixed(1)}</td>
              <td className={styles.target}>
                {parseFloat(item.target).toFixed(1)}
              </td>
              <td className={styles.sl}>{parseFloat(item.sl).toFixed(1)}</td>
              <td>{item.tradeHigh ? item.tradeHigh.toFixed(2) : ""}</td>
              <td>{item.tradeLow ? item.tradeLow.toFixed(2) : ""}</td>

              <td className={styles.time}>{getTimeFormatted(item.time)}</td>
            </tr>
          ))}
      </table>
    );
  };

  return (
    <div className={styles.container}>
      {tradeToApprove?._id && (
        <TradeApproveModal
          tradeDetails={tradeToApprove}
          onClose={() => setTradeToApprove({})}
          onSuccess={() => {
            fetchTodayTrades();
            setTradeToApprove({});
          }}
          stockData={
            stockData?.data ? stockData.data[stockDetailModal.symbol] : {}
          }
          stockPreset={stockPresets[stockDetailModal.symbol]}
        />
      )}
      {stockDetailModal?.show ? (
        <StockDetailsModal
          onClose={() => setStockDetailModal({})}
          stockData={
            stockData?.data ? stockData.data[stockDetailModal.symbol] : {}
          }
          stockPreset={stockPresets[stockDetailModal.symbol]}
          name={stockDetailModal.symbol}
        />
      ) : (
        ""
      )}

      <audio ref={audioElem} />

      <div className={styles.section}>
        <p className={styles.heading}>Approved trades</p>

        <div className={styles.cards}>
          {todayTrades
            .filter((item) => item.isApproved)
            .map((item) => getTradeCard(item))}
        </div>

        {/* {getTradesTable(todayTrades.filter((item) => item.isApproved))} */}
      </div>

      <div className={styles.section}>
        <p className={styles.heading}>Unapproved trades</p>

        <div className={styles.cards}>
          {todayTrades
            .filter((item) => !item.isApproved)
            .map((item) => getTradeCard(item))}
        </div>
        {/* {getTradesTable(todayTrades.filter((item) => !item.isApproved))} */}
      </div>
      <div className={styles.section}>
        <p className={styles.heading}>
          Last Recorded Price (updates every 5 min)
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
                <td
                  className={styles.name}
                  onClick={() =>
                    setStockDetailModal({ symbol: item.symbol, show: true })
                  }
                >
                  {item.symbol}
                </td>
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
