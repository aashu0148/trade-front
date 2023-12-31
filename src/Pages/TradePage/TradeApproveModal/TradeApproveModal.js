import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import Modal from "Components/Modal/Modal";
import Button from "Components/Button/Button";
import InputControl from "Components/InputControl/InputControl";
import StockChart from "../StockChart/StockChart";
import Slider from "Components/Slider/Slider";
import Toggle from "Components/Toggle/Toggle";

import { updateTrade } from "apis/trade";

import styles from "./TradeApproveModal.module.scss";

function TradeApproveModal({
  className,
  bodyClassName,
  tradeDetails = {},
  onClose,
  onSuccess,
  lrp,
  stockData,
  onDecision,
  stockPreset,
  withoutModal = false,
  withoutChart = false,
  staticModal = false,
}) {
  const [values, setValues] = useState({
    startPrice: parseFloat(tradeDetails.startPrice.toFixed(3)),
    type: tradeDetails.type,
    target: parseFloat(tradeDetails.target.toFixed(3)),
    sl: parseFloat(tradeDetails.sl.toFixed(3)),
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

  const handleTradeTypeReversal = (obj) => {
    const targetLen = Math.abs(values.startPrice - values.target);
    const slLen = Math.abs(values.startPrice - values.sl);

    const newType = obj.value;
    const newTarget =
      newType == "buy"
        ? values.startPrice + targetLen
        : values.startPrice - targetLen;
    const newSl =
      newType == "buy" ? values.startPrice - slLen : values.startPrice + slLen;

    setValues((prev) => ({
      ...prev,
      type: newType,
      target: newTarget,
      sl: newSl,
    }));
  };

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

    if (staticModal) {
      if (onDecision) onDecision(values, approved);

      return;
    }

    const sData = stockData["5"] || {};
    const lastIndex = sData.t?.length ? sData.t.length - 1 : 0;

    if (lastIndex) {
      const prices = {
        high:
          sData.h[lastIndex] > sData.h[lastIndex - 1]
            ? sData.h[lastIndex]
            : sData.h[lastIndex - 1],
        low:
          sData.l[lastIndex] < sData.l[lastIndex - 1]
            ? sData.l[lastIndex]
            : sData.l[lastIndex - 1],
      };

      if (values.startPrice > prices.low && values.startPrice < prices.high)
        values.status = "taken";
      else {
        values.status = "limit";
        values.limitTime = sData.t[lastIndex];
      }
    }

    setDisabledButtons((prev) => ({
      ...prev,
      reject: approved ? false : true,
      approve: approved ? true : false,
    }));
    const res = await updateTrade(tradeDetails._id, {
      ...values,
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

  const handleSliderChange = (newVal) => {
    let sl, target, trigger;
    if (values.type == "buy") [sl, trigger, target] = newVal;
    else [target, trigger, sl] = newVal;

    setValues((prev) => ({ ...prev, target, startPrice: trigger, sl }));
  };

  const getSliderDetails = () => {
    let val = [],
      labels = [];
    const threePercent = (3 / 100) * values.startPrice;

    const min = values.startPrice - threePercent;
    const max = values.startPrice + threePercent;

    if (values.type == "buy") {
      val = [values.sl, values.startPrice, values.target];
      labels = [
        {
          value: values.sl,
          label: "SL",
          style: { background: "red", borderColor: "red" },
        },
        {
          value: values.startPrice,
          label: "Trigger",
          style: { background: "white" },
        },
        {
          value: values.target,
          label: "Target",
          style: { background: "green", borderColor: "green" },
        },
      ];
    } else {
      val = [values.target, values.startPrice, values.sl];
      labels = [
        {
          value: values.target,
          label: "Target",
          style: { background: "green", borderColor: "green" },
        },
        {
          value: values.startPrice,
          label: "Trigger",
          style: { background: "white" },
        },
        {
          value: values.sl,
          label: "SL",
          style: { background: "red", borderColor: "red" },
        },
      ];
    }

    return { value: val, min, max, labels };
  };

  useEffect(() => {
    if (!tradeDetails.symbol) return;

    setValues({
      startPrice: parseFloat(tradeDetails.startPrice.toFixed(3)),
      type: tradeDetails.type,
      target: parseFloat(tradeDetails.target.toFixed(3)),
      sl: parseFloat(tradeDetails.sl.toFixed(3)),
    });
    setErrors({});
  }, [tradeDetails.symbol]);

  const sliderDetails = getSliderDetails();

  const approvalJsx = (
    <div className={`${styles.container} ${className || ""}`}>
      <p className="heading">Approve/Reject this trade</p>

      <div className={`${styles.body} ${bodyClassName || ""}`}>
        {withoutChart ? (
          ""
        ) : (
          <StockChart
            stockData={stockData}
            stockPreset={stockPreset}
            shortChart
          />
        )}

        <div className={styles.right}>
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
                    ? Object.keys(
                        tradeDetails.analytics?.allowedIndicatorSignals
                      )
                        .filter(
                          (key) =>
                            tradeDetails.analytics.allowedIndicatorSignals[
                              key
                            ] == tradeDetails.type
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
                  onChange={handleTradeTypeReversal}
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

          <Slider
            value={sliderDetails.value}
            min={sliderDetails.min}
            max={sliderDetails.max}
            dotDetails={sliderDetails.labels}
            onChange={handleSliderChange}
          />
          <div />

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
      </div>
    </div>
  );

  return withoutModal ? (
    approvalJsx
  ) : (
    <Modal onClose={onClose}>{approvalJsx}</Modal>
  );
}

export default TradeApproveModal;
