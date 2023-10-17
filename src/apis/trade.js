import { errorToastLogger, fetchWrapper } from "utils/util";

export const getTodayTrades = async () => {
  const reqPath = `/trade/today`;
  let response;

  try {
    response = await fetchWrapper(reqPath);
    const data = await response.json();
    if (!data?.success) {
      errorToastLogger(
        "getTodayTrades",
        data?.message || "Failed to get trades",
        data?.error
      );
      return false;
    }
    return data;
  } catch (err) {
    errorToastLogger("getTodayTrades", "Failed to get trades", err);
    return false;
  }
};

export const getRecentStockData = async (timestamp) => {
  const reqPath = `/trade/recent-data?timestamp=${timestamp}`;
  let response;

  try {
    response = await fetchWrapper(reqPath);
    const data = await response.json();
    if (!data?.success) {
      errorToastLogger(
        "getRecentStockData",
        data?.message || "Failed to get stocks data",
        data?.error
      );
      return false;
    }
    return data;
  } catch (err) {
    errorToastLogger("getRecentStockData", "Failed to get stocks data", err);
    return false;
  }
};

export const getStocksData = async (from, to) => {
  const reqPath = `/trade/data?from=${from}&to=${to}`;
  let response;

  try {
    response = await fetchWrapper(reqPath);
    const data = await response.json();
    if (!data?.success) {
      errorToastLogger(
        "getStocksData",
        data?.message || "Failed to get stocks data",
        data?.error
      );
      return false;
    }
    return data;
  } catch (err) {
    errorToastLogger("getStocksData", "Failed to get stocks data", err);
    return false;
  }
};

export const getBestStockPresets = async () => {
  const reqPath = `/preset/all`;
  let response;

  try {
    response = await fetchWrapper(reqPath);
    const data = await response.json();
    if (!data?.success) {
      errorToastLogger(
        "getBestStockPresets",
        data?.message || "Failed to get presets",
        data?.error
      );
      return false;
    }
    return data;
  } catch (err) {
    errorToastLogger("getBestStockPresets", "Failed to get presets", err);
    return false;
  }
};

export const createNewPreset = async (values) => {
  const reqPath = `/preset`;
  let response;

  try {
    response = await fetchWrapper(reqPath, values);
    const data = await response.json();
    if (!data?.success) {
      errorToastLogger(
        "createNewPreset",
        data?.message || "Failed to create preset",
        data?.error
      );
      return false;
    }
    return data;
  } catch (err) {
    errorToastLogger("createNewPreset", "Failed to create preset", err);
    return false;
  }
};
