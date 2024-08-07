import { useEffect } from "react";
import { Button, Input, Form, Modal, Select, Card } from "antd";
import useModal from "../hooks/useModal";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import { useDispatch, useSelector } from "react-redux";
import { getUsers } from "../redux/features/auth/authSlice";
import { toast } from "react-toastify";
import { useDataFetch } from "../hooks/useDataFetch";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
// import LoadingSpinner from "./LoadingSpinner";

const CreateLeaveBalanceForm = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { users, user } = useSelector((state) => state.auth);
  const { open, handleCancel, showModal } = useModal();
  const { userData } = useUserSelectOptions();
  const { data, error: dataError, loading, dataFetcher } = useDataFetch();

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  const onFinish = async (values) => {
    try {
      // get the selected user's for email data
      const selectedUser = users?.data?.find((u) => u._id === values.employee);
      if (!selectedUser) {
        toast.error("Selected user not found");
        return;
      }
      // prepare email data
      const emailData = {
        subject: "Leave Balance Award- A.T. Lukman & Co.",
        send_to: selectedUser.email,
        send_from: user?.data?.email,
        reply_to: "noreply@gmail.com",
        template: "leaveBalance",
        url: "dashboard/staff",
        context: {
          leaveType: "Annual Leave",
          leaveBalance: values.annualLeaveBalance,
        },
      };
      // post data
      await dataFetcher("leaves/balances", "POST", values);
      if (!dataError && emailData) {
        await dispatch(sendAutomatedCustomEmail(emailData)); // Send email if emailData is provided
      }
      form.resetFields(); //reset fields
    } catch (error) {
      console.error("Error creating leave balance:", error);
      toast.error(error || "An error occurred while creating leave balance");
    }
  };

  // send success message
  if (data?.message === "success") {
    toast.success("Leave Balance Created");
  }

  // send error message
  if (dataError) {
    toast.error(dataError);
  }

  // if (!users?.data) {
  //   return <LoadingSpinner />;
  // }

  return (
    <>
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Create Leave Balance
      </Button>
      <Modal
        title="Leave Balance Form"
        open={open}
        onCancel={handleCancel}
        footer={null}>
        <Form
          form={form}
          layout="vertical"
          name="leave application form"
          onFinish={onFinish}>
          <Card title="" bordered={false} style={{ width: 400, height: 350 }}>
            <Form.Item
              name="employee"
              label="Employee"
              rules={[
                { required: true, message: "Please select an employee" },
              ]}>
              <Select
                placeholder="Select a staff"
                options={userData}
                allowClear
                style={{ width: "100%" }}
              />
            </Form.Item>
            <Form.Item
              label="Annual Leave Balance"
              name="annualLeaveBalance"
              rules={[
                {
                  required: true,
                  message: "Please enter annual leave balance",
                },
              ]}>
              <Input />
            </Form.Item>
            <Form.Item
              label="Sick Leave Balance"
              name="sickLeaveBalance"
              rules={[
                { required: true, message: "Please enter sick leave balance" },
              ]}>
              <Input />
            </Form.Item>
            <Form.Item>
              <Button className="blue-btn" htmlType="submit">
                Save
              </Button>
            </Form.Item>
          </Card>
        </Form>
      </Modal>
    </>
  );
};

export default CreateLeaveBalanceForm;
