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
  Tooltip,
} from "antd";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import useModal from "../hooks/useModal";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getUsers } from "../redux/features/auth/authSlice";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import moment from "moment";
import { FaCalendar } from "react-icons/fa";

const { TextArea } = Input;
const { Title } = Typography;

const EventForm = () => {
  const { allUsers } = useUserSelectOptions();
  const dispatch = useDispatch();
  const { dataFetcher, error, loading } = useDataFetch();
  const { users, user } = useSelector((state) => state.auth);
  const { sendingEmail, emailSent, msg } = useSelector((state) => state.email);

  const { open, confirmLoading, showModal, handleOk, handleCancel } =
    useModal();
  const [form] = Form.useForm();

  // const handleSubmit = useCallback(
  const handleSubmission = useCallback((result) => {
    if (result?.error) {
      // Handle Error here
    } else {
      // Handle Success here
      // form.resetFields();
    }
  }, []);

  // / fetch users
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        // Extract user IDs from values.assignedTo
        const participantIds = values.participants || []; // Ensure it's an array

        // Find corresponding user objects from the users state
        const participants = users?.data?.filter((user) =>
          participantIds.includes(user._id)
        );

        // Map user objects to their email addresses
        const sendToEmails = participants?.map((user) => user.email);
        const participantNames = participants?.map((user) => {
          const lastName = user.lastName || "";
          const secondName = user.secondName || "";
          return `${user.firstName} ${lastName || secondName} (${
            user.position || "client"
          })`;
        });

        // Function to format date and time
        const formatDateTime = (date) => {
          return moment(date).format("MMMM D, YYYY [at] h:mm A");
        };

        // Function to format time only
        const formatTime = (date) => {
          return moment(date).format("h:mm A");
        };

        // Prepare email data
        const emailData = {
          subject: "Office Event - A.T. Lukman & Co.",
          send_to: sendToEmails,
          reply_to: "noreply@gmail.com",
          template: "events",
          url: "dashboard/events",
          context: {
            sendersName: user?.data?.firstName,
            sendersPosition: user?.data?.position,
            title: values.title,
            startDateTime: formatDateTime(values.start),
            endDateTime: formatDateTime(values.end),
            startTime: formatTime(values.start),
            endTime: formatTime(values.end),
            participants: participantNames,
            description: values.description,
            location: values.location,
          },
        };

        // Post data
        const result = await dataFetcher("events", "post", values);
        // await fetchData("", "tasks");
        handleSubmission(result);

        // Send email if emailData is provided
        if (!result?.error && emailData) {
          await dispatch(sendAutomatedCustomEmail(emailData));
        }
        // form.resetFields();
      } catch (err) {
        console.error(err);
      }
    },
    [dataFetcher, handleSubmission, user, users, dispatch]
  );
  async (values) => {
    try {
      const result = await dataFetcher("events", "post", values);
      handleSubmission(result);
      form.resetFields();
    } catch (err) {
      console.error(err);
    }
  },
    [form, handleSubmission];

  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (errorInfo) {
      return;
    }
    await handleSubmit(values);
  }, [form, handleSubmit]);

  // Show success message when email is sent
  useEffect(() => {
    if (emailSent) {
      toast.success(msg);
    }
  }, [emailSent, msg]);

  // Show error message when an error occurs
  if (error) {
    toast.error("An error occurred. Please try again.");
  }

  return (
    <>
      <Tooltip title="Create Event">
        <Button
          onClick={showModal}
          className="flex items-center xl:w-48  bg-white text-blue-500 rounded-lg shadow-md transition duration-300 p-2 sm:p-3 md:p-4 lg:px-6 text-sm sm:text-base md:text-lg lg:text-xl">
          <FaCalendar size={20} />
          <span className="text-[15px]">+ Add Event</span>
        </Button>
      </Tooltip>
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
              options={allUsers}
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
              loading={loading || sendingEmail}
              onClick={onSubmit}
              htmlType="submit"
              className="w-full blue-btn">
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default EventForm;
