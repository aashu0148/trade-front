import React from "react";

import Modal from "Components/Modal/Modal";
import StockChart from "Pages/TradePage/StockChart/StockChart";

import styles from "./TradeDetailModal.module.scss";

function TradeDetailModal({ onClose, trade }) {
  // console.log(trade);

  return (
    <Modal onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.tradeDetails}>
          <div className={styles.detail}>
            <label>Stock:</label>
            <p className={styles.value}>{trade.symbol}</p>
          </div>
          <div className={styles.detail}>
            <label>Type:</label>
            <p
              className={`${styles.value} ${
                trade.type == "buy" ? styles.green : styles.red
              }`}
            >
              {trade.type}
            </p>
          </div>
          <div className={styles.detail}>
            <label>Trigger:</label>
            <p className={`${styles.value}`}>{trade.startPrice}</p>
          </div>
          <div className={styles.detail}>
            <label>Target:</label>
            <p className={`${styles.value} ${styles.green}`}>
              {trade.target ? trade.target.toFixed(2) : ""}
            </p>
          </div>
          <div className={styles.detail}>
            <label>SL:</label>
            <p className={`${styles.value} ${styles.red}`}>
              {trade.sl ? trade.sl.toFixed(2) : ""}
            </p>
          </div>
          <div className={styles.detail}>
            <label>Reasons:</label>
            <p className={styles.value} style={{ textTransform: "uppercase" }}>
              {typeof trade.analytics.allowedIndicatorSignals == "object"
                ? Object.keys(trade.analytics.allowedIndicatorSignals)
                    .filter(
                      (key) =>
                        trade.analytics.allowedIndicatorSignals[key] !== "hold"
                    )
                    .join(", ")
                : ""}
            </p>
          </div>
          <div className={styles.detail}>
            <label>Status:</label>
            <p className={`${styles.value}`}>{trade.status}</p>
          </div>
        </div>

        <StockChart
          firstTradeIndex={trade.tradeStartIndex}
          stockData={{ 5: trade.priceData || {} }}
          stockPreset={trade.preset}
        />
      </div>
    </Modal>
  );
}

export default TradeDetailModal;
