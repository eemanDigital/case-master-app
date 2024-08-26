import PropTypes from "prop-types";
import { useState, useEffect } from "react";

import useUserSelectOptions from "../hooks/useUserSelectOptions";
import { Button, Form, Select } from "antd";
import axios from "axios";

import useHandleSubmit from "../hooks/useHandleSubmit";

const baseURL = import.meta.env.VITE_BASE_URL;

const LawyersInCourtForm = ({ reportId }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const { userData } = useUserSelectOptions();
  const {
    form,
    onSubmit,
    loading: isSaving,
  } = useHandleSubmit(
    `reports/${reportId}`,
    "patch",
    "reports",
    "reports",
    undefined,
    undefined
  ); // custom hook to handle form submission

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${baseURL}/reports/${reportId}`);

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
            loading={isSaving}
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

LawyersInCourtForm.propTypes = {
  // Define prop types  LawyersInCourtForm
  reportId: PropTypes.string.isRequired,
};

export default LawyersInCourtForm;
