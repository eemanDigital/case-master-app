// components/UpdateClientStatus.jsx - ENHANCED VERSION
import { useState, useEffect } from "react";
import { Modal, Button, Form, Checkbox, Alert, Space } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import PropTypes from "prop-types";
import useModal from "../hooks/useModal";
import { useDataFetch } from "../hooks/useDataFetch";
import { getUsers } from "../redux/features/auth/authSlice";

const UpdateClientStatus = ({ clientId, clientData }) => {
  const [form] = Form.useForm();
  const { open, showModal, handleCancel } = useModal();
  const dispatch = useDispatch();
  const { loading, dataFetcher } = useDataFetch();

  // Populate form when modal opens
  useEffect(() => {
    if (clientData && open) {
      form.setFieldsValue({
        isActive: clientData.isActive || false,
      });
    }
  }, [clientData, form, open]);

  const handleSubmit = async (values) => {
    try {
      const result = await dataFetcher(
        `users/upgradeUser/${clientId}`,
        "patch",
        { isActive: values.isActive }
      );

      if (result && !result.error) {
        toast.success(
          `Client account ${values.isActive ? "activated" : "deactivated"} successfully`
        );
        dispatch(getUsers());
        handleCancel();
      } else {
        toast.error(result?.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("An error occurred while updating");
    }
  };

  return (
    <section>
      <Button
        onClick={showModal}
        className="bg-orange-500 hover:bg-orange-600 text-white border-0"
        icon={<CheckCircleOutlined />}
      >
        Update Status
      </Button>

      <Modal
        title={
          <Space>
            <CheckCircleOutlined />
            <span>Update Client Status</span>
          </Space>
        }
        open={open}
        onCancel={handleCancel}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Current Status */}
          <Alert
            message="Current Status"
            description={
              <div className="flex items-center gap-2 mt-2">
                {clientData?.isActive ? (
                  <>
                    <CheckCircleOutlined className="text-green-600 text-lg" />
                    <span className="text-green-700 font-medium">
                      Active - Client can login
                    </span>
                  </>
                ) : (
                  <>
                    <CloseCircleOutlined className="text-red-600 text-lg" />
                    <span className="text-red-700 font-medium">
                      Inactive - Client cannot login
                    </span>
                  </>
                )}
              </div>
            }
            type={clientData?.isActive ? "success" : "warning"}
            showIcon
            className="mb-6"
          />

          {/* Status Toggle */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <Form.Item name="isActive" valuePropName="checked" className="mb-0">
              <Checkbox>
                <div>
                  <span className="font-medium text-base">Active Account</span>
                  <p className="text-gray-500 text-sm mt-1">
                    When checked, the client can login and access their account.
                    Uncheck to deactivate access.
                  </p>
                </div>
              </Checkbox>
            </Form.Item>
          </div>

          {/* Warning */}
          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.isActive !== curr.isActive}
          >
            {({ getFieldValue }) =>
              !getFieldValue("isActive") && (
                <Alert
                  message="Deactivation Warning"
                  description="The client will lose access to their account immediately. They can be reactivated at any time."
                  type="warning"
                  showIcon
                  className="mb-4"
                />
              )
            }
          </Form.Item>

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
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Form>
      </Modal>
    </section>
  );
};

UpdateClientStatus.propTypes = {
  clientId: PropTypes.string.isRequired,
  clientData: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    isActive: PropTypes.bool,
  }),
};

export default UpdateClientStatus;