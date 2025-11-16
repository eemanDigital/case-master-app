import PropTypes from "prop-types";
import { useState } from "react";
import {
  Modal,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Alert,
  Space,
} from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import dayjs from "dayjs";

const { TextArea } = Input;

const LeaveResponseForm = ({ application, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const { data, loading, error: dataError, dataFetcher } = useDataFetch();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const showModal = () => {
    setOpen(true);
    // Pre-fill form with application data
    form.setFieldsValue({
      startDate: application.startDate ? dayjs(application.startDate) : null,
      endDate: application.endDate ? dayjs(application.endDate) : null,
      daysApproved: application.daysAppliedFor,
    });
  };

  const handleCancel = () => {
    setOpen(false);
    form.resetFields();
    setSelectedStatus(null);
  };

  const statusOptions = [
    {
      label: "Approve Application",
      value: "approved",
      icon: <CheckCircleOutlined />,
    },
    {
      label: "Reject Application",
      value: "rejected",
      icon: <CloseCircleOutlined />,
    },
  ];

  // Calculate days when dates change
  const handleDateChange = () => {
    const startDate = form.getFieldValue("startDate");
    const endDate = form.getFieldValue("endDate");

    if (startDate && endDate) {
      const days = endDate.diff(startDate, "days") + 1;
      form.setFieldsValue({ daysApproved: days });
    }
  };

  const handleFinish = async (values) => {
    try {
      const payload = {
        status: values.status,
        responseMessage: values.responseMessage,
      };

      // Only add dates if they were actually modified
      if (
        values.startDate &&
        values.startDate !== dayjs(application.startDate)
      ) {
        payload.startDate = values.startDate.format("YYYY-MM-DD");
      }
      if (values.endDate && values.endDate !== dayjs(application.endDate)) {
        payload.endDate = values.endDate.format("YYYY-MM-DD");
      }

      // Only add daysApproved if status is approved AND it's different from daysAppliedFor
      if (values.status === "approved") {
        if (
          values.daysApproved &&
          values.daysApproved !== application.daysAppliedFor
        ) {
          payload.daysApproved = values.daysApproved;
        }
      }

      // Submit response
      const response = await dataFetcher(
        `leaves/applications/${application._id || application.id}`,
        "PUT",
        payload
      );

      if (response?.status === "success") {
        toast.success(`Leave application ${values.status} successfully`);

        // Prepare email data
        const emailData = {
          subject: `Leave Application ${
            values.status === "approved" ? "Approved" : "Rejected"
          } - A.T. Lukman & Co.`,
          send_to: application.employee?.email,
          reply_to: "noreply@atlukman.com",
          template: "leaveResponse",
          url: "dashboard/staff",
          context: {
            applicantName: `${application.employee?.firstName} ${application.employee?.lastName}`,
            applicationDate: formatDate(application.createdAt),
            typeOfLeave: application.typeOfLeave,
            startDate: payload.startDate || formatDate(application.startDate),
            endDate: payload.endDate || formatDate(application.endDate),
            status: values.status,
            daysApproved: payload.daysApproved || application.daysAppliedFor,
            responseMessage: values.responseMessage,
            approvedBy: `${user?.data?.firstName} ${user?.data?.lastName}`,
          },
        };

        // Send notification email
        await dispatch(sendAutomatedCustomEmail(emailData));

        form.resetFields();
        setOpen(false);
        setSelectedStatus(null);

        // Callback to refresh parent component
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error("Response submission error:", err);
      toast.error(err.message || "Failed to submit response");
    }
  };

  return (
    <>
      <Button
        type="primary"
        onClick={showModal}
        className="blue-btn"
        icon={<CheckCircleOutlined />}>
        Respond to Application
      </Button>

      <Modal
        title="Leave Application Response"
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={600}>
        {/* Application Summary */}
        <Alert
          message="Application Details"
          description={
            <div className="space-y-1 mt-2">
              <div>
                <strong>Employee:</strong>{" "}
                {`${application.employee?.firstName} ${application.employee?.lastName}`}
              </div>
              <div>
                <strong>Leave Type:</strong>{" "}
                <span className="capitalize">{application.typeOfLeave}</span>
              </div>
              <div>
                <strong>Period:</strong>{" "}
                {`${formatDate(application.startDate)} - ${formatDate(
                  application.endDate
                )}`}
              </div>
              <div>
                <strong>Days Applied:</strong> {application.daysAppliedFor} days
              </div>
              <div>
                <strong>Reason:</strong> {application.reason}
              </div>
            </div>
          }
          type="info"
          showIcon
          className="mb-4"
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off">
          <Form.Item
            name="status"
            label="Response Decision"
            rules={[
              { required: true, message: "Please select response status" },
            ]}>
            <Select
              placeholder="Select your decision"
              options={statusOptions}
              onChange={(value) => setSelectedStatus(value)}
            />
          </Form.Item>

          {selectedStatus === "approved" && (
            <>
              <Alert
                message="Optional: Modify leave dates or approved days"
                type="warning"
                showIcon
                className="mb-4"
              />

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="startDate"
                  label="Start Date"
                  tooltip="Leave blank to keep original date">
                  <DatePicker
                    style={{ width: "100%" }}
                    format="YYYY-MM-DD"
                    onChange={handleDateChange}
                  />
                </Form.Item>

                <Form.Item
                  name="endDate"
                  label="End Date"
                  tooltip="Leave blank to keep original date">
                  <DatePicker
                    style={{ width: "100%" }}
                    format="YYYY-MM-DD"
                    onChange={handleDateChange}
                  />
                </Form.Item>
              </div>

              <Form.Item
                name="daysApproved"
                label="Days Approved"
                rules={[
                  {
                    required: true,
                    message: "Please specify days approved",
                  },
                  {
                    type: "number",
                    min: 0.5,
                    message: "Minimum 0.5 days",
                  },
                  {
                    type: "number",
                    max: application.daysAppliedFor,
                    message: "Cannot exceed days applied",
                  },
                ]}>
                <InputNumber
                  style={{ width: "100%" }}
                  min={0.5}
                  max={application.daysAppliedFor}
                  step={0.5}
                  placeholder="Number of days"
                />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="responseMessage"
            label={
              selectedStatus === "approved"
                ? "Approval Message (Optional)"
                : "Response Message"
            }
            rules={[
              {
                required: selectedStatus === "rejected",
                message: "Please provide a reason for rejection",
              },
              {
                min: 10,
                message: "Message must be at least 10 characters",
              },
              {
                max: 500,
                message: "Message cannot exceed 500 characters",
              },
            ]}>
            <TextArea
              rows={4}
              placeholder={
                selectedStatus === "approved"
                  ? "Add any comments or instructions (optional)..."
                  : "Please provide detailed reason for rejection..."
              }
              showCount
              maxLength={500}
            />
          </Form.Item>

          {dataError && (
            <Alert
              message="Error"
              description={dataError}
              type="error"
              showIcon
              closable
              className="mb-4"
            />
          )}

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                danger={selectedStatus === "rejected"}
                className={selectedStatus === "rejected" ? "" : "blue-btn"}>
                {selectedStatus === "approved"
                  ? "Approve Application"
                  : selectedStatus === "rejected"
                  ? "Reject Application"
                  : "Submit Response"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

LeaveResponseForm.propTypes = {
  application: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    employee: PropTypes.shape({
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      email: PropTypes.string,
    }),
    startDate: PropTypes.string,
    endDate: PropTypes.string,
    typeOfLeave: PropTypes.string,
    daysAppliedFor: PropTypes.number,
    reason: PropTypes.string,
    createdAt: PropTypes.string,
  }).isRequired,
  onSuccess: PropTypes.func,
};

export default LeaveResponseForm;
