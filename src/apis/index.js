import { errorToastLogger, fetchWrapper } from "utils/util";

export const getCurrentUser = async () => {
  const reqPath = `/user/me`;
  let response;

  try {
    response = await fetchWrapper(reqPath);
    const data = await response.json();
    if (!data?.success) {
      errorToastLogger(
        "getCurrentUser",
        data?.message || "Failed to get user",
        data?.error
      );
      return false;
    }
    return data;
  } catch (err) {
    errorToastLogger("getCurrentUser", "Failed to get user", err);
    return false;
  }
};

export const sayHiToBackend = async () => {
  const reqPath = "/hi";
  let response;

  try {
    response = await fetchWrapper(reqPath);
    const data = await response.text();

    return data;
  } catch (err) {
    return false;
  }
};
