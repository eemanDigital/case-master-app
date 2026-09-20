import notify from "../utils/notify";
// components/UpdateUserPrivileges.jsx - NEW USER MODEL
// Sets the professional role and administrative level for a user.
import { useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Select,
  Alert,
  Card,
  Space,
  Tag,
} from "antd";
import {
  CrownOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import PropTypes from "prop-types";
import useModal from "../hooks/useModal";
import { useDataFetch } from "../hooks/useDataFetch";
import { getUsers } from "../redux/features/auth/authSlice";
import { roleOptions, adminLevelOptions } from "../data/options";

const UpdateUserPrivileges = ({ userId, userData }) => {
  const [form] = Form.useForm();
  const { open, showModal, handleCancel } = useModal();
  const dispatch = useDispatch();
  const { loading, dataFetcher } = useDataFetch();

  useEffect(() => {
    if (userData && open) {
      form.setFieldsValue({
        role: userData.role || userData.userType,
        adminLevel: userData.adminLevel || "none",
      });
    }
  }, [userData, form, open]);

  const handleSubmit = async (values) => {
    try {
      const updateData = {
        role: values.role,
        adminLevel: values.adminLevel,
      };

      const result = await dataFetcher(
        `users/upgradeUser/${userId}`,
        "patch",
        updateData
      );

      if (result && !result.error) {
        notify.success("User privileges updated successfully");
        dispatch(getUsers());
        handleCancel();
      } else {
        notify.error(result?.error || "Failed to update privileges");
      }
    } catch (err) {
      console.error("Update error:", err);
      notify.error("An error occurred while updating");
    }
  };

  return (
    <section>
      <Button
        onClick={showModal}
        className="bg-purple-500 hover:bg-purple-600 text-white border-0"
        icon={<CrownOutlined />}
      >
        Manage Privileges
      </Button>

      <Modal
        title={
          <Space>
            <CrownOutlined />
            <span>Manage User Privileges</span>
          </Space>
        }
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Alert
            message="User Information"
            description={
              <div className="mt-2">
                <p>
                  <strong>Name:</strong> {userData?.firstName}{" "}
                  {userData?.lastName}
                </p>
                <p>
                  <strong>User Type:</strong>{" "}
                  <Tag>{userData?.userType}</Tag>
                </p>
              </div>
            }
            type="info"
            showIcon
            className="mb-6"
          />

          <Card className="mb-4 bg-purple-50 border-purple-200">
            <Form.Item
              label="Professional Role"
              name="role"
              rules={[{ required: true, message: "Please select a role" }]}
              extra="Determines day-to-day functions (case handling, documents, court appearances, etc.)"
            >
              <Select
                size="large"
                options={roleOptions.filter((r) => r.value !== "client")}
                placeholder="Select role"
                suffixIcon={<IdcardOutlined />}
              />
            </Form.Item>
          </Card>

          <Card className="mb-4 bg-orange-50 border-orange-200">
            <Form.Item
              label="Administrative Level"
              name="adminLevel"
              rules={[
                { required: true, message: "Please select an admin level" },
              ]}
              extra="Administrators can manage users, settings, and reports. Super administrators additionally manage firm-wide configuration."
            >
              <Select
                size="large"
                options={adminLevelOptions}
                placeholder="Select admin level"
                suffixIcon={<SafetyCertificateOutlined />}
              />
            </Form.Item>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={handleCancel} size="large">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              className="bg-blue-600"
            >
              {loading ? "Saving..." : "Update Privileges"}
            </Button>
          </div>
        </Form>
      </Modal>
    </section>
  );
};

UpdateUserPrivileges.propTypes = {
  userId: PropTypes.string.isRequired,
  userData: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    userType: PropTypes.string,
    role: PropTypes.string,
    adminLevel: PropTypes.string,
  }).isRequired,
};

export default UpdateUserPrivileges;