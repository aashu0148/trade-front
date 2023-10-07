import React, { useEffect, useState } from "react";
import { Bookmark, Copy, X } from "react-feather";
import { toast } from "react-hot-toast";

import InputSelect from "Components/InputControl/InputSelect/InputSelect";
import InputControl from "Components/InputControl/InputControl";
import MultiSelect from "Components/MultiSelect/MultiSelect";
import Button from "Components/Button/Button";
import Spinner from "Components/Spinner/Spinner";

import {
  createNewPreset,
  getBestStockPresets,
  getStocksData,
} from "apis/trade";
import { copyToClipboard } from "utils/util";
import { indicatorsWeightEnum, takeTrades } from "utils/tradeUtil";

import styles from "./ConfigurationPage.module.scss";

const optionalIndicators = [
  {
    label: "Break out/down (beta)" + ` (${indicatorsWeightEnum.br} point)`,
    value: "br",
  },
  {
    label: "Trend indicator (beta)" + ` (${indicatorsWeightEnum.trend} point)`,
    value: "trend",
  },
  {
    label: "Bollinger band" + ` (${indicatorsWeightEnum.bollingerBand} point)`,
    value: "bollinger",
  },
  {
    label: "Moving average" + ` (${indicatorsWeightEnum.sma} point)`,
    value: "sma",
  },
  {
    label: "RSI" + ` (${indicatorsWeightEnum.rsi} point)`,
    value: "rsi",
  },
  {
    label: "MACD" + ` (${indicatorsWeightEnum.macd} point)`,
    value: "macd",
  },
  {
    label: "William % R" + ` (${indicatorsWeightEnum.williamR} point)`,
    value: "willR",
  },
  {
    label: "Money flow index" + ` (${indicatorsWeightEnum.mfi} point)`,
    value: "mfi",
  },
  {
    label: "Commodity channel index" + ` (${indicatorsWeightEnum.cci} point)`,
    value: "cci",
  },
  {
    label: "Stochastic" + ` (${indicatorsWeightEnum.stochastic} point)`,
    value: "stochastic",
  },
  {
    label: "VWAP" + ` (${indicatorsWeightEnum.vwap} point)`,
    value: "vwap",
  },
  {
    label: "Parabolic SAR" + ` (${indicatorsWeightEnum.psar} point)`,
    value: "psar",
  },
];

