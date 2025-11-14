import React from "react";
import {
  Form,
  Input,
  Select,
  Checkbox,
  Button,
  DatePicker,
  Typography,
  Alert,
} from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import {
  register,
  sendVerificationMail,
} from "../redux/features/auth/authSlice";
import { gender, positions, roles } from "../data/options";

const { Title } = Typography;
const { TextArea } = Input;

const SignUp = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);

  const onFinish = async (values) => {
    await dispatch(register(values));
    await dispatch(sendVerificationMail(values.email));
    navigate("/dashboard/staff");
  };

  // Custom validator for year of call (should be in the past)
  const validateYearOfCall = (_, value) => {
    if (!value) return Promise.resolve();

    const selectedYear = value.year();
    const currentYear = new Date().getFullYear();

    if (selectedYear > currentYear) {
      return Promise.reject(new Error("Year of call cannot be in the future"));
    }

    if (selectedYear < 1900) {
      return Promise.reject(new Error("Please enter a valid year"));
    }

    return Promise.resolve();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 px-4 sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-10 md:p-20">
          <Title level={2} className="text-center mb-8 text-gray-800">
            Add Staff
          </Title>

          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            layout="vertical"
            className="space-y-6"
            scrollToFirstError>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Personal Information */}
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[
                  {
                    required: true,
                    message: "Please input your first name!",
                  },
                  {
                    min: 2,
                    message: "First name must be at least 2 characters",
                  },
                ]}>
                <Input placeholder="First Name" />
              </Form.Item>

              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[
                  {
                    required: true,
                    message: "Please input your last name!",
                  },
                  {
                    min: 2,
                    message: "Last name must be at least 2 characters",
                  },
                ]}>
                <Input placeholder="Last Name" />
              </Form.Item>

              <Form.Item name="middleName" label="Middle Name">
                <Input placeholder="Middle Name" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  {
                    required: true,
                    message: "Please input your email!",
                  },
                  {
                    type: "email",
                    message: "Please enter a valid email!",
                  },
                ]}>
                <Input placeholder="Email" />
              </Form.Item>

              {/* Password Fields */}
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  {
                    required: true,
                    message: "Please enter your password",
                  },
                  {
                    pattern:
                      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                    message:
                      "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
                  },
                ]}>
                <Input.Password
                  placeholder="Password"
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              <Form.Item
                name="passwordConfirm"
                label="Confirm Password"
                dependencies={["password"]}
                rules={[
                  {
                    required: true,
                    message: "Please confirm your password",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error("The two passwords do not match!")
                      );
                    },
                  }),
                ]}>
                <Input.Password
                  placeholder="Confirm Password"
                  iconRender={(visible) =>
                    visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                  }
                />
              </Form.Item>

              {/* Lawyer Checkbox */}
              <Form.Item
                name="isLawyer"
                valuePropName="checked"
                className="sm:col-span-2">
                <Checkbox>Is User A Lawyer</Checkbox>
              </Form.Item>

              {/* Lawyer-Specific Fields - Conditionally Required */}
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.isLawyer !== currentValues.isLawyer
                }>
                {({ getFieldValue }) =>
                  getFieldValue("isLawyer") && (
                    <Alert
                      message="Lawyer Information Required"
                      description="Please fill in all lawyer-specific fields below"
                      type="info"
                      showIcon
                      className="mb-4 sm:col-span-2"
                    />
                  )
                }
              </Form.Item>

              <Form.Item
                name="yearOfCall"
                label="Year of Call to Bar"
                rules={[
                  ({ getFieldValue }) => ({
                    required: getFieldValue("isLawyer"),
                    message: "Year of call is required for lawyers",
                  }),
                  {
                    validator: validateYearOfCall,
                  },
                ]}>
                <DatePicker
                  className="w-full"
                  picker="year"
                  placeholder="Select year of call"
                />
              </Form.Item>

              <Form.Item
                name="practiceArea"
                label="Practice Area"
                rules={[
                  ({ getFieldValue }) => ({
                    required: getFieldValue("isLawyer"),
                    message: "Practice area is required for lawyers",
                  }),
                  {
                    min: 3,
                    message: "Practice area must be at least 3 characters",
                  },
                ]}>
                <Input placeholder="e.g. Intellectual Property Law, Corporate Law, etc." />
              </Form.Item>

              <Form.Item
                name="universityAttended"
                label="University Attended"
                rules={[
                  ({ getFieldValue }) => ({
                    required: getFieldValue("isLawyer"),
                    message: "University attended is required for lawyers",
                  }),
                  {
                    min: 3,
                    message: "Please enter a valid university name",
                  },
                ]}>
                <Input placeholder="e.g. University of Ilorin, University of Lagos, etc." />
              </Form.Item>

              <Form.Item
                name="lawSchoolAttended"
                label="Law School Attended"
                rules={[
                  ({ getFieldValue }) => ({
                    required: getFieldValue("isLawyer"),
                    message: "Law school attended is required for lawyers",
                  }),
                  {
                    min: 3,
                    message: "Please enter a valid law school name",
                  },
                ]}>
                <Input placeholder="e.g. Nigerian Law School, Abuja, Kano Law School, etc." />
              </Form.Item>

              {/* Contact Information */}
              <Form.Item
                name="phone"
                label="Phone Contact"
                rules={[
                  {
                    required: true,
                    message: "Please input your phone number!",
                  },
                  {
                    pattern: /^[+]?[\d\s\-()]+$/,
                    message: "Please enter a valid phone number",
                  },
                  {
                    min: 10,
                    message: "Phone number must be at least 10 digits",
                  },
                ]}>
                <Input placeholder="Phone Contact" />
              </Form.Item>

              <Form.Item
                name="address"
                label="Address"
                className="sm:col-span-2"
                rules={[
                  {
                    required: true,
                    message: "Please input your address!",
                  },
                  {
                    min: 10,
                    message: "Address must be at least 10 characters",
                  },
                ]}>
                <Input placeholder="No.2, Maitama Close, Abuja" />
              </Form.Item>

              {/* Professional Information */}
              <Form.Item
                name="position"
                label="Position"
                rules={[
                  {
                    required: true,
                    message: "Please select your position!",
                  },
                ]}>
                <Select options={positions} placeholder="Select position" />
              </Form.Item>

              <Form.Item
                name="gender"
                label="Gender"
                rules={[
                  {
                    required: true,
                    message: "Please select your gender!",
                  },
                ]}>
                <Select options={gender} placeholder="Select gender" />
              </Form.Item>

              <Form.Item
                name="role"
                label="Role"
                rules={[
                  {
                    required: true,
                    message: "Please select your role!",
                  },
                ]}>
                <Select options={roles} placeholder="Select role" />
              </Form.Item>

              {/* Conditional Other Position Field */}
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) =>
                  prevValues.position !== currentValues.position
                }>
                {({ getFieldValue }) =>
                  getFieldValue("position") === "Other" ? (
                    <Form.Item
                      name="otherPosition"
                      label="Specify Other Position"
                      rules={[
                        {
                          required: true,
                          message: "Please specify the other position!",
                        },
                        {
                          min: 2,
                          message: "Position must be at least 2 characters",
                        },
                      ]}>
                      <Input placeholder="Specify Position" />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              {/* Additional Fields */}
              <Form.Item
                name="annualLeaveEntitled"
                label="Annual Leave Entitled (Days)">
                <Input type="number" min="0" max="365" placeholder="e.g. 21" />
              </Form.Item>

              <Form.Item
                name="bio"
                label="Bio"
                className="sm:col-span-2"
                rules={[
                  {
                    max: 500,
                    message: "Bio must not exceed 500 characters",
                  },
                ]}>
                <TextArea
                  rows={4}
                  placeholder="Short bio about the staff"
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </div>

            <Form.Item className="text-center">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                className="w-full sm:w-64 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                loading={isLoading}>
                {isLoading ? "Adding Staff..." : "Add Staff"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
