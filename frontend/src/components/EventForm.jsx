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
  Checkbox,
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

  const handleSubmission = useCallback(
    (result) => {
      if (result?.error) {
        // Handle Error here
        toast.error(
          result?.error?.message || "Failed to create event. Please try again."
        );
      } else {
        // Handle Success here
        toast.success("Event created successfully!");
        form.resetFields();
        handleCancel(); // Close the modal
      }
    },
    [form, handleCancel]
  );

  // fetch users
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        // Extract the sendNotification flag
        const { sendNotification, ...eventData } = values;

        // Extract user IDs from values.participants
        const participantIds = eventData.participants || []; // Ensure it's an array

        // Post data
        const result = await dataFetcher("events", "post", eventData);
        handleSubmission(result);

        // Only send email if sendNotification is true and there are participants
        if (!result?.error && sendNotification && participantIds.length > 0) {
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
              title: eventData.title,
              startDateTime: formatDateTime(eventData.start),
              endDateTime: formatDateTime(eventData.end),
              startTime: formatTime(eventData.start),
              endTime: formatTime(eventData.end),
              participants: participantNames,
              description: eventData.description,
              location: eventData.location,
            },
          };

          // Send email
          try {
            await dispatch(sendAutomatedCustomEmail(emailData));
          } catch (emailError) {
            console.error("Email sending failed:", emailError);
            toast.warning(
              "Event created successfully, but failed to send email notifications."
            );
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("An unexpected error occurred. Please try again.");
      }
    },
    [dataFetcher, handleSubmission, user, users, dispatch]
  );

  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (errorInfo) {
      toast.error("Please fill in all required fields correctly.");
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

  // Show error message when dataFetch error occurs
  useEffect(() => {
    if (error) {
      toast.error(error?.message || "An error occurred. Please try again.");
    }
  }, [error]);

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
          className="flex flex-col gap-6"
          initialValues={{
            sendNotification: true, // Default to checked
          }}>
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

          <Form.Item name="sendNotification" valuePropName="checked">
            <Checkbox>Send email notification to participants</Checkbox>
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
