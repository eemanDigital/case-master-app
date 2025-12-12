import { useEffect, useState } from "react";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import PropTypes from "prop-types";
import {
  Button,
  Input,
  Form,
  Card,
  Select,
  DatePicker,
  Modal,
  Row,
  Col,
  Alert,
  Tag,
} from "antd";
import ReactQuill from "react-quill";
import { formats } from "../utils/quillFormat";
import useInitialDataFetcher from "../hooks/useInitialDataFetcher";
import useHandleSubmit from "../hooks/useHandleSubmit";
// Removed useNavigate - we want to close the modal, not change pages
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import dayjs from "dayjs";

const UpdateCaseReportForm = ({ reportId, onClose }) => {
  const { casesOptions, casesData } = useCaseSelectOptions();
  const { clientEmailsOption } = useClientSelectOptions();

  // This hook will now only run when the parent renders this component (on click)
  const { formData, loading: formDataLoading } = useInitialDataFetcher(
    "reports",
    reportId
  );

  const { userData, lawyersOptions } = useUserSelectOptions();

  // Removed useModal hook - The parent controls the existence of this component
  // const { open, showModal, handleOk, handleCancel } = useModal();

  const [selectedCase, setSelectedCase] = useState(null);
  const [autoFilledClient, setAutoFilledClient] = useState(null);
  const [showClientWarning, setShowClientWarning] = useState(false);

  // custom hook to handle form submission
  const {
    form,
    data,
    onSubmit,
    loading: submitLoading,
  } = useHandleSubmit(`reports/${reportId}`, "patch", "reports", "reports");

  // On Success
  useEffect(() => {
    if (data) {
      // Instead of navigating, we close the modal and tell parent to refresh
      if (onClose) onClose(true);
    }
  }, [data, onClose]);

  // Set initial form values when formData is loaded
  useEffect(() => {
    if (formData) {
      const caseReportedId = formData?.caseReported?._id || "";
      const reportedById = formData?.reportedBy?._id || "";

      // Set selected case for auto-fill logic
      if (caseReportedId) {
        const selectedCaseData = casesData?.find(
          (caseItem) => caseItem._id === caseReportedId
        );
        setSelectedCase(caseReportedId);

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
        }
      }

      form.setFieldsValue({
        date: formData?.date ? dayjs(formData.date) : dayjs(),
        update: formData?.update || "",
        adjournedFor: formData?.adjournedFor || "",
        caseReported: caseReportedId,
        clientEmail: formData?.clientEmail || "",
        reportedBy: reportedById,
        adjournedDate: formData?.adjournedDate
          ? dayjs(formData.adjournedDate)
          : null,
        lawyersInCourt:
          formData?.lawyersInCourt?.map((lawyer) => lawyer._id) || [],
      });
    }
  }, [formData, form, casesData]);

  // Handle case selection and auto-fill client
  const handleCaseChange = (caseId) => {
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
        });

        setShowClientWarning(false);
      }
    } else {
      setAutoFilledClient(null);
      form.setFieldsValue({
        clientEmail: "",
      });
    }
  };

  const handleClientChange = (clientEmail) => {
    if (selectedCase && clientEmail !== autoFilledClient?.email) {
      setShowClientWarning(true);
    } else {
      setShowClientWarning(false);
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      const formattedValues = {
        ...values,
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

  const handleModalCancel = () => {
    setSelectedCase(null);
    setAutoFilledClient(null);
    setShowClientWarning(false);
    // Call parent close prop
    if (onClose) onClose(false);
  };

  return (
    <Modal
      open={true} // Always true because the parent renders it conditionally
      title="Update Case Report"
      width={1000}
      footer={null}
      onCancel={handleModalCancel}
      style={{ top: 20 }}
      destroyOnClose>
      <Form
        layout="vertical"
        form={form}
        name="update-case-report"
        onFinish={handleFormSubmit}
        className="flex justify-center">
        <Card
          bordered={false}
          loading={formDataLoading}
          style={{ width: "100%" }}>
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
                  options={userData}
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
                options={lawyersOptions || []}
                allowClear
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          </div>

          {/* Submit Section */}
          <Form.Item className="mb-0">
            <div className="flex gap-3 justify-end border-t pt-4">
              <Button onClick={handleModalCancel} disabled={submitLoading}>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={submitLoading}
                htmlType="submit"
                className="min-w-32 bg-blue-600 hover:bg-blue-700">
                {submitLoading ? "Updating..." : "Update Report"}
              </Button>
            </div>
          </Form.Item>
        </Card>
      </Form>
    </Modal>
  );
};

UpdateCaseReportForm.propTypes = {
  reportId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default UpdateCaseReportForm;
