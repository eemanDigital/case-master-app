import { useState, useEffect, useCallback } from "react";
import { Modal, Button, Form, Input, Checkbox, Select } from "antd";
import "react-toastify/dist/ReactToastify.css";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import useModal from "../hooks/useModal";

const { Option } = Select;

const baseURL = import.meta.env.VITE_BASE_URL;

const UpdateClientInfo = () => {
  const { open, showModal, handleOk, handleCancel } = useModal();
  const { cases } = useDataGetterHook();
  const [form] = Form.useForm();
  const { TextArea } = Input;
  const { dataFetcher, data } = useDataFetch(); //general data fetcher

  const { id } = useParams();
  // console.log(id);
  // const { singleData, singleDataFetcher } = useSingleDataFetcher();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

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
        const response = await axios.get(`${baseURL}/clients/${id}`, {
          headers: {
            ...fileHeaders,
            Authorization: `Bearer ${token}`,
          },
        });
        // console.log("RES", response.data.data);

        setFormData((prevData) => {
          return {
            ...prevData,
            ...response?.data?.data,
          };
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // FORM SUBMISSION
  // form submit functionalities
  const handleSubmission = useCallback(
    (result) => {
      if (result?.error) {
        // Handle Error here
      } else {
        // Handle Success here
        // form.resetFields();
      }
    },
    []
    // [form]
  );

  // submit data
  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields(); // Validate the form fields
    } catch (errorInfo) {
      return;
    }
    const result = await dataFetcher(`clients/${id}`, "patch", values); // Submit the form data to the backend
    // console.log(values);

    handleSubmission(result); // Handle the submission after the API Call
  }, [form, handleSubmission, dataFetcher, id]);

  // filter options for the select field

  // loading state handler
  if (loading) {
    return <div>Loading...</div>;
  }

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
        confirmLoading={loading}
        onCancel={handleCancel}>
        <Form
          form={form}
          initialValues={formData}
          // onFinish={handleSubmit}
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
            label="Second Name"
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
        <Form.Item>
          <Button onClick={onSubmit} type="default" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Modal>
    </section>
  );
};

export default UpdateClientInfo;
