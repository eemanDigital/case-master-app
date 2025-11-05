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
} from "antd";
import { formats } from "../utils/quillFormat";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useSelector } from "react-redux";
import useHandleSubmit from "../hooks/useHandleSubmit";

const CreateCaseReportForm = () => {
  const { user } = useSelector((state) => state.auth);
  const [selectedCase, setSelectedCase] = useState(null);
  const [autoFilledClient, setAutoFilledClient] = useState(null);
  const [showClientWarning, setShowClientWarning] = useState(false);

  // form data
  const [formData, setFormData] = useState({
    date: Date.now(),
    update: "",
    adjournedDate: "",
    reportedBy: user?.data?.firstName,
    adjournedFor: "",
    clientEmail: "",
    caseReported: "",
  });

  const { casesOptions, casesData } = useCaseSelectOptions(); // Assuming casesData contains full case objects
  const { userData } = useUserSelectOptions();
  const { clientEmailsOption } = useClientSelectOptions();
  const navigate = useNavigate();

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
      // Find the selected case from casesData
      const selectedCaseData = casesData?.find(
        (caseItem) => caseItem._id === caseId
      );

      if (selectedCaseData && selectedCaseData.client) {
        // Auto-fill the client field
        const clientId = selectedCaseData.client._id || selectedCaseData.client;
        const clientName = selectedCaseData.client.firstName
          ? `${selectedCaseData.client.firstName} ${
              selectedCaseData.client.lastName || ""
            }`
          : "Client";

        setAutoFilledClient({
          id: clientId,
          name: clientName,
          email: selectedCaseData.client.email,
        });

        // Set form values
        form.setFieldsValue({
          clientEmail: clientId,
          caseReported: caseId,
        });

        setShowClientWarning(false);
      }
    } else {
      // Case was cleared
      setAutoFilledClient(null);
      form.setFieldsValue({
        clientEmail: undefined,
      });
    }
  };

  // Handle manual client selection (override auto-fill)
  const handleClientChange = (clientId) => {
    if (selectedCase && clientId !== autoFilledClient?.id) {
      setShowClientWarning(true);
    } else {
      setShowClientWarning(false);
    }
  };

  const handleFormChange = (changedValues, allValues) => {
    setFormData((prevData) => ({
      ...prevData,
      ...changedValues,
    }));
  };

  return (
    <Form
      layout="vertical"
      form={form}
      name="dynamic_form_complex"
      className="flex justify-center"
      onValuesChange={handleFormChange}
      onFinish={onSubmit}>
      <Card
        title="Create Case Report"
        bordered={false}
        className="w-[700px] shadow-lg"
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

          {/* Auto-filled Case Info */}
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

        {/* Client Selection Section */}
        <div className="mb-6">
          <Form.Item
            name="clientEmail"
            label="Client"
            rules={[
              {
                required: true,
                message: "Please select client to send report",
              },
            ]}>
            <Select
              placeholder={
                autoFilledClient
                  ? `Auto-filled: ${autoFilledClient.name}`
                  : "Select a client or choose a case first"
              }
              options={clientEmailsOption}
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: "100%" }}
              onChange={handleClientChange}
              disabled={!!autoFilledClient} // Disable when auto-filled
            />
          </Form.Item>

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
                    {autoFilledClient.email && (
                      <span className="block text-green-600 text-xs">
                        {autoFilledClient.email}
                      </span>
                    )}
                  </p>
                </div>
                <Tag color="green">Auto-matched</Tag>
              </div>
            </div>
          )}
        </div>

        {/* Report Details Section */}
        <div className="mb-6">
          <Form.Item name="date" label="Report Date">
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item
            className="mt-10 mb-10"
            name="update"
            label="Case Update"
            rules={[
              {
                required: true,
                message: "Please write your case update!",
              },
            ]}>
            <ReactQuill
              className="h-[200px] mb-7"
              theme="snow"
              formats={formats}
              placeholder="Provide detailed update on the case proceedings..."
            />
          </Form.Item>

          <Form.Item
            className="mt-5"
            name="adjournedFor"
            label="Matter Adjourned For"
            rules={[
              {
                required: true,
                message: "Please specify what the matter was adjourned for",
              },
            ]}>
            <Input.TextArea
              placeholder="e.g., Hearing, Cross-examination, Judgment, etc."
              rows={3}
            />
          </Form.Item>

          <Form.Item name="adjournedDate" label="Next Adjourned Date">
            <DatePicker className="w-full" />
          </Form.Item>
        </div>

        {/* Reporter Section */}
        <div className="mb-6">
          <Form.Item
            name="reportedBy"
            label="Reported By"
            initialValue={user?.data?._id}
            rules={[
              {
                required: true,
                message: "Please select who is reporting this case",
              },
            ]}>
            <Select
              placeholder="Select reporter"
              options={userData}
              allowClear
              style={{ width: "100%" }}
            />
          </Form.Item>
        </div>

        {/* Submit Section */}
        <Form.Item className="mb-0">
          <div className="flex gap-3 justify-end">
            <Button onClick={() => navigate(-1)} disabled={hookLoading}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={hookLoading}
              htmlType="submit"
              className="min-w-32">
              {hookLoading ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </Form.Item>
      </Card>
    </Form>
  );
};

export default CreateCaseReportForm;
