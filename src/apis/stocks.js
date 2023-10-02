import { errorToastLogger, fetchWrapper } from "utils/util";

export const getAllStocks = async () => {
  const reqPath = `/stock/all`;
  let response;

  try {
    response = await fetchWrapper(reqPath);
    const data = await response.json();
    if (!data?.success) {
      errorToastLogger(
        "getAllStocks",
        data?.message || "Failed to get stocks",
        data?.error
      );
      return false;
    }
    return data;
  } catch (err) {
    errorToastLogger("getAllStocks", "Failed to get stocks", err);
    return false;
  }
};

export const addNewStock = async (values) => {
  const reqPath = `/stock`;
  let response;

  try {
    response = await fetchWrapper(reqPath, values);
    const data = await response.json();
    if (!data?.success) {
      errorToastLogger(
        "addNewStock",
        data?.message || "Failed to add stock",
        data?.error
      );
      return false;
    }
    return data;
  } catch (err) {
    errorToastLogger("addNewStock", "Failed to add stock", err);
    return false;
  }
};

export const deleteStock = async (symbol) => {
  const reqPath = `/stock/${symbol}`;
  let response;

  try {
    response = await fetchWrapper(reqPath, "", "", "DELETE");
    const data = await response.json();
    if (!data?.success) {
      errorToastLogger(
        "deleteStock",
        data?.message || "Failed to delete stock",
        data?.error
      );
      return false;
    }
    return data;
  } catch (err) {
    errorToastLogger("deleteStock", "Failed to delete stock", err);
    return false;
  }
};
