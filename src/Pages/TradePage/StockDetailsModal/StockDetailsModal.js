import React, { useState } from "react";
import { toast } from "react-hot-toast";

import Modal from "Components/Modal/Modal";
import Button from "Components/Button/Button";
import InputControl from "Components/InputControl/InputControl";

import { updateTrade } from "apis/trade";

import styles from "./StockDetailsModal.module.scss";
import StockChart from "../StockChart/StockChart";

function StockDetailsModal({
  stockData = {},
  stockPreset = {},
  name = "",
  onClose,
}) {
  return (
    <Modal onClose={onClose}>
      <div className={styles.container}>
        <p className="heading">{name || "Stock details"} </p>

        <StockChart stockData={stockData} stockPreset={stockPreset} />
      </div>
    </Modal>
  );
}

export default StockDetailsModal;
