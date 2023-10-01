import React, { useEffect, useState } from "react";
import { Bookmark, Check, Copy, X } from "react-feather";
import { toast } from "react-hot-toast";

import InputSelect from "Components/InputControl/InputSelect/InputSelect";
import InputControl from "Components/InputControl/InputControl";
import MultiSelect from "Components/MultiSelect/MultiSelect";
import Button from "Components/Button/Button";

import { getBestStockPresets } from "apis/trade";
import { copyToClipboard } from "utils/util";
import { indicatorsWeightEnum, takeTrades } from "utils/tradeUtil";
import stockData from "utils/stockData";

import styles from "./TestPage.module.scss";
import Toggle from "Components/Toggle/Toggle";

const availableStocks = [
  ...Object.keys(stockData).map((key) => ({
    value: key,
    label: key,
    data: stockData[key],
  })),
].filter((item) => item.data?.c?.length);

const optionalIndicators = [
  {
    label: "William % R" + ` (${indicatorsWeightEnum.williamR} point)`,
    value: "willR",
  },
  {
    label: "Money flow index" + ` (${indicatorsWeightEnum.mfi} point)`,
    value: "mfi",
  },
  {
    label: "Trend indicator (beta)" + ` (${indicatorsWeightEnum.trend} point)`,
    value: "trend",
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
};
function TestPage() {
  const [values, setValues] = useState({ ...defaultConfigs });
  const [firstRender, setFirstRender] = useState(true);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [stockPresets, setStockPresets] = useState({});
  const [tradeResults, setTradeResults] = useState([]);
  const [useBestPresets, setUseBestPresets] = useState(true);
  const [evaluating, setEvaluating] = useState(false);

  const fetchBestStockPreset = async () => {
    const res = await getBestStockPresets();
    if (!Array.isArray(res?.data)) return;

    setStockPresets(
      res.data.reduce((acc, curr) => {
        acc[curr.symbol] = curr;
        return acc;
      }, {})
    );
  };

  const sleep = (time = 200) => new Promise((res) => setTimeout(res, time));

  const handleEvaluation = async () => {
    if (!selectedStocks.length) return;

    setTradeResults([]);
    setEvaluating(true);
    const results = [];
    for (let i = 0; i < selectedStocks.length; ++i) {
      await sleep(1200);

      const stock = availableStocks.find(
        (item) => item.value == selectedStocks[i].value
      );
      if (!stock) continue;

      const preset = useBestPresets ? stockPresets[stock.value] : values;
      if (typeof preset !== "object" || !preset) continue;

      const { trades } = await takeTrades(stock.data, preset);
      const totalDays = parseInt((stock.data.c.length * 5) / 60 / 6);
      const total = trades.length;
      const profitable = trades.filter(
        (item) => item.result == "profit"
      ).length;

      const trade = {
        stock: stock.label,
        profitPercent: `${((profitable / total) * 100).toFixed(2)}%`,
        tradesNeeded: totalDays * 2,
        totalDays,
        tradesTaken: total,
        profitMaking: profitable,
        lossMaking: total - profitable,
        buyTrades: trades.filter((item) => item.type == "buy").length,
        sellTrades: trades.filter((item) => item.type == "sell").length,
        trades: trades.sort((a, b) =>
          parseInt(a.analytics.estimatedAccuracy) >
          parseInt(b.analytics.estimatedAccuracy)
            ? -1
            : 1
        ),
      };
      results.push(trade);

      setTradeResults([...results]);
    }

    setEvaluating(false);
    console.table(results);
    toast.success("Evaluation completed");
  };

  useEffect(() => {
    setFirstRender(false);
    fetchBestStockPreset();
  }, []);

  const stocksDiv = (
    <div className="col" style={{ gap: "10px" }}>
      <InputSelect
        placeholder="Select a stock"
        label="Select stocks"
        options={availableStocks
          .filter((item) => !selectedStocks.some((s) => item.value == s.value))
          .map((item) => ({
            label: item.label,
            value: item.value,
          }))}
        value={""}
        onChange={(e) => setSelectedStocks((prev) => [...prev, e])}
      />

      <div className={styles.chips}>
        {selectedStocks.map((item) => (
          <div
            key={item.value}
            className={styles.chip}
            onClick={() =>
              setSelectedStocks((prev) =>
                prev.filter((s) => s.value !== item.value)
              )
            }
          >
            {item.label}{" "}
            <div className="icon">
              <X />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <p className={styles.heading}>Test the stocks</p>

      <div className={styles.form}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <p className={styles.label}>Use best presets for trades</p>
          <Toggle
            options={[
              {
                icon: <X />,
                value: "no",
              },
              {
                icon: <Check />,
                value: "yes",
              },
            ]}
            selected={useBestPresets ? "yes" : "no"}
            onChange={(e) => setUseBestPresets(e.value == "yes")}
          />
        </div>

        {useBestPresets ? (
          <div className="row">{stocksDiv}</div>
        ) : (
          <>
            <div className="row">
              {stocksDiv}

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
                disabled={!selectedStocks.length}
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
                disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                  disabled={!selectedStocks.length}
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
                disabled={!selectedStocks.length}
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
                disabled={!selectedStocks.length}
              />
            </div>
          </>
        )}

        {tradeResults.length ? (
          <div className={styles.results}>
            <table className={styles.table}>
              <tr>
                <th>Symbol</th>
                <th>Percent 💸</th>
                <th>Days</th>
                <th>Trades</th>
                <th>Profit making</th>
                <th>Loss making</th>
                <th>BUY</th>
                <th>SELL</th>
              </tr>

              {tradeResults.map((item) => (
                <tr key={item.symbol}>
                  <td className={styles.name}>{item.stock}</td>
                  <td
                    className={
                      parseInt(item.profitPercent) > 46
                        ? styles.green
                        : styles.red
                    }
                  >
                    {item.profitPercent}
                  </td>
                  <td>{item.totalDays}</td>
                  <td>{item.tradesTaken}</td>
                  <td className={styles.green}>{item.profitMaking}</td>
                  <td className={styles.red}>{item.lossMaking}</td>
                  <td>{item.buyTrades}</td>
                  <td>{item.sellTrades}</td>
                </tr>
              ))}
            </table>
          </div>
        ) : (
          ""
        )}
        {evaluating ? (
          <p className={styles.heading} style={{ textAlign: "center" }}>
            Evaluating...
          </p>
        ) : (
          ""
        )}

        <div className={styles.footer}>
          <div />

          <div className={styles.right}>
            <Button
              outlineButton
              onClick={() => copyToClipboard(JSON.stringify(values))}
            >
              <Copy /> copy configuration
            </Button>

            <Button
              disabled={!selectedStocks.length}
              onClick={handleEvaluation}
            >
              Evaluate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TestPage;
