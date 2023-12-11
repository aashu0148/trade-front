import React, { useState } from "react";
import { toast } from "react-hot-toast";

import Modal from "Components/Modal/Modal";
import Button from "Components/Button/Button";
import InputControl from "Components/InputControl/InputControl";
import StockChart from "../StockChart/StockChart";
import Toggle from "Components/Toggle/Toggle";

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
    type: tradeDetails.type,
    target: tradeDetails.target,
    sl: tradeDetails.sl,
  });
  const [errors, setErrors] = useState({
    startPrice: "",
    target: "",
    sl: "",
    type: "",
  });
  const [disabledButtons, setDisabledButtons] = useState({
    reject: false,
    approve: false,
  });

  const validateSubmission = () => {
    const errors = {};

    if (!values.target) errors.target = "Enter target";
    else if (values.type == "buy" && values.target < values.startPrice)
      errors.target = "Target must be greater than trigger";
    else if (values.type == "buy" && values.sl > values.startPrice)
      errors.sl = "Stop loss must be smaller than trigger";

    if (!values.sl) errors.sl = "Enter sl";
    else if (values.type == "sell" && values.target > values.startPrice)
      errors.target = "Target must be smaller than trigger";
    else if (values.type == "sell" && values.sl < values.startPrice)
      errors.sl = "Stop loss must be greater than trigger";

    if (!values.startPrice) errors.startPrice = "Enter startPrice";

    if (Object.keys(errors).length) {
      setErrors(errors);
      return false;
    } else {
      setErrors({});
      return true;
    }
  };

  const handleSubmission = async (approved = false) => {
    if (!validateSubmission()) return;

    setDisabledButtons((prev) => ({
      ...prev,
      reject: approved ? false : true,
      approve: approved ? true : false,
    }));
    const res = await updateTrade(tradeDetails._id, {
      isApproved: approved,
      type: values.type,
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
              onWheel={(event) => event.target.blur()}
              error={errors.startPrice}
            />

            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label className={styles.label}>Type</label>

              <Toggle
                className={styles.toggle}
                options={[
                  { label: "BUY", value: "buy" },
                  { label: "SELL", value: "sell" },
                ]}
                selected={values.type}
                onChange={(obj) =>
                  setValues((prev) => ({
                    ...prev,
                    type: obj.value,
                    target: prev.sl,
                    sl: prev.target,
                  }))
                }
              />
            </div>
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
              onWheel={(event) => event.target.blur()}
              error={errors.target}
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
              onWheel={(event) => event.target.blur()}
              error={errors.sl}
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
