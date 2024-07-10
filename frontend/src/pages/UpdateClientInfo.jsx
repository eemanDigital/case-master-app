import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Input, Checkbox, Select } from "antd";
import { useAuth } from "../hooks/useAuth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import axios from "axios";
import { useParams } from "react-router-dom";

const { Option } = Select;

const baseURL = import.meta.env.VITE_BASE_URL;

const UpdateClientInfo = () => {
  const { authenticate } = useAuth();
  const [open, setOpen] = useState(false);
  const { cases } = useDataGetterHook();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loadingInfo, setLoadingInfo] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${baseURL}/clients/${id}`);
        form.setFieldsValue(response?.data?.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingInfo(false);
      }
    }
    fetchData();
  }, [id, form]);

  const showModal = () => {
    setOpen(true);
  };

  const handleOk = () => {
    form.submit();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleSubmit = async (values) => {
    try {
      await axios.patch(`${baseURL}/clients/${id}`, values);
      toast.success("Client information updated successfully!");
      setOpen(false);
    } catch (err) {
      toast.error("Failed to update client information.");
      console.error(err);
    }
  };

  return (
    <section className="bg-gray-200">
      <Button onClick={showModal} className="bg-red-600 text-white">
        Update Client Information
      </Button>
      <Modal
        width={580}
        title="Update Client Information"
        open={open}
        onOk={handleOk}
        confirmLoading={loadingInfo}
        onCancel={handleCancel}>
        <Form
          form={form}
          onFinish={handleSubmit}
          className="bg-white shadow-md rounded-md px-8 pt-6 pb-8 m-4"
          layout="vertical">
          <Form.Item
            label="First Name"
            name="firstName"
            rules={[
              { required: true, message: "Please enter your first name" },
            ]}>
            <Input placeholder="First Name" />
          </Form.Item>
          <Form.Item
            label="Last Name"
            name="secondName"
            // rules={[
            //   { required: true, message: "Please enter your last name" },
            // ]}
          >
            <Input placeholder="Last Name" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                type: "email",
                message: "Please enter a valid email",
              },
            ]}>
            <Input placeholder="Email" />
          </Form.Item>

          <Form.Item
            label="Phone Contact"
            name="phone"
            rules={[
              { required: true, message: "Please enter your phone contact" },
            ]}>
            <Input placeholder="Phone Contact" />
          </Form.Item>
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: "Please enter your address" }]}>
            <Input placeholder="No.2, Maitama Close, Abuja" />
          </Form.Item>
          <Form.Item
            label="Client's Case"
            name="case"
            rules={[
              { required: true, message: "Please select at least one case" },
            ]}>
            <Select
              mode="multiple"
              placeholder="Select cases"
              style={{ width: "100%" }}>
              {cases?.data?.map((singleCase) => {
                const { firstParty, secondParty } = singleCase;
                const firstName = firstParty?.name[0]?.name;
                const secondName = secondParty?.name[0]?.name;
                return (
                  <Option value={singleCase._id} key={singleCase._id}>
                    {firstName} vs {secondName}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item name="active" valuePropName="checked">
            <Checkbox>Client Active</Checkbox>
          </Form.Item>
        </Form>
        <ToastContainer />
      </Modal>
    </section>
  );
};

export default UpdateClientInfo;
