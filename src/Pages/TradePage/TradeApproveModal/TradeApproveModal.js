import React, { useState } from "react";
import { toast } from "react-hot-toast";

import Modal from "Components/Modal/Modal";
import Button from "Components/Button/Button";
import InputControl from "Components/InputControl/InputControl";
import StockChart from "../StockChart/StockChart";

import { updateTrade } from "apis/trade";

import styles from "./TradeApproveModal.module.scss";

function TradeApproveModal({
  tradeDetails = {},
  onClose,
  onSuccess,
  lrp,
  stockData,
  stockPreset,
}) {
  const [values, setValues] = useState({
    startPrice: tradeDetails.startPrice,
    target: tradeDetails.target,
    sl: tradeDetails.sl,
  });
  const [disabledButtons, setDisabledButtons] = useState({
    reject: false,
    approve: false,
  });

  const handleSubmission = async (approved = false) => {
    setDisabledButtons((prev) => ({
      ...prev,
      reject: approved ? false : true,
      approve: approved ? true : false,
    }));
    const res = await updateTrade(tradeDetails._id, {
      isApproved: approved,
      target: values.target,
      sl: values.sl,
      startPrice: values.startPrice,
    });
    setDisabledButtons((prev) => ({
      ...prev,
      reject: false,
      approve: false,
    }));

    if (!res?.data) return;

    toast.success("Trade updated successfully");
    if (onSuccess) onSuccess(res.data);
  };

  return (
    <Modal onClose={onClose}>
      <div className={styles.container}>
        <p className="heading">Approve/Reject this trade</p>
        <StockChart
          stockData={stockData}
          stockPreset={stockPreset}
          shortChart
        />

        <div className={styles.form}>
          <div className={styles.details}>
            <div className={styles.info}>
              <label>Symbol</label>
              <span>{tradeDetails.symbol}</span>
            </div>

            <div className={styles.info}>
              <label>LRP</label>
              <span>{lrp}</span>
            </div>

            <div className={styles.info}>
              <label>Type</label>
              <span className={`${styles.green}`}>{tradeDetails.type}</span>
            </div>

            <div className={styles.info}>
              <label>Reasons</label>
              <span
                className={`${styles.small}`}
                style={{ textTransform: "capitalize" }}
              >
                {typeof tradeDetails?.analytics?.allowedIndicatorSignals ==
                "object"
                  ? Object.keys(tradeDetails.analytics?.allowedIndicatorSignals)
                      .filter(
                        (key) =>
                          tradeDetails.analytics.allowedIndicatorSignals[key] ==
                          tradeDetails.type
                      )
                      .join(", ")
                  : ""}
              </span>
            </div>
          </div>

          <div className="row">
            <InputControl
              label="Trigger price"
              placeholder="Enter trigger price"
              type="number"
              min={0}
              value={values.startPrice}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  startPrice: parseFloat(e.target.value),
                }))
              }
            />
          </div>

          <div className="row">
            <InputControl
              label="Target"
              placeholder="Enter target"
              type="number"
              min={0}
              value={values.target}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  target: parseFloat(e.target.value),
                }))
              }
            />

            <InputControl
              label="Stop loss"
              placeholder="Enter SL"
              type="number"
              min={0}
              value={values.sl}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  sl: parseFloat(e.target.value),
                }))
              }
            />
          </div>
        </div>

        <div className="footer">
          <Button
            redButton
            disabled={disabledButtons.reject}
            useSpinnerWhenDisabled
            onClick={() => handleSubmission()}
          >
            Reject
          </Button>
          <Button
            disabled={disabledButtons.approve}
            useSpinnerWhenDisabled
            onClick={() => handleSubmission(true)}
          >
            Approve
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default TradeApproveModal;
