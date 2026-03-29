// components/ContactForm.jsx
import { useState } from "react";
import { toast } from "react-toastify";
import { useDataFetch } from "../hooks/useDataFetch";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import { Form, Input, Select, Button, Card, Typography } from "antd";

const devEmail = import.meta.env.VITE_DEVELOPER_EMAIL;
const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const categoryOptions = [
  { value: "support", label: "General Support" },
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "billing", label: "Billing Question" },
  { value: "other", label: "Other" },
];

const ContactForm = () => {
  useRedirectLogoutUser("/users/login");
  const [form] = Form.useForm();
  const { dataFetcher } = useDataFetch();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const firmName = user?.data?.firmId?.name || "Your Firm";

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const emailData = {
        subject: `Contact Request - ${firmName}`,
        send_to: devEmail,
        reply_to: user?.data?.email,
        template: "contactRequest",
        context: {
          name: values.name,
          email: user?.data?.email,
          category: values.category,
          subject: values.subject,
          message: values.message,
        },
      };

      await dataFetcher("contacts", "post", values);
      await dispatch(sendAutomatedCustomEmail(emailData));

      toast.success("Message sent successfully. We'll get back to you soon!");
      form.resetFields();
      navigate("/dashboard");
    } catch (error) {
      toast.error("Error sending message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="shadow-md">
        <div className="text-center mb-6">
          <Title level={3} className="mb-1">
            Contact Support
          </Title>
          <Text type="secondary">
            Have a question or need help? Fill out the form below and we'll get
            back to you as soon as possible.
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            name: user?.data?.name || "",
            email: user?.data?.email || "",
          }}
        >
          <Form.Item
            label="Your Name"
            name="name"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="Enter your email address" />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: "Please select a category" }]}
          >
            <Select placeholder="Select a category">
              {categoryOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: "Please enter a subject" }]}
          >
            <Input placeholder="Brief description of your inquiry" />
          </Form.Item>

          <Form.Item
            label="Message"
            name="message"
            rules={[{ required: true, message: "Please enter your message" }]}
          >
            <TextArea
              rows={5}
              placeholder="Describe your question or issue in detail"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
              size="large"
            >
              Send Message
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ContactForm;
