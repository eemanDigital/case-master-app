import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Modal,
  Typography,
  Button,
  Space,
  Tag,
  Dropdown,
  Card,
  Descriptions,
  Divider,
  message,
  Spin,
  Input,
} from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  PrinterOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  FileTextOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getGeneratedDocument,
  updateGeneratedDocument,
  exportDocument,
  selectSelectedDocument,
  selectIsExporting,
} from "../../redux/features/templates/templateSlice";

const { Title, Text, Paragraph } = Typography;

const statusColors = {
  draft: "blue",
  final: "green",
  signed: "gold",
  archived: "default",
};

const DocumentViewer = ({ visible, document, onClose }) => {
  const dispatch = useDispatch();
  const selectedDocument = useSelector(selectSelectedDocument);
  const isExporting = useSelector(selectIsExporting);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (visible && document?._id) {
      dispatch(getGeneratedDocument(document._id));
    }
  }, [visible, document]);

  useEffect(() => {
    if (selectedDocument) {
      setEditTitle(selectedDocument.title);
      setEditContent(selectedDocument.content);
    }
  }, [selectedDocument]);

  const handleStatusChange = async (newStatus) => {
    try {
      await dispatch(
        updateGeneratedDocument({
          id: selectedDocument._id,
          data: { status: newStatus },
        })
      ).unwrap();
      message.success("Status updated");
    } catch (error) {
      message.error("Failed to update status");
    }
  };

  const handleSaveEdit = async () => {
    try {
      await dispatch(
        updateGeneratedDocument({
          id: selectedDocument._id,
          data: {
            title: editTitle,
            content: editContent,
          },
        })
      ).unwrap();
      message.success("Document saved");
      setIsEditing(false);
    } catch (error) {
      message.error("Failed to save");
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await dispatch(
        exportDocument({ id: selectedDocument._id, format })
      ).unwrap();

      const blob = new Blob([response], {
        type:
          format === "pdf"
            ? "application/pdf"
            : format === "docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "text/plain",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedDocument.title}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success("Document exported");
    } catch (error) {
      message.error("Export failed");
    }
  };

  const getExportMenuItems = () => [
    {
      key: "pdf",
      label: "Export as PDF",
      onClick: () => handleExport("pdf"),
    },
    {
      key: "docx",
      label: "Export as Word",
      onClick: () => handleExport("docx"),
    },
    {
      key: "txt",
      label: "Export as Text",
      onClick: () => handleExport("txt"),
    },
  ];

  const getStatusMenuItems = () => [
    { key: "draft", label: "Draft", onClick: () => handleStatusChange("draft") },
    { key: "final", label: "Final", onClick: () => handleStatusChange("final") },
    { key: "signed", label: "Signed", onClick: () => handleStatusChange("signed") },
    { key: "archived", label: "Archived", onClick: () => handleStatusChange("archived") },
  ];

  if (!selectedDocument) {
    return (
      <Modal open={visible} onCancel={onClose} footer={null} width="90%" title="Document Viewer">
        <div style={{ textAlign: "center", padding: 48 }}>
          <Spin size="large" />
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width="95%"
      title={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={onClose} />
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              style={{ width: 300 }}
            />
          ) : (
            <Text strong>{selectedDocument.title}</Text>
          )}
          <Tag color={statusColors[selectedDocument.status]}>
            {selectedDocument.status?.toUpperCase()}
          </Tag>
        </Space>
      }
    >
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Space>
              <Dropdown menu={{ items: getStatusMenuItems() }}>
                <Button>Change Status</Button>
              </Dropdown>
              <Dropdown menu={{ items: getExportMenuItems() }}>
                <Button icon={<DownloadOutlined />} loading={isExporting}>
                  Export
                </Button>
              </Dropdown>
              <Button
                icon={<PrinterOutlined />}
                onClick={() => window.print()}
              >
                Print
              </Button>
            </Space>
            {isEditing ? (
              <Space>
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(selectedDocument.title);
                    setEditContent(selectedDocument.content);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveEdit}
                >
                  Save
                </Button>
              </Space>
            ) : (
              <Button
                icon={<EditOutlined />}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>

          {isEditing ? (
            <Input.TextArea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={25}
              style={{
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 14,
                lineHeight: 1.8,
              }}
            />
          ) : (
            <div
              className="document-content"
              style={{
                background: "#fff",
                padding: 48,
                minHeight: 600,
                fontFamily: "'Times New Roman', Times, serif",
                fontSize: 14,
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
                border: "1px solid #e8e8e8",
              }}
            >
              {selectedDocument.content}
            </div>
          )}
        </div>

        <Card
          title="Document Details"
          size="small"
          style={{ width: 300 }}
        >
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Template">
              {selectedDocument.templateId?.title || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Matter">
              {selectedDocument.matterId?.matterNumber || "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Client">
              {selectedDocument.clientId
                ? `${selectedDocument.clientId.firstName} ${selectedDocument.clientId.lastName}`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Generated By">
              {selectedDocument.generatedBy
                ? `${selectedDocument.generatedBy.firstName} ${selectedDocument.generatedBy.lastName}`
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {dayjs(selectedDocument.createdAt).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Updated">
              {dayjs(selectedDocument.updatedAt).format("DD/MM/YYYY HH:mm")}
            </Descriptions.Item>
            <Descriptions.Item label="Exports">
              {selectedDocument.exports?.length || 0} times
            </Descriptions.Item>
          </Descriptions>

          {selectedDocument.exports?.length > 0 && (
            <>
              <Divider>Export History</Divider>
              {selectedDocument.exports.map((exp, index) => (
                <div key={index} style={{ marginBottom: 4 }}>
                  <Text type="secondary">
                    {exp.format.toUpperCase()} - {dayjs(exp.exportedAt).format("DD/MM/YYYY")}
                  </Text>
                </div>
              ))}
            </>
          )}
        </Card>
      </div>
    </Modal>
  );
};

export default DocumentViewer;
