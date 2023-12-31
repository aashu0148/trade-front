import React, { useEffect, useState } from "react";
import { takeTrades } from "@aashu0148/yota-algo";

import { getDateFormatted, getTimeFormatted } from "utils/util";

import styles from "./StockChart.module.scss";

function StockChart({
  stockData = {},
  stockPreset = {},
  shortChart = false,
  tradesResponse = {},
  showIndexInTooltip = false,
  firstTradeIndex = -1,
}) {
  const [tooltipDetails, setTooltipDetails] = useState({
    style: {},
    data: {},
    close: "",
    index: "",
    date: "",
  });

  const renderChart = async () => {
    const chartElem = document.querySelector("#chart");

    if (!chartElem) return;
    chartElem.innerHTML = "";

    const width = chartElem.clientWidth;
    const height = chartElem.clientHeight;

    const { createChart } = window.LightweightCharts;

    const chart = createChart(chartElem, {
      width,
      height,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      pane: 0,
    });

    const candleSeries = chart.addCandlestickSeries({
      pane: 0,
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    const timeArr = stockData["5"].t;
    candleSeries.setData(
      stockData["5"].c.map((item, i) => ({
        time: stockData["5"].t[i],
        high: stockData["5"].h[i],
        low: stockData["5"].l[i],
        open: stockData["5"].o[i],
        close: stockData["5"].c[i],
      }))
    );

    // update tooltip
    chart.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartElem.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartElem.clientHeight
      ) {
        setTooltipDetails((prev) => ({
          ...prev,
          style: { ...prev.style, opacity: 0 },
        }));
      } else {
        // time will be in the same format that we supplied to setData.
        // thus it will be YYYY-MM-DD
        const dateStr = param.time;
        const data = param.seriesPrices.get(candleSeries);
        const price = data.value !== undefined ? data.value : data.close;

        const y = param.point.y;
        let left = param.point.x;
        if (left > chartElem.clientWidth) {
          left = param.point.x;
        }

        let top = y;
        if (top > chartElem.clientHeight) {
          top = y;
        }

        const style = {
          opacity: "1",
          top: top + "px",
          left: left + "px",
        };

        const index = timeArr.findIndex((item) => item == dateStr);

        setTooltipDetails({
          style,
          data,
          index,
          close: price,
          date: `${getDateFormatted(
            dateStr * 1000,
            true,
            true
          )} ${getTimeFormatted(dateStr * 1000)}`,
        });
      }
    });

    const colors = ["#a6b8ff50", "#ffd4a650", "#e0a6ff50", "#ffa6e050"];

    // trades
    const { trades, indicators = {} } =
      tradesResponse?.trades && tradesResponse?.indicators
        ? tradesResponse
        : await takeTrades(stockData, stockPreset, false);

    // trade marks
    if (firstTradeIndex > 0) {
      const line = chart.addLineSeries({
        pane: 0,
        color: "black",
        lineWidth: 8,
      });

      try {
        line.setData([
          {
            time: stockData["5"].t[firstTradeIndex - 1],
            value: stockData["5"].c[firstTradeIndex - 1],
          },
          {
            time: stockData["5"].t[firstTradeIndex + 1],
            value: stockData["5"].c[firstTradeIndex - 1],
          },
        ]);
      } catch (err) {}
    }
    trades.forEach((trade, i) => {
      const line = chart.addLineSeries({
        pane: 0,
        color: trade.type == "buy" ? "green" : "red",
        lineWidth: 8,
      });

      try {
        line.setData([
          {
            time: stockData["5"].t[trade.startIndex - 1],
            value: trade.startPrice,
          },
          {
            time: stockData["5"].t[trade.startIndex + 1],
            value: trade.startPrice,
          },
        ]);
      } catch (err) {
        // console.log("Error setting line data", {
        //   trade,
        //   time: stockData["5"].t[trade.startIndex - 1],
        //   stockData,
        // });
      }
    });

    // trend lines
    const trendLines = indicators.trendLines || [];
    trendLines.forEach((tLine) => {
      const line = chart.addLineSeries({
        pane: 0,
        color: "#197beb",
        lineWidth: 2,
      });

      line.setData([
        {
          time: stockData["5"].t[tLine.points[0].index],
          value: tLine.points[0].value,
        },
        {
          time: stockData["5"].t[tLine.points[tLine.points.length - 1].index],
          value: tLine.points[tLine.points.length - 1].value,
        },
      ]);
    });

    // range marks
    const ranges = indicators.ranges || [];
    ranges.forEach((range, i) => {
      const color = colors[i % colors.length];
      const line = chart.addLineSeries({
        pane: 0,
        color: "#197beb50",
        lineWidth: 8,
      });

      line.setData([
        {
          time: stockData["5"].t[range.start.index],
          value: range.min,
        },
        {
          time: stockData["5"].t[
            range.stillStrong ? stockData["5"].t.length - 1 : range.end.index
          ],
          value: range.min,
        },
      ]);
    });

    // VWAP
    const vwapSeries = chart.addLineSeries({
      priceFormat: { type: "price" },
      color: "orange",
      lineWidth: 1,
      pane: 0,
    });
    vwapSeries.setData(
      stockData["5"].c.map((item, i) => ({
        time: stockData["5"].t[i],
        value: indicators.vwap ? indicators.vwap[i] : "",
      }))
    );

    // PSAR
    const psarSeries = chart.addLineSeries({
      priceFormat: { type: "price" },
      color: "gray",
      lineWidth: 1,
      pane: 0,
    });
    psarSeries.setData(
      stockData["5"].c.map((_e, i) => ({
        time: stockData["5"].t[i],
        value: indicators.psar ? indicators.psar[i] : "",
      }))
    );

    // MACD
    const macdSeries = chart.addLineSeries({
      priceFormat: { type: "price" },
      color: "green",
      lineWidth: 1,
      pane: 1,
    });
    macdSeries.setData(
      stockData["5"].c.map((item, i) => ({
        time: stockData["5"].t[i],
        value: indicators.macd ? indicators.macd[i]?.macd : "",
      }))
    );

    const macdSignalSeries = chart.addLineSeries({
      priceFormat: { type: "price" },
      color: "red",
      lineWidth: 1,
      pane: 1,
    });
    macdSignalSeries.setData(
      stockData["5"].c.map((item, i) => ({
        time: stockData["5"].t[i],
        value: indicators.macd ? indicators.macd[i]?.signal : "",
      }))
    );

    chart.timeScale().fitContent();
  };

  useEffect(() => {
    if (stockData["5"] && stockData["5"]?.c?.length) {
      setTimeout(renderChart, 500);
    }
  }, [stockData, stockPreset]);

  const tooltipDiv = (
    <div className={styles.tooltip} style={{ ...tooltipDetails.style }}>
      {showIndexInTooltip ? (
        <div className={styles.item}>
          <label>Index</label>
          <span>{tooltipDetails.index}</span>
        </div>
      ) : (
        ""
      )}

      {["close", "open", "high", "low", "date"].map((item) => (
        <div className={styles.item} key={item}>
          <label>{item}</label>
          <span>{tooltipDetails[item] || tooltipDetails.data[item]}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.chartOuter}>
        {tooltipDiv}
        <div
          id="chart"
          className={`${styles.chart} ${shortChart ? styles.shortChart : ""}`}
        />
      </div>
    </div>
  );
}

export default StockChart;
