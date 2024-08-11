import { useCallback, useEffect } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import {
  Button,
  Input,
  Form,
  Modal,
  Select,
  DatePicker,
  Typography,
} from "antd";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import useModal from "../hooks/useModal";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getUsers } from "../redux/features/auth/authSlice";

const { TextArea } = Input;
const { Title } = Typography;

const EventForm = () => {
  const { userData } = useUserSelectOptions();
  const { fetchData } = useDataFetch();
  const dispatch = useDispatch();
  const { dataFetcher, data, error, loading } = useDataFetch();
  // const { users, user } = useSelector((state) => state.auth);
  // const { emailSent, msg } = useSelector((state) => state.email);

  const { open, confirmLoading, showModal, handleOk, handleCancel } =
    useModal();
  const [form] = Form.useForm();

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

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        const result = await dataFetcher("events", "POST", values);
        handleSubmission(result);
        form.resetFields();
      } catch (err) {
        console.error(err);
      }
    },
    [fetchData, form, handleSubmission]
  );

  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (errorInfo) {
      return;
    }
    await handleSubmit(values);
  }, [form, handleSubmit]);

  // useEffect(() => {
  //   if (emailSent) {
  //     toast.success(msg);
  //   }
  // }, [emailSent, msg]);

  return (
    <>
      <Button
        onClick={showModal}
        className="blue-btn text-white rounded-lg shadow-md transition duration-300">
        Create Event
      </Button>
      <Modal
        width="80%"
        title={<Title level={3}>Create Event</Title>}
        open={open}
        onOk={handleOk}
        footer={null}
        onCancel={handleCancel}
        confirmLoading={confirmLoading}
        className="modal-container">
        <Form
          layout="vertical"
          form={form}
          name="create_event_form"
          className="flex flex-col gap-6">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please enter the title" }]}>
            <Input placeholder="Enter the title" />
          </Form.Item>
          <Form.Item
            name="start"
            label="Start Date"
            rules={[
              { required: true, message: "Please select a start date!" },
            ]}>
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              className="w-full"
            />
          </Form.Item>
          <Form.Item
            name="end"
            label="End Date"
            rules={[
              { required: true, message: "Please select and end date!" },
            ]}>
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm:ss"
              className="w-full"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[
              { max: 500, message: "Description cannot exceed 500 characters" },
            ]}>
            <TextArea rows={4} placeholder="Enter the description" />
          </Form.Item>

          <Form.Item name="participants" label="Participants">
            <Select
              mode="multiple"
              placeholder="Select participants"
              options={userData}
              allowClear
              className="w-full"
            />
          </Form.Item>

          <Form.Item
            name="location"
            label="Location"
            rules={[
              { max: 200, message: "Location cannot exceed 200 characters" },
            ]}>
            <Input placeholder="Enter the location" />
          </Form.Item>

          <Form.Item>
            <Button
              onClick={onSubmit}
              type="primary"
              htmlType="submit"
              className="w-full">
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default EventForm;
