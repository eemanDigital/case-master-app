import React, { useState, useCallback, useMemo } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Upload,
  message,
  Divider,
  Tabs,
  Spin,
} from "antd";
import {
  MailOutlined,
  PaperClipOutlined,
  SendOutlined,
  FileTextOutlined,
  UserOutlined,
  InboxOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import {
  sendCustomEmail,
  EMAIL_RESET,
} from "../../redux/features/emails/emailSlice";
import useUserSelectOptions from "../../hooks/useUserSelectOptions";

const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

const CustomEmailModal = ({
  visible,
  onClose,
  preselectedRecipients = [],
  preselectedSubject = "",
}) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);

  // Use the optimized hook with caching - fetch all user types at once
  const { data: userOptions, loading: usersLoading } = useUserSelectOptions({
    type: "all",
    fetchAll: true,
    autoFetch: visible, // Only fetch when modal opens
    includeInactive: false,
  });

  // Combine loading states
  const isLoading = loading || usersLoading;

  // Memoize options for performance
  const clientOptions = useMemo(() => userOptions?.clients || [], [userOptions?.clients]);
  const lawyerOptions = useMemo(() => userOptions?.lawyers || [], [userOptions?.lawyers]);

  const handleSubmit = useCallback(
    async (values) => {
      // Validate at least one recipient
      const recipients = values.recipients || [];
      if (values.recipientEmail) {
        recipients.push(values.recipientEmail);
      }

      if (recipients.length === 0) {
        message.error("Please select at least one recipient");
        return;
      }

      // Validate at least one message content
      if (!values.textContent && !values.htmlContent) {
        message.error("Please enter a message (plain text or HTML)");
        return;
      }

      setLoading(true);

      try {
        // Prepare attachments
        const processedAttachment = attachments.map((file) => ({
          file: file.originFileObj,
          filename: file.name,
        }));

        const emailData = {
          send_to: recipients,
          subject: values.subject,
          htmlContent: values.htmlContent || null,
          textContent: values.textContent || null,
          reply_to: values.replyTo || null,
          attachments:
            processedAttachment.length > 0 ? processedAttachment : undefined,
        };

        await dispatch(sendCustomEmail(emailData)).unwrap();

        message.success("Email sent successfully!");
        form.resetFields();
        setAttachments([]);
        onClose();
      } catch (error) {
        message.error(error || "Failed to send email");
      } finally {
        setLoading(false);
      }
    },
    [dispatch, attachments, form, onClose],
  );

  const handleCancel = useCallback(() => {
    form.resetFields();
    setAttachments([]);
    dispatch(EMAIL_RESET());
    onClose();
  }, [form, onClose, dispatch]);

  const handleFileChange = useCallback(({ fileList }) => {
    setAttachments(fileList);
  }, []);

  // Simple text formatting helper
  const formatText = (type) => {
    const textarea = document.querySelector('.formatting-textarea');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let formattedText = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        formattedText = `_${selectedText}_`;
        cursorOffset = 1;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        cursorOffset = 3;
        break;
      case 'bullet':
        formattedText = `\n• ${selectedText}`;
        cursorOffset = 2;
        break;
      case 'number':
        formattedText = `\n1. ${selectedText}`;
        cursorOffset = 3;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        cursorOffset = selectedText.length + 3;
        break;
      default:
        return;
    }

    const newText = text.substring(0, start) + formattedText + text.substring(end);
    form.setFieldValue('textContent', newText);

    // Set cursor position
    setTimeout(() => {
      textarea.focus();
      const newPos = selectedText ? start + formattedText.length : start + cursorOffset;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const tabItems = [
    {
      key: "text",
      label: (
        <span>
          <FileTextOutlined /> Plain Text
        </span>
      ),
      children: (
        <Form.Item
          name="textContent"
        >
          <div>
            {/* Formatting Toolbar */}
            <div className="flex items-center gap-1 mb-2 pb-2 border-b border-slate-200">
              <Button
                type="text"
                size="small"
                onClick={() => formatText('bold')}
                className="font-bold"
                title="Bold"
              >
                B
              </Button>
              <Button
                type="text"
                size="small"
                onClick={() => formatText('italic')}
                className="italic"
                title="Italic"
              >
                I
              </Button>
              <Button
                type="text"
                size="small"
                onClick={() => formatText('underline')}
                className="underline"
                title="Underline"
              >
                U
              </Button>
              <div className="w-px h-4 bg-slate-300 mx-1" />
              <Button
                type="text"
                size="small"
                onClick={() => formatText('bullet')}
                title="Bullet List"
              >
                •
              </Button>
              <Button
                type="text"
                size="small"
                onClick={() => formatText('number')}
                title="Numbered List"
              >
                1.
              </Button>
              <div className="w-px h-4 bg-slate-300 mx-1" />
              <Button
                type="text"
                size="small"
                onClick={() => formatText('link')}
                title="Add Link"
              >
                Link
              </Button>
              <span className="text-xs text-slate-400 ml-auto">
                Markdown supported
              </span>
            </div>
            <TextArea
              rows={10}
              placeholder="Write your message here... Use **bold**, _italic_, • bullets, or 1. numbered lists"
              showCount
              maxLength={5000}
              className="formatting-textarea"
            />
          </div>
        </Form.Item>
      ),
    },
    {
      key: "html",
      label: (
        <span>
          <CodeOutlined /> HTML
        </span>
      ),
      children: (
        <Form.Item
          name="htmlContent"
        >
          <TextArea
            rows={10}
            placeholder="<p>Your HTML content here...</p>"
            showCount
            maxLength={10000}
            style={{ fontFamily: "monospace" }}
          />
        </Form.Item>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <MailOutlined className="text-white text-lg" />
          </div>
          <div>
            <span className="font-bold text-slate-800">Compose Email</span>
            <p className="text-xs text-slate-500 font-normal m-0">
              Send custom emails with attachments
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={720}
      footer={null}
      destroyOnClose
      className="email-modal">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          recipients: preselectedRecipients,
          subject: preselectedSubject,
        }}
        className="mt-4">
        {/* Recipients */}
        <Form.Item
          name="recipients"
          label="To"
          dependencies={['recipientEmail']}
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                const recipientEmail = getFieldValue('recipientEmail');
                if (!value || value.length === 0) {
                  if (!recipientEmail) {
                    return Promise.reject(new Error('Please select recipients or enter an email'));
                  }
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <Select
            mode="multiple"
            placeholder="Select clients or enter email below"
            showSearch
            optionFilterProp="label"
            loading={usersLoading}
            className="w-full"
            dropdownRender={(menu) => (
              usersLoading ? (
                <div className="p-4 text-center">
                  <Spin size="small" />
                  <p className="text-xs text-slate-500 mt-2">Loading contacts...</p>
                </div>
              ) : menu
            )}
          >
            {clientOptions.map((client) => (
              <Option
                key={client.email}
                value={client.email}
                label={client.label}>
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-slate-400" />
                  <span>{client.label}</span>
                  <span className="text-slate-400 text-xs">
                    ({client.email})
                  </span>
                </div>
              </Option>
            ))}
            {lawyerOptions.map((lawyer) => (
              <Option
                key={lawyer.email}
                value={lawyer.email}
                label={lawyer.label}>
                <div className="flex items-center gap-2">
                  <UserOutlined className="text-blue-400" />
                  <span>{lawyer.label}</span>
                  <span className="text-slate-400 text-xs">
                    ({lawyer.email})
                  </span>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Additional Email Input */}
        <Form.Item 
          name="recipientEmail" 
          label="Or add external email"
          rules={[
            {
              type: 'email',
              message: 'Please enter a valid email address',
            },
          ]}
        >
          <Input
            placeholder="client@example.com"
            suffix={<MailOutlined className="text-slate-400" />}
          />
        </Form.Item>

        {/* Reply To */}
        <Form.Item name="replyTo" label="Reply To (optional)">
          <Input placeholder="reply@example.com" />
        </Form.Item>

        {/* Subject */}
        <Form.Item
          name="subject"
          label="Subject"
          rules={[
            { required: true, message: "Please enter a subject" },
            { max: 200, message: "Subject must be less than 200 characters" },
          ]}>
          <Input placeholder="Enter email subject" maxLength={200} showCount />
        </Form.Item>

        <Divider className="!my-4" />

        {/* Message Type Tabs */}
        <Tabs
          defaultActiveKey="text"
          items={tabItems}
          className="message-tabs"
        />

        {/* Attachments */}
        <div className="mt-4">
          <div className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <PaperClipOutlined /> Attachments
            <span className="text-slate-400 font-normal text-xs">
              (Max 10 files, 20MB total)
            </span>
          </div>

          <Dragger
            multiple
            fileList={attachments}
            onChange={handleFileChange}
            beforeUpload={() => false}
            maxCount={10}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
            showUploadList={{ showRemoveIcon: true }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined className="text-indigo-500 text-3xl" />
            </p>
            <p className="ant-upload-text">Click or drag files to upload</p>
            <p className="ant-upload-hint">
              PDF, Word, Excel, PowerPoint, Images up to 10MB each
            </p>
          </Dragger>

          {attachments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={file.uid || index}
                  className="bg-slate-100 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm">
                  <PaperClipOutlined className="text-slate-500" />
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <span className="text-slate-400 text-xs">
                    {(file.size / 1024).toFixed(1)}KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Divider className="!my-4" />

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button onClick={handleCancel}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SendOutlined />}
            loading={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600">
            Send Email
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CustomEmailModal;
