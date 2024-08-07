import { useEffect, useMemo, useState } from "react";
import { Button, Input, Form, Modal, Select, Card, Spin } from "antd";
import useHandleSubmit from "../hooks/useHandleSubmit";
import useModal from "../hooks/useModal";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const CreateLeaveBalanceForm = ({ userId }) => {
  const [formData, setFormData] = useState({});
  // hook for modal
  const { open, handleCancel, showModal } = useModal();
  // hook for user data options
  const { userData } = useUserSelectOptions();
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const {
    onSubmit,
    form,
    data: hookData,
    loading: hookLoading,
    error: hookError,
  } = useHandleSubmit("leaves/balances", "POST", emailData);

  const emailData = useMemo(
    () => ({
      subject: "Case Report - A.T. Lukman & Co.",
      send_to: formData.employee,
      send_from: user?.data?.email,
      reply_to: "noreply@gmail.com",
      template: "caseReport",
      url: "dashboard/staff",
    }),
    [formData.employee, user?.data?.email]
  );

  useEffect(() => {
    if (hookData) {
      toast.success("Report Created");
      navigate(-1);
    } else if (hookError) {
      toast.error(hookError);
    }
  }, [hookData, navigate, hookError]);

  return (
    <>
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Create Leave Balance
      </Button>
      <Modal
        title="Leave Balance Form"
        open={open}
        // onOk={handleOk}
        // confirmLoading={loading}
        onCancel={handleCancel}
        footer={null}>
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
                    placeholder="Select a staff"
                    options={userData}
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
                  Save
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
