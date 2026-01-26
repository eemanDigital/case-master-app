// pages/AddUserForm.jsx - COMPLETE FIX
import React, { useState, useCallback, useMemo } from "react";
import { Form, Button, Card, Steps, Alert, Space, Tag } from "antd";
import { UserOutlined, TeamOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { register, sendVerificationMail } from "../redux/features/auth/authSlice";
import { userTypeOptions } from "../data/options";
import { formatPhoneNumber } from "../utils/validation";
import { prepareUserData } from "../utils/userDataHelper";

// Step Components
import UserTypeStep from "../components/user-forms/steps/UserTypeStep";
import BasicInfoStep from "../components/user-forms/steps/BasicInfoStep";
import AccountStep from "../components/user-forms/steps/AccountStep";
import ProfessionalStep from "../components/user-forms/steps/ProfessionalStep";
import PrivilegesStep from "../components/user-forms/steps/PrivilegesStep";

const { Step } = Steps;

const STEP_CONFIG = [
  { key: "userType", title: "User Type", icon: <UserOutlined /> },
  { key: "basic", title: "Basic Info", icon: <UserOutlined /> },
  { key: "account", title: "Account", icon: <UserOutlined /> },
  { key: "professional", title: "Professional", icon: <UserOutlined /> },
  { key: "privileges", title: "Privileges", icon: <UserOutlined /> },
];

const AddUserForm = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedUserType, setSelectedUserType] = useState("staff");

  // Step field validation map
  const STEP_FIELDS = useMemo(
    () => ({
      0: ["userType"],
      1: ["firstName", "lastName", "email", "phone", "address", "gender"],
      2: ["password", "passwordConfirm"],
      3: [], // Professional step - conditional fields
      4: [], // Privileges step - optional
    }),
    []
  );

  // ✅ Handle form submission - Get ALL form values
  const handleSubmit = useCallback(
    async (values) => {
      try {
        // ✅ CRITICAL: Get ALL form values, not just current step
        const allFormValues = form.getFieldsValue(true);
        
        console.log("🔍 All Form Values:", allFormValues); // Debug log

        if (allFormValues.phone) {
          allFormValues.phone = formatPhoneNumber(allFormValues.phone);
        }

        const userData = prepareUserData(allFormValues);
        
        console.log("📦 Prepared User Data:", userData); // Debug log

        const result = await dispatch(register(userData));

        if (result.error) {
          console.error("❌ Registration Error:", result.error);
          return;
        }

        await dispatch(sendVerificationMail(allFormValues.email));

        // Only reset form on success
        form.resetFields();

        navigate("/dashboard/staff", {
          state: {
            message: `Successfully added ${allFormValues.userType}: ${allFormValues.firstName} ${allFormValues.lastName}`,
            userType: allFormValues.userType,
          },
        });
      } catch (err) {
        console.error("Registration failed:", err);
      }
    },
    [dispatch, navigate, form]
  );

  // Navigation handlers
  const handleNext = useCallback(() => {
    const stepFields = STEP_FIELDS[currentStep];

    if (stepFields && stepFields.length > 0) {
      form
        .validateFields(stepFields)
        .then(() => {
          setCurrentStep((prev) => prev + 1);
        })
        .catch((errorInfo) => {
          console.log("Validation errors:", errorInfo);
        });
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, form, STEP_FIELDS]);

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleUserTypeSelect = useCallback(
    (userType) => {
      setSelectedUserType(userType);
      form.setFieldsValue({ userType });
    },
    [form]
  );

  // Render current step content
  const renderStepContent = useMemo(() => {
    switch (currentStep) {
      case 0:
        return (
          <UserTypeStep
            userTypeOptions={userTypeOptions}
            selectedUserType={selectedUserType}
            onSelect={handleUserTypeSelect}
          />
        );
      case 1:
        return <BasicInfoStep />;
      case 2:
        return <AccountStep />;
      case 3:
        return <ProfessionalStep selectedUserType={selectedUserType} />;
      case 4:
        return <PrivilegesStep selectedUserType={selectedUserType} />;
      default:
        return null;
    }
  }, [currentStep, selectedUserType, handleUserTypeSelect]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Card>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">
            <TeamOutlined className="mr-3" />
            Add New User
          </h2>
          <p className="text-gray-500">
            Register a new user with appropriate role and permissions
          </p>
        </div>

        {error && (
          <Alert
            message="Registration Error"
            description={error}
            type="error"
            showIcon
            closable
            className="mb-6"
          />
        )}

        <Steps current={currentStep} className="mb-8">
          {STEP_CONFIG.map((step) => (
            <Step key={step.key} title={step.title} icon={step.icon} />
          ))}
        </Steps>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          initialValues={{
            userType: "staff",
            isActive: true,
            clientCategory: "individual",
            preferredContactMethod: "email",
            employmentType: "full-time",
            workSchedule: "9-5",
            role: "staff",
            hasAdminPrivileges: false,
            hasLawyerPrivileges: false,
            hasHrPrivileges: false,
            additionalRoles: [],
          }}
          preserve={true}
          scrollToFirstError
        >
          {/* ✅ Hidden fields to preserve userType selection */}
          <Form.Item name="userType" hidden>
            <input type="hidden" />
          </Form.Item>

          {renderStepContent}

          <div className="mt-8 pt-6 border-t">
            <Space className="w-full justify-between">
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                size="large"
              >
                Previous
              </Button>

              {currentStep < STEP_CONFIG.length - 1 ? (
                <Button type="primary" onClick={handleNext} size="large">
                  Next Step
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={isLoading}
                >
                  {isLoading
                    ? "Adding User..."
                    : `Add ${selectedUserType.charAt(0).toUpperCase() + selectedUserType.slice(1)}`}
                </Button>
              )}
            </Space>
          </div>
        </Form>

        <div className="mt-6 text-center">
          <Tag color="blue" icon={<UserOutlined />}>
            Currently Adding:{" "}
            <strong>
              {selectedUserType.charAt(0).toUpperCase() +
                selectedUserType.slice(1)}
            </strong>
          </Tag>
        </div>
      </Card>
    </div>
  );
};

export default AddUserForm;