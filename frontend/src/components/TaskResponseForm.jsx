import React, { useState, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  message,
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

import {
  submitTaskResponse,
  uploadTaskResponseDocs,
  selectTaskActionLoading,
} from "../redux/features/task/taskSlice";
import { selectUser } from "../redux/features/auth/authSlice";

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TaskResponseForm = ({ taskId, taskDetails, onResponseSubmitted }) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const loading = useSelector(selectTaskActionLoading);

  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [isEmailEnabled, setIsEmailEnabled] = useState(true);

  const isSubmittingRef = useRef(false);

  const resetForm = useCallback(() => {
    form.resetFields();
    setFileList([]);
    setUploadProgress(0);
    setSubmissionStatus(null);
    setIsEmailEnabled(true);
    isSubmittingRef.current = false;
  }, [form]);

  const handleCancel = useCallback(() => {
    setModalOpen(false);
    resetForm();
  }, [resetForm]);

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

  const uploadFiles = async (tid) => {
    if (fileList.length === 0) return [];

    setUploading(true);
    const uploadPromises = fileList
      .filter((file) => file.originFileObj)
      .map(async (file) => {
        const formData = new FormData();
        formData.append("files", file.originFileObj);
        formData.append(
          "description",
          `Task response document for ${taskDetails?.title || "task"}`,
        );

        try {
          const result = await dispatch(
            uploadTaskResponseDocs({
              taskId: tid,
              formData,
            }),
          ).unwrap();

          return result.files?.[0]?._id || null;
        } catch (error) {
          message.error(`Failed to upload ${file.name}`);
          return null;
        }
      });

    const results = await Promise.all(uploadPromises);
    setUploading(false);
    return results;
  };

  const handleSubmit = async (values) => {
    if (isSubmittingRef.current) {
      message.warning("Submission in progress, please wait...");
      return;
    }

    isSubmittingRef.current = true;
    setSubmissionStatus("uploading");

    try {
      let timeSpentInMinutes = 0;
      if (values.timeSpent) {
        const hours = values.timeSpent.hour();
        const minutes = values.timeSpent.minute();
        timeSpentInMinutes = hours * 60 + minutes;
      }

      const documentIds = await uploadFiles(taskId);
      const validDocumentIds = documentIds.filter((id) => id !== null);

      const payload = {
        status: values.completed ? "completed" : "in-progress",
        completionPercentage: values.completed
          ? 100
          : values.completionPercentage || 0,
        comment: values.comment,
        timeSpent: timeSpentInMinutes || 0,
        documentIds: validDocumentIds,
      };

      await dispatch(
        submitTaskResponse({
          taskId,
          data: payload,
        }),
      ).unwrap();

      setSubmissionStatus("success");
      message.success("Task response submitted successfully!");

      setTimeout(() => {
        handleCancel();
        onResponseSubmitted?.();
      }, 1500);
    } catch (error) {
      setSubmissionStatus("error");
      message.error(error?.message || "Failed to submit response");
      isSubmittingRef.current = false;
    }
  };

  const handleCompletionChange = (e) => {
    if (e.target.checked) {
      form.setFieldValue("completionPercentage", 100);
    } else {
      form.setFieldValue("completionPercentage", 0);
    }
  };

  const handleCompletionPercentageChange = (value) => {
    form.setFieldValue("completed", value === 100);
  };

  const handleEmailToggle = (e) => {
    setIsEmailEnabled(e.target.checked);
  };

  const isSubmitting = uploading || loading || isSubmittingRef.current;

  return (
    <>
      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={() => setModalOpen(true)}
        size="large"
        className="bg-blue-600 hover:bg-blue-700 border-blue-600">
        Submit Response
      </Button>

      <Modal
        title={
          <Space>
            <SendOutlined className="text-blue-500" />
            <Title level={4} className="!mb-0">
              Submit Task Response
            </Title>
          </Space>
        }
        open={modalOpen}
        onCancel={handleCancel}
        width={700}
        footer={null}
        destroyOnClose
        maskClosable={!isSubmitting}
        keyboard={!isSubmitting}
        closable={!isSubmitting}>
        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={isSubmitting}
          initialValues={{
            completionPercentage: 0,
            timeSpent: null,
            completed: false,
          }}>
          <Row gutter={[16, 16]}>
            {/* Left Column */}
            <Col xs={24} lg={12}>
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

              <Card size="small" className="mb-4">
                <Form.Item label="Time Spent (HH:mm)" name="timeSpent">
                  <TimePicker
                    format="HH:mm"
                    placeholder="Select time spent"
                    disabled={isSubmitting}
                    className="w-full"
                    showNow={false}
                  />
                </Form.Item>
                <Text type="secondary" className="text-xs">
                  Select the time you spent on this task
                </Text>
              </Card>

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
                    onRemove={(file) =>
                      setFileList((prev) =>
                        prev.filter((f) => f.uid !== file.uid),
                      )
                    }
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx,.xls,.zip"
                    listType="text"
                    beforeUpload={() => false}
                    disabled={isSubmitting}>
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
                  Supported: PDF, DOC, DOCX, JPG, PNG, TXT, Excel, ZIP (Max
                  10MB)
                </Text>
              </Card>

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

          {/* Comment Section */}
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
                { min: 10, message: "Comment must be at least 10 characters" },
                {
                  max: 2000,
                  message: "Comment must not exceed 2000 characters",
                },
              ]}
              validateTrigger="onBlur">
              <TextArea
                rows={5}
                placeholder="Describe your progress, challenges, or completion details..."
                showCount
                maxLength={2000}
                disabled={isSubmitting}
                className="resize-none"
              />
            </Form.Item>
          </Card>

          {/* Status Alerts */}
          {submissionStatus === "success" && (
            <Alert
              message="Response Submitted Successfully!"
              description={
                isEmailEnabled
                  ? "Your task response has been submitted and notifications sent."
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button onClick={handleCancel} disabled={isSubmitting} size="large">
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
    </>
  );
};

export default TaskResponseForm;
