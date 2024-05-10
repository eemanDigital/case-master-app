import { useState, useCallback } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import {
  MinusCircleOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";

import { Button, Input, Form, Space, Upload } from "antd";
// import { useDataGetterHook } from "../hooks/useDataGetterHook";

const CaseDocument = () => {
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    document: [
      {
        fileName: "",
        file: null,
      },
    ],
  });
  // handle reports post and get report data
  const { dataFetcher, data } = useDataFetch();

  // fetched cases and user data
  //   const { files } = useDataGetterHook();

  //   console.log("CASES", files);
  //   //  map over cases value

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

  const onSubmit = useCallback(async () => {
    // submit data
    const fileHeaders = {
      "Content-Type": "multipart/form-data",
    };

    let values;
    try {
      values = await form.validateFields(); // Validate the form fields
    } catch (errorInfo) {
      return;
    }
    const result = await dataFetcher("cases", "post", values, fileHeaders); // Submit the form data to the backend

    console.log("VALUES", values);
    handleSubmission(result); // Handle the submission after the API Call
  }, [form, handleSubmission, dataFetcher]);

  console.log("FORMDATA", formData);
  return (
    <>
      <Form
        layout="vertical"
        form={form}
        name="document upload"
        // autoComplete="off"
        className="flex  justify-center">
        {/* <h1 className="text-4xl">Case Report</h1> */}
        <Form.List name="document">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space
                  className="flex flex-col"
                  key={key}
                  //   style={{
                  //     display: "flex",
                  //     marginBottom: 8,
                  //   }}
                  align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, "fileName"]}
                    initialValue={formData?.name}
                    rules={[
                      {
                        required: true,
                        message: "Missing document's name",
                      },
                    ]}>
                    <Input placeholder="Document's Name" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "file"]}
                    initialValue={formData?.name}
                    rules={[
                      {
                        required: true,
                        message: "Missing document",
                      },
                    ]}>
                    <Upload name="case documents">
                      <Button icon={<UploadOutlined />}>Click to upload</Button>
                    </Upload>
                  </Form.Item>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}>
                  Add Documents
                </Button>
              </Form.Item>

              <Form.Item>
                <Button onClick={onSubmit} type="default" htmlType="submit">
                  Submit
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </>
  );
};

export default CaseDocument;
