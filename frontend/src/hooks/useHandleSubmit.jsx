import { Form } from "antd";
import { useCallback } from "react";
import { useDataFetch } from "./useDataFetch";

const useHandleSubmit = (endpoint, method) => {
  const [form] = Form.useForm();
  const { dataFetcher, data, loading, error } = useDataFetch(); //general data fetcher

  const handleSubmission = useCallback((result) => {
    if (result?.error) {
      // Handle Error here
    } else {
      // Handle Success here
      form.resetFields();
    }
  }, [][form]);

  // submit data
  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields(); // Validate the form fields
      // console.log("case data", values);
    } catch (errorInfo) {
      return;
    }
    const result = await dataFetcher(endpoint, method, values); // Submit the form data to the backend
    console.log(values);

    handleSubmission(result); // Handle the submission after the API Call
  }, [form, handleSubmission, dataFetcher, endpoint, method]);

  return { onSubmit, form, data, loading, error };
};

export default useHandleSubmit;
