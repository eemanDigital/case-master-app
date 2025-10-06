import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Button,
  Form,
  Select,
  Spin,
  Tag,
  Avatar,
  List,
  Card,
} from "antd";
import {
  UserAddOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  UserPlusIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import useUserSelectOptions from "../hooks/useUserSelectOptions";
import useHandleSubmit from "../hooks/useHandleSubmit";

const baseURL = import.meta.env.VITE_BASE_URL;

const LawyersInCourtForm = ({ reportId, onSuccess }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [currentLawyers, setCurrentLawyers] = useState([]);
  const { userData } = useUserSelectOptions();
  const {
    form,
    onSubmit,
    loading: isSaving,
  } = useHandleSubmit(
    `reports/${reportId}`,
    "patch",
    "reports",
    "reports",
    undefined,
    undefined
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get(`${baseURL}/reports/${reportId}`);
        const reportData = response?.data?.data;
        setFormData(reportData);
        setCurrentLawyers(reportData?.lawyersInCourt || []);

        // Set form values with lawyer IDs
        form.setFieldsValue({
          lawyersInCourt:
            reportData?.lawyersInCourt?.map((lawyer) => lawyer._id) || [],
        });
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [reportId, form]);

  const showModal = () => setVisible(true);
  const handleCancel = () => {
    setVisible(false);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    const success = await onSubmit(values);
    if (success) {
      handleCancel();
      onSuccess?.(); // Optional callback for parent component
    }
  };

  // Debug: Log the userData to see the actual structure
  console.log("User Data:", userData);

  // Format user options for the Select component
  const formatUserOptions = (users) => {
    if (!users || !Array.isArray(users)) return [];

    return users.map((user) => {
      // Handle both formats: {value, label} and {_id, firstName, lastName}
      const value = user.value || user._id;
      const label = user.label || `${user.firstName} ${user.lastName}`;
      const firstName = user.firstName || label.split(" ")[0];
      const lastName = user.lastName || label.split(" ")[1] || "";

      return {
        label: (
          <div className="flex items-center gap-2 py-1">
            <Avatar size="small" className="bg-blue-500 text-white">
              {firstName?.[0]}
              {lastName?.[0]}
            </Avatar>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {firstName} {lastName}
              </div>
              <div className="text-xs text-gray-500">
                {user.role || "Lawyer"} • {user.email || ""}
              </div>
            </div>
          </div>
        ),
        value: value,
      };
    });
  };

  // Get the actual options for the Select component
  const lawyerOptions = formatUserOptions(userData);

  return (
    <div className="w-full">
      <Button
        type="primary"
        icon={<UserAddOutlined />}
        onClick={showModal}
        className="bg-blue-600 hover:bg-blue-700 border-0 shadow-sm flex items-center gap-2"
        size="small">
        Assign Lawyers
      </Button>

      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <UserPlusIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                Assign Legal Team
              </div>
              <div className="text-sm text-gray-500">
                Select lawyers for court representation
              </div>
            </div>
          </div>
        }
        open={visible}
        onCancel={handleCancel}
        footer={null}
        centered
        width={600}
        className="rounded-2xl [&_.ant-modal-content]:rounded-2xl [&_.ant-modal-header]:rounded-t-2xl"
        closeIcon={<XMarkIcon className="w-5 h-5 text-gray-400" />}>
        <Spin spinning={loading} size="large">
          <div className="space-y-6">
            {/* Current Assignment Preview */}
            {currentLawyers.length > 0 && (
              <Card className="border-0 bg-blue-50/50 shadow-sm" size="small">
                <div className="flex items-center gap-2 mb-3">
                  <TeamOutlined className="text-blue-600" />
                  <span className="font-medium text-gray-900">
                    Currently Assigned
                  </span>
                  <Tag color="blue" className="ml-auto">
                    {currentLawyers.length} lawyer
                    {currentLawyers.length !== 1 ? "s" : ""}
                  </Tag>
                </div>
                <div className="space-y-2">
                  {currentLawyers.map((lawyer, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm">
                      <Avatar
                        size="small"
                        className="bg-green-500 text-white text-xs">
                        {lawyer.firstName?.[0]}
                        {lawyer.lastName?.[0]}
                      </Avatar>
                      <span className="text-gray-700">
                        {lawyer.firstName} {lawyer.lastName}
                      </span>
                      <Tag color="green" className="ml-auto text-xs">
                        Assigned
                      </Tag>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Assignment Form */}
            <Form
              layout="vertical"
              form={form}
              name="assignLawyerForm"
              onFinish={handleSubmit}
              className="w-full">
              <Form.Item
                name="lawyersInCourt"
                label={
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4 text-gray-600" />
                    <span className="font-medium text-gray-900">
                      Legal Team
                    </span>
                  </div>
                }
                rules={[
                  {
                    required: true,
                    message:
                      "Please select at least one lawyer for court representation",
                  },
                ]}
                help="Select all lawyers who will be present in court for this case">
                <Select
                  mode="multiple"
                  placeholder={
                    <div className="flex items-center gap-2 text-gray-400">
                      <UserPlusIcon className="w-4 h-4" />
                      Select lawyers...
                    </div>
                  }
                  options={lawyerOptions}
                  allowClear
                  className="w-full"
                  size="large"
                  optionFilterProp="label"
                  showSearch
                  filterOption={(input, option) => {
                    const labelText =
                      option.label.props.children[1].props.children[0].props
                        .children;
                    return labelText
                      .toLowerCase()
                      .includes(input.toLowerCase());
                  }}
                  suffixIcon={
                    <UserGroupIcon className="w-4 h-4 text-gray-400" />
                  }
                  // Ensure proper value handling
                  getPopupContainer={(trigger) => trigger.parentNode}
                />
              </Form.Item>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleCancel}
                  className="flex-1 border-gray-300 text-gray-700 hover:text-gray-900"
                  size="large"
                  icon={<CloseOutlined />}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSaving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 border-0 shadow-sm"
                  size="large"
                  icon={<CheckBadgeIcon className="w-4 h-4" />}>
                  {isSaving ? "Assigning..." : "Assign Team"}
                </Button>
              </div>
            </Form>

            {/* Help Text */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TeamOutlined className="w-3 h-3 text-blue-600" />
                </div>
                <div className="text-xs text-gray-600">
                  <strong>Note:</strong> Selected lawyers will be recorded as
                  the legal representatives for this court session. You can
                  update this assignment at any time.
                </div>
              </div>
            </div>
          </div>
        </Spin>
      </Modal>
    </div>
  );
};

LawyersInCourtForm.propTypes = {
  reportId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
};

export default LawyersInCourtForm;
