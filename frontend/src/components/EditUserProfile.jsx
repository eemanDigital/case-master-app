// components/EditUserProfile.jsx - COMPLETE REFACTOR
import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Alert,
  Space,
  Divider,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  BankOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import PropTypes from "prop-types";
import useModal from "../hooks/useModal";
import { useDataFetch } from "../hooks/useDataFetch";
import { getUser } from "../redux/features/auth/authSlice";

const { TextArea } = Input;

const EditUserProfile = ({ userData }) => {
  const [form] = Form.useForm();
  const { open, showModal, handleCancel } = useModal();
  const { data, loading, error, dataFetcher } = useDataFetch();
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUserData = userData || user?.data || user;
  const isLawyer = currentUserData?.isLawyer || currentUserData?.userType === "lawyer";
  const isClient = currentUserData?.userType === "client";
  const isStaff = currentUserData?.userType === "staff";

  // Populate form when modal opens
  useEffect(() => {
    if (currentUserData && open) {
      const formData = {
        firstName: currentUserData.firstName,
        lastName: currentUserData.lastName,
        middleName: currentUserData.middleName,
        email: currentUserData.email,
        phone: currentUserData.phone,
        address: currentUserData.address,
        gender: currentUserData.gender,
        bio: currentUserData.bio || currentUserData.professionalInfo?.bio,
        dateOfBirth: currentUserData.dateOfBirth
          ? dayjs(currentUserData.dateOfBirth)
          : null,
      };

      // Add lawyer-specific fields
      if (isLawyer && currentUserData.lawyerDetails) {
        formData.yearOfCall = currentUserData.lawyerDetails.yearOfCall
          ? dayjs(currentUserData.lawyerDetails.yearOfCall)
          : null;
        formData.barNumber = currentUserData.lawyerDetails.barNumber;
        formData.practiceAreas = currentUserData.lawyerDetails.practiceAreas;
        formData.specialization = currentUserData.lawyerDetails.specialization;
        formData.lawSchoolAttended =
          currentUserData.lawyerDetails.lawSchool?.name;
        formData.universityAttended =
          currentUserData.lawyerDetails.undergraduateSchool?.name;
      }

      // Add staff-specific fields
      if (isStaff && currentUserData.staffDetails) {
        formData.department = currentUserData.staffDetails.department;
        formData.designation = currentUserData.staffDetails.designation;
        formData.skills = currentUserData.staffDetails.skills?.join(", ");
      }

      // Add client-specific fields
      if (isClient && currentUserData.clientDetails) {
        formData.company = currentUserData.clientDetails.company;
        formData.industry = currentUserData.clientDetails.industry;
        formData.clientCategory = currentUserData.clientDetails.clientCategory;
      }

      form.setFieldsValue(formData);
    }
  }, [currentUserData, form, open, isLawyer, isStaff, isClient]);

  const handleSubmit = async (values) => {
    try {
      const updateData = {
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth
          ? values.dateOfBirth.format("YYYY-MM-DD")
          : null,
      };

      // Handle lawyer details
      if (isLawyer) {
        updateData.lawyerDetails = {
          ...currentUserData.lawyerDetails,
          barNumber: values.barNumber,
          yearOfCall: values.yearOfCall
            ? values.yearOfCall.format("YYYY-MM-DD")
            : null,
          practiceAreas: values.practiceAreas,
          specialization: values.specialization,
          lawSchool: {
            name: values.lawSchoolAttended,
          },
          undergraduateSchool: {
            name: values.universityAttended,
          },
        };
        updateData.professionalInfo = {
          bio: values.bio,
        };
      } else {
        updateData.bio = values.bio;
      }

      // Handle staff details
      if (isStaff) {
        updateData.staffDetails = {
          ...currentUserData.staffDetails,
          department: values.department,
          designation: values.designation,
          skills: values.skills
            ? values.skills.split(",").map((s) => s.trim())
            : [],
        };
      }

      // Handle client details
      if (isClient) {
        updateData.clientDetails = {
          ...currentUserData.clientDetails,
          company: values.company,
          industry: values.industry,
          clientCategory: values.clientCategory,
        };
      }

      await dataFetcher("users/updateUser", "patch", updateData);
      await dispatch(getUser());
    } catch (err) {
      console.error("Profile update error:", err);
    }
  };

  // Success handling
  useEffect(() => {
    if (data) {
      toast.success("Profile updated successfully");
      handleCancel();
      navigate(0);
    }
  }, [data, handleCancel, navigate]);

  // Error handling
  useEffect(() => {
    if (error) {
      toast.error(error || "Failed to update profile");
    }
  }, [error]);

  return (
    <section className="w-full">
      <Button
        onClick={showModal}
        icon={<EditOutlined />}
        type="primary"
        size="large"
        block
        className="bg-blue-600 hover:bg-blue-700"
      >
        Edit Profile
      </Button>

      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>Edit Profile</span>
          </Space>
        }
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={window.innerWidth < 768 ? "95%" : 800}
        className="mobile-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          preserve={true}
          scrollToFirstError
        >
          {/* Personal Information */}
          <Alert
            message="Personal Information"
            type="info"
            showIcon
            className="mb-4"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[
                { required: true, message: "Please enter first name" },
                { min: 2, message: "Minimum 2 characters" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="First Name"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ min: 2, message: "Minimum 2 characters" }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Last Name"
                size="large"
              />
            </Form.Item>

            <Form.Item label="Middle Name" name="middleName">
              <Input placeholder="Middle Name" size="large" />
            </Form.Item>

            <Form.Item
              label="Gender"
              name="gender"
              rules={[{ required: true, message: "Please select gender" }]}
            >
              <Select
                size="large"
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                  { value: "other", label: "Other" },
                  { value: "prefer-not-to-say", label: "Prefer not to say" },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="Date of Birth"
              name="dateOfBirth"
              className="col-span-1 sm:col-span-2"
            >
              <DatePicker
                className="w-full"
                size="large"
                format="DD/MM/YYYY"
                placeholder="Select date of birth"
              />
            </Form.Item>
          </div>

          <Divider />

          {/* Contact Information */}
          <Alert
            message="Contact Information"
            type="info"
            showIcon
            className="mb-4"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Invalid email" },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Email"
                size="large"
                disabled
              />
            </Form.Item>

            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                { required: true, message: "Please enter phone" },
                {
                  pattern: /^[+]?[\d\s\-()]+$/,
                  message: "Invalid phone number",
                },
              ]}
            >
              <Input placeholder="Phone" size="large" />
            </Form.Item>

            <Form.Item
              label="Address"
              name="address"
              className="col-span-1 sm:col-span-2"
              rules={[
                { required: true, message: "Please enter address" },
                { min: 10, message: "Address should be detailed" },
              ]}
            >
              <TextArea
                placeholder="Full Address"
                rows={3}
                size="large"
              />
            </Form.Item>
          </div>

          {/* Lawyer-Specific Fields */}
          {isLawyer && (
            <>
              <Divider />
              <Alert
                message="Legal Credentials"
                icon={<SafetyCertificateOutlined />}
                type="info"
                showIcon
                className="mb-4"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Form.Item label="Bar Number" name="barNumber">
                  <Input placeholder="Bar Number" size="large" />
                </Form.Item>

                <Form.Item label="Year of Call" name="yearOfCall">
                  <DatePicker
                    className="w-full"
                    size="large"
                    picker="year"
                    placeholder="Year of Call"
                  />
                </Form.Item>

                <Form.Item
                  label="Practice Areas"
                  name="practiceAreas"
                  className="col-span-1 sm:col-span-2"
                >
                  <Select
                    mode="multiple"
                    size="large"
                    placeholder="Select practice areas"
                    options={[
                      { value: "corporate", label: "Corporate" },
                      { value: "criminal", label: "Criminal" },
                      { value: "family", label: "Family" },
                      { value: "real-estate", label: "Real Estate" },
                      { value: "intellectual-property", label: "IP" },
                      { value: "tax", label: "Tax" },
                      { value: "labor", label: "Labor" },
                    ]}
                  />
                </Form.Item>

                <Form.Item
                  label="Specialization"
                  name="specialization"
                  className="col-span-1 sm:col-span-2"
                >
                  <Input placeholder="e.g., Corporate M&A" size="large" />
                </Form.Item>

                <Form.Item label="University" name="universityAttended">
                  <Input placeholder="University Attended" size="large" />
                </Form.Item>

                <Form.Item label="Law School" name="lawSchoolAttended">
                  <Input placeholder="Law School Attended" size="large" />
                </Form.Item>
              </div>
            </>
          )}

          {/* Staff-Specific Fields */}
          {isStaff && (
            <>
              <Divider />
              <Alert
                message="Employment Details"
                icon={<TeamOutlined />}
                type="info"
                showIcon
                className="mb-4"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Form.Item label="Department" name="department">
                  <Select
                    size="large"
                    options={[
                      { value: "hr", label: "HR" },
                      { value: "finance", label: "Finance" },
                      { value: "it", label: "IT" },
                      { value: "administration", label: "Administration" },
                      { value: "support", label: "Support" },
                    ]}
                  />
                </Form.Item>

                <Form.Item label="Designation" name="designation">
                  <Input placeholder="Job Designation" size="large" />
                </Form.Item>

                <Form.Item
                  label="Skills (comma separated)"
                  name="skills"
                  className="col-span-1 sm:col-span-2"
                >
                  <Input
                    placeholder="e.g., Microsoft Office, Communication"
                    size="large"
                  />
                </Form.Item>
              </div>
            </>
          )}

          {/* Client-Specific Fields */}
          {isClient && (
            <>
              <Divider />
              <Alert
                message="Business Information"
                icon={<BankOutlined />}
                type="info"
                showIcon
                className="mb-4"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Form.Item label="Company" name="company">
                  <Input placeholder="Company Name" size="large" />
                </Form.Item>

                <Form.Item label="Industry" name="industry">
                  <Input placeholder="Industry" size="large" />
                </Form.Item>

                <Form.Item label="Client Category" name="clientCategory">
                  <Select
                    size="large"
                    options={[
                      { value: "individual", label: "Individual" },
                      { value: "corporate", label: "Corporate" },
                      { value: "government", label: "Government" },
                      { value: "ngo", label: "NGO" },
                    ]}
                  />
                </Form.Item>
              </div>
            </>
          )}

          {/* Bio */}
          <Divider />
          <Form.Item
            label="Professional Bio"
            name="bio"
            rules={[{ max: 2000, message: "Maximum 2000 characters" }]}
          >
            <TextArea
              rows={4}
              placeholder="Brief professional background..."
              showCount
              maxLength={2000}
              size="large"
            />
          </Form.Item>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button onClick={handleCancel} size="large" block className="sm:w-auto">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              className="sm:w-auto bg-blue-600"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Form>
      </Modal>
    </section>
  );
};


EditUserProfile.propTypes = {
  userData: PropTypes.object,
};

export default EditUserProfile;