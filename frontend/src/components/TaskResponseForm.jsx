import PropTypes from "prop-types";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Modal,
  Button,
  Form,
  Input,
  Checkbox,
  Upload,
  Card,
  Space,
  Alert,
  Progress,
  Tag,
  Typography,
  Divider,
  Row,
  Col,
  Select,
  TimePicker,
} from "antd";
import {
  UploadOutlined,
  PaperClipOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SendOutlined,
  FileTextOutlined,
  LoadingOutlined,
  MailOutlined,
} from "@ant-design/icons";
import useModal from "../hooks/useModal";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { sendAutomatedCustomEmail } from "../redux/features/emails/emailSlice";
import { useDataFetch } from "../hooks/useDataFetch";

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TaskResponseForm = ({ taskId, onResponseSubmitted, taskDetails }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { user } = useSelector((state) => state.auth);
  const { sendingEmail, emailSent, msg } = useSelector((state) => state.email);

  // Use your custom data fetch hook
  const { dataFetcher, loading: apiLoading, error: apiError } = useDataFetch();

  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [isEmailEnabled, setIsEmailEnabled] = useState(true); // Email toggle state

  const { open, showModal, handleCancel } = useModal();

  // Use refs to prevent duplicate submissions
  const isSubmittingRef = useRef(false);
  const emailSentRef = useRef(false);

  // Reset everything when modal closes
  const handleModalCancel = useCallback(() => {
    form.resetFields();
    setFileList([]);
    setUploadProgress(0);
    setSubmissionStatus(null);
    setIsEmailEnabled(true); // Reset to default enabled
    isSubmittingRef.current = false;
    emailSentRef.current = false;
    handleCancel();
  }, [form, handleCancel]);

  // Handle file upload changes with validation
  const handleFileChange = useCallback(({ fileList: newFileList }) => {
    const validatedFileList = newFileList.map((file) => {
      const isLt10M = file.size ? file.size / 1024 / 1024 < 10 : true;
      const isValidType = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain",
        "application/zip",
      ].includes(file.type);

      if (file.size && !isLt10M) {
        file.status = "error";
        file.response = "File size must be less than 10MB";
      } else if (!isValidType) {
        file.status = "error";
        file.response = "File type not supported";
      } else if (file.status !== "error") {
        file.status = "done";
      }

      return file;
    });

    setFileList(validatedFileList);
  }, []);

  // Remove file from upload list
  const handleRemoveFile = useCallback((file) => {
    setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
  }, []);

  // Upload files to the server using axios
  const uploadFiles = async (taskId) => {
    if (fileList.length === 0) return [];

    setUploading(true);
    const uploadPromises = fileList
      .filter((file) => file.originFileObj)
      .map(async (file) => {
        const formData = new FormData();
        formData.append("files", file.originFileObj);
        formData.append(
          "description",
          `Task response document for ${taskDetails?.title || "task"}`
        );

        try {
          // Use dataFetcher for file upload
          const result = await dataFetcher(
            `tasks/${taskId}/response-documents`,
            "POST",
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const progress = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                  );
                  setUploadProgress(progress);
                }
              },
            }
          );

          if (result.error) {
            throw new Error(result.error);
          }

          return result.data?.files?.[0]?._id || null;
        } catch (error) {
          console.error("File upload error:", error);
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }
      });

    const results = await Promise.all(uploadPromises);
    setUploading(false);
    return results;
  };

  // Send email notification function
  const sendEmailNotification = async (responseData, formValues) => {
    if (!isEmailEnabled || emailSentRef.current) return;

    try {
      const creatorEmail = responseData?.createdBy?.email;

      if (!creatorEmail) {
        console.warn("No creator email found, skipping email notification");
        return;
      }

      const emailData = {
        subject: "Task Response Submitted - A.T. Lukman & Co.",
        send_to: creatorEmail,
        reply_to: "noreply@atlukman.com",
        template: "taskResponse",
        url: "/dashboard/tasks",
        context: {
          recipient: responseData.createdBy?.firstName || "Task Creator",
          position: responseData.createdBy?.position || "",
          comment: formValues.comment,
          completed: formValues.completed ? "Completed" : "In Progress",
          completionPercentage: formValues.completionPercentage || 0,
          submittedBy: `${user?.data?.firstName || user?.firstName} ${
            user?.data?.lastName || user?.lastName
          }`,
          taskTitle: taskDetails?.title || "Task",
          timeSpent: formValues.timeSpent
            ? `${formValues.timeSpent.hour()}h ${formValues.timeSpent.minute()}m`
            : "Not specified",
        },
      };

      emailSentRef.current = true;
      await dispatch(sendAutomatedCustomEmail(emailData));
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      // Don't show error toast here as response was already successful
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    // Prevent duplicate submissions
    if (isSubmittingRef.current) {
      toast.warning("Submission in progress, please wait...");
      return;
    }

    isSubmittingRef.current = true;
    setSubmissionStatus("uploading");

    try {
      // Convert Day.js time to minutes
      let timeSpentInMinutes = 0;
      if (values.timeSpent) {
        const hours = values.timeSpent.hour();
        const minutes = values.timeSpent.minute();
        timeSpentInMinutes = hours * 60 + minutes;
      }

      // 1. Upload files first
      const documentIds = await uploadFiles(taskId);
      const validDocumentIds = documentIds.filter((id) => id !== null);

      // 2. Prepare response payload with updated field names
      const payload = {
        status: values.completed ? "completed" : "in-progress",
        completionPercentage: values.completed
          ? 100
          : values.completionPercentage || 0,
        comment: values.comment,
        timeSpent: timeSpentInMinutes || 0,
        documentIds: validDocumentIds,
      };

      // 3. Submit task response using dataFetcher
      const response = await dataFetcher(
        `tasks/${taskId}/responses`,
        "POST",
        payload
      );

      if (response.error) {
        throw new Error(response.error);
      }

      setSubmissionStatus("success");

      // 4. Send email notification if enabled (in background, don't await)
      if (isEmailEnabled) {
        sendEmailNotification(response.data, values).catch(() => {
          // Silent fail - don't affect user experience
        });
      }

      toast.success("Task response submitted successfully!");

      // 5. Callback to refresh parent component
      if (onResponseSubmitted) {
        onResponseSubmitted();
      }

      // 6. Close modal after short delay
      setTimeout(() => {
        handleModalCancel();
      }, 1500);
    } catch (error) {
      console.error("Submission error:", error);
      setSubmissionStatus("error");
      toast.error(
        error.message || "Failed to submit task response. Please try again."
      );
      // Reset submitting flag on error
      isSubmittingRef.current = false;
    }
  };

  // Calculate time spent in minutes
  const handleTimeChange = (time) => {
    form.setFieldValue("timeSpent", time);
  };

  // Handle completion checkbox change
  const handleCompletionChange = (e) => {
    if (e.target.checked) {
      form.setFieldValue("completionPercentage", 100);
    } else {
      form.setFieldValue("completionPercentage", 0);
    }
  };

  // Handle completion percentage change
  const handleCompletionPercentageChange = (value) => {
    if (value === 100) {
      form.setFieldValue("completed", true);
    } else {
      form.setFieldValue("completed", false);
    }
  };

  // Toggle email notification
  const handleEmailToggle = (e) => {
    setIsEmailEnabled(e.target.checked);
  };

  // Show API errors
  useEffect(() => {
    if (apiError && !isSubmittingRef.current) {
      toast.error(apiError);
    }
  }, [apiError]);

  // Show success message when email is sent
  useEffect(() => {
    if (emailSent && !isSubmittingRef.current) {
      toast.success(msg || "Email notification sent successfully!");
    }
  }, [emailSent, msg]);

  const isSubmitting =
    uploading || sendingEmail || apiLoading || isSubmittingRef.current;

  return (
    <div className="task-response-form">
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={showModal}
        size="large"
        className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 border-blue-600"
        disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit Response"}
      </Button>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <SendOutlined className="text-blue-500" />
            <Title level={4} className="mb-0">
              Submit Task Response
            </Title>
          </div>
        }
        open={open}
        onCancel={handleModalCancel}
        width={700}
        footer={null}
        destroyOnClose
        className="task-response-modal"
        maskClosable={!isSubmitting}
        keyboard={!isSubmitting}
        closable={!isSubmitting}>
        <Divider className="my-4" />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="response-form"
          disabled={isSubmitting}
          initialValues={{
            completionPercentage: 0,
            timeSpent: null,
            completed: false,
          }}>
          <Row gutter={[16, 16]}>
            {/* Left Column - Response Details */}
            <Col xs={24} lg={12}>
              {/* Completion Status */}
              <Card size="small" className="mb-4">
                <Form.Item name="completed" valuePropName="checked">
                  <Checkbox
                    disabled={isSubmitting}
                    onChange={handleCompletionChange}>
                    <Space>
                      <CheckCircleOutlined className="text-green-500" />
                      <Text strong>Mark task as completed</Text>
                    </Space>
                  </Checkbox>
                </Form.Item>
              </Card>

              {/* Progress Percentage */}
              <Card size="small" className="mb-4">
                <Form.Item
                  label="Completion Percentage"
                  name="completionPercentage"
                  rules={[
                    {
                      required: true,
                      message: "Please set completion percentage",
                    },
                  ]}>
                  <Select
                    placeholder="Select completion percentage"
                    disabled={isSubmitting}
                    onChange={handleCompletionPercentageChange}>
                    <Option value={0}>0% - Not Started</Option>
                    <Option value={25}>25% - Just Started</Option>
                    <Option value={50}>50% - Halfway</Option>
                    <Option value={75}>75% - Almost Done</Option>
                    <Option value={100}>100% - Completed</Option>
                  </Select>
                </Form.Item>
              </Card>

              {/* Time Spent */}
              <Card size="small" className="mb-4">
                <Form.Item label="Time Spent (HH:mm)" name="timeSpent">
                  <TimePicker
                    format="HH:mm"
                    placeholder="Select time spent"
                    onChange={handleTimeChange}
                    disabled={isSubmitting}
                    className="w-full"
                    showNow={false}
                  />
                </Form.Item>
                <Text type="secondary" className="text-xs">
                  Select the time you spent on this task
                </Text>
              </Card>

              {/* Email Notification Toggle */}
              <Card size="small" className="mb-4">
                <Form.Item name="sendEmailNotification" valuePropName="checked">
                  <Checkbox
                    checked={isEmailEnabled}
                    onChange={handleEmailToggle}
                    disabled={isSubmitting}>
                    <Space>
                      <MailOutlined
                        className={
                          isEmailEnabled ? "text-blue-500" : "text-gray-400"
                        }
                      />
                      <Text strong>Send email notification</Text>
                    </Space>
                  </Checkbox>
                </Form.Item>
                <Text type="secondary" className="text-xs block mt-1">
                  {isEmailEnabled
                    ? "Task creator will receive email notification"
                    : "Email notification will not be sent"}
                </Text>
              </Card>
            </Col>

            {/* Right Column - File Upload */}
            <Col xs={24} lg={12}>
              <Card
                size="small"
                title={
                  <Space>
                    <PaperClipOutlined />
                    <Text strong>Attach Files</Text>
                    <Tag color="blue">{fileList.length}</Tag>
                  </Space>
                }>
                <Form.Item name="files">
                  <Upload
                    fileList={fileList}
                    onChange={handleFileChange}
                    onRemove={handleRemoveFile}
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx,.xls,.zip"
                    listType="text"
                    beforeUpload={() => false}
                    disabled={isSubmitting}
                    itemRender={(originNode, file) => (
                      <div className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
                        <Space>
                          <FileTextOutlined />
                          <Text
                            ellipsis={{ tooltip: file.name }}
                            className="max-w-[150px]">
                            {file.name}
                          </Text>
                          {file.status === "uploading" && (
                            <Progress
                              percent={uploadProgress}
                              size="small"
                              style={{ width: 80 }}
                            />
                          )}
                        </Space>
                        {file.status === "error" && (
                          <Tag color="red" icon={<CloseCircleOutlined />}>
                            {file.response}
                          </Tag>
                        )}
                      </div>
                    )}>
                    <Button
                      icon={<UploadOutlined />}
                      type="dashed"
                      block
                      disabled={isSubmitting}
                      className="h-20 border-dashed">
                      <div className="flex flex-col items-center">
                        <UploadOutlined className="text-lg mb-1" />
                        <Text>Click or drag files to upload</Text>
                      </div>
                    </Button>
                  </Upload>
                </Form.Item>

                <Text type="secondary" className="text-xs block mt-2">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG, TXT, Excel, ZIP
                  (Max 10MB per file)
                </Text>
              </Card>

              {/* Upload Progress */}
              {uploading && fileList.length > 0 && (
                <Alert
                  message="Uploading Files"
                  description={`${uploadProgress}% complete`}
                  type="info"
                  showIcon
                  className="mt-4"
                />
              )}
            </Col>
          </Row>

          {/* Comment Section - Full Width */}
          <Card
            size="small"
            title={
              <Space>
                <FileTextOutlined />
                <Text strong>Response Details & Comments</Text>
              </Space>
            }
            className="mt-4">
            <Form.Item
              name="comment"
              rules={[
                { required: true, message: "Please provide a comment!" },
                {
                  min: 10,
                  message: "Comment must be at least 10 characters long",
                },
                {
                  max: 2000,
                  message: "Comment must not exceed 2000 characters",
                },
              ]}
              validateTrigger="onBlur">
              <TextArea
                rows={5}
                placeholder="Describe your progress, challenges encountered, completion details, or any other relevant information..."
                showCount
                maxLength={2000}
                disabled={isSubmitting}
                className="resize-none"
              />
            </Form.Item>
          </Card>

          {/* Status Alerts */}
          {submissionStatus === "uploading" && (
            <Alert
              message="Uploading Files..."
              description="Please wait while we upload your files and submit the response."
              type="info"
              showIcon
              className="mt-4"
            />
          )}

          {submissionStatus === "success" && (
            <Alert
              message="Response Submitted Successfully!"
              description={
                isEmailEnabled
                  ? "Your task response has been submitted and email notifications have been sent."
                  : "Your task response has been submitted successfully."
              }
              type="success"
              showIcon
              className="mt-4"
            />
          )}

          {submissionStatus === "error" && (
            <Alert
              message="Submission Failed"
              description="There was an error submitting your response. Please try again."
              type="error"
              showIcon
              className="mt-4"
            />
          )}

          {/* API Error Alert */}
          {apiError && (
            <Alert
              message="API Error"
              description={apiError}
              type="error"
              showIcon
              className="mt-4"
            />
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              onClick={handleModalCancel}
              disabled={isSubmitting}
              size="large">
              Cancel
            </Button>
            <Button
              type="primary"
              icon={isSubmitting ? <LoadingOutlined spin /> : <SendOutlined />}
              htmlType="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              size="large"
              className="bg-blue-600 hover:bg-blue-700 border-blue-600">
              {isSubmitting ? "Submitting..." : "Submit Response"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

// Prop types validation
TaskResponseForm.propTypes = {
  taskId: PropTypes.string.isRequired,
  onResponseSubmitted: PropTypes.func,
  taskDetails: PropTypes.shape({
    title: PropTypes.string,
    createdBy: PropTypes.shape({
      email: PropTypes.string,
      firstName: PropTypes.string,
      position: PropTypes.string,
    }),
  }),
};

TaskResponseForm.defaultProps = {
  taskDetails: {},
  onResponseSubmitted: () => {},
};

export default TaskResponseForm;
