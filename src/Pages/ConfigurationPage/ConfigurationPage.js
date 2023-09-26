import React, { useState } from "react";
import { Copy } from "react-feather";

import InputSelect from "Components/InputControl/InputSelect/InputSelect";
import InputControl from "Components/InputControl/InputControl";
import MultiSelect from "Components/MultiSelect/MultiSelect";
import Button from "Components/Button/Button";

import stockData from "utils/stockData";
import { copyToClipboard } from "utils/util";

import styles from "./ConfigurationPage.module.scss";
import { takeTrades } from "utils/tradeUtil";

const availableStocks = [
  {
    label: "Tata motors",
    value: "TATAMOTORS",
    data: stockData.TATAMOTORS,
  },
  {
    label: "Tata steel",
    value: "TATASTEEL",
    data: stockData.TATASTEEL,
  },
  {
    label: "HDFC life",
    value: "HDFCLIFE",
    data: stockData.HDFCLIFE,
  },
  {
    label: "HCL tech",
    value: "HCLTECH",
    data: stockData.HCLTECH,
  },
  {
    label: "ITC",
    value: "ITC",
    data: stockData.ITC,
  },
  {
    label: "Laopala",
    value: "LAOPALA",
    data: stockData.LAOPALA,
  },
  {
    label: "Latent view",
    value: "LATENTVIEW",
    data: stockData.LATENTVIEW,
  },
  {
    label: "Laurus labs",
    value: "LAURUSLABS",
    data: stockData.LAURUSLABS,
  },
  {
    label: "Paras",
    value: "PARAS",
    data: stockData.PARAS,
  },
  {
    label: "Indusind bank",
    value: "INDUSINDBK",
    data: stockData.INDUSINDBK,
  },
  {
    label: "Reliance",
    value: "RELIANCE",
    data: stockData.RELIANCE,
  },
  {
    label: "SBIN",
    value: "SBIN",
    data: stockData.SBIN,
  },
  {
    label: "KFINTECH",
    value: "KFINTECH",
    data: stockData.KFINTECH,
  },
  {
    label: "KOTAKBKETF",
    value: "KOTAKBKETF",
    data: stockData.KOTAKBKETF,
  },
  {
    label: "shoperstop",
    value: "SHOPERSTOP",
    data: stockData.SHOPERSTOP,
  },
  {
    label: "MAKEINDIA",
    value: "MAKEINDIA",
    data: stockData.MAKEINDIA,
  },
  {
    label: "ICICIM150",
    value: "ICICIM150",
    data: stockData.ICICIM150,
  },
  {
    label: "Tata consumer",
    value: "TATACONSUM",
    data: stockData.TATACONSUM,
  },
  {
    label: "Lic housing finance",
    value: "LICHSGFIN",
    data: stockData.LICHSGFIN,
  },
  {
    label: "Coal india",
    value: "COALINDIA",
    data: stockData.COALINDIA,
  },
  {
    label: "BPCL",
    value: "BPCL",
    data: stockData.BPCL,
  },
  {
    label: "MAZDOCK",
    value: "MAZDOCK",
    data: stockData.MAZDOCK,
  },
].filter((item) => item.data?.c?.length);

const optionalIndicators = [
  {
    label: "William % R",
    value: "willR",
  },
  {
    label: "Money flow index",
    value: "mfi",
  },
  {
    label: "Trend indicator (beta)",
    value: "trend",
  },
  {
    label: "Commodity channel index",
    value: "cci",
  },
  {
    label: "Stochastic",
    value: "stochastic",
  },
  {
    label: "VWAP",
    value: "vwap",
  },
  {
    label: "Parabolic SAR",
    value: "psar",
  },
];

