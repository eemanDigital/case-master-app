import { useState } from "react";
import { Modal, Button, Form, Input, Checkbox, Select } from "antd";
import { useAuth } from "../hooks/useAuth";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

const { Option } = Select;

const AddClientForm = () => {
  const { authenticate } = useAuth();
  const [open, setOpen] = useState(false);
  const { cases } = useDataGetterHook();
  const [form] = Form.useForm();

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
      await authenticate("clients/signup", "post", values);
      toast.success("Client added successfully!");
      setOpen(false);
      form.resetFields();
    } catch (err) {
      toast.error("Failed to add client.");
      console.error(err);
    }
  };

  return (
    <section className="bg-gray-200">
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Add Client
      </Button>
      <Modal
        width={580}
        title="Client Form"
        open={open}
        onOk={handleOk}
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
            label="Second Name"
            name="secondName"
            rules={[
              { required: true, message: "Please enter your second name" },
            ]}>
            <Input placeholder="Second Name" />
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
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}>
            <Input.Password placeholder="*******" />
          </Form.Item>
          <Form.Item
            label="Confirm Password"
            name="passwordConfirm"
            rules={[
              { required: true, message: "Please confirm your password" },
            ]}>
            <Input.Password placeholder="*******" />
          </Form.Item>
          <Form.Item
            label="Phone Contact"
            name="phone"
            rules={[
              { required: true, message: "Please enter your phone number" },
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
            <Checkbox>Is client active</Checkbox>
          </Form.Item>
        </Form>
        <ToastContainer />
      </Modal>
    </section>
  );
};

export default AddClientForm;
