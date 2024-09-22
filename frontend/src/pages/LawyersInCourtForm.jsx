import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Modal, Button, Form, Select, Spin } from "antd";
import axios from "axios";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import useHandleSubmit from "../hooks/useHandleSubmit";

const baseURL = import.meta.env.VITE_BASE_URL;

const LawyersInCourtForm = ({ reportId }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
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
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${baseURL}/reports/${reportId}`);
        setFormData((prevData) => ({
          ...prevData,
          ...response?.data?.data,
        }));
        form.setFieldsValue(response?.data?.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [reportId, form]);

  const showModal = () => setVisible(true);
  const handleCancel = () => setVisible(false);

  const handleSubmit = async (values) => {
    await onSubmit(values);
    handleCancel();
  };

  return (
    <div className="w-full ">
      <Button type="primary" onClick={showModal} className="my-4">
        Click To Assign
      </Button>

      <Modal
        title="Assign Lawyer to Court"
        visible={visible}
        onCancel={handleCancel}
        footer={null}
        centered
        width="90%"
        maxWidth={800}
        bodyStyle={{ padding: "24px" }}>
        <Spin spinning={loading}>
          <Form
            layout="vertical"
            form={form}
            name="assignLawyerForm"
            initialValues={formData}
            onFinish={handleSubmit}
            className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4">
              <Form.Item
                name="lawyersInCourt"
                label="Lawyer in Court"
                className="flex-grow w-full sm:w-3/4"
                rules={[
                  {
                    required: true,
                    message: "Please select at least one lawyer",
                  },
                ]}>
                <Select
                  mode="multiple"
                  placeholder="Select lawyers..."
                  options={userData}
                  allowClear
                  className="w-full"
                />
              </Form.Item>
              <Form.Item className="w-full sm:w-1/5 mt-4 sm:mt-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSaving}
                  className="  w-full">
                  Save
                </Button>
              </Form.Item>
            </div>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

LawyersInCourtForm.propTypes = {
  reportId: PropTypes.string.isRequired,
};

export default LawyersInCourtForm;
