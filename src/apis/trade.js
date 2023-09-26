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
