import React from "react";

import Modal from "Components/Modal/Modal";
import TradeCard from "Components/TradeCard/TradeCard";

import { getDateFormatted } from "utils/util";

import styles from "./TradesModal.module.scss";

function TradesModal({
  onClose,
  trades = [],
  hideTime = false,
  showDateInCard = false,
}) {
  return (
    <Modal onClose={onClose}>
      <div className={styles.container}>
        {hideTime ? (
          ""
        ) : (
          <p className={`heading-small`}>
            {getDateFormatted(trades[0]?.time, false, true)} Trades
          </p>
        )}

        <div className={styles.cards}>
          {trades.map((item) => (
            <TradeCard
              key={item._id || item.startPrice + item.type + item.time}
              trade={item}
              hideChartButton
              showDateWithTime={showDateInCard}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}

export default TradesModal;
