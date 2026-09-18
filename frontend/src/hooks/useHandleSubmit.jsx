import notify from "../utils/notify";
import { Form } from "antd";
import { useCallback } from "react";
import { useDataFetch } from "./useDataFetch";
import { useDispatch } from "react-redux";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { useDataGetterHook } from "./useDataGetterHook";
import { useNavigate } from "react-router-dom";

const useHandleSubmit = (
  endpoint,
  method,
  refreshEndPoint,
  key,
  emailData,
  path
) => {
  const [form] = Form.useForm();
  const { dataFetcher, loading, error, data } = useDataFetch(); // General data fetcher
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { fetchData } = useDataGetterHook();

  // Submit data
  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields(); // Validate the form fields
    } catch (errorInfo) {
      notify.error("Validation failed");
      return;
    }
    try {
      const response = await dataFetcher(endpoint, method, values); // Submit the form data to the backend

      if (response?.error) {
        notify.error(response?.error || "Error submitting data");
      } else {
        notify.success("Data submitted successfully");
        if (path) {
          navigate(path);
        }
        form.resetFields();

        if (emailData) {
          await dispatch(sendAutomatedCustomEmail(emailData)); // Send email if emailData is provided
        }

        if (refreshEndPoint) {
          await fetchData(refreshEndPoint, key); // Refresh data if callback is provided
        }
      }
    } catch (error) {
      notify.error("Error submitting report");
    }
  }, [
    form,
    dataFetcher,
    endpoint,
    method,
    emailData,
    dispatch,
    fetchData,
    refreshEndPoint,
    key,
    navigate,
    path,
  ]);

  return { onSubmit, form, loading, error, data };
};

export default useHandleSubmit;
