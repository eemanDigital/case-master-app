import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import {
  Button,
  Form,
  Input,
  Card,
  Spin,
  Select,
  DatePicker,
  message,
} from "antd";
import { formats } from "../utils/quillFormat";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { toast } from "react-toastify";

const CreateCaseReportForm = () => {
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    date: Date.now(),
    update: "",
    adjournedDate: "",
    reportedBy: "",
    adjournedFor: "",
    caseReported: [],
  });
  const { dataFetcher, data, error, loading } = useDataFetch();
  const { fetchData } = useDataGetterHook();
  const { casesOptions } = useCaseSelectOptions();
  const { userData } = useUserSelectOptions();
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmission = useCallback(
    (result) => {
      if (result?.error) {
        // Handle Error here
      } else {
        // Handle Success here
        form.resetFields();
      }
    },
    [form]
  );

  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (errorInfo) {
      return;
    }

    try {
      const result = await dataFetcher("reports", "POST", values);
      await fetchData("reports", "reports"); // Ensure fetchData completes before proceeding
      handleSubmission(result);
      setIsSuccess(true); // Set success state
    } catch (error) {
      toast.error("Error submitting report:", error);
    }
  }, [form, handleSubmission, dataFetcher, fetchData]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Report Created");
      navigate(-1); // Redirect to the case report list page
    }
  }, [isSuccess, navigate]);
  return (
    <>
      <Form
        layout="vertical"
        form={form}
        name="dynamic_form_complex"
        className="flex justify-center">
        <Card title="Case Report" bordered={false} style={{ width: 700 }}>
          <Form.Item name="date" label="Report Date">
            <DatePicker />
          </Form.Item>
          <Form.Item
            name="update"
            label="Write update here..."
            initialValue={formData?.update}
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
              // value={formData.body}
              dangerouslySetInnerHTML={{ __html: formData?.update }}
            />
          </Form.Item>

          <Form.Item
            name="adjournedFor"
            label="Matter adjourned for"
            initialValue={formData?.adjournedFor}
            rules={[
              {
                required: true,
                message: "write what the matter was adjourned for!",
              },
            ]}>
            <Input placeholder="Your text here..." />
          </Form.Item>
          <Form.Item
            name="caseReported"
            label="Case Reported"
            initialValue={formData?.caseReported}
            rules={[
              {
                required: true,
                message: "Please, provide the case you are reporting on",
              },
            ]}>
            <Select
              noStyle
              notFoundContent={data ? <Spin size="small" /> : null}
              placeholder="Select a case here"
              options={casesOptions}
              allowClear
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item
            name="reportedBy"
            label="Case Reporter"
            initialValue={formData?.reportedBy}
            rules={[
              {
                required: true,
                message: "Please, select reporter!",
              },
            ]}>
            <Select
              noStyle
              notFoundContent={data ? <Spin size="small" /> : null}
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
            <Button onClick={onSubmit} type="default" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Card>
      </Form>
    </>
  );
};

export default CreateCaseReportForm;
