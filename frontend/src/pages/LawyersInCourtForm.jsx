import { useState, useCallback, useEffect } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import useModal from "../hooks/useModal";
import { Button, Form, Select } from "antd";
import axios from "axios";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useNavigate } from "react-router-dom";

const baseURL = import.meta.env.VITE_BASE_URL;

const LawyersInCourtForm = ({ reportId }) => {
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const { fetchData } = useDataGetterHook();
  const { userData } = useUserSelectOptions();
  const navigate = useNavigate(); // Initialize navigate

  // handle reports post and get report data
  const { dataFetcher, data } = useDataFetch();
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("jwt="))
    ?.split("=")[1];

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${baseURL}/reports/${reportId}`, {
          headers: {
            ...fileHeaders,
            Authorization: `Bearer ${token}`,
          },
        });

        setFormData((prevData) => {
          return {
            ...prevData,
            ...response?.data?.data,
          };
        });

        // Set form fields with fetched data
        form.setFieldsValue(response?.data?.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [reportId, form]);

  // form submit functionalities
  const handleSubmission = useCallback(
    (result) => {
      if (result?.error) {
        // Handle Error here
      } else {
        // Handle Success here
        form.resetFields();
        navigate("/dashboard/cause-list"); // Redirect to /cause-list page
      }
    },
    [navigate, form]
  );

  // submit data
  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields(); // Validate the form fields
    } catch (errorInfo) {
      return;
    }
    const result = await dataFetcher(`reports/${reportId}`, "PATCH", values); // Submit the form data to the backend
    //get list after submit
    await fetchData("reports", "reports");
    window.location.reload(); //force reload of page to reflect change

    handleSubmission(result); // Handle the submission after the API Call
  }, [form, handleSubmission, dataFetcher, fetchData, reportId]);

  return (
    <>
      <Form
        layout="vertical"
        form={form}
        name="form to assign lawyer to court"
        autoComplete="off"
        className="flex flex-col md:flex-row md:items-end md:space-x-4 justify-center"
        initialValues={formData}>
        <div className="flex-grow">
          <Form.Item
            name="lawyersInCourt"
            label="Lawyer in Court"
            className="w-full"
            initialValue={formData?.lawyersInCourt}>
            <Select
              mode="multiple"
              placeholder="Select lawyers..."
              options={userData}
              allowClear
              className="w-[20px]"
            />
          </Form.Item>
        </div>
        <Form.Item className="md:mb-0">
          <Button
            onClick={onSubmit}
            type="default"
            htmlType="submit"
            className="w-full md:w-auto">
            Save
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default LawyersInCourtForm;
