import { useState, useCallback } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import { Button, Input, Form, Card, Spin, Select, DatePicker } from "antd";

const CreateCaseReportForm = () => {
  // destructure textarea from input
  const { TextArea } = Input;

  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    date: "",
    update: "",
    adjournedDate: "",
    reportedBy: "",
    adjournedFor: "",
    caseReported: [],
  });
  // handle reports post and get report data
  const { dataFetcher, data } = useDataFetch();
  const { casesOptions } = useCaseSelectOptions();
  const { userData } = useUserSelectOptions();

  // form submit functionalities
  const handleSubmission = useCallback(
    (result) => {
      if (result?.error) {
        // Handle Error here
      } else {
        // Handle Success here
        // form.resetFields();
      }
    },
    []
    // [form]
  );

  // submit data
  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields(); // Validate the form fields
    } catch (errorInfo) {
      return;
    }
    const result = await dataFetcher("reports", "POST", values); // Submit the form data to the backend
    console.log(values);
    handleSubmission(result); // Handle the submission after the API Call
  }, [form, handleSubmission, dataFetcher]);

  return (
    <>
      <Form
        layout="vertical"
        form={form}
        name="dynamic_form_complex"
        // autoComplete="off"
        className="flex  justify-center">
        {/* <h1 className="text-4xl">Case Report</h1> */}
        <Card title="Case Report" bordered={false} style={{ width: 700 }}>
          <Form.Item name="date" label="Report Date">
            <DatePicker />
          </Form.Item>
          {/* UPDATE */}
          <Form.Item
            name="update"
            label="Write update here..."
            //   tooltip="This is a required field"
            initialValue={formData?.update}
            rules={[
              {
                required: true,
                message: "Please write your update!",
              },
            ]}>
            <TextArea rows={8} placeholder="Your text here..." />
          </Form.Item>
          {/* MATTER ADJOURNED FOR */}
          <Form.Item
            name="adjournedFor"
            label="Matter adjourned for"
            //   tooltip="This is a required field"
            initialValue={formData?.adjournedFor}
            rules={[
              {
                required: true,
                message: "write what the matter was adjourned for!",
              },
            ]}>
            <Input placeholder="Your text here..." />
          </Form.Item>

          {/* CASE REPORTED */}

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
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
          {/* REPORTER */}

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
              style={{
                width: "100%",
              }}
            />
          </Form.Item>

          {/* ADJOURNED DATE */}

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
