import { useEffect } from "react";
import { Modal, Button, Form, Input } from "antd";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate, useParams } from "react-router-dom";
import useModal from "../hooks/useModal";
import useInitialDataFetcher from "../hooks/useInitialDataFetcher";
import useHandleSubmit from "../hooks/useHandleSubmit";
import LoadingSpinner from "../components/LoadingSpinner";
import { useDispatch } from "react-redux";
import { getUsers } from "../redux/features/auth/authSlice";

const UpdateClientInfo = () => {
  const { open, showModal, handleOk, handleCancel } = useModal();
  const { id } = useParams();
  const { formData, loading } = useInitialDataFetcher("users", id);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // custom hook to handle form submission
  const {
    form,
    data,
    onSubmit,
    loading: submitLoading,
  } = useHandleSubmit(`users/updateUser`, "patch");

  // navigate after success
  useEffect(() => {
    if (data) {
      dispatch(getUsers());
      navigate(-1);
    }
  }, [data, navigate, dispatch]);

  // loading state handler
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <section className="bg-gray-200">
      <Button onClick={showModal} className="m-2 blue-btn">
        Update Client Information
      </Button>
      <Modal
        width={580}
        title="Update Client Information"
        open={open}
        onOk={handleOk}
        footer={null}
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
          <Form.Item label="Second Name" name="secondName">
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
        </Form>
        <Form.Item>
          <Button
            loading={submitLoading}
            onClick={onSubmit}
            type="default"
            htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Modal>
    </section>
  );
};

export default UpdateClientInfo;
