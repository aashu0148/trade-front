export const analyzeTradesForCompletion = (
  trades = [],
  currIndex,
  stockData = { c: [], v: [], h: [], o: [], l: [] }
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

    if (trade.status == "limit") {
      if (currIndex - trade.startIndex > 8) {
        trade.status = "cancelled";
        return;
      }

      const prices = {
        high: stockData.h[currIndex],
        low: stockData.l[currIndex],
      };

      if (trade.startPrice > prices.low && trade.startPrice < prices.high) {
        trade.status = "taken";
        trade.limitIndex = trade.startIndex;
        trade.startIndex = currIndex;
      }

      return;
    }

    const currTradeHigh = trade.tradeHigh || 0;
    const currTradeLow = trade.tradeLow || 9999999;
    const isSellTrade = trade.type.toLowerCase() == "sell";

    if (!stockData?.c?.length) return;

    const tradeTimeInSec = trade.time / 1000;
    const timeIndex = stockData.t.findIndex((t) => t >= tradeTimeInSec);
    if (timeIndex < 0) return;

    const { statusNumber, tradeHigh, tradeLow } = checkTradeCompletion(
      trade.startPrice,
      {
        c: stockData.c.slice(timeIndex, currIndex + 1),
        o: stockData.o.slice(timeIndex, currIndex + 1),
        h: stockData.h.slice(timeIndex, currIndex + 1),
        l: stockData.l.slice(timeIndex, currIndex + 1),
        t: stockData.t.slice(timeIndex, currIndex + 1),
      },
      trade.target,
      trade.sl,
      isSellTrade
    );

    const currentTime = stockData.t[currIndex + 1];
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

    if (status == trade.status) {
      if (tradeHigh !== currTradeHigh || tradeLow !== currTradeLow) {
        trade.tradeHigh = tradeHigh;
        trade.tradeLow = tradeLow;
      }

      return;
    }

    // update the trade status
    trade.tradeHigh = tradeHigh;
    trade.tradeLow = tradeLow;
    trade.status = status;
  });

  return trades;
};
