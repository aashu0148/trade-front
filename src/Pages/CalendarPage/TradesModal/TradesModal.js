import React from "react";

import Modal from "Components/Modal/Modal";
import TradeCard from "Components/TradeCard/TradeCard";

import { getDateFormatted } from "utils/util";

import styles from "./TradesModal.module.scss";

function TradesModal({
  className,
  lrps = {},
  onClose,
  trades = [],
  hideTime = false,
  showDateInCard = false,
  withoutModal = false,
  hideCancelledOrders = false,
}) {
  const segregatedTrades = {
    limit: trades.filter((item) => item.status == "limit"),
    cancelled: trades.filter((item) => item.status == "cancelled"),
    approved: trades.filter(
      (item) =>
        item.status !== "limit" &&
        item.status !== "cancelled" &&
        item.isApproved
    ),
    rejected: trades.filter(
      (item) =>
        item.status !== "limit" &&
        item.status !== "cancelled" &&
        item.isApproved == false
    ),
    ignored: trades.filter(
      (item) =>
        item.status !== "limit" &&
        item.status !== "cancelled" &&
        item.isApproved == undefined
    ),
  };

  const getTradesSection = (filteredTrades, title) => {
    return (
      <div className={styles.section}>
        <p className="title">{title}</p>

        <div className={styles.cards}>
          {filteredTrades.map((item) => (
            <TradeCard
              lrp={lrps[item.symbol]}
              key={item._id || item.startPrice + item.type + item.time}
              trade={item}
              hideChartButton
              showDateWithTime={showDateInCard}
            />
          ))}
        </div>
      </div>
    );
  };

  const containerJsx = (
    <div className={`${styles.container} ${className || ""}`}>
      {hideTime ? (
        ""
      ) : (
        <p className={`heading-small`}>
          {getDateFormatted(trades[0]?.time, false, true)} Trades
        </p>
      )}

      {segregatedTrades.limit.length
        ? getTradesSection(segregatedTrades.limit, "Limit orders")
        : ""}

      {segregatedTrades.approved.length
        ? getTradesSection(segregatedTrades.approved, "Approved trades")
        : ""}

      {segregatedTrades.ignored.length
        ? getTradesSection(segregatedTrades.ignored, "Ignored trades")
        : ""}

      {segregatedTrades.rejected.length
        ? getTradesSection(segregatedTrades.rejected, "Rejected trades")
        : ""}

      {segregatedTrades.cancelled.length && !hideCancelledOrders
        ? getTradesSection(segregatedTrades.cancelled, "Cancelled orders")
        : ""}
    </div>
  );

  return withoutModal ? (
    containerJsx
  ) : (
    <Modal onClose={onClose}>{containerJsx}</Modal>
  );
}

export default TradesModal;
