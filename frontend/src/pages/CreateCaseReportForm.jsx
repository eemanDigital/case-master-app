import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import useClientSelectOptions from "../hooks/useClientSelectOptions";
import { Button, Form, Input, Card, Select, DatePicker } from "antd";
import { formats } from "../utils/quillFormat";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useSelector } from "react-redux";
import useHandleSubmit from "../hooks/useHandleSubmit";

const CreateCaseReportForm = () => {
  const { user } = useSelector((state) => state.auth);
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

  const { casesOptions } = useCaseSelectOptions();
  const { userData } = useUserSelectOptions();
  const { clientEmailsOption } = useClientSelectOptions();
  const navigate = useNavigate();

  // prepare email data
  const emailData = useMemo(
    () => ({
      subject: "Case Report - A.T. Lukman & Co.",
      send_to: formData.clientEmail,
      send_from: user?.data?.email,
      reply_to: "noreply@gmail.com",
      template: "caseReport",
      url: "dashboard/case-reports",
    }),
    [formData.clientEmail, user?.data?.email]
  );

  // for data submission
  const {
    onSubmit,
    form,
    data: hookData,
    loading: hookLoading,
  } = useHandleSubmit("reports", "POST", "reports", "report", emailData);

  // navigate after success
  useEffect(() => {
    if (hookData) {
      navigate(-1);
    }
  }, [hookData, navigate]);

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
      onValuesChange={handleFormChange}>
      <Card title="Case Report" bordered={false} className="w-[700px]">
        <Form.Item name="date" label="Report Date">
          <DatePicker />
        </Form.Item>
        <Form.Item
          className="mt-10 mb-10"
          name="update"
          label="Write update here..."
          rules={[
            {
              required: true,
              message: "Please write your update!",
            },
          ]}>
          <ReactQuill
            className="h-[200px] mb-7"
            theme="snow"
            formats={formats}
          />
        </Form.Item>

        <Form.Item
          className="mt-5"
          name="adjournedFor"
          label="Matter adjourned for"
          rules={[
            {
              required: true,
              message: "Write what the matter was adjourned for!",
            },
          ]}>
          <Input placeholder="Your text here..." />
        </Form.Item>

        <Form.Item
          name="caseReported"
          label="Case Reported"
          rules={[
            {
              required: true,
              message: "Please provide the case you are reporting on",
            },
          ]}>
          <Select
            placeholder="Select a case here"
            options={casesOptions}
            allowClear
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          name="clientEmail"
          label="Client's Name"
          rules={[
            {
              required: true,
              message: "Please select client to send report",
            },
          ]}>
          <Select
            placeholder="Select a client here"
            options={clientEmailsOption}
            allowClear
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          name="reportedBy"
          label="Case Reporter"
          rules={[
            {
              required: true,
              message: "Please select reporter!",
            },
          ]}>
          <Select
            placeholder="Select a reporter"
            options={userData}
            allowClear
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item name="adjournedDate" label="Next Adjourned Date">
          <DatePicker />
        </Form.Item>
        <Form.Item>
          <Button
            loading={hookLoading}
            onClick={onSubmit}
            className="blue-btn"
            htmlType="submit"
            // loading={hookLoading}
          >
            Submit
          </Button>
        </Form.Item>
      </Card>
    </Form>
  );
};

export default CreateCaseReportForm;
