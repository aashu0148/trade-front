import { errorToastLogger, fetchWrapper } from "utils/util";

export const loginUser = async (values) => {
  const reqPath = `/user/login`;
  let response;

  try {
    response = await fetchWrapper(reqPath, values, "", "", true);
    const data = await response.json();
    if (!data?.success) {
      errorToastLogger(
        "loginUser",
        data?.message || "Failed to login user",
        data?.error
      );
      return false;
    }
    return data;
  } catch (err) {
    errorToastLogger("loginUser", "Failed to login user", err);
    return false;
  }
};
