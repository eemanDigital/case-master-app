import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Alert,
  Space,
} from "antd";
import { CalendarOutlined, FileTextOutlined } from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { toast } from "react-toastify";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const LeaveAppForm = ({ onSuccess }) => {
  const leaveTypes = [
    { label: "Annual Leave", value: "annual" },
    { label: "Casual Leave", value: "casual" },
    { label: "Sick Leave", value: "sick" },
    { label: "Maternity Leave", value: "maternity" },
    { label: "Paternity Leave", value: "paternity" },
    { label: "Compassionate Leave", value: "compassionate" },
    { label: "Unpaid Leave", value: "unpaid" },
  ];

  const { user } = useSelector((state) => state.auth);
  const { loading, error: dataError, dataFetcher } = useDataFetch();
  const { adminOptions } = useUserSelectOptions();
  const [visible, setVisible] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [calculatedDays, setCalculatedDays] = useState(0);
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // Fetch employee leave balance when modal opens
  useEffect(() => {
    if (visible && user?.data?._id) {
      fetchLeaveBalance();
    }
  }, [visible]);

  const fetchLeaveBalance = async () => {
    try {
      const response = await dataFetcher(
        `leaves/balances/${user.data._id}`,
        "GET"
      );

      if (response?.data?.leaveBalance) {
        setLeaveBalance(response.data.leaveBalance);
      } else {
        // ✅ Handle null balance gracefully
        setLeaveBalance(null);
        console.warn("No leave balance found for employee");
      }
    } catch (err) {
      console.error("Failed to fetch leave balance:", err);
      setLeaveBalance(null); // ✅ Set null instead of crashing
    }
  };

  const showModal = () => {
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
    form.resetFields();
    setSelectedLeaveType(null);
    setCalculatedDays(0);
  };

  // Calculate leave days when dates change
  const handleDateChange = (dates) => {
    if (dates && dates[0] && dates[1]) {
      const start = dates[0];
      const end = dates[1];
      const days = end.diff(start, "days") + 1;
      setCalculatedDays(days);
    } else {
      setCalculatedDays(0);
    }
  };

  // Get available balance for selected leave type
  const getAvailableBalance = () => {
    if (!leaveBalance || !selectedLeaveType) return null;

    const balanceMap = {
      annual: leaveBalance.annualLeaveBalance,
      casual: leaveBalance.annualLeaveBalance,
      sick: leaveBalance.sickLeaveBalance,
      maternity: leaveBalance.maternityLeaveBalance,
      paternity: leaveBalance.paternityLeaveBalance,
      compassionate: leaveBalance.compassionateLeaveBalance,
      unpaid: "Unlimited",
    };

    return balanceMap[selectedLeaveType];
  };

  const handleSubmit = async (values) => {
    try {
      const { dateRange, typeOfLeave, reason, applyTo } = values;

      const payload = {
        startDate: dateRange[0].format("YYYY-MM-DD"),
        endDate: dateRange[1].format("YYYY-MM-DD"),
        typeOfLeave,
        reason,
        applyTo,
      };

      // Submit leave application
      const response = await dataFetcher(
        "leaves/applications",
        "POST",
        payload
      );

      if (response?.status === "success") {
        toast.success("Leave application submitted successfully");

        // Prepare email data
        const emailData = {
          subject: "New Leave Application - A.T. Lukman & Co.",
          send_to: applyTo,
          reply_to: "noreply@atlukman.com",
          template: "leaveApplication",
          url: "dashboard/staff",
          context: {
            leaveType: typeOfLeave,
            startDate: payload.startDate,
            endDate: payload.endDate,
            daysAppliedFor: calculatedDays,
            applicantName: `${user?.data?.firstName} ${user?.data?.lastName}`,
            reason: reason,
          },
        };

        // Send notification email
        await dispatch(sendAutomatedCustomEmail(emailData));

        form.resetFields();
        setVisible(false);
        setSelectedLeaveType(null);
        setCalculatedDays(0);

        // Callback to refresh parent component
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(err.message || "Failed to submit leave application");
    }
  };

  // Disable past dates
  const disabledDate = (current) => {
    return current && current < dayjs().startOf("day");
  };

  const availableBalance = getAvailableBalance();
  const insufficientBalance =
    selectedLeaveType &&
    selectedLeaveType !== "unpaid" &&
    availableBalance !== null &&
    calculatedDays > availableBalance;

  return (
    <>
      <Button
        type="primary"
        className="blue-btn"
        icon={<FileTextOutlined />}
        onClick={showModal}>
        Apply for Leave
      </Button>

      <Modal
        title={
          <Space>
            <CalendarOutlined />
            <span>Leave Application</span>
          </Space>
        }
        open={visible}
        onCancel={handleCancel}
        footer={null}
        width={600}>
        {/* Leave Balance Summary */}

        {leaveBalance ? (
          <Alert
            message="Your Leave Balance"
            description={
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <strong>Annual:</strong> {leaveBalance.annualLeaveBalance}{" "}
                  days
                </div>

                <div>
                  <strong>Sick:</strong> {leaveBalance.sickLeaveBalance} days
                </div>
                <div>
                  <strong>Maternity:</strong>{" "}
                  {leaveBalance.maternityLeaveBalance} days
                </div>
                <div>
                  <strong>Paternity:</strong>{" "}
                  {leaveBalance.paternityLeaveBalance} days
                </div>
              </div>
            }
            type="info"
          />
        ) : (
          <Alert
            message="No Leave Balance Found"
            description="Please contact HR to set up your leave entitlements."
            type="warning"
            showIcon
          />
        )}

        {selectedLeaveType &&
          !leaveBalance &&
          selectedLeaveType !== "unpaid" && (
            <Alert
              message="Cannot verify balance"
              description="Application will be submitted pending HR verification."
              type="warning"
            />
          )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off">
          <Form.Item
            name="dateRange"
            label="Leave Period"
            rules={[
              { required: true, message: "Please select leave dates" },
              {
                validator: (_, value) => {
                  if (value && value[0] && value[1]) {
                    const days = value[1].diff(value[0], "days") + 1;
                    if (days > 365) {
                      return Promise.reject(
                        new Error("Leave period cannot exceed 365 days")
                      );
                    }
                  }
                  return Promise.resolve();
                },
              },
            ]}>
            <RangePicker
              style={{ width: "100%" }}
              format="YYYY-MM-DD"
              disabledDate={disabledDate}
              onChange={handleDateChange}
              placeholder={["Start Date", "End Date"]}
            />
          </Form.Item>

          {calculatedDays > 0 && (
            <Alert
              message={`Leave Duration: ${calculatedDays} day${
                calculatedDays > 1 ? "s" : ""
              }`}
              type="info"
              showIcon
              className="mb-4"
            />
          )}

          <Form.Item
            name="typeOfLeave"
            label="Leave Type"
            rules={[{ required: true, message: "Please select leave type" }]}>
            <Select
              placeholder="Select leave type"
              options={leaveTypes}
              onChange={(value) => setSelectedLeaveType(value)}
            />
          </Form.Item>

          {/* Balance Warning */}
          {selectedLeaveType && availableBalance !== null && (
            <Alert
              message={
                selectedLeaveType === "unpaid"
                  ? "No balance required for unpaid leave"
                  : `Available ${selectedLeaveType} leave: ${availableBalance} days`
              }
              type={insufficientBalance ? "error" : "success"}
              showIcon
              className="mb-4"
            />
          )}

          <Form.Item
            name="reason"
            label="Reason for Leave"
            rules={[
              { required: true, message: "Please provide reason for leave" },
              { min: 10, message: "Reason must be at least 10 characters" },
              { max: 1000, message: "Reason cannot exceed 1000 characters" },
            ]}>
            <TextArea
              rows={4}
              placeholder="Please provide detailed reason for your leave application..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item
            name="applyTo"
            label="Approving Authority"
            rules={[
              {
                required: true,
                message: "Please select the approving authority",
              },
            ]}>
            <Select
              placeholder="Select approving authority"
              options={adminOptions}
              allowClear
              showSearch
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
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
                disabled={insufficientBalance}
                className="blue-btn">
                Submit Application
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default LeaveAppForm;
