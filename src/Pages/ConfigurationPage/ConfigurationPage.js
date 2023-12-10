import React, { useEffect, useState } from "react";
import { Bookmark, Copy, X } from "react-feather";
import { toast } from "react-hot-toast";
import Calendar from "react-calendar";

import InputSelect from "Components/InputControl/InputSelect/InputSelect";
import InputControl from "Components/InputControl/InputControl";
import MultiSelect from "Components/MultiSelect/MultiSelect";
import Button from "Components/Button/Button";
import Spinner from "Components/Spinner/Spinner";
import StockChart from "Pages/TradePage/StockChart/StockChart";

import {
  createNewPreset,
  getBestStockPresets,
  getStocksData,
} from "apis/trade";
import { copyToClipboard } from "utils/util";
import {
  defaultTradePreset,
  indicatorsWeightEnum,
  takeTrades,
} from "utils/tradeUtil";

import styles from "./ConfigurationPage.module.scss";
import TradesModal from "Pages/CalendarPage/TradesModal/TradesModal";

const optionalIndicators = [
  {
    label: "SR" + ` (${indicatorsWeightEnum.sr} point)`,
    value: "sr",
  },
  {
    label: "Trend lines" + ` (${indicatorsWeightEnum.tl} point)`,
    value: "tl",
  },
  {
    label: "Break out/down (beta)" + ` (${indicatorsWeightEnum.br} point)`,
    value: "br",
  },
  {
    label: "Engulfing candle" + ` (${indicatorsWeightEnum.engulf} point)`,
    value: "engulf",
  },
  // {
  //   label: "Trend indicator (beta)" + ` (${indicatorsWeightEnum.trend} point)`,
  //   value: "trend",
  // },
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

function ConfigurationPage() {
  const [stocksData, setStocksData] = useState({});
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [values, setValues] = useState({ ...defaultTradePreset });
  const [selectedStock, setSelectedStock] = useState({});
  const [tradeResults, setTradeResults] = useState({
    analytics: {},
    tradesResponse: {},
  });
  const [stockPresets, setStockPresets] = useState({});
  const [disabledButtons, setDisabledButtons] = useState({
    savePresetToDb: false,
    fetchStockData: false,
  });
  const [loadingPage, setLoadingPage] = useState(true);
  const [isMoreTuningOpen, setIsMoreTuningOpen] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [showTradesModal, setShowTradesModal] = useState(false);
  const [allTimeFrame, setAllTimeFrame] = useState({
    start: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });

  const availableStocks = [
    ...Object.keys(stocksData).map((key) => ({
      value: key,
      label: `${key} | ${
        stocksData[key]["5"].c[stocksData[key]["5"].c.length - 1]
      }`,
      data: stocksData[key],
    })),
  ].filter((item) => item.data["5"]?.c?.length);

  const fetchStockData = async () => {
    if (allTimeFrame.start > allTimeFrame.end) {
      toast.error("start date must be smaller than end date");
      return;
    }
    if (
      allTimeFrame.end.getTime() - allTimeFrame.start.getTime() >
      320 * 24 * 60 * 60 * 1000
    ) {
      toast.error("Interval can not be greater than 1 year");
      return;
    }

    setDisabledButtons((prev) => ({ ...prev, fetchStockData: true }));
    const res = await getStocksData(
      allTimeFrame.start.getTime(),
      allTimeFrame.end.getTime()
    );
    setDisabledButtons((prev) => ({ ...prev, fetchStockData: false }));
    setLoadingPage(false);
    if (typeof res?.data !== "object" || !res?.data) return;

    toast.success("new stock data filled");
    setStocksData(res.data);
    setSelectedStock({});
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
    if (!selectedStock?.data["5"]) return;

    const startTime = Date.now();

    const tradesResponse = await takeTrades(selectedStock.data, values, false);
    const { trades, indicators } = tradesResponse;
    const endTime = Date.now();

    const totalDays = parseInt((selectedStock.data["5"].c.length * 5) / 60 / 6);

    const total = trades.length;
    const profitable = trades.filter((item) => item.status == "profit").length;
    const lost = trades.filter((item) => item.status == "loss").length;
    const unfinished = trades.filter(
      (item) => item.status == "unfinished"
    ).length;

    const analytics = {
      stock: selectedStock.label,
      symbol: selectedStock.value,
      profitPercent: `${((profitable / (profitable + lost)) * 100).toFixed(
        2
      )}%`,
      tradesNeeded: totalDays * 2,
      totalDays,
      tradesTaken: total,
      profitMaking: profitable,
      lossMaking: lost,
      unfinished,
      buyTrades: trades.filter((item) => item.type == "buy").length,
      sellTrades: trades.filter((item) => item.type == "sell").length,
    };

    console.log(
      {
        trades: trades.map((item) => ({
          reasons: Object.keys(item.analytics.allowedIndicatorSignals)
            .filter((k) => item.analytics.allowedIndicatorSignals[k] !== "hold")
            .join(", "),
          ...item,
        })),
        indicators,
        analytics,
        config: values,
      },
      (endTime - startTime) / 1000 + "s"
    );
    setTradeResults({ analytics, tradesResponse });
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
        result: tradeResults.analytics,
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

  const handlePasteConfig = async () => {
    const text = await window.navigator.clipboard.readText();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {}
    if (typeof parsed?.preset !== "object" || !parsed?.symbol) {
      toast.error("Invalid config");
      return;
    }

    const finalPreset = { ...defaultTradePreset, ...parsed.preset };
    setValues(finalPreset);

    toast.success("Preset pasted");
  };

  const handleApplyBestPreset = () => {
    const preset = stockPresets[selectedStock.value] || {};

    setValues({ ...defaultTradePreset, ...preset });
    toast.success("Preset applied");
  };

  const handleSavePresetToDb = async () => {
    const currentPercent = parseInt(tradeResults.analytics?.profitPercent) || 0;
    const tradesTaken = parseInt(tradeResults.analytics?.tradesTaken) || 0;
    if (currentPercent < 44)
      return toast.error("Profit percent must be greater than 44");
    // if (tradesTaken < 20) return toast.error("Take at least 20 trades");

    setDisabledButtons((prev) => ({ ...prev, savePresetToDb: true }));
    const result = { ...tradeResults.analytics };
    const res = await createNewPreset({
      preset: values,
      symbol: selectedStock.value,
      result,
    });
    setDisabledButtons((prev) => ({ ...prev, savePresetToDb: false }));
    if (!res) return;

    toast.success("Stock preset saved to database");
    fetchBestStockPreset();
  };

  useEffect(() => {
    setTradeResults({ analytics: {}, tradesResponse: {} });
  }, [selectedStock]);

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
      {showTradesModal ? (
        <TradesModal
          trades={tradeResults?.tradesResponse?.trades}
          hideTime
          onClose={() => setShowTradesModal(false)}
          showDateInCard
        />
      ) : (
        ""
      )}

      <p className={styles.heading}>Configure a stock for best outcome</p>

      {loadingPage ? (
        <div className="spinner-container">
          <Spinner />
        </div>
      ) : (
        <div className={styles.form}>
          <div className="row">
            <InputControl
              placeholder="Select start date"
              label="Start date"
              datePicker
              datePickerProps={{
                maxDate: new Date(),
                // minDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
              }}
              value={allTimeFrame.start}
              onChange={(date) =>
                setAllTimeFrame((prev) => ({ ...prev, start: date }))
              }
            />

            <InputControl
              placeholder="Select end date"
              label="End date"
              datePicker
              datePickerProps={{
                maxDate: new Date(),
                // minDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
              }}
              value={allTimeFrame.end}
              onChange={(date) =>
                setAllTimeFrame((prev) => ({ ...prev, end: date }))
              }
            />

            <Button
              className={styles.button}
              onClick={fetchStockData}
              disabled={disabledButtons.fetchStockData}
              useSpinnerWhenDisabled
            >
              Fetch new data
            </Button>
          </div>

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
              id={JSON.stringify(values.useSRsToNeglectTrades)}
              options={[
                {
                  label: `Use SR to neglect trades`,
                  value: "useSRsToNeglectTrades",
                  selected: values.useSRsToNeglectTrades,
                },
              ]}
              onChange={(obj) =>
                setValues((prev) => ({
                  ...prev,
                  useSRsToNeglectTrades: obj[0].selected,
                }))
              }
            />

            {/* <MultiSelect
              id={JSON.stringify(values.reverseTheTradingLogic)}
              options={[
                {
                  label: `Reverse trade taking logic`,
                  value: "reverseTheTradingLogic",
                  selected: values.reverseTheTradingLogic,
                },
              ]}
              onChange={(obj) =>
                setValues((prev) => ({
                  ...prev,
                  reverseTheTradingLogic: obj[0].selected,
                }))
              }
            /> */}
          </div>
          <div className="row">
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

            <InputControl
              placeholder="Enter number"
              numericInput
              label="TrendLine V-point offset"
              max={30}
              min={1}
              value={values.trendLineVPointOffset}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  trendLineVPointOffset: parseInt(e.target.value),
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

            {/* <InputControl
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
              disabled={!selectedStock?.value }
            /> */}
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

          {tradeResults.analytics?.profitPercent ? (
            <div>
              <p
                className={styles.textBtn}
                onClick={() => setShowChart((prev) => !prev)}
              >
                {showChart ? "Hide" : "Show"} chart
              </p>
              {showChart ? (
                <StockChart
                  stockData={selectedStock?.data}
                  stockPreset={values}
                  tradesResponse={tradeResults.tradesResponse}
                  showIndexInTooltip
                />
              ) : (
                ""
              )}

              <p
                className={styles.heading}
                style={{ textAlign: "center", marginBottom: "15px" }}
              >
                Results: {selectedStock.label} | (
                {tradeResults.analytics?.totalDays} days)
              </p>
              <div className={styles.results}>
                <div className={styles.card}>
                  <p
                    className={`${styles.title} ${
                      parseInt(tradeResults.analytics?.profitPercent) >= 48
                        ? styles.green
                        : styles.red
                    }`}
                  >
                    {tradeResults.analytics?.profitPercent}
                  </p>
                  <p className={styles.desc}>Profit Percent 💸</p>
                </div>

                <div className={styles.card}>
                  <p className={`${styles.title}`}>
                    {tradeResults.analytics?.totalDays}
                  </p>
                  <p className={styles.desc}>Total days</p>
                </div>

                <div className={styles.card}>
                  <p className={`${styles.title}`}>
                    {tradeResults.analytics?.tradesTaken}
                  </p>
                  <p className={styles.desc}>Trades taken</p>
                </div>

                <div className={styles.card}>
                  <p className={`${styles.title} ${styles.green}`}>
                    {tradeResults.analytics?.profitMaking}
                  </p>
                  <p className={styles.desc}>Profit making trades</p>
                </div>

                <div className={styles.card}>
                  <p className={`${styles.title} ${styles.red}`}>
                    {tradeResults.analytics?.lossMaking}
                  </p>
                  <p className={styles.desc}>Loss making trades</p>
                </div>

                <div className={styles.card}>
                  <p className={`${styles.title}`}>
                    {tradeResults.analytics?.unfinished}
                  </p>
                  <p className={styles.desc}>Unfinished trades</p>
                </div>
              </div>

              <div className={styles.buttons}>
                <Button outlineButton onClick={() => setShowTradesModal(true)}>
                  View trades
                </Button>

                {parseInt(tradeResults.analytics?.profitPercent) > 44 && (
                  <Button
                    onClick={handleSavePresetToDb}
                    disabled={disabledButtons.savePresetToDb}
                    useSpinnerWhenDisabled
                  >
                    Save this preset to database
                  </Button>
                )}
              </div>
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
                {/* {tradeResults.analytics?.profitPercent && (
                  <Button outlineButton onClick={() => handleSaveConfig()}>
                    <Bookmark /> Save this config
                  </Button>
                )} */}

                <Button onClick={() => handleApplyBestPreset()}>
                  Apply preset
                </Button>

                <Button onClick={() => handlePasteConfig()} outlineButton>
                  Paste config
                </Button>
              </div>
            ) : (
              <div />
            )}

            <div className={styles.right}>
              {tradeResults.analytics?.profitPercent ? (
                <Button
                  outlineButton
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify({
                        preset: { ...values },
                        symbol: selectedStock.value,
                        result: tradeResults.analytics,
                      })
                    )
                  }
                >
                  <Copy /> copy config
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
