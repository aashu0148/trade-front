import React, { useEffect, useState } from "react";
import { Trash } from "react-feather";
import { toast } from "react-hot-toast";

import Spinner from "Components/Spinner/Spinner";
import InputControl from "Components/InputControl/InputControl";
import Button from "Components/Button/Button";

import { getBestStockPresets } from "apis/trade";
import { addNewStock, deleteStock, getAllStocks } from "apis/stocks";

import styles from "./StocksPage.module.scss";

function StocksPage() {
  const [stockSymbol, setStockSymbol] = useState("");
  const [stocks, setStocks] = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [addingStock, setAddingStock] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [presets, setPresets] = useState({});

  const fetchBestStockPreset = async () => {
    const res = await getBestStockPresets();
    if (!Array.isArray(res?.data)) return;

    setPresets(
      res.data.reduce((acc, curr) => {
        acc[curr.symbol] = curr;
        return acc;
      }, {})
    );
  };

  const fetchAllStocks = async () => {
    const res = await getAllStocks();
    setLoadingPage(false);

    if (!res?.data) return;

    setStocks(res.data.map((item) => item.symbol));
  };

  const handleAddNewStock = async () => {
    if (!stockSymbol) {
      setErrMsg("Enter stock name");
      return;
    }
    setErrMsg("");

    setAddingStock(true);
    const res = await addNewStock({ symbol: stockSymbol.toUpperCase() });
    setAddingStock(false);
    if (!res) return;

    fetchAllStocks();
    toast.success("Stock added successfully");
    setStockSymbol("");
  };

  const handleDeleteStock = async (symbol) => {
    const res = await deleteStock(symbol);
    if (!res) return;

    fetchAllStocks();
    toast.success("Stock deleted successfully");
  };

  useEffect(() => {
    fetchBestStockPreset();
    fetchAllStocks();
  }, []);

  return loadingPage ? (
    <div className="spinner-container">
      <Spinner />
    </div>
  ) : (
    <div className={styles.container}>
      <p className={styles.heading}>Available stocks</p>

      <div className={styles.add}>
        <InputControl
          label="Add new stock"
          placeholder="TATASTEEL"
          value={stockSymbol}
          onChange={(event) => setStockSymbol(event.target.value)}
          error={errMsg}
          onKeyDown={(e) => (e.key == "Enter" ? handleAddNewStock() : "")}
        />

        <Button
          disabled={addingStock}
          useSpinnerWhenDisabled
          onClick={handleAddNewStock}
        >
          Add stock
        </Button>
      </div>

      <div className={styles.stocks}>
        {stocks.length ? (
          stocks.map((s) => (
            <div key={s} className={styles.stock}>
              <p className={styles.name}>{s}</p>

              <div className={styles.right}>
                {presets[s] ? (
                  <>
                    <p className={styles.green}>
                      {presets[s].result?.profitPercent}
                    </p>
                    <p>{presets[s].result?.tradesTaken} trades</p>
                    <p>{presets[s].result?.totalDays} days</p>
                  </>
                ) : (
                  ""
                )}

                <div className="icon" onClick={() => handleDeleteStock(s)}>
                  <Trash />
                </div>
              </div>
            </div>
          ))
        ) : (
          <p>No stocks present</p>
        )}
      </div>
    </div>
  );
}

export default StocksPage;
