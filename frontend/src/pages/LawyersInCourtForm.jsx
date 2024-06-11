import { useState, useCallback, useEffect } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import useCaseSelectOptions from "../hooks/useCaseSelectOptions";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import useModal from "../hooks/useModal";
import { Button, Input, Form, Card, Select, Modal } from "antd";
import axios from "axios";

const baseURL = import.meta.env.VITE_BASE_URL;

const LawyersInCourtForm = ({ reportId }) => {
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  // handle reports post and get report data
  const { dataFetcher, data } = useDataFetch();

  const { userData } = useUserSelectOptions();

  const { open, confirmLoading, modalText, showModal, handleOk, handleCancel } =
    useModal(); //modal hook

  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("jwt="))
    ?.split("=")[1];

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${baseURL}/reports/${reportId}`, {
          headers: {
            ...fileHeaders,
            Authorization: `Bearer ${token}`,
          },
        });

        setFormData((prevData) => {
          return {
            ...prevData,
            ...response?.data?.data,
          };
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [reportId]);

  // form submit functionalities
  const handleSubmission = useCallback(
    (result) => {
      if (result?.error) {
        // Handle Error here
      } else {
        // Handle Success here
        form.resetFields();
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
    const result = await dataFetcher(`reports/${reportId}`, "PATCH", values); // Submit the form data to the backend
    console.log(values);
    handleSubmission(result); // Handle the submission after the API Call
  }, [form, handleSubmission, dataFetcher]);

  return (
    <>
      <button
        onClick={showModal}
        className="bg-blue-500 hover:bg-blue-700 text-white  py-2 px-4 my-2 tracking-wider ">
        Assign Lawyer To Court
      </button>
      <Modal
        title="Send Reminder on Task"
        open={open}
        onOk={handleOk}
        // confirmLoading={}
        onCancel={handleCancel}>
        <Form
          layout="vertical"
          form={form}
          name="dynamic_form_complex"
          // autoComplete="off"
          className="flex  justify-center">
          {/* <h1 className="text-4xl">Case Report</h1> */}
          <Card title="Case Report" bordered={false} style={{ width: 700 }}>
            <div>
              <Form.Item
                name="lawyersInCourt"
                label="Account Officer"
                className="w-[200px]"
                initialValue={formData?.lawyersInCourt}>
                <Select
                  // noStyle
                  mode="multiple"
                  placeholder="Select account officer"
                  options={userData}
                  allowClear
                  // style={{
                  //   width: "100%",
                  // }}
                />
              </Form.Item>
            </div>
            <Form.Item>
              <Button onClick={onSubmit} type="default" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Card>
        </Form>
      </Modal>
    </>
  );
};

export default LawyersInCourtForm;
