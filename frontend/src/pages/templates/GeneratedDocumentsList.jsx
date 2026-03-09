import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Typography,
  Dropdown,
  message,
  Modal,
  Spin,
  Empty,
} from "antd";
import {
  DownloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import templateService from "../../redux/features/templates/templateService";
import {
  getGeneratedDocuments,
  updateGeneratedDocument,
  deleteTemplate,
  selectGeneratedDocuments,
  selectTemplateLoading,
  selectTemplatePagination,
  resetTemplateState,
} from "../../redux/features/templates/templateSlice";
import DocumentViewer from "../../components/templates/DocumentViewer";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;

const statusColors = {
  draft: "blue",
  final: "green",
  signed: "gold",
  archived: "default",
};

const GeneratedDocumentsList = () => {
  const dispatch = useDispatch();
  const documents = useSelector(selectGeneratedDocuments);
  const loading = useSelector(selectTemplateLoading);
  const pagination = useSelector(selectTemplatePagination);

  console.log("Generated Documents:", documents);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    fetchDocuments();
    return () => {
      dispatch(resetTemplateState());
    };
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [search, status, dateRange, pagination.current]);

  const fetchDocuments = () => {
    const params = {
      page: pagination.current,
      limit: pagination.limit,
      search: search || undefined,
      status: status || undefined,
    };
    dispatch(getGeneratedDocuments(params));
  };

  const handleSearch = (value) => {
    setSearch(value);
  };

  const handleStatusFilter = (value) => {
    setStatus(value);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleView = (record) => {
    setSelectedDoc(record);
    setViewerVisible(true);
  };

  const handleStatusChange = async (docId, newStatus) => {
    try {
      await dispatch(
        updateGeneratedDocument({
          id: docId,
          data: { status: newStatus },
        }),
      ).unwrap();
      message.success("Status updated");
      fetchDocuments();
    } catch (error) {
      message.error("Failed to update status");
    }
  };

  const handleExport = async (docId, format) => {
    try {
      const blob = await templateService.exportDocument(docId, format);

      const mimeTypes = {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        txt: "text/plain",
      };

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: mimeTypes[format] }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedDoc?.title || "document"}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success(`Exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error("Export error:", error);
      message.error("Failed to export document");
    }
  };

  const handleDelete = async (docId) => {
    Modal.confirm({
      title: "Delete Document",
      content: "Are you sure you want to delete this document?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await dispatch(deleteTemplate(docId)).unwrap();
          message.success("Document deleted");
          fetchDocuments();
        } catch (error) {
          message.error("Failed to delete document");
        }
      },
    });
  };

  const getExportMenuItems = (docId) => [
    {
      key: "pdf",
      label: "Export as PDF",
      onClick: () => handleExport(docId, "pdf"),
    },
    {
      key: "docx",
      label: "Export as Word",
      onClick: () => handleExport(docId, "docx"),
    },
    {
      key: "txt",
      label: "Export as Text",
      onClick: () => handleExport(docId, "txt"),
    },
  ];

  const columns = [
    {
      title: "Document Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Space>
          <FileTextOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Template",
      dataIndex: ["templateId", "title"],
      key: "template",
      render: (text) => text || "-",
    },
    {
      title: "Matter",
      dataIndex: ["matterId", "matterNumber"],
      key: "matter",
      render: (text) => text || "-",
    },
    {
      title: "Generated By",
      dataIndex: ["generatedBy", "firstName"],
      key: "generatedBy",
      render: (_, record) =>
        record.generatedBy
          ? `${record.generatedBy.firstName} ${record.generatedBy.lastName}`
          : "-",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "date",
      render: (date) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Select
          value={status}
          size="small"
          onChange={(value) => handleStatusChange(record._id, value)}
          style={{ width: 100 }}>
          <Select.Option value="draft">
            <Tag color="blue">Draft</Tag>
          </Select.Option>
          <Select.Option value="final">
            <Tag color="green">Final</Tag>
          </Select.Option>
          <Select.Option value="signed">
            <Tag color="gold">Signed</Tag>
          </Select.Option>
          <Select.Option value="archived">
            <Tag>Archived</Tag>
          </Select.Option>
        </Select>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleView(record)}>
            View
          </Button>
          <Dropdown menu={{ items: getExportMenuItems(record._id) }}>
            <Button icon={<DownloadOutlined />}>Export</Button>
          </Dropdown>
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>
              Generated Documents
            </Title>
            <Tag color="geekblue">{pagination.totalRecords} documents</Tag>
          </Space>
        }>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <Space wrap>
            <Search
              placeholder="Search documents..."
              allowClear
              onSearch={handleSearch}
              style={{ width: 250 }}
            />
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: 150 }}
              onChange={handleStatusFilter}>
              <Select.Option value="draft">Draft</Select.Option>
              <Select.Option value="final">Final</Select.Option>
              <Select.Option value="signed">Signed</Select.Option>
              <Select.Option value="archived">Archived</Select.Option>
            </Select>
            <RangePicker onChange={handleDateRangeChange} />
          </Space>

          {loading ? (
            <div style={{ textAlign: "center", padding: 48 }}>
              <Spin size="large" />
            </div>
          ) : documents?.length === 0 ? (
            <Empty description="No generated documents found" />
          ) : (
            <>
              <Table
                columns={columns}
                dataSource={documents}
                rowKey="_id"
                pagination={{
                  current: pagination.current,
                  total: pagination.totalRecords,
                  pageSize: pagination.limit,
                  onChange: (page) =>
                    dispatch(getGeneratedDocuments({ ...getParams(), page })),
                }}
              />
            </>
          )}
        </Space>
      </Card>

      {selectedDoc && (
        <DocumentViewer
          visible={viewerVisible}
          document={selectedDoc}
          onClose={() => {
            setViewerVisible(false);
            setSelectedDoc(null);
          }}
        />
      )}
    </div>
  );
};

export default GeneratedDocumentsList;
