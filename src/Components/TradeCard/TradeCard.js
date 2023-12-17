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
  const targetLength = Math.abs(trigger - target);
  const slLength = Math.abs(trigger - sl);
  const t1 = isBuyTrade ? trigger + slLength : trigger - slLength;
  const t1Length = Math.abs(trigger - t1);
  const t1PercentOfTarget = (t1Length / targetLength) * 100;
  const t1Succeeded =
    (isBuyTrade && tradeHigh > t1) || (!isBuyTrade && tradeLow < t1);

  // t1Length should be < 80% of targetLength
  const useTargetOne = t1PercentOfTarget < 80;

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

  const getLeftPieceWidth = () => {
    if (
      (isBuyTrade && trade.status == "loss") ||
      (!isBuyTrade && trade.status == "profit")
    )
      return 100;

    if (
      trade.status == "loss" ||
      trade.status == "profit" ||
      trade.status == "unfinished"
    ) {
      if (t1Succeeded && !isBuyTrade) return t1PercentOfTarget;
      else return 0;
    }

    if (lrp < trigger && !isBuyTrade)
      return ((trigger - lrp) / (trigger - target)) * 100;
    else if (lrp < trigger && isBuyTrade)
      return ((trigger - lrp) / (trigger - sl)) * 100;
    else return 0;
  };

  const getRightPieceWidth = () => {
    if (
      (isBuyTrade && trade.status == "profit") ||
      (!isBuyTrade && trade.status == "loss")
    )
      return 100;

    if (
      trade.status == "loss" ||
      trade.status == "profit" ||
      trade.status == "unfinished"
    ) {
      if (t1Succeeded && isBuyTrade) return t1PercentOfTarget;
      else return 0;
    }

    if (lrp > trigger && isBuyTrade)
      return ((lrp - trigger) / (target - trigger)) * 100;
    else if (lrp > trigger && !isBuyTrade)
      return ((lrp - trigger) / (sl - trigger)) * 100;
    else return 0;
  };

  const tradeBar = (
    <div className={styles.bar}>
      <div
        className={`${styles.piece} ${isBuyTrade ? styles.red : styles.green}`}
      >
        <div
          className={styles.inner}
          style={{
            width: `${getLeftPieceWidth()}%`,
          }}
        />
      </div>
      <div
        className={`${styles.piece} ${isBuyTrade ? styles.green : styles.red}`}
      >
        <div
          className={styles.inner}
          style={{
            width: `${getRightPieceWidth()}%`,
          }}
        />
      </div>

      <div className={`${styles.stick}`} style={{ left: "50%" }}>
        <span>{trigger.toFixed(1)}</span>
      </div>

      {/* t1 stick */}
      {useTargetOne ? (
        <div
          className={`${styles.stick}`}
          style={{
            left: `${
              isBuyTrade
                ? 50 + (t1PercentOfTarget / 100) * 50
                : 50 - (t1PercentOfTarget / 100) * 50
            }%`,
          }}
        >
          <span style={{ color: colors.green }}>{t1.toFixed(1)}</span>
        </div>
      ) : (
        ""
      )}

      <div
        className={`${styles.stick} ${
          isBuyTrade ? styles.redStick : styles.greenStick
        }`}
        style={{ left: "0%", borderColor: "transparent" }}
      >
        <span>{(isBuyTrade ? sl : target).toFixed(1)}</span>
      </div>

      <div
        className={`${styles.stick} ${
          isBuyTrade ? styles.greenStick : styles.redStick
        }`}
        style={{ left: "100%", borderColor: "transparent" }}
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
      {tradeHigh && tradeLow ? (
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
      {trade.status == "limit" || trade.status == "cancelled" ? (
        <div style={{ textAlign: "center" }}>
          <div className={styles.top}>
            <p className={styles.name} style={{ textTransform: "capitalize" }}>
              {trade.status} order
            </p>
          </div>
          <label className={styles.label}>
            Target: <span>{trade.target}</span> SL: <span>{trade.sl}</span>
          </label>
        </div>
      ) : (
        tradeBar
      )}

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

      <div>
        {lrp ? (
          <div className={styles.footer}>
            <label className={styles.label}>
              LRP: <span>{lrp}</span>
            </label>
          </div>
        ) : (
          ""
        )}
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
    </div>
  );
}

export default TradeCard;
