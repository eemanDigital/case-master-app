import { Form } from "antd";
import { useCallback } from "react";
import { useDataFetch } from "./useDataFetch";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { useDataGetterHook } from "./useDataGetterHook";

const useHandleSubmit = (endpoint, method, refreshEndPoint, key, emailData) => {
  const [form] = Form.useForm();
  const { dataFetcher, loading, error, data } = useDataFetch(); // General data fetcher
  const dispatch = useDispatch();
  const { fetchData } = useDataGetterHook();

  // Submit data
  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields(); // Validate the form fields
    } catch (errorInfo) {
      toast.error("Validation failed");
      return;
    }
    try {
      const response = await dataFetcher(endpoint, method, values); // Submit the form data to the backend

      if (response?.error) {
        toast.error(response?.error || "Error submitting data");
      } else {
        toast.success("Data submitted successfully");
        form.resetFields();

        if (emailData) {
          await dispatch(sendAutomatedCustomEmail(emailData)); // Send email if emailData is provided
        }

        if (refreshEndPoint) {
          await fetchData(refreshEndPoint, key); // Refresh data if callback is provided
        }
      }
    } catch (error) {
      toast.error("Error submitting report");
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
  ]);

  return { onSubmit, form, loading, error, data };
};

export default useHandleSubmit;
