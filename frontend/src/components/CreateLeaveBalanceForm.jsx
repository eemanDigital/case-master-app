import { useState, useCallback } from "react";
import { useDataFetch } from "../hooks/useDataFetch";

import { Button, Input, Form, Modal, Select, Card, Spin } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

const CreateLeaveBalanceForm = ({ userId }) => {
  //   const { id } = useParams();
  const [open, setOpen] = useState(false);
  //   const [confirmLoading, setConfirmLoading] = useState(false);
  //   const [modalText, setModalText] = useState("Content of the modal");
  const showModal = () => {
    setOpen(true);
  };
  //   const handleOk = () => {
  //     setModalText("The modal will be closed after two seconds");
  //     setConfirmLoading(true);
  //     setTimeout(() => {
  //       setOpen(false);
  //       setConfirmLoading(false);
  //     }, 2000);
  //   };
  const handleCancel = () => {
    console.log("Clicked cancel button");
    setOpen(false);
  };

  const [form] = Form.useForm();
  const [formData, setFormData] = useState({});
  // destructor authenticate from useAuth
  const { dataFetcher, data, loading } = useDataFetch();
  const { users } = useDataGetterHook();

  //  get users/reporter data
  const usersData = Array.isArray(users?.data)
    ? users?.data.map((user) => {
        return {
          value: user?._id,
          label: user?.fullName,
        };
      })
    : [];

  // console.log(users);

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
    const result = await dataFetcher("leaves/balances", "POST", values); // Submit the form data to the backend
    console.log(values);
    handleSubmission(result); // Handle the submission after the API Call
  }, [form, handleSubmission, dataFetcher]);
  return (
    <>
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Create Leave Balance
      </Button>
      <Modal
        title="Leave Balance Form"
        open={open}
        // onOk={handleOk}
        confirmLoading={loading}
        onCancel={handleCancel}>
        <section className="flex justify-between gap-8 ">
          <Form
            layout="vertical"
            form={form}
            name="leave application form"
            // autoComplete="off"
            className="flex  justify-center">
            <Card title="" bordered={false} style={{ width: 400, height: 350 }}>
              <div>
                <Form.Item
                  name="employee"
                  label="Employee"
                  initialValue={formData?.employee}
                  rules={[
                    {
                      required: true,
                      message: "Please, select employee!",
                    },
                  ]}>
                  <Select
                    mode="multiple"
                    noStyle
                    notFoundContent={data ? <Spin size="small" /> : null}
                    placeholder="Select a staff"
                    options={usersData}
                    allowClear
                    style={{
                      width: "100%",
                    }}
                  />
                </Form.Item>
                <Form.Item
                  label="Annual Leave Balance"
                  name="annualLeaveBalance"
                  initialValue={formData?.annualLeaveBalance}>
                  <Input />
                </Form.Item>
                {/* sick leave Balance */}
                <Form.Item
                  label="Sick Leave Balance"
                  name="sickLeaveBalance"
                  initialValue={formData?.sickLeaveBalance}>
                  <Input />
                </Form.Item>
              </div>

              <Form.Item>
                <Button onClick={onSubmit} type="default" htmlType="submit">
                  Submit
                </Button>
              </Form.Item>
            </Card>
          </Form>
        </section>
      </Modal>
    </>
  );
};
export default CreateLeaveBalanceForm;
