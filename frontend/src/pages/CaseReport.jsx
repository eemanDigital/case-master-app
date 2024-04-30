import { useState, useCallback, useEffect } from "react";
import { useDataFetch } from "../context/useDataFectch";
import { DeleteOutlined } from "@ant-design/icons";
import {
  PartyDynamicInputs,
  SelectInputs,
  DynamicInputArrays,
  TextAreaInput,
} from "../components/DynamicInputs";

import {
  Button,
  Input,
  Form,
  Divider,
  Typography,
  Spin,
  Select,
  DatePicker,
} from "antd";

const CaseReport = () => {
  // destructure textarea from input
  const { TextArea } = Input;

  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    date: "",
    update: "",
    adjournedDate: "",
    reporter: "",
    caseReported: [],
  });
  // destructor authenticate from useAuth
  const { dataFetcher, data } = useDataFetch();

  //  get users/account officer's data
  const cases = Array.isArray(data?.data)
    ? data?.data.map((singleCase) => {
        // console.log(singleCase?._id);
        return {
          value: singleCase?._id,
          label: singleCase?.caseFullTitle,
        };
      })
    : [];

  // console.log("CASES", cases);

  // getAllUsers
  const fetchData = async () => {
    try {
      await dataFetcher("cases");
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    fetchData(); // Call the async function to fetch data
  }, []);

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
        // initialValues={formData}
      >
        {/* DATE*/}
        <Divider orientation="left" orientationMargin="0">
          <Typography.Title level={4}>Date</Typography.Title>
        </Divider>

        {/* Report Date */}
        <div>
          <Form.Item name="date" label="Report Date">
            <DatePicker />
          </Form.Item>
        </div>
        <Divider />

        {/* UPDATE */}
        <div>
          <Form.Item
            name="update"
            label="Write update here..."
            //   tooltip="This is a required field"
            initialValue={formData?.update}
            // rules={[
            //   {
            //     required: true,
            //     message: "Please enter suit no!",
            //   },
            // ]}
          >
            <TextArea />
          </Form.Item>
        </div>

        {/*  */}

        {/* ACCOUNT OFFICER */}

        <div>
          <Form.Item
            name="caseReported"
            label="Case To Work On"
            initialValue={formData?.caseReported}>
            <Select
              noStyle
              mode="multiple"
              notFoundContent={data ? <Spin size="small" /> : null}
              placeholder="Select a case here"
              options={cases}
              allowClear
              style={{
                width: "100%",
              }}
            />
          </Form.Item>
        </div>

        {/* ADJOURNED DATE */}
        <div>
          <Form.Item name="adjournedDate" label="Report Date">
            <DatePicker />
          </Form.Item>
        </div>

        <Divider />

        {/* CASE SUMMARY */}
        {/* <TextAreaInput
          fieldName="caseSummary"
          initialValue={formData?.caseSummary}
          label="Case Summary"
        /> */}
        {/* GENERAL COMMENT */}
        {/* <TextAreaInput
          fieldName="generalComment"
          initialValue={formData?.generalComment}
          label="General Comment"
        /> */}
        <Divider />

        <Form.Item>
          <Button onClick={onSubmit} type="default" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default CaseReport;
