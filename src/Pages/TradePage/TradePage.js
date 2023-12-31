import React, { useEffect, useRef, useState } from "react";
import { AlertCircle } from "react-feather";

import TradeApproveModal from "./TradeApproveModal/TradeApproveModal";
import StockDetailsModal from "./StockDetailsModal/StockDetailsModal";
import TradeCard from "Components/TradeCard/TradeCard";

import { getBestStockPresets, getTodayTrades } from "apis/trade";
import { getTimeFormatted } from "utils/util";
import { arrowDownIcon, arrowUpIcon } from "utils/svgs";
import bubbleSound from "assets/bubble.mp3";
import secSound from "assets/10 Sec.mp3";

import styles from "./TradePage.module.scss";

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
      // console.log(data);
      // if (Array.isArray(data) && data[0]?.analytic) {
      //   console.log(
      //     data
      //       .map((item) => ({
      //         symbol: item.symbol,
      //         MAIN: item.analytic.netSignal,
      //         PRICE: item.analytic.price,
      //         PP: item.analytic.possibleProfit,
      //         R: item.analytic.nearestResistance,
      //         S: item.analytic.nearestSupport,
      //         ...item.analytic.mainSignals,
      //         ...item.analytic.otherSignals,
      //       }))
      //       .map((item) =>
      //         Object.keys(item)
      //           .map((a) => `${a}: ${item[a]}`)
      //           .join(" | ")
      //           .slice(8)
      //           .replace("PRICE: ", "")
      //           .replaceAll("undefined", "_")
      //           .replace("MAIN: ", "")
      //           .replace("rsiSignal", "rsi")
      //           .replace("macdSignal", "macd")
      //           .replace("srSignal", "sr")
      //           .replace("bollingerBandSignal", "bb")
      //           .replace("smaSignal", "sma")
      //           .replace("psarSignal", "psar")
      //           .replace("willRSignal", "willR")
      //           .replace("mfiSignal", "mfi")
      //           .replace("vwapSignal", "vwap")
      //       )
      //   );
      // }
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

  useEffect(() => {
    fetchTodayTrades();
    fetchBestStockPreset();
    if (socket) handleSocketEvents();
  }, [socket]);

  useEffect(() => {
    fetchTodayTrades();
    setInterval(fetchTodayTrades, 70 * 1000);
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
            .map((item) => (
              <TradeCard
                key={item.id}
                trade={item}
                lrp={parseFloat(
                  Object.keys(stockData.data[item.symbol] || {}).length
                    ? stockData.data[item.symbol]["5"].c[
                        stockData.data[item.symbol]["5"].c.length - 1
                      ]
                    : ""
                ).toFixed(1)}
                onViewChart={() =>
                  setStockDetailModal({ symbol: item.symbol, show: true })
                }
                onApprove={() => {
                  setStockDetailModal({ symbol: item.symbol });
                  setTradeToApprove(item);
                }}
              />
            ))}
        </div>

        {/* {getTradesTable(todayTrades.filter((item) => item.isApproved))} */}
      </div>

      <div className={styles.section}>
        <p className={styles.heading}>Unapproved trades</p>

        <div className={styles.cards}>
          {todayTrades
            .filter((item) => item.isApproved == undefined)
            .map((item) => (
              <TradeCard
                key={item.id}
                trade={item}
                lrp={parseFloat(
                  Object.keys(stockData.data[item.symbol] || {}).length
                    ? stockData.data[item.symbol]["5"].c[
                        stockData.data[item.symbol]["5"].c.length - 1
                      ]
                    : ""
                ).toFixed(1)}
                // onViewChart={() =>
                //   setStockDetailModal({ symbol: item.symbol, show: true })
                // }
                onApprove={() => {
                  setStockDetailModal({ symbol: item.symbol });
                  setTradeToApprove(item);
                }}
              />
            ))}
        </div>
      </div>

      <div className={styles.section}>
        <p className={styles.heading}>Rejected trades</p>

        <div className={styles.cards}>
          {todayTrades
            .filter((item) => item.isApproved == false)
            .map((item) => (
              <TradeCard
                key={item.id}
                trade={item}
                lrp={parseFloat(
                  Object.keys(stockData.data[item.symbol] || {}).length
                    ? stockData.data[item.symbol]["5"].c[
                        stockData.data[item.symbol]["5"].c.length - 1
                      ]
                    : ""
                ).toFixed(1)}
                onViewChart={() =>
                  setStockDetailModal({ symbol: item.symbol, show: true })
                }
                onApprove={() => {
                  setStockDetailModal({ symbol: item.symbol });
                  setTradeToApprove(item);
                }}
              />
            ))}
        </div>
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
