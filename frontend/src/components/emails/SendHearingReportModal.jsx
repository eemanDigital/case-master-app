import React, { useState, useCallback, useMemo } from "react";
import {
  Modal,
  Form,
  Select,
  Button,
  message,
  Spin,
  Alert,
  Divider,
} from "antd";
import {
  MailOutlined,
  SendOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import {
  sendCustomEmail,
  EMAIL_RESET,
} from "../../redux/features/emails/emailSlice";
import useUserSelectOptions from "../../hooks/useUserSelectOptions";
import { formatDate, formatName } from "../../utils/formatters";

const { Option } = Select;

const SendHearingReportModal = ({ visible, onClose, hearing, matter }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Fetch clients for this matter
  const { data: matterClients, loading: clientsLoading } = useUserSelectOptions(
    {
      type: "clients",
      autoFetch: visible,
      includeInactive: false,
    },
  );

  // Get client email from matter
  const clientEmail = useMemo(() => {
    if (matter?.clientId?.email) return matter.clientId.email;
    if (matter?.client?.email) return matter.client.email;
    return "";
  }, [matter]);

  // Pre-fill form with hearing data
  const defaultMessage = useMemo(() => {
    if (!hearing) return "";

    const hearingDate = dayjs(hearing.date).format("DD MMMM YYYY");
    const purpose = hearing.purpose || "Court Hearing";
    const outcome = hearing.outcome
      ? `\n\nCourt Outcome: ${hearing.outcome.replace(/_/g, " ")}`
      : "";
    const notes = hearing.notes ? `\n\nCourt Notes:\n${hearing.notes}` : "";
    const nextHearingInfo = hearing.nextHearingDate
      ? `\n\nNext Hearing Date: ${dayjs(hearing.nextHearingDate).format("DD MMMM YYYY [at] HH:mm")}`
      : "";
    const lawyersAssigned =
      hearing.lawyerPresent?.length > 0
        ? `\n\nLawyer(s): ${hearing.lawyerPresent.map((l) => formatName(l.firstName, l.lastName)).join(", ")}`
        : "";

    return `Dear Client,

We write to inform you about the proceedings of your case (${matter?.title || matter?.matterNumber || "Matter"}) held on ${hearingDate}.

Purpose: ${purpose}${outcome}${notes}${nextHearingInfo}${lawyersAssigned}

Please do not hesitate to contact us if you have any questions or require further clarification.

Best regards,
Legal Team`.trim();
  }, [hearing, matter]);

  const handleSubmit = useCallback(
    async (values) => {
      if (!hearing) {
        message.error("No hearing information available");
        return;
      }

      setLoading(true);

      try {
        const emailData = {
          send_to: [values.recipientEmail],
          subject: `Court Hearing Report - ${matter?.title || matter?.matterNumber || "Your Case"} - ${dayjs(hearing.date).format("DD MMM YYYY")}`,
          htmlContent: null,
          textContent: values.message,
        };

        await dispatch(sendCustomEmail(emailData)).unwrap();

        message.success("Hearing report sent to client successfully!");
        form.resetFields();
        onClose();
      } catch (error) {
        message.error(error || "Failed to send hearing report");
      } finally {
        setLoading(false);
      }
    },
    [dispatch, hearing, matter, form, onClose],
  );

  const handleCancel = useCallback(() => {
    form.resetFields();
    dispatch(EMAIL_RESET());
    onClose();
  }, [form, onClose, dispatch]);

  if (!hearing) return null;

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <MailOutlined className="text-white text-lg" />
          </div>
          <div>
            <span className="font-bold text-slate-800">
              Send Hearing Report
            </span>
            <p className="text-xs text-slate-500 font-normal m-0">
              Email hearing details to client
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={600}
      footer={null}
      destroyOnClose>
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message="Hearing Report"
        description={
          <div className="text-xs mt-2 space-y-1">
            <p>
              <strong>Date:</strong>{" "}
              {dayjs(hearing.date).format("DD MMMM YYYY [at] HH:mm")}
            </p>
            <p>
              <strong>Purpose:</strong> {hearing.purpose || "N/A"}
            </p>
            {hearing.outcome && (
              <p>
                <strong>Outcome:</strong> {hearing.outcome.replace(/_/g, " ")}
              </p>
            )}
            {hearing.nextHearingDate && (
              <p>
                <strong>Next Hearing:</strong>{" "}
                {dayjs(hearing.nextHearingDate).format(
                  "DD MMMM YYYY [at] HH:mm",
                )}
              </p>
            )}
          </div>
        }
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          recipientEmail: clientEmail,
          message: defaultMessage,
        }}
        className="mt-4">
        <Form.Item
          name="recipientEmail"
          label="Recipient Email"
          rules={[
            { required: true, message: "Please enter recipient email" },
            { type: "email", message: "Please enter a valid email" },
          ]}>
          <Select
            showSearch
            placeholder="Select client or enter email"
            loading={clientsLoading}
            dropdownRender={(menu) =>
              clientsLoading ? (
                <div className="p-4 text-center">
                  <Spin size="small" />
                </div>
              ) : (
                menu
              )
            }>
            {matterClients?.map((client) => (
              <Option key={client.email} value={client.email}>
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-slate-400" />
                  <span>{client.label}</span>
                  <span className="text-slate-400 text-xs">
                    ({client.email})
                  </span>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="message"
          label="Message"
          rules={[{ required: true, message: "Please enter a message" }]}>
          <Select
            placeholder="Select a template or write custom message"
            onChange={(value) => form.setFieldValue("message", value)}>
            <Option value={defaultMessage}>
              <div className="flex items-center gap-2">
                <FileTextOutlined className="text-blue-500" />
                <span>Hearing Summary (Default)</span>
              </div>
            </Option>
            <Option
              value={`Dear Client,\n\nYour case was called today. Please contact us for updates.\n\nBest regards,\nLegal Team`}>
              <div className="flex items-center gap-2">
                <CheckCircleOutlined className="text-green-500" />
                <span>Brief Update</span>
              </div>
            </Option>
          </Select>
        </Form.Item>

        <Form.Item name="message" noStyle>
          <textarea
            className="ant-input w-full rounded-lg"
            rows={10}
            placeholder="Write your message here..."
          />
        </Form.Item>

        <Divider className="!my-4" />

        <div className="flex justify-end gap-3">
          <Button onClick={handleCancel}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SendOutlined />}
            loading={loading}
            className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600">
            Send Report
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default SendHearingReportModal;
