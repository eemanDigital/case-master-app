import { Form } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useDataFetch } from "./useDataFetch";
import { useDispatch } from "react-redux";

import { toast } from "react-toastify";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";

const useHandleSubmit = (endpoint, method, emailData, refreshDataCallback) => {
  const [form] = Form.useForm();
  const { dataFetcher, data, loading, error } = useDataFetch(); // General data fetcher
  const dispatch = useDispatch();

  const handleSubmission = useCallback(
    (result) => {
      if (result?.error) {
        // Handle Error here
      } else {
        // Handle Success here
        form.resetFields();
      }
    },
    [form]
  );

  // Submit data
  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields(); // Validate the form fields
    } catch (errorInfo) {
      return;
    }
    try {
      await dataFetcher(endpoint, method, values); // Submit the form data to the backend

      if (emailData) {
        await dispatch(sendAutomatedCustomEmail(emailData)); // Send email if emailData is provided
      }

      if (refreshDataCallback) {
        await refreshDataCallback(); // Refresh data if callback is provided
      }

      handleSubmission(data); // Handle the submission after the API Call
    } catch (error) {
      toast.error("Error submitting report:", error);
    }
  }, [
    form,
    handleSubmission,
    dataFetcher,
    endpoint,
    method,
    emailData,
    dispatch,
    refreshDataCallback,
    data,
  ]);

  // useEffect(() => {
  //   if (data?.data.message === "success") {
  //     toast.success("Report Created");

  //     if (path) {
  //       navigate(path); // Redirect to the case report list page
  //     }
  //   }
  // }, [navigate, path, data?.data.message]);

  return { onSubmit, form, data, loading, error };
};

export default useHandleSubmit;
