import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Form,
  Modal,
  Select,
  Card,
  InputNumber,
  DatePicker,
  Row,
  Col,
  Alert,
} from "antd";
import useModal from "../hooks/useModal";
import moment from "moment";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import { useDispatch, useSelector } from "react-redux";
import { getUsers } from "../redux/features/auth/authSlice";
import { toast } from "react-toastify";
import {
  PlusOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import ButtonWithIcon from "./ButtonWithIcon";

const { Option } = Select;

const CreateLeaveBalanceForm = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { users, user } = useSelector((state) => state.auth);
  const { open, handleCancel, showModal } = useModal();
  const { userData } = useUserSelectOptions();
  const { data, error: dataError, loading, dataFetcher } = useDataFetch();
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setSelectedEmployee(null);
    }
  }, [open, form]);

  const handleEmployeeChange = (employeeId) => {
    const employee = users?.data?.find((u) => u._id === employeeId);
    setSelectedEmployee(employee);
  };

  const onFinish = async (values) => {
    try {
      // Validate year (must be current or future year)
      const currentYear = new Date().getFullYear();
      if (values.year && values.year < currentYear) {
        toast.error("Cannot create leave balance for past years");
        return;
      }

      // Prepare payload according to backend model
      const payload = {
        employee: values.employee,
        annualLeaveBalance: values.annualLeaveBalance || 0,
        sickLeaveBalance: values.sickLeaveBalance || 0,
        maternityLeaveBalance: values.maternityLeaveBalance || 0,
        paternityLeaveBalance: values.paternityLeaveBalance || 0,
        compassionateLeaveBalance: values.compassionateLeaveBalance || 0,
        carryOverDays: values.carryOverDays || 0,
        year: values.year || currentYear,
        lastUpdated: new Date().toISOString(),
      };

      // Get selected user for email data
      const selectedUser = users?.data?.find((u) => u._id === values.employee);
      if (!selectedUser) {
        toast.error("Selected user not found");
        return;
      }

      // Prepare comprehensive email data
      const emailData = {
        subject: "Leave Balance Award - A.T. Lukman & Co.",
        send_to: selectedUser.email,
        reply_to: "noreply@atlukman.com",
        template: "leaveBalance",
        url: "/dashboard/leaves",
        context: {
          employeeName: `${selectedUser.firstName} ${selectedUser.lastName}`,
          annualLeaveBalance: values.annualLeaveBalance,
          sickLeaveBalance: values.sickLeaveBalance,
          maternityLeaveBalance: values.maternityLeaveBalance || 0,
          paternityLeaveBalance: values.paternityLeaveBalance || 0,
          compassionateLeaveBalance: values.compassionateLeaveBalance || 0,
          carryOverDays: values.carryOverDays || 0,
          totalAvailableLeave:
            (values.annualLeaveBalance || 0) +
            (values.sickLeaveBalance || 0) +
            (values.maternityLeaveBalance || 0) +
            (values.paternityLeaveBalance || 0) +
            (values.compassionateLeaveBalance || 0) +
            (values.carryOverDays || 0),
          year: values.year || currentYear,
          awardedBy: `${user?.data?.firstName} ${user?.data?.lastName}`,
          awardDate: new Date().toLocaleDateString(),
        },
      };

      // Post data to backend
      await dataFetcher("leaves/balances", "POST", payload);

      if (!dataError) {
        // Send email notification
        await dispatch(sendAutomatedCustomEmail(emailData));

        toast.success("Leave balance created successfully!");
        handleCancel();
      }
    } catch (error) {
      console.error("Error creating leave balance:", error);

      // Handle specific backend errors
      if (error.includes("already exists")) {
        toast.error("Leave balance already exists for this employee and year");
      } else if (error.includes("negative")) {
        toast.error("Leave balance cannot be negative");
      } else {
        toast.error(error || "An error occurred while creating leave balance");
      }
    }
  };

  // Handle API responses
  useEffect(() => {
    if (data?.message === "success") {
      toast.success("Leave balance created successfully!");
      handleCancel();
    }
  }, [data, handleCancel]);

  useEffect(() => {
    if (dataError) {
      // Handle specific error messages from backend
      if (dataError.includes("already exists")) {
        toast.error("Leave balance already exists for this employee and year");
      } else if (dataError.includes("negative")) {
        toast.error("Leave balance values cannot be negative");
      } else if (dataError.includes("required")) {
        toast.error("Please fill all required fields");
      } else {
        toast.error(dataError);
      }
    }
  }, [dataError]);

  const validatePositiveNumber = (_, value) => {
    if (value === undefined || value === null || value === "") {
      return Promise.resolve();
    }
    if (value < 0) {
      return Promise.reject(new Error("Value cannot be negative"));
    }
    return Promise.resolve();
  };

  const currentYear = new Date().getFullYear();

  return (
    <>
      <ButtonWithIcon
        onClick={showModal}
        icon={<PlusOutlined className="mr-2" />}
        text="Create Leave Balance"
        type="primary"
      />

      <Modal
        title={
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-blue-500" />
            <span>Create Leave Balance</span>
          </div>
        }
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={700}
        destroyOnClose>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            year: currentYear,
            annualLeaveBalance: 21,
            sickLeaveBalance: 10,
            maternityLeaveBalance: 90,
            paternityLeaveBalance: 14,
            compassionateLeaveBalance: 5,
            carryOverDays: 0,
          }}
          className="w-full">
          <Card title="Employee Information" bordered={false} className="mb-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="employee"
                  label="Employee"
                  rules={[
                    { required: true, message: "Please select an employee" },
                  ]}>
                  <Select
                    placeholder="Select employee"
                    options={userData}
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    onChange={handleEmployeeChange}
                    suffixIcon={<UserOutlined />}
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="year"
                  label="Year"
                  rules={[
                    { required: true, message: "Please select year" },
                    {
                      validator: (_, value) => {
                        if (value < 2000) {
                          return Promise.reject(
                            new Error("Year must be 2000 or later")
                          );
                        }
                        if (value > currentYear + 1) {
                          return Promise.reject(
                            new Error(
                              "Cannot create balance for distant future years"
                            )
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}>
                  <InputNumber
                    min={2000}
                    max={currentYear + 1}
                    placeholder="Enter year"
                    className="w-full"
                    addonAfter={<CalendarOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>

            {selectedEmployee && (
              <Alert
                message={`Selected: ${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                type="info"
                showIcon
                className="mb-2"
              />
            )}
          </Card>

          <Card title="Leave Balances" bordered={false} className="mb-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="annualLeaveBalance"
                  label="Annual Leave Balance"
                  rules={[
                    {
                      required: true,
                      message: "Please enter annual leave balance",
                    },
                    { validator: validatePositiveNumber },
                  ]}>
                  <InputNumber
                    min={0}
                    max={365}
                    placeholder="Enter days"
                    className="w-full"
                    addonAfter="days"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="sickLeaveBalance"
                  label="Sick Leave Balance"
                  rules={[
                    {
                      required: true,
                      message: "Please enter sick leave balance",
                    },
                    { validator: validatePositiveNumber },
                  ]}>
                  <InputNumber
                    min={0}
                    max={365}
                    placeholder="Enter days"
                    className="w-full"
                    addonAfter="days"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="maternityLeaveBalance"
                  label="Maternity Leave Balance"
                  rules={[{ validator: validatePositiveNumber }]}>
                  <InputNumber
                    min={0}
                    max={365}
                    placeholder="Enter days"
                    className="w-full"
                    addonAfter="days"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="paternityLeaveBalance"
                  label="Paternity Leave Balance"
                  rules={[{ validator: validatePositiveNumber }]}>
                  <InputNumber
                    min={0}
                    max={365}
                    placeholder="Enter days"
                    className="w-full"
                    addonAfter="days"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="compassionateLeaveBalance"
                  label="Compassionate Leave Balance"
                  rules={[{ validator: validatePositiveNumber }]}>
                  <InputNumber
                    min={0}
                    max={365}
                    placeholder="Enter days"
                    className="w-full"
                    addonAfter="days"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="carryOverDays"
                  label="Carry Over Days"
                  rules={[{ validator: validatePositiveNumber }]}>
                  <InputNumber
                    min={0}
                    max={100}
                    placeholder="Enter days"
                    className="w-full"
                    addonAfter="days"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="text-sm text-gray-600">
              <strong>Total Available Leave:</strong>{" "}
              <span className="font-bold text-green-600">
                {(form.getFieldValue("annualLeaveBalance") || 0) +
                  (form.getFieldValue("sickLeaveBalance") || 0) +
                  (form.getFieldValue("maternityLeaveBalance") || 0) +
                  (form.getFieldValue("paternityLeaveBalance") || 0) +
                  (form.getFieldValue("compassionateLeaveBalance") || 0) +
                  (form.getFieldValue("carryOverDays") || 0)}{" "}
                days
              </span>
            </div>
          </div>

          <Form.Item className="mb-0">
            <div className="flex gap-3 justify-end">
              <Button onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<PlusOutlined />}
                className="blue-btn">
                Create Leave Balance
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CreateLeaveBalanceForm;
