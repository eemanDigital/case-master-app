import { useState, useEffect } from "react";
import { Modal, Button, Form, Input, Select, DatePicker, Alert } from "antd";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import dayjs from "dayjs";

const { TextArea } = Input;

const LeaveResponseForm = ({ appId, onSuccess, applicationData }) => {
  const [open, setOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { data, loading, error: dataError, dataFetcher } = useDataFetch();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const statusOptions = [
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  useEffect(() => {
    if (applicationData && open) {
      form.setFieldsValue({
        startDate: applicationData.startDate
          ? dayjs(applicationData.startDate)
          : null,
        endDate: applicationData.endDate
          ? dayjs(applicationData.endDate)
          : null,
        daysApproved: applicationData.daysAppliedFor,
        status: applicationData.status,
      });
    }
  }, [applicationData, open, form]);

  const showModal = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
    form.resetFields();
  };

  const handleFinish = async (values) => {
    try {
      const payload = {
        status: values.status,
        responseMessage: values.responseMessage,
        reviewedBy: user?.data?._id,
        reviewedAt: new Date().toISOString(),
      };

      // Include dates if modified
      if (values.startDate && values.endDate) {
        payload.startDate = values.startDate.format("YYYY-MM-DD");
        payload.endDate = values.endDate.format("YYYY-MM-DD");
      }

      // Include approved days if status is approved
      if (values.status === "approved" && values.daysApproved) {
        payload.daysApproved = values.daysApproved;
      }

      // Submit response
      await dataFetcher(`leaves/applications/${appId}`, "PUT", payload);

      if (!dataError) {
        // Prepare email data
        const emailData = {
          subject: "Leave Application Response - A.T. Lukman & Co.",
          send_to: applicationData.employee?.email,
          reply_to: "noreply@atlukman.com",
          template: "leaveResponse",
          url: "/dashboard/leaves",
          context: {
            applicationDate: formatDate(applicationData.createdAt),
            typeOfLeave: applicationData.typeOfLeave,
            startDate: formatDate(
              values.startDate || applicationData.startDate
            ),
            endDate: formatDate(values.endDate || applicationData.endDate),
            status: values.status,
            daysApproved: values.daysApproved || applicationData.daysAppliedFor,
            responseMessage: values.responseMessage,
            approvedBy: `${user?.data?.firstName} ${user?.data?.lastName}`,
            applicantName: `${applicationData.employee?.firstName} ${applicationData.employee?.lastName}`,
          },
        };

        // Send email notification
        await dispatch(sendAutomatedCustomEmail(emailData));

        toast.success(`Leave application ${values.status} successfully!`);
        handleCancel();

        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error("Response submission error:", err);
      toast.error(err.message || "Failed to submit response");
    }
  };

  const handleStatusChange = (status) => {
    if (status === "approved") {
      form.setFieldValue("daysApproved", applicationData.daysAppliedFor);
    } else {
      form.setFieldValue("daysApproved", null);
    }
  };

  return (
    <>
      <Button type="primary" onClick={showModal}>
        Respond to Application
      </Button>

      <Modal
        title="Leave Application Response"
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={600}
        destroyOnClose>
        {applicationData && (
          <Alert
            message="Application Details"
            description={
              <div className="text-sm">
                <p>
                  <strong>Employee:</strong>{" "}
                  {applicationData.employee?.firstName}{" "}
                  {applicationData.employee?.lastName}
                </p>
                <p>
                  <strong>Leave Type:</strong> {applicationData.typeOfLeave}
                </p>
                <p>
                  <strong>Duration:</strong> {applicationData.daysAppliedFor}{" "}
                  days
                </p>
                <p>
                  <strong>Reason:</strong> {applicationData.reason}
                </p>
              </div>
            }
            type="info"
            className="mb-4"
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          requiredMark="optional">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="startDate" label="Start Date (Optional)">
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                placeholder="Leave start date"
              />
            </Form.Item>

            <Form.Item name="endDate" label="End Date (Optional)">
              <DatePicker
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
                placeholder="Leave end date"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="status"
            label="Decision"
            rules={[{ required: true, message: "Please select a decision" }]}>
            <Select
              options={statusOptions}
              placeholder="Select decision"
              onChange={handleStatusChange}
            />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.status !== currentValues.status
            }>
            {({ getFieldValue }) =>
              getFieldValue("status") === "approved" ? (
                <Form.Item
                  name="daysApproved"
                  label="Days Approved"
                  rules={[
                    { required: true, message: "Please enter approved days" },
                  ]}>
                  <Input
                    type="number"
                    min={0.5}
                    max={applicationData?.daysAppliedFor}
                    step={0.5}
                    placeholder="Enter number of days approved"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            name="responseMessage"
            label="Response Message"
            rules={[
              { required: true, message: "Please provide a response message" },
              { max: 500, message: "Message cannot exceed 500 characters" },
            ]}>
            <TextArea
              rows={4}
              placeholder="Provide detailed response to the employee..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex gap-3 justify-end">
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Submit Response
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default LeaveResponseForm;