const defaultConfigs = {
  decisionMakingPoints: 3,
  additionalIndicators: {
    willR: false,
    mfi: false,
    trend: false,
    cci: false,
    stochastic: false,
    vwap: false,
    psar: false,
    br: false,
    rsi: false,
    macd: true,
    bollinger: true,
    sma: true,
    obv: false,
  },
  useSupportResistances: true,
  vPointOffset: 8,
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
  targetProfitPercent: 1.4,
  stopLossPercent: 0.7,
  brTotalTrendLength: 33,
  brLongTrendLength: 21,
  brShortTrendLength: 10,
  avoidingLatestSmallMovePercent: 0.9,
};
function ConfigurationPage() {
  const [stocksData, setStocksData] = useState({});
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [values, setValues] = useState({ ...defaultConfigs });
  const [selectedStock, setSelectedStock] = useState({});
  const [tradeResults, setTradeResults] = useState({});
  const [stockPresets, setStockPresets] = useState({});
  const [disabledButtons, setDisabledButtons] = useState({
    savePresetToDb: false,
  });
  const [loadingPage, setLoadingPage] = useState(true);
  const [isMoreTuningOpen, setIsMoreTuningOpen] = useState(false);

  const availableStocks = [
    ...Object.keys(stocksData).map((key) => ({
      value: key,
      label: `${key} | ${stocksData[key].c.pop()}`,
      data: stocksData[key],
    })),
  ].filter((item) => item.data?.c?.length);

  const fetchStockData = async () => {
    const res = await getStocksData();
    setLoadingPage(false);
    if (typeof res?.data !== "object" || !res?.data) return;

    setStocksData(res.data);
  };

  const fetchBestStockPreset = async () => {
    const res = await getBestStockPresets();
    if (!Array.isArray(res?.data)) return;

    setStockPresets(
      res.data.reduce((acc, curr) => {
        acc[curr.symbol] = curr.preset;
        return acc;
      }, {})
    );
  };

  const handleEvaluation = async () => {
    if (!selectedStock?.data?.c?.length) return;

    const startTime = Date.now();
    const { trades } = await takeTrades(selectedStock.data, values, false);
    const endTime = Date.now();

    const totalDays = parseInt((selectedStock.data.c.length * 5) / 60 / 6);

    const total = trades.length;
    const profitable = trades.filter((item) => item.status == "profit").length;

    const analytics = {
      stock: selectedStock.label,
      symbol: selectedStock.value,
      profitPercent: `${((profitable / total) * 100).toFixed(2)}%`,
      tradesNeeded: totalDays * 2,
      totalDays,
      tradesTaken: total,
      profitMaking: profitable,
      lossMaking: total - profitable,
      buyTrades: trades.filter((item) => item.type == "buy").length,
      sellTrades: trades.filter((item) => item.type == "sell").length,
    };

    console.log(
      { trades, analytics, config: values },
      (endTime - startTime) / 1000 + "s"
    );
    setTradeResults(analytics);
    toast.success("Evaluation done");
  };

  const handleSaveConfig = () => {
    const configString = JSON.stringify(values);

    const correspondingConfigs = savedConfigs.filter(
      (item) => item.stock == selectedStock.value
    );

    const alreadyExist = correspondingConfigs.some(
      (item) => JSON.stringify(item.config) == configString
    );
    if (alreadyExist) {
      toast.error("Config already exists in saved");
      return;
    }

    setSavedConfigs((prev) => [
      ...prev,
      {
        stock: selectedStock.value,
        name: `${selectedStock.value} ${correspondingConfigs.length + 1}`,
        config: values,
        result: tradeResults,
      },
    ]);
  };

  const handleConfigApply = (config) => {
    if (typeof config.config == "object") {
      setValues(config.config);
      setSelectedStock(
        availableStocks.find((item) => item.value == config.stock)
      );

      toast.success("Config applied");
      setTradeResults({});
    }
  };

  const handleApplyBestPreset = () => {
    const preset = stockPresets[selectedStock.value] || {};

    setValues({ ...defaultConfigs, ...preset });
    toast.success("Preset applied");
  };

  const handleSavePresetToDb = async () => {
    const currentPercent = parseInt(tradeResults.profitPercent) || 0;
    const tradesTaken = parseInt(tradeResults.tradesTaken) || 0;
    if (currentPercent < 48)
      return toast.error("Profit percent must be greater than 48");
    if (tradesTaken < 25) return toast.error("Take at least 25 trades");

    setDisabledButtons((prev) => ({ ...prev, savePresetToDb: true }));
    const res = await createNewPreset({
      preset: values,
      symbol: selectedStock.value,
      result: tradeResults,
    });
    setDisabledButtons((prev) => ({ ...prev, savePresetToDb: false }));
    if (!res) return;

    toast.success("Stock preset saved to database");
    fetchBestStockPreset();
  };

  useEffect(() => {
    if (loadingPage) return;

    const str = JSON.stringify(savedConfigs);
    localStorage.setItem("saved-config", str);
  }, [savedConfigs]);

  useEffect(() => {
    try {
      const savedConfigs = localStorage.getItem("saved-config");
      if (savedConfigs) {
        const arr = JSON.parse(savedConfigs);

        if (Array.isArray(arr)) setSavedConfigs(arr);
      }
    } catch (err) {
      // nothing
    }

    fetchStockData();
    fetchBestStockPreset();
  }, []);

  return (
    <div className={styles.container}>
      <p className={styles.heading}>Configure a stock for best outcome</p>

      {loadingPage ? (
        <div className="spinner-container">
          <Spinner />
        </div>
      ) : (
        <div className={styles.form}>
          <div className="row">
            <InputSelect
              placeholder="Select a stock"
              label="Select stock"
              options={availableStocks.map((item) => ({
                label: item.label,
                value: item.value,
              }))}
              value={
                selectedStock.value
                  ? { label: selectedStock.label, value: selectedStock.value }
                  : ""
              }
              onChange={(e) => {
                setSelectedStock(
                  availableStocks.find((item) => item.value == e.value)
                );
                setTradeResults({});
              }}
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
          <div className="row" style={{ alignItems: "center" }}>
            <MultiSelect
              id={JSON.stringify(values.useSupportResistances)}
              options={[
                {
                  label: `Use support resistances`,
                  value: "useSupportResistances",
                  selected: values.useSupportResistances,
                },
              ]}
              onChange={(obj) =>
                setValues((prev) => ({
                  ...prev,
                  useSupportResistances: obj[0].selected,
                }))
              }
            />

            <InputControl
              placeholder="Enter number"
              numericInput
              label="V-point offset"
              max={30}
              min={1}
              value={values.vPointOffset}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  vPointOffset: parseInt(e.target.value),
                }))
              }
              disabled={!selectedStock?.value}
            />
          </div>
          <div className="row">
            <InputControl
              placeholder="Enter number"
              label="Target percentage (0.2 - 2)"
              type="number"
              max={4}
              min={0.2}
              value={values.targetProfitPercent}
              onChange={(e) => {
                const val = isNaN(parseFloat(e.target.value))
                  ? ""
                  : parseFloat(e.target.value);

                if (val < 0 || val > 4) return;

                setValues((prev) => ({
                  ...prev,
                  targetProfitPercent: val,
                }));
              }}
              disabled={!selectedStock?.value}
            />

            <InputControl
              placeholder="Enter number"
              label="Stop-loss percentage (0.2 - 2)"
              type="number"
              max={4}
              min={0.2}
              value={values.stopLossPercent}
              onChange={(e) => {
                const val = isNaN(parseFloat(e.target.value))
                  ? ""
                  : parseFloat(e.target.value);

                if (val < 0 || val > 4) return;

                setValues((prev) => ({
                  ...prev,
                  stopLossPercent: val,
                }));
              }}
              disabled={!selectedStock?.value}
            />

            <InputControl
              placeholder="Enter number"
              label="Avoiding last move percent (0.2 - 2)"
              type="number"
              max={4}
              min={0.2}
              value={values.avoidingLatestSmallMovePercent}
              onChange={(e) => {
                const val = isNaN(parseFloat(e.target.value))
                  ? ""
                  : parseFloat(e.target.value);

                if (val < 0 || val > 4) return;

                setValues((prev) => ({
                  ...prev,
                  avoidingLatestSmallMovePercent: val,
                }));
              }}
              disabled={!selectedStock?.value}
            />
          </div>
          <div className="col" style={{ gap: "10px" }}>
            <p className={styles.label}>Additional indicators</p>

            <MultiSelect
              id={JSON.stringify(values.additionalIndicators)}
              options={optionalIndicators.map((item) => ({
                ...item,
                selected: values.additionalIndicators[item.value]
                  ? true
                  : false,
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
            <p className={styles.label}>Break out/down </p>

            <div className="row">
              <InputControl
                placeholder="Enter number"
                hintText="total trend length"
                numericInput
                max={40}
                min={5}
                value={values.brTotalTrendLength}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    brTotalTrendLength: parseInt(e.target.value),
                  }))
                }
                disabled={!selectedStock?.value}
              />
              <InputControl
                placeholder="Enter number"
                hintText="long trend length"
                numericInput
                max={40}
                min={5}
                value={values.brLongTrendLength}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    brLongTrendLength: parseInt(e.target.value),
                  }))
                }
                disabled={!selectedStock?.value}
              />
              <InputControl
                placeholder="Enter number"
                hintText="short trend length"
                numericInput
                max={30}
                min={4}
                value={values.brShortTrendLength}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    brShortTrendLength: parseInt(e.target.value),
                  }))
                }
                disabled={!selectedStock?.value}
              />
            </div>
          </div>

          <p
            className={styles.textBtn}
            onClick={() => setIsMoreTuningOpen((prev) => !prev)}
          >
            {isMoreTuningOpen ? "Hide" : "Show"} more tuning
          </p>
          {isMoreTuningOpen ? (
            <div className={`${styles.tuning} ${styles.open}`}>
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
                <p className={styles.label}>
                  SMA (simple moving average) Period
                </p>

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
            </div>
          ) : (
            ""
          )}

          {tradeResults?.profitPercent ? (
            <div>
              <p
                className={styles.heading}
                style={{ textAlign: "center", marginBottom: "15px" }}
              >
                Results: {selectedStock.label}
              </p>
              <div className={styles.results}>
                <div className={styles.card}>
                  <p
                    className={`${styles.title} ${
                      parseInt(tradeResults.profitPercent) >= 48
                        ? styles.green
                        : styles.red
                    }`}
                  >
                    {tradeResults.profitPercent}
                  </p>
                  <p className={styles.desc}>Profit Percent 💸</p>
                </div>

                <div className={styles.card}>
                  <p className={`${styles.title}`}>{tradeResults.totalDays}</p>
                  <p className={styles.desc}>Total days</p>
                </div>

                <div className={styles.card}>
                  <p className={`${styles.title}`}>
                    {tradeResults.tradesTaken}
                  </p>
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

                <div className={styles.card}>
                  <p className={`${styles.title}`}>{tradeResults.buyTrades}</p>
                  <p className={styles.desc}>BUY trades</p>
                </div>

                <div className={styles.card}>
                  <p className={`${styles.title}`}>{tradeResults.sellTrades}</p>
                  <p className={styles.desc}>SELL trades</p>
                </div>
              </div>

              {parseInt(tradeResults.profitPercent) >= 48 && (
                <Button
                  style={{ margin: "15px auto 0 auto" }}
                  onClick={handleSavePresetToDb}
                  disabled={disabledButtons.savePresetToDb}
                  useSpinnerWhenDisabled
                >
                  Save this preset to database
                </Button>
              )}
            </div>
          ) : (
            ""
          )}
          {savedConfigs?.length ? (
            <div className={styles.configs}>
              <p className={styles.label}>Saved configs</p>
              {savedConfigs.map((item, index) => (
                <div className={styles.config} key={index}>
                  <p className={styles.title}>{item.name}</p>

                  <div className={styles.right}>
                    <Button
                      outlineButton
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify({
                            preset: { ...item.config },
                            symbol: item.stock,
                            result: item.result,
                          })
                        )
                      }
                    >
                      <Copy />
                    </Button>
                    <Button onClick={() => handleConfigApply(item)}>
                      Apply
                    </Button>

                    <div
                      className="icon"
                      onClick={() =>
                        setSavedConfigs((prev) =>
                          prev.filter((e, i) => i !== index)
                        )
                      }
                    >
                      <X />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            ""
          )}
          <div className={styles.footer}>
            {selectedStock.value ? (
              <div className={styles.right}>
                {tradeResults.profitPercent && (
                  <Button outlineButton onClick={() => handleSaveConfig()}>
                    <Bookmark /> Save this config
                  </Button>
                )}

                <Button onClick={() => handleApplyBestPreset()}>
                  Apply preset
                </Button>
              </div>
            ) : (
              <div />
            )}

            <div className={styles.right}>
              {tradeResults.profitPercent ? (
                <Button
                  outlineButton
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify({
                        preset: { ...values },
                        symbol: selectedStock.value,
                        result: tradeResults,
                      })
                    )
                  }
                >
                  <Copy /> copy configuration
                </Button>
              ) : (
                ""
              )}

              <Button
                disabled={!selectedStock?.value}
                onClick={handleEvaluation}
              >
                Evaluate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfigurationPage;
