import { useEffect } from "react";
import PropTypes from "prop-types";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Space,
  Button,
  message,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  addLitigationStep,
  updateLitigationStep,
  selectActionLoading,
} from "../../redux/features/litigation/litigationSlice";
import { PRIORITY_LEVELS, DATE_FORMAT } from "../../utils/litigationConstants";
import useUserSelectOptions from "../../hooks/useUserSelectOptions";

const { TextArea } = Input;
const { Option } = Select;

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const CreateEditStepModal = ({
  visible,
  onCancel,
  onSuccess,
  matterId,
  editingStep,
}) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const actionLoading = useSelector(selectActionLoading);
  const {
    data: staffOptions,
    loading: staffLoading,
    error: staffError,
  } = useUserSelectOptions({ type: "staff", autoFetch: visible });

  useEffect(() => {
    if (visible) {
      if (editingStep) {
        form.setFieldsValue({
          ...editingStep,
          dueDate: editingStep.dueDate ? dayjs(editingStep.dueDate) : null,
          assignedTo:
            editingStep.assignedTo?._id || editingStep.assignedTo || undefined,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          priority: "medium",
          status: "pending",
          assignedTo: undefined,
        });
      }
    }
  }, [visible, editingStep, form]);

  const handleSubmit = async (values) => {
    try {
      const stepData = {
        ...values,
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
      };

      if (editingStep) {
        await dispatch(
          updateLitigationStep({
            matterId,
            stepId: editingStep._id,
            stepData,
          })
        ).unwrap();
        message.success("Step updated successfully");
      } else {
        await dispatch(
          addLitigationStep({ matterId, stepData })
        ).unwrap();
        message.success("Step added successfully");
      }

      form.resetFields();
      onSuccess?.();
    } catch (error) {
      message.error(error?.message || "Failed to save step");
    }
  };

  return (
    <Modal
      title={editingStep ? "Edit Step" : "Add New Step"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          priority: "medium",
          status: "pending",
        }}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: "Please enter step title" }]}
        >
          <Input placeholder="Enter step title" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Enter step description" />
        </Form.Item>

        <Form.Item
          name="assignedTo"
          label="Assigned to"
          rules={[{ required: true, message: "Please select the responsible officer" }]}
          validateStatus={staffError ? "error" : undefined}
          help={
            staffError
              ? "Unable to load staff accounts. Close and reopen this form to retry."
              : undefined
          }
        >
          <Select
            showSearch
            optionFilterProp="label"
            loading={staffLoading}
            options={staffOptions}
            placeholder="Select the officer responsible for this step"
          />
        </Form.Item>

        <Form.Item name="priority" label="Priority">
          <Select placeholder="Select priority">
            {PRIORITY_LEVELS.map((priority) => (
              <Option key={priority.value} value={priority.value}>
                <Space>
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor:
                        priority.value === "low"
                          ? "#52c41a"
                          : priority.value === "medium"
                          ? "#faad14"
                          : priority.value === "high"
                          ? "#fa8c16"
                          : "#f5222d",
                    }}
                  />
                  {priority.label}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="status" label="Status">
          <Select placeholder="Select status">
            {STATUS_OPTIONS.map((status) => (
              <Option key={status.value} value={status.value}>
                {status.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="dueDate" label="Due Date">
          <DatePicker
            style={{ width: "100%" }}
            format={DATE_FORMAT}
            placeholder="Select due date"
          />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <TextArea rows={2} placeholder="Additional notes" />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={actionLoading}>
              {editingStep ? "Update" : "Add"} Step
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

CreateEditStepModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  matterId: PropTypes.string.isRequired,
  editingStep: PropTypes.shape({
    _id: PropTypes.string,
    dueDate: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date),
    ]),
    assignedTo: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ _id: PropTypes.string }),
    ]),
  }),
};

export default CreateEditStepModal;
