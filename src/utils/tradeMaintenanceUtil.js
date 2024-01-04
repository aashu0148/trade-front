export const analyzeTradesForCompletion = (
  trades = [],
  currIndex,
  stockData = {}
) => {
  const checkTradeCompletion = (
    triggerPrice,
    priceData,
    target,
    sl,
    isSellTrade = false
  ) => {
    let statusNumber = 0,
      tradeHigh,
      tradeLow;
    if (
      !triggerPrice ||
      !target ||
      !sl ||
      !Array.isArray(priceData?.c) ||
      !priceData?.c?.length
    )
      return {
        statusNumber,
        tradeHigh,
        tradeLow,
      };

    tradeHigh = priceData.h[0];
    tradeLow = priceData.l[0];
    for (let i = 0; i < priceData.c.length; ++i) {
      const l = priceData.l[i];
      const h = priceData.h[i];

      if (h > tradeHigh) tradeHigh = h;
      else if (l < tradeLow) tradeLow = l;

      if (
        statusNumber == 0 &&
        ((isSellTrade && l < target) || (!isSellTrade && h > target))
      ) {
        statusNumber = 1;
      }
      if (
        statusNumber == 0 &&
        ((isSellTrade && h >= sl) || (!isSellTrade && l <= sl))
      ) {
        statusNumber = -1;
      }
    }

    return {
      statusNumber,
      tradeHigh,
      tradeLow,
    };
  };

  trades.forEach((trade) => {
    if (
      trade.status == "profit" ||
      trade.status == "loss" ||
      trade.status == "cancelled" ||
      trade.status == "unfinished"
    )
      return;

    const symbol = trade.symbol || trade.name;
    const sData = stockData[symbol] ? stockData[symbol]["5"] : {};

    if (trade.status == "limit") {
      if (currIndex - trade.startIndex > 8) {
        trade.status = "cancelled";
        return;
      }

      const prices = {
        high: sData.h[currIndex],
        low: sData.l[currIndex],
      };

      if (trade.startPrice > prices.low && trade.startPrice < prices.high) {
        trade.status = "taken";
        trade.limitIndex = trade.startIndex;
        trade.startIndex = currIndex;
      }

      return;
    }

    const isSellTrade = trade.type.toLowerCase() == "sell";
    if (!sData?.c?.length) return;

    const tradeTimeInSec = trade.time / 1000;
    const timeIndex = sData.t.findIndex((t) => t >= tradeTimeInSec);
    if (timeIndex < 0) return;

    const tradePriceData = {
      c: sData.c.slice(timeIndex, currIndex + 1),
      o: sData.o.slice(timeIndex, currIndex + 1),
      h: sData.h.slice(timeIndex, currIndex + 1),
      l: sData.l.slice(timeIndex, currIndex + 1),
      t: sData.t.slice(timeIndex, currIndex + 1),
      v: sData.v.slice(timeIndex, currIndex + 1),
    };
    const longTradePriceData = {
      c: sData.c.slice(timeIndex - 50, currIndex + 1),
      o: sData.o.slice(timeIndex - 50, currIndex + 1),
      h: sData.h.slice(timeIndex - 50, currIndex + 1),
      l: sData.l.slice(timeIndex - 50, currIndex + 1),
      t: sData.t.slice(timeIndex - 50, currIndex + 1),
      v: sData.v.slice(timeIndex - 50, currIndex + 1),
    };
    const { statusNumber, tradeHigh, tradeLow } = checkTradeCompletion(
      trade.startPrice,
      tradePriceData,
      trade.target,
      trade.sl,
      isSellTrade
    );

    const currentTime = sData.t[currIndex];
    const currentDate = new Date(currentTime * 1000).toLocaleDateString(
      "en-in"
    );

    const status =
      trade.date !== currentDate
        ? "unfinished"
        : statusNumber == 1
        ? "profit"
        : statusNumber == -1
        ? "loss"
        : "taken";

    // update the trade status
    trade.priceData = longTradePriceData;
    trade.tradeStartIndex = 50;
    trade.tradeHigh = tradeHigh;
    trade.tradeLow = tradeLow;
    trade.status = status;
  });

  return trades;
};
