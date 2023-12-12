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
}) {
  const segregatedTrades = {
    approved: trades.filter((item) => item.isApproved),
    rejected: trades.filter((item) => item.isApproved == false),
    ignored: trades.filter((item) => item.isApproved == undefined),
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

      {segregatedTrades.approved.length
        ? getTradesSection(segregatedTrades.approved, "Approved trades")
        : ""}

      {segregatedTrades.ignored.length
        ? getTradesSection(segregatedTrades.ignored, "Ignored trades")
        : ""}

      {segregatedTrades.rejected.length
        ? getTradesSection(segregatedTrades.rejected, "Rejected trades")
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
