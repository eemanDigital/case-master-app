import React from "react";
import {
  Form,
  Input,
  Select,
  Checkbox,
  Button,
  DatePicker,
  Typography,
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
            className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[
                  { required: true, message: "Please input your first name!" },
                ]}>
                <Input placeholder="First Name" />
              </Form.Item>

              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[
                  { required: true, message: "Please input your last name!" },
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
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}>
                <Input placeholder="Email" />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Please enter your password" },
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
                  { required: true, message: "Please confirm your password" },
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

              <Form.Item name="isLawyer" valuePropName="checked">
                <Checkbox>Is User A Lawyer</Checkbox>
              </Form.Item>

              <Form.Item name="yearOfCall" label="Year of Call">
                <DatePicker className="w-full" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Phone Contact"
                rules={[
                  {
                    required: true,
                    message: "Please input your phone number!",
                  },
                ]}>
                <Input placeholder="Phone Contact" />
              </Form.Item>

              <Form.Item
                name="address"
                label="Address"
                className="sm:col-span-2"
                rules={[
                  { required: true, message: "Please input your address!" },
                ]}>
                <Input placeholder="No.2, Maitama Close, Abuja" />
              </Form.Item>

              <Form.Item
                name="position"
                label="Position"
                rules={[
                  { required: true, message: "Please select your position!" },
                ]}>
                <Select options={positions} />
              </Form.Item>

              <Form.Item
                name="gender"
                label="Gender"
                rules={[
                  { required: true, message: "Please select your gender!" },
                ]}>
                <Select options={gender} />
              </Form.Item>

              <Form.Item
                name="role"
                label="Role"
                rules={[
                  { required: true, message: "Please select your role!" },
                ]}>
                <Select options={roles} />
              </Form.Item>

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
                      ]}>
                      <Input placeholder="Specify Position" />
                    </Form.Item>
                  ) : null
                }
              </Form.Item>

              <Form.Item name="practiceArea" label="Practice Area">
                <Input placeholder="e.g. Intellectual Property Law" />
              </Form.Item>

              <Form.Item name="universityAttended" label="University Attended">
                <Input placeholder="e.g. University of Ilorin" />
              </Form.Item>

              <Form.Item name="lawSchoolAttended" label="Law School Attended">
                <Input placeholder="e.g. Kano Law School" />
              </Form.Item>

              <Form.Item name="bio" label="Bio" className="sm:col-span-2">
                <TextArea rows={4} placeholder="Short bio about the staff" />
              </Form.Item>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full sm:w-auto  bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
                loading={isLoading}>
                {isLoading ? "Saving..." : "Add Staff"}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
