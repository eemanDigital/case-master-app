import { useState, useCallback } from "react";
import { useDataFetch } from "../context/useDataFetch";

import {
  Button,
  Input,
  Form,
  Space,
  Card,
  Divider,
  Typography,
  Spin,
  Select,
  DatePicker,
} from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

const CaseReport = () => {
  // destructure textarea from input
  const { TextArea } = Input;

  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    date: "",
    update: "",
    adjournedDate: "",
    reportedBy: "",
    caseReported: [],
  });
  // destructor authenticate from useAuth
  const { dataFetcher, data } = useDataFetch();
  const { cases, users } = useDataGetterHook();

  //  map over cases value
  const casesData = Array.isArray(cases?.data)
    ? cases?.data.map((singleCase) => {
        const { firstParty, secondParty } = singleCase;
        const firstName = firstParty?.description[0]?.name;
        const secondName = secondParty?.description[0]?.name;

        return {
          value: singleCase?._id,
          label: `${firstName || ""} vs ${secondName || ""}`,
        };
      })
    : [];

  //  get users/reporter data
  const usersData = Array.isArray(users?.data)
    ? users?.data.map((user) => {
        return {
          value: user?._id,
          label: user?.fullName,
        };
      })
    : [];

  console.log(users);

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

          {/* CASE REPORTED */}

          <Form.Item
            name="caseReported"
            label="Case To Work On"
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
              options={casesData}
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
              options={usersData}
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

export default CaseReport;
