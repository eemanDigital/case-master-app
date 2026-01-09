import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import {
  Button,
  Form,
  Input,
  Card,
  Select,
  DatePicker,
  Alert,
  Tag,
  Row,
  Col,
} from "antd";
import { formats } from "../utils/quillFormat";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useSelector } from "react-redux";
import useHandleSubmit from "../hooks/useHandleSubmit";
import dayjs from "dayjs"; // Make sure you have dayjs installed

const CreateCaseReportForm = () => {
  const { user } = useSelector((state) => state.auth);
  const [selectedCase, setSelectedCase] = useState(null);
  const [autoFilledClient, setAutoFilledClient] = useState(null);
  const [showClientWarning, setShowClientWarning] = useState(false);

  const { casesOptions, casesData } = useCaseSelectOptions();

  const { clientEmailsOption } = useClientSelectOptions();
  const { data: staffOptions, loading, error } = useUserSelectOptions();
  const navigate = useNavigate();

  // console.log("📝 CreateCaseReportForm: Rendered", userData);

  const {
    onSubmit,
    form,
    data: hookData,
    loading: hookLoading,
  } = useHandleSubmit("reports", "POST", "reports", "report", undefined);

  // Navigate after success
  useEffect(() => {
    if (hookData) {
      navigate(-1);
    }
  }, [hookData, navigate]);

  // Handle case selection and auto-fill client
  const handleCaseChange = (caseId, option) => {
    setSelectedCase(caseId);

    if (caseId) {
      const selectedCaseData = casesData?.find(
        (caseItem) => caseItem._id === caseId
      );

      if (selectedCaseData && selectedCaseData.client) {
        const clientEmail = selectedCaseData.client.email;
        const clientName = selectedCaseData.client.firstName
          ? `${selectedCaseData.client.firstName} ${
              selectedCaseData.client.lastName || ""
            }`
          : "Client";

        setAutoFilledClient({
          email: clientEmail,
          name: clientName,
          id: selectedCaseData.client._id || selectedCaseData.client,
        });

        form.setFieldsValue({
          clientEmail: clientEmail,
          caseReported: caseId,
        });

        setShowClientWarning(false);
      }
    } else {
      setAutoFilledClient(null);
      form.setFieldsValue({
        clientEmail: undefined,
      });
    }
  };

  // Handle manual client selection
  const handleClientChange = (clientEmail) => {
    if (selectedCase && clientEmail !== autoFilledClient?.email) {
      setShowClientWarning(true);
    } else {
      setShowClientWarning(false);
    }
  };

  // FIXED: Proper date handling for submission
  const handleSubmit = async (values) => {
    try {
      const formattedValues = {
        ...values,
        // Convert dayjs objects to ISO strings for the API
        date: values.date
          ? values.date.toISOString()
          : new Date().toISOString(),
        adjournedDate: values.adjournedDate
          ? values.adjournedDate.toISOString()
          : null,
      };

      await onSubmit(formattedValues);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form
      layout="vertical"
      form={form}
      name="create-case-report"
      className="flex justify-center"
      onFinish={handleSubmit}
      initialValues={{
        // FIXED: Use dayjs objects or null for DatePicker initial values
        date: dayjs(), // Current date as dayjs object
        adjournedDate: null, // Explicitly set to null if no initial value
        reportedBy: `${user?.data?._id} ${user?.data?._id}`,
      }}>
      <Card
        title="Create Case Report"
        bordered={false}
        className="w-full max-w-4xl shadow-lg"
        extra={
          <Button type="link" onClick={() => navigate(-1)}>
            ← Back
          </Button>
        }>
        {/* Case Selection Section */}
        <div className="mb-6">
          <Form.Item
            name="caseReported"
            label="Select Case"
            rules={[
              {
                required: true,
                message: "Please select a case to report on",
              },
            ]}>
            <Select
              placeholder="Search and select a case..."
              options={casesOptions}
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              onChange={handleCaseChange}
            />
          </Form.Item>

          {selectedCase && autoFilledClient && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-blue-800 font-semibold text-sm mb-1">
                    📋 Case Selected
                  </h4>
                  <p className="text-blue-700 text-sm">
                    Client will be auto-filled based on case selection
                  </p>
                </div>
                <Tag color="blue">Auto-filled</Tag>
              </div>
            </div>
          )}
        </div>

        {/* Client and Reporter Section */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="clientEmail"
              label="Client Email"
              rules={[
                {
                  required: true,
                  message: "Please select client to send report",
                },
                {
                  type: "email",
                  message: "Please enter a valid email address",
                },
              ]}>
              <Select
                placeholder={
                  autoFilledClient
                    ? `Auto-filled: ${autoFilledClient.email}`
                    : "Select a client or choose a case first"
                }
                options={clientEmailsOption}
                allowClear
                showSearch
                optionFilterProp="label"
                onChange={handleClientChange}
                disabled={!!autoFilledClient}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              name="reportedBy"
              label="Reported By"
              rules={[
                {
                  required: true,
                  message: "Please select who is reporting this case",
                },
              ]}>
              <Select
                placeholder="Select reporter"
                options={staffOptions}
                isLoading={loading}
                allowClear
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Warning when manually changing auto-filled client */}
        {showClientWarning && (
          <Alert
            message="Client Override"
            description="You're manually selecting a different client than the one associated with this case. Make sure this is intentional."
            type="warning"
            showIcon
            closable
            onClose={() => setShowClientWarning(false)}
            className="mb-4"
          />
        )}

        {/* Auto-filled Client Info */}
        {autoFilledClient && !showClientWarning && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-green-800 font-semibold text-sm mb-1">
                  👤 Auto-filled Client
                </h4>
                <p className="text-green-700 text-sm">
                  {autoFilledClient.name}
                  <span className="block text-green-600 text-xs">
                    {autoFilledClient.email}
                  </span>
                </p>
              </div>
              <Tag color="green">Auto-matched</Tag>
            </div>
          </div>
        )}

        {/* Report Dates Section */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="date"
              label="Report Date"
              rules={[
                {
                  required: true,
                  message: "Please select report date",
                },
              ]}>
              {/* FIXED: DatePicker automatically uses dayjs objects */}
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="adjournedDate" label="Next Adjourned Date">
              <DatePicker className="w-full" format="YYYY-MM-DD" />
            </Form.Item>
          </Col>
        </Row>

        {/* Case Update Section */}
        <div className="mb-6">
          <Form.Item
            name="update"
            label="Case Update"
            rules={[
              {
                required: true,
                message: "Please write your case update!",
              },
              {
                min: 10,
                message: "Case update must be at least 10 characters long",
              },
            ]}>
            <ReactQuill
              className="h-[200px] mb-12"
              theme="snow"
              formats={formats}
              placeholder="Provide detailed update on the case proceedings..."
            />
          </Form.Item>
        </div>

        {/* Adjournment Details Section */}
        <div className="mb-6">
          <Form.Item
            name="adjournedFor"
            label="Matter Adjourned For"
            rules={[
              {
                required: true,
                message: "Please specify what the matter was adjourned for",
              },
              {
                min: 5,
                message: "Please provide a meaningful description",
              },
            ]}>
            <Input.TextArea
              placeholder="e.g., Hearing, Cross-examination, Judgment, Further mention, etc."
              rows={3}
              showCount
              maxLength={500}
            />
          </Form.Item>
        </div>

        {/* Lawyers in Court Section */}
        <div className="mb-6">
          <Form.Item
            name="lawyersInCourt"
            label="Lawyers Present in Court"
            help="Select all lawyers who were present during the proceedings">
            <Select
              mode="multiple"
              placeholder="Select lawyers present in court..."
              // options={lawyers || []}
              allowClear
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
        </div>

        {/* Submit Section */}
        <Form.Item className="mb-0">
          <div className="flex gap-3 justify-end border-t pt-4">
            <Button onClick={() => navigate(-1)} disabled={hookLoading}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={hookLoading}
              htmlType="submit"
              className="min-w-32 bg-blue-600 hover:bg-blue-700">
              {hookLoading ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </Form.Item>
      </Card>
    </Form>
  );
};

export default CreateCaseReportForm;
