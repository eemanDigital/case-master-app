import { useEffect } from "react";
import { message } from "antd";

const useErrorMessage = (error) => {
  useEffect(() => {
    if (error) {
      message.error(error?.response?.data?.message || "Something went wrong");
    }
  }, [error]);
};

export default useErrorMessage;
