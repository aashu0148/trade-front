import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import InputControl from "Components/InputControl/InputControl";
import InputSelect from "Components/InputControl/InputSelect/InputSelect";
import Button from "Components/Button/Button";
import Spinner from "Components/Spinner/Spinner";

import { getBestStockPresets, getStocksData } from "apis/trade";

import styles from "./LiveTestPage.module.scss";

function LiveTestPage() {
  const [stocksData, setStocksData] = useState({});
  const [selectedStock, setSelectedStock] = useState({});
  const [stockPresets, setStockPresets] = useState({});
  const [disabledButtons, setDisabledButtons] = useState({
    savePresetToDb: false,
    fetchStockData: false,
  });
  const [loadingPage, setLoadingPage] = useState(true);
  const [timeFrame, setTimeFrame] = useState({
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
    if (timeFrame.start > timeFrame.end) {
      toast.error("start date must be smaller than end date");
      return;
    }
    if (
      timeFrame.end.getTime() - timeFrame.start.getTime() >
      320 * 24 * 60 * 60 * 1000
    ) {
      toast.error("Interval can not be greater than 1 year");
      return;
    }

    setDisabledButtons((prev) => ({ ...prev, fetchStockData: true }));
    const res = await getStocksData(
      timeFrame.start.getTime(),
      timeFrame.end.getTime()
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

  useEffect(() => {
    fetchStockData();
    fetchBestStockPreset();
  }, []);

  return loadingPage ? (
    <div className="spinner-container">
      <Spinner />
    </div>
  ) : (
    <div className={styles.container}>
      <p className="heading">Test stock like its LIVE</p>

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
          placeholder="Select start date"
          label="Start date"
          datePicker
          datePickerProps={{
            maxDate: new Date(),
            // minDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000),
          }}
          value={timeFrame.start}
          onChange={(date) =>
            setTimeFrame((prev) => ({ ...prev, start: date }))
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
          value={timeFrame.end}
          onChange={(date) => setTimeFrame((prev) => ({ ...prev, end: date }))}
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
    </div>
  );
}

export default LiveTestPage;
