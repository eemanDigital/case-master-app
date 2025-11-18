import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import {
  Modal,
  Button,
  Form,
  Input,
  Checkbox,
  Upload,
  message,
  Space,
  Progress,
  Alert,
  Divider,
} from "antd";
import useModal from "../hooks/useModal";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import {
  UploadOutlined,
  PaperClipOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

const TaskResponseForm = ({ taskId, onResponseSubmit, task }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { user } = useSelector((state) => state.auth);
  const { sendingEmail, emailSent, msg } = useSelector((state) => state.email);
  const [fileList, setFileList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { open, showModal, handleCancel } = useModal();
  const { dataFetcher, error: dataError } = useDataFetch();

  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
  };

  const beforeUpload = (file) => {
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error("File must be smaller than 10MB!");
      return false;
    }

    // Validate file types
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      message.error("You can only upload PDF, Word, Excel, or image files!");
      return false;
    }

    return true;
  };

  const handleRemoveFile = (file) => {
    setFileList(fileList.filter((f) => f.uid !== file.uid));
  };

  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);
    return interval;
  };

  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    const progressInterval = simulateUploadProgress();

    try {
      const formData = new FormData();
      formData.append("completed", values.completed || false);
      formData.append("comment", values.comment || "");

      // Append file if exists
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append("doc", fileList[0].originFileObj);
      }

      const response = await dataFetcher(
        `tasks/${taskId}/response`,
        "POST",
        formData,
        true // Set to true for FormData requests
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response?.status === "success") {
        toast.success("Task response submitted successfully!");

        // Send email notification to task assigner
        if (task?.assignedBy?.email) {
          const emailData = {
            subject: `Task Response Submitted - ${task?.title}`,
            send_to: task.assignedBy.email,
            reply_to: "noreply@atlukman.com",
            template: "taskResponse",
            url: `/dashboard/tasks/${taskId}`,
            context: {
              recipient: task.assignedBy.firstName,
              comment: values.comment || "No comments provided",
              completed: values.completed ? "Yes" : "No",
              taskTitle: task.title,
              submittedBy: `${user?.data?.firstName} ${user?.data?.lastName}`,
              submissionDate: new Date().toLocaleDateString(),
              taskPriority: task.taskPriority,
              dueDate: new Date(task.dueDate).toLocaleDateString(),
            },
          };

          try {
            await dispatch(sendAutomatedCustomEmail(emailData));
          } catch (emailError) {
            console.warn("Email notification failed:", emailError);
            // Don't fail the whole submission if email fails
          }
        }

        // Reset form and close modal
        form.resetFields();
        setFileList([]);
        setUploadProgress(0);
        handleCancel();

        // Notify parent component
        if (onResponseSubmit) {
          onResponseSubmit(response.data.task);
        }
      }
    } catch (err) {
      clearInterval(progressInterval);
      setUploadProgress(0);

      console.error("Submission error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to submit task response. Please try again.";

      toast.error(errorMessage);

      // Show more detailed error in development
      if (process.env.NODE_ENV === "development") {
        console.error("Detailed error:", err.response?.data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelWithReset = () => {
    form.resetFields();
    setFileList([]);
    setUploadProgress(0);
    handleCancel();
  };

  // Get response status from task
  const existingResponse = task?.taskResponse?.[0];
  const isCompleted =
    existingResponse?.completed || task?.status === "completed";

  useEffect(() => {
    if (emailSent && msg) {
      toast.success(msg);
    }
  }, [emailSent, msg]);

  useEffect(() => {
    if (dataError) {
      toast.error(dataError);
    }
  }, [dataError]);

  // Pre-fill form if response exists
  useEffect(() => {
    if (existingResponse && open) {
      form.setFieldsValue({
        completed: existingResponse.completed,
        comment: existingResponse.comment || "",
      });
    }
  }, [existingResponse, open, form]);

  return (
    <div className="w-full">
      <Button
        type={existingResponse ? "default" : "primary"}
        onClick={showModal}
        className="w-full sm:w-auto px-6 py-2 text-sm sm:text-base font-medium rounded-md shadow-sm transition duration-300 ease-in-out flex items-center justify-center gap-2"
        disabled={isSubmitting}
        icon={
          existingResponse ? <CheckCircleOutlined /> : <PaperClipOutlined />
        }>
        {isSubmitting
          ? "Submitting..."
          : existingResponse
          ? "Update Response"
          : "Submit Response"}
      </Button>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <PaperClipOutlined className="text-blue-500" />
            <span>
              {existingResponse
                ? "Update Task Response"
                : "Submit Task Response"}
            </span>
          </div>
        }
        open={open}
        onCancel={handleCancelWithReset}
        footer={[
          <Button
            key="cancel"
            onClick={handleCancelWithReset}
            disabled={isSubmitting}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() => form.submit()}
            loading={isSubmitting}
            icon={<CheckCircleOutlined />}>
            {existingResponse ? "Update Response" : "Submit Response"}
          </Button>,
        ]}
        width={700}
        destroyOnClose>
        <div className="space-y-4">
          {/* Task Info */}
          {task && (
            <Alert
              message="Task Information"
              description={
                <div className="text-sm">
                  <div>
                    <strong>Title:</strong> {task.title}
                  </div>
                  <div>
                    <strong>Priority:</strong>{" "}
                    <span className="capitalize">{task.taskPriority}</span>
                  </div>
                  <div>
                    <strong>Due Date:</strong>{" "}
                    {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                </div>
              }
              type="info"
              showIcon
            />
          )}

          {/* Existing Response Alert */}
          {existingResponse && (
            <Alert
              message="Response Exists"
              description="You have already submitted a response for this task. You can update it below."
              type="warning"
              showIcon
            />
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="mt-4"
            disabled={isSubmitting}>
            <Form.Item
              name="completed"
              valuePropName="checked"
              initialValue={existingResponse?.completed || false}>
              <Checkbox disabled={isCompleted}>
                Mark task as completed
                {isCompleted && (
                  <span className="ml-2 text-green-600 text-sm">
                    (Currently completed)
                  </span>
                )}
              </Checkbox>
            </Form.Item>

            <Divider />

            <Form.Item
              name="comment"
              label="Comments & Progress Update"
              rules={[
                { required: true, message: "Please provide your comments" },
                { min: 10, message: "Comments must be at least 10 characters" },
                {
                  max: 1000,
                  message: "Comments cannot exceed 1000 characters",
                },
              ]}
              initialValue={existingResponse?.comment || ""}>
              <Input.TextArea
                rows={5}
                placeholder="Provide detailed comments about your task progress, challenges faced, and any important updates..."
                showCount
                maxLength={1000}
                disabled={isSubmitting}
              />
            </Form.Item>

            <Form.Item
              label="Attach Supporting Document"
              extra="Supported formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max: 10MB)">
              <Upload
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={handleFileChange}
                onRemove={handleRemoveFile}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                maxCount={1}
                disabled={isSubmitting}>
                <Button icon={<UploadOutlined />} disabled={isSubmitting}>
                  Select File
                </Button>
              </Upload>

              {/* Show existing document if updating response */}
              {existingResponse?.doc && !fileList.length && (
                <div className="mt-2 p-2 bg-gray-50 rounded border">
                  <Space>
                    <PaperClipOutlined className="text-blue-500" />
                    <span className="text-sm">
                      Current document: {existingResponse.doc.split("/").pop()}
                    </span>
                    <Button
                      type="link"
                      size="small"
                      href={existingResponse.doc}
                      target="_blank">
                      View
                    </Button>
                  </Space>
                </div>
              )}
            </Form.Item>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <Form.Item label="Upload Progress">
                <Progress
                  percent={uploadProgress}
                  status="active"
                  strokeColor={{
                    "0%": "#108ee9",
                    "100%": "#87d068",
                  }}
                />
              </Form.Item>
            )}
          </Form>

          {/* Submission Guidelines */}
          <Alert
            message="Submission Guidelines"
            description={
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>
                  Provide detailed comments about your progress and any
                  challenges
                </li>
                <li>Attach relevant documents to support your response</li>
                <li>Mark as completed only when the task is fully done</li>
                <li>
                  Your response will be sent to the task assigner for review
                </li>
              </ul>
            }
            type="info"
            showIcon
          />
        </div>
      </Modal>
    </div>
  );
};

TaskResponseForm.propTypes = {
  taskId: PropTypes.string.isRequired,
  onResponseSubmit: PropTypes.func,
  task: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    taskPriority: PropTypes.string,
    dueDate: PropTypes.string,
    assignedBy: PropTypes.shape({
      email: PropTypes.string,
      firstName: PropTypes.string,
    }),
    taskResponse: PropTypes.arrayOf(
      PropTypes.shape({
        completed: PropTypes.bool,
        comment: PropTypes.string,
        doc: PropTypes.string,
        submittedBy: PropTypes.string,
        timestamp: PropTypes.string,
      })
    ),
    status: PropTypes.string,
  }),
};

TaskResponseForm.defaultProps = {
  onResponseSubmit: () => {},
  task: null,
};

export default TaskResponseForm;
