import React from "react";

import Button from "Components/Button/Button";

import { getDateFormatted, getTimeFormatted } from "utils/util";

import styles from "./TradeCard.module.scss";

const colors = {
  red: "#fa3f35",
  green: "#21ac56",
  blue: "#27a5f3",
  primary: "#1c65db",
};
function TradeCard({
  trade = {},
  lrp,
  onApprove,
  onViewChart,
  hideChartButton = false,
  showDateWithTime = false,
}) {
  const isBuyTrade = trade.type == "buy";

  const { startPrice: trigger, tradeHigh, tradeLow, target, sl } = trade;

  let timestamp = trade.time;
  // if timestamp in seconds
  if (timestamp < Date.now() / 100) timestamp *= 1000;

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
        className={`${styles.piece} ${isBuyTrade ? styles.red : styles.green}`}
      >
        <div
          className={styles.inner}
          style={{
            width: `${
              (isBuyTrade && trade.status == "loss") ||
              (!isBuyTrade && trade.status == "profit")
                ? 100
                : trade.status == "loss" ||
                  trade.status == "profit" ||
                  trade.status == "unfinished"
                ? 0
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
        className={`${styles.piece} ${isBuyTrade ? styles.green : styles.red}`}
      >
        <div
          className={styles.inner}
          style={{
            width: `${
              (isBuyTrade && trade.status == "profit") ||
              (!isBuyTrade && trade.status == "loss")
                ? 100
                : trade.status == "loss" ||
                  trade.status == "profit" ||
                  trade.status == "unfinished"
                ? 0
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
      className={`${styles.container} ${
        trade.status == "profit"
          ? styles.profitCard
          : trade.status == "loss"
          ? styles.lossCard
          : ""
      }`}
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

      <div className={styles.footer}>
        {hideChartButton ? (
          ""
        ) : (
          <p
            className={styles.btn}
            onClick={() => (onViewChart ? onViewChart(trade) : "")}
          >
            Chart
          </p>
        )}

        <p className={styles.time}>
          {getTimeFormatted(timestamp)}{" "}
          {showDateWithTime ? getDateFormatted(timestamp, true) : ""}
        </p>
      </div>

      {typeof trade.isApproved !== "boolean" &&
      Date.now() - trade.time < 4 * 60 * 1000 ? (
        <Button
          className={styles.approve}
          onClick={() => {
            if (onApprove) onApprove(trade);
          }}
        >
          Approve
        </Button>
      ) : (
        ""
      )}
    </div>
  );
}

export default TradeCard;
