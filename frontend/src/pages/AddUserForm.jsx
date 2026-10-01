// pages/AddUserForm.jsx - COMPLETE FIX
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Form, Button, Card, Steps, Alert, Space, Tag } from "antd";
import { UserOutlined, TeamOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
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

// Fields that only make sense for one user type. Switching type clears the
// other type's values so nothing stale is submitted.
const CLIENT_ONLY_FIELDS = [
  "clientCategory",
  "company",
  "industry",
  "taxId",
  "clientSince",
  "preferredContactMethod",
  "billingAddress",
  "referralSource",
  "clientNotes",
];

const STAFF_ONLY_FIELDS = [
  "position",
  "department",
  "designation",
  "employmentType",
  "workSchedule",
  "skills",
  "barNumber",
  "barAssociation",
  "yearOfCall",
  "practiceAreas",
  "hourlyRate",
  "specialization",
  "lawSchoolAttended",
  "lawSchoolGraduationYear",
  "lawSchoolDegree",
  "universityAttended",
  "universityGraduationYear",
  "universityDegree",
  "isPartner",
  "partnershipPercentage",
  "bio",
];

// Client accounts have no professional role or admin authority to grant, so
// those two steps are retitled and the last step is skipped for them.
const CLIENT_STEP_TITLES = {
  userType: "User Type",
  basic: "Contact Info",
  account: "Account",
  professional: "Client Details",
  privileges: "Review",
};

const AddUserForm = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, error } = useSelector((state) => state.auth);

  // The User Management page preselects the type when linking here (adding a
  // client sends { userType: "client" }), so the wizard opens on the right path.
  const presetUserType =
    location.state?.userType === "client" ? "client" : "staff";

  const [currentStep, setCurrentStep] = useState(
    presetUserType === "client" ? 1 : 0
  );
  const [selectedUserType, setSelectedUserType] = useState(presetUserType);

  // Apply the preset once the form instance exists.
  useEffect(() => {
    form.setFieldsValue({
      userType: presetUserType,
      role: presetUserType === "client" ? "client" : undefined,
      adminLevel: "none",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step field validation map. Step 1 and step 3 differ per user type: clients
  // have no `position`, no required surname/address and no gender requirement.
  const STEP_FIELDS = useMemo(
    () => ({
      0: ["userType"],
      1:
        selectedUserType === "client"
          ? ["firstName", "email", "phone"]
          : ["firstName", "lastName", "email", "phone", "address", "gender"],
      2: ["password", "passwordConfirm"],
      3:
        selectedUserType === "client"
          ? ["clientCategory"]
          : ["role", "position"],
      4: ["role", "adminLevel"],
    }),
    [selectedUserType]
  );

  // Handle form submission - collect ALL steps, not just the visible one.
  const handleSubmit = useCallback(
    async () => {
      try {
        const allFormValues = form.getFieldsValue(true);

        if (allFormValues.phone) {
          allFormValues.phone = formatPhoneNumber(allFormValues.phone);
        }

        const userData = prepareUserData(allFormValues);
        const result = await dispatch(register(userData));

        if (result.error) {
          return;
        }

        await dispatch(sendVerificationMail(allFormValues.email));

        // Only reset form on success
        form.resetFields();

        const isClient = allFormValues.userType === "client";
        const name =
          allFormValues.company ||
          [allFormValues.firstName, allFormValues.lastName]
            .filter(Boolean)
            .join(" ") ||
          "client";

        navigate(isClient ? "/dashboard/clients" : "/dashboard/staff", {
          state: {
            message: `${name} has been added as a ${
              isClient
                ? allFormValues.clientCategory || "individual"
                : "staff"
            } ${isClient ? "client" : "member"}.`,
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
  const handleNext = useCallback(
    (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const stepFields = STEP_FIELDS[currentStep];

      if (stepFields && stepFields.length > 0) {
        form
          .validateFields(stepFields)
          .then(() => {
            setCurrentStep((prev) => prev + 1);
          })
          .catch(({ errorFields }) => {
            // Surface the first problem so the user knows why it blocked.
            console.warn("Step validation failed:", errorFields);
          });
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    },
    [currentStep, form, STEP_FIELDS]
  );

  const handlePrevious = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleUserTypeSelect = useCallback(
    (userType) => {
      setSelectedUserType(userType);
      if (userType === "client") {
        form.resetFields(STAFF_ONLY_FIELDS);
        form.setFieldsValue({
          userType,
          role: "client",
          adminLevel: "none",
          clientCategory: "individual",
        });
      } else {
        form.resetFields(["role", ...CLIENT_ONLY_FIELDS]);
        form.setFieldsValue({ userType, adminLevel: "none" });
      }
    },
    [form]
  );

  const isClient = selectedUserType === "client";

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
        return <BasicInfoStep selectedUserType={selectedUserType} />;
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
            {isClient ? (
              <UserOutlined className="mr-3" />
            ) : (
              <TeamOutlined className="mr-3" />
            )}
            {isClient ? "Add New Client" : "Add New User"}
          </h2>
          <p className="text-gray-500">
            {isClient
              ? "Register a client account — an individual or an organisation"
              : "Register a new user with appropriate role and permissions"}
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
            <Step
              key={step.key}
              title={
                isClient
                  ? CLIENT_STEP_TITLES[step.key]
                  : step.title
              }
              icon={step.icon}
            />
          ))}
        </Steps>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          initialValues={{
            userType: presetUserType,
            isActive: true,
            clientCategory: "individual",
            preferredContactMethod: "email",
            adminLevel: "none",
          }}
          preserve
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
                onClick={(e) => { e.preventDefault(); handlePrevious(); }}
                disabled={currentStep === 0}
                size="large"
              >
                Previous
              </Button>

              {currentStep < STEP_CONFIG.length - 1 ? (
                <Button
                  type="primary"
                  htmlType="button"
                  onClick={(e) => handleNext(e)}
                  onMouseDown={(e) => e.preventDefault()}
                  size="large"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={isLoading}
                  icon={isClient ? <UserOutlined /> : <TeamOutlined />}
                >
                  {isLoading
                    ? "Creating Account..."
                    : isClient
                      ? "Create Client Account"
                      : "Add Staff Member"}
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
        <p className="mt-2 text-center text-xs text-gray-400">
          A verification email is sent to the new account once it is created.
        </p>
      </Card>
    </div>
  );
};

export default AddUserForm;