function ConfigurationPage() {
  const [values, setValues] = useState({
    decisionMakingPoints: 3,
    additionalIndicators: {
      willR: false,
      mfi: false,
      trend: false,
      cci: false,
      stochastic: false,
      vwap: false,
      psar: false,
    },
    vPointOffset: 10,
    rsiLow: 48,
    rsiHigh: 63,
    smaLowPeriod: 18,
    smaHighPeriod: 150,
    rsiPeriod: 8,
    macdFastPeriod: 14,
    macdSlowPeriod: 24,
    macdSignalPeriod: 8,
    bollingerBandPeriod: 23,
    bollingerBandStdDev: 4,
    cciPeriod: 20,
    stochasticPeriod: 14,
    stochasticMA: 3,
    stochasticLow: 23,
    stochasticHigh: 83,
    willRPeriod: 14,
    willRLow: -90,
    willRHigh: -10,
    psarStart: 0.02,
    psarAcceleration: 0.02,
    psarMaxValue: 0.2,
    superTrendMultiplier: 3,
    mfiPeriod: 14,
    mfiLow: 23,
    mfiHigh: 83,
    vwapPeriod: 14,
  });
  const [selectedStock, setSelectedStock] = useState({});
  const [tradeResults, setTradeResults] = useState({});

  const handleEvaluation = async () => {
    if (!selectedStock?.data?.c?.length) return;

    const { trades } = await takeTrades(selectedStock.data, values);

    const totalTradesNeeded = parseInt(
      ((selectedStock.data.c.length * 5) / 60 / 6) * 2
    );

    const total = trades.length;
    const profitable = trades.filter((item) => item.result == "profit").length;

    setTradeResults({
      stock: selectedStock.label,
      profitPercent: `${((profitable / total) * 100).toFixed(2)}%`,
      tradesNeeded: totalTradesNeeded,
      tradesTaken: total,
      profitMaking: profitable,
      lossMaking: total - profitable,
      trades: trades.sort((a, b) =>
        parseInt(a.analytics.estimatedAccuracy) >
        parseInt(b.analytics.estimatedAccuracy)
          ? -1
          : 1
      ),
    });
  };

  return (
    <div className={styles.container}>
      <p className={styles.heading}>Configure a stock for best outcome</p>

      <div className={styles.form}>
        <div className="row">
          <InputSelect
            placeholder="Select a stock"
            label="Select stock"
            options={availableStocks.map((item) => ({
              label: item.label,
              value: item.value,
            }))}
            onChange={(e) =>
              setSelectedStock(
                availableStocks.find((item) => item.value == e.value)
              )
            }
          />

          <InputControl
            placeholder="Enter number"
            numericInput
            label="Decision making points (1-10)"
            max={10}
            min={1}
            value={values.decisionMakingPoints}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                decisionMakingPoints: parseInt(e.target.value),
              }))
            }
            disabled={!selectedStock?.value}
          />
        </div>
        <div className="col" style={{ gap: "10px" }}>
          <p className={styles.label}>Additional indicators</p>

          <MultiSelect
            options={optionalIndicators.map((item) => ({
              ...item,
              selected: values.additionalIndicators[item.value] ? true : false,
            }))}
            onChange={(indicators) =>
              setValues((prev) => ({
                ...prev,
                additionalIndicators: {
                  ...prev.additionalIndicators,
                  ...indicators.reduce((acc, curr) => {
                    acc[curr.value] = curr.selected;
                    return acc;
                  }, {}),
                },
              }))
            }
          />
        </div>

        <div className="col" style={{ gap: "10px" }}>
          <p className={styles.label}>MACD </p>

          <div className="row">
            <InputControl
              placeholder="Enter number"
              hintText="MACD - fast period"
              numericInput
              max={40}
              min={5}
              value={values.macdFastPeriod}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  macdFastPeriod: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
            <InputControl
              placeholder="Enter number"
              hintText="MACD - slow period"
              numericInput
              max={40}
              min={5}
              value={values.macdSlowPeriod}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  macdSlowPeriod: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
            <InputControl
              placeholder="Enter number"
              hintText="MACD - signal period"
              numericInput
              max={30}
              min={4}
              value={values.macdSignalPeriod}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  macdSignalPeriod: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
          </div>
        </div>
        <div className="col" style={{ gap: "10px" }}>
          <p className={styles.label}>Stochastic</p>

          <div className="row">
            <InputControl
              placeholder="Enter number"
              hintText="Stochastic - low"
              numericInput
              max={90}
              min={10}
              value={values.stochasticLow}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  stochasticLow: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
            <InputControl
              placeholder="Enter number"
              hintText="Stochastic - high"
              numericInput
              max={90}
              min={10}
              value={values.stochasticHigh}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  stochasticHigh: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
            <InputControl
              placeholder="Enter number"
              hintText="Stochastic - period"
              numericInput
              max={30}
              min={4}
              value={values.stochasticPeriod}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  stochasticPeriod: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
          </div>
        </div>
        <div className="col" style={{ gap: "10px" }}>
          <p className={styles.label}>William % R</p>

          <div className="row">
            <InputControl
              placeholder="Enter number"
              hintText="willR - low"
              numericInput
              max={90}
              min={10}
              value={values.willRLow}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  willRLow: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
            <InputControl
              placeholder="Enter number"
              hintText="willR - high"
              numericInput
              max={90}
              min={10}
              value={values.willRHigh}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  willRHigh: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
            <InputControl
              placeholder="Enter number"
              hintText="willR - period"
              numericInput
              max={30}
              min={4}
              value={values.willRPeriod}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  willRPeriod: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
          </div>
        </div>
        <div className="col" style={{ gap: "10px" }}>
          <p className={styles.label}>MFI (Money flow index)</p>

          <div className="row">
            <InputControl
              placeholder="Enter number"
              hintText="MFI - low"
              numericInput
              max={90}
              min={10}
              value={values.mfiLow}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  mfiLow: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
            <InputControl
              placeholder="Enter number"
              hintText="MFI - high"
              numericInput
              max={90}
              min={10}
              value={values.mfiHigh}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  mfiHigh: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
            <InputControl
              placeholder="Enter number"
              hintText="MFI - period"
              numericInput
              max={30}
              min={4}
              value={values.mfiPeriod}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  mfiPeriod: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
          </div>
        </div>
        <div className="col" style={{ gap: "10px" }}>
          <p className={styles.label}>RSI (10-90)</p>

          <div className="row">
            <InputControl
              placeholder="Enter number"
              hintText="RSI - low"
              numericInput
              max={90}
              min={10}
              value={values.rsiLow}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  rsiLow: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
            <InputControl
              placeholder="Enter number"
              hintText="RSI - high"
              numericInput
              max={90}
              min={10}
              value={values.rsiHigh}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  rsiHigh: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
            <InputControl
              placeholder="Enter number"
              hintText="RSI - period"
              numericInput
              max={30}
              min={4}
              value={values.rsiPeriod}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  rsiPeriod: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
          </div>
        </div>
        <div className="col" style={{ gap: "10px" }}>
          <p className={styles.label}>SMA (simple moving average) Period</p>

          <div className="row">
            <InputControl
              placeholder="Enter number"
              hintText="SMA - low period"
              numericInput
              max={150}
              min={10}
              value={values.smaLowPeriod}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  smaLowPeriod: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
            <InputControl
              placeholder="Enter number"
              hintText="SMA - high period"
              numericInput
              max={400}
              min={100}
              value={values.smaHighPeriod}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  smaHighPeriod: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
          </div>
        </div>
        <div className="col" style={{ gap: "10px" }}>
          <p className={styles.label}>Bollinger band</p>

          <div className="row">
            <InputControl
              placeholder="Enter number"
              hintText="Period"
              numericInput
              max={40}
              min={5}
              value={values.bollingerBandPeriod}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  bollingerBandPeriod: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
            <InputControl
              placeholder="Enter number"
              hintText="Deviation"
              numericInput
              max={10}
              min={1}
              value={values.bollingerBandStdDev}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  bollingerBandStdDev: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
          </div>
        </div>
        <div className="row">
          <InputControl
            label="VWAP period"
            placeholder="Enter number"
            numericInput
            max={40}
            min={4}
            value={values.vwapPeriod}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                vwapPeriod: parseInt(e.target.value),
              }))
            }
            disabled={!selectedStock?.value}
          />

          <InputControl
            label="CCI period"
            placeholder="Enter number"
            numericInput
            max={40}
            min={4}
            value={values.cciPeriod}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                cciPeriod: parseInt(e.target.value),
              }))
            }
            disabled={!selectedStock?.value}
          />
        </div>

        {tradeResults?.profitPercent ? (
          <div className={styles.results}>
            <div className={styles.card}>
              <p
                className={`${styles.title} ${
                  parseInt(tradeResults.profitPercent) > 40
                    ? styles.green
                    : styles.red
                }`}
              >
                {tradeResults.profitPercent}
              </p>
              <p className={styles.desc}>Profit Percent 💸</p>
            </div>

            <div className={styles.card}>
              <p className={`${styles.title}`}>{tradeResults.tradesNeeded}</p>
              <p className={styles.desc}>Trades needed</p>
            </div>

            <div className={styles.card}>
              <p className={`${styles.title}`}>{tradeResults.tradesTaken}</p>
              <p className={styles.desc}>Trades taken</p>
            </div>

            <div className={styles.card}>
              <p className={`${styles.title} ${styles.green}`}>
                {tradeResults.profitMaking}
              </p>
              <p className={styles.desc}>Profit making trades</p>
            </div>

            <div className={styles.card}>
              <p className={`${styles.title} ${styles.red}`}>
                {tradeResults.lossMaking}
              </p>
              <p className={styles.desc}>Loss making trades</p>
            </div>
          </div>
        ) : (
          ""
        )}

        <div className={styles.footer}>
          <Button
            outlineButton
            onClick={() => copyToClipboard(JSON.stringify(values))}
          >
            <Copy /> copy configuration
          </Button>

          <Button disabled={!selectedStock?.value} onClick={handleEvaluation}>
            Evaluate
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfigurationPage;
