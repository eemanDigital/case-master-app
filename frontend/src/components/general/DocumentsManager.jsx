import React, { useState, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Switch,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  addDocument,
  updateDocumentStatus,
  deleteDocument,
} from "../../redux/features/general/generalSlice";
import { DOCUMENT_TYPES } from "../../utils/generalConstants";

const { Option } = Select;

const DocumentsManager = ({ matterId }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);

  const selectedDetails = useSelector((state) => state.general.selectedDetails);
  const generalDetail = selectedDetails?.generalDetail || selectedDetails;
  const actionLoading = useSelector((state) => state.general.actionLoading);

  const documents = generalDetail?.documentsReceived || [];

  const handleAdd = useCallback(() => {
    setEditingDocument(null);
    form.resetFields();
    setModalVisible(true);
  }, [form]);

  const handleUpdateStatus = useCallback(
    (document) => {
      setEditingDocument(document);
      form.setFieldsValue({
        receivedDate: document.receivedDate
          ? dayjs(document.receivedDate)
          : null,
        returnDate: document.returnDate ? dayjs(document.returnDate) : null,
        receiptNumber: document.receiptNumber,
      });
      setStatusModalVisible(true);
    },
    [form],
  );

  const handleDelete = useCallback(
    async (documentId) => {
      Modal.confirm({
        title: "Delete Document",
        content: "Are you sure you want to remove this document?",
        okText: "Delete",
        okType: "danger",
        onOk: async () => {
          try {
            await dispatch(deleteDocument({ matterId, documentId })).unwrap();
            message.success("Document deleted successfully");
          } catch (error) {
            message.error(error || "Failed to delete document");
          }
        },
      });
    },
    [dispatch, matterId],
  );

  const handleSubmit = useCallback(
    async (values) => {
      try {
        const data = {
          docName: values.docName,
          docType: values.docType,
          originalKeptByFirm: values.originalKeptByFirm,
          receivedDate: values.receivedDate?.toISOString(),
        };

        await dispatch(addDocument({ matterId, data })).unwrap();
        message.success("Document added successfully");
        setModalVisible(false);
        form.resetFields();
      } catch (error) {
        message.error(error || "Failed to add document");
      }
    },
    [dispatch, matterId, form],
  );

  const handleStatusUpdate = useCallback(
    async (values) => {
      try {
        const data = {
          receivedDate: values.receivedDate?.toISOString(),
          returnDate: values.returnDate?.toISOString(),
          receiptNumber: values.receiptNumber,
        };

        await dispatch(
          updateDocumentStatus({
            matterId,
            documentId: editingDocument._id,
            data,
          }),
        ).unwrap();
        message.success("Document status updated successfully");
        setStatusModalVisible(false);
        form.resetFields();
      } catch (error) {
        message.error(error || "Failed to update document");
      }
    },
    [dispatch, matterId, editingDocument, form],
  );

  const columns = [
    {
      title: "Document Name",
      dataIndex: "docName",
      key: "docName",
      width: "30%",
      render: (name) => (
        <Space>
          <FileTextOutlined />
          <strong>{name}</strong>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "docType",
      key: "docType",
      width: "15%",
      render: (type) => {
        const docType = DOCUMENT_TYPES.find((t) => t.value === type);
        return <Tag color="blue">{docType?.label || type}</Tag>;
      },
    },
    {
      title: "Received Date",
      dataIndex: "receivedDate",
      key: "receivedDate",
      width: "15%",
      render: (date) =>
        date ? dayjs(date).format("DD MMM YYYY") : "Not received",
    },
    {
      title: "Return Date",
      dataIndex: "returnDate",
      key: "returnDate",
      width: "15%",
      render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "N/A"),
    },
    {
      title: "Original Kept",
      dataIndex: "originalKeptByFirm",
      key: "originalKeptByFirm",
      width: "10%",
      render: (kept) =>
        kept ? (
          <CheckCircleOutlined style={{ color: "#52c41a" }} />
        ) : (
          <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
        ),
    },
    {
      title: "Receipt #",
      dataIndex: "receiptNumber",
      key: "receiptNumber",
      width: "10%",
    },
    {
      title: "Actions",
      key: "actions",
      width: "5%",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleUpdateStatus(record)}
          />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  const summary = {
    total: documents.length,
    received: documents.filter((d) => d.receivedDate).length,
    pending: documents.filter((d) => !d.receivedDate).length,
    originalKept: documents.filter((d) => d.originalKeptByFirm).length,
  };

  return (
    <div>
      <Card
        title="Documents Received"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Document
          </Button>
        }
        style={{ marginBottom: 16 }}>
        <Space size="large" style={{ marginBottom: 16 }}>
          <span>
            Total: <strong>{summary.total}</strong>
          </span>
          <span>
            Received: <Tag color="green">{summary.received}</Tag>
          </span>
          <span>
            Pending: <Tag color="orange">{summary.pending}</Tag>
          </span>
          <span>
            Original Kept: <Tag color="blue">{summary.originalKept}</Tag>
          </span>
        </Space>

        <Table
          columns={columns}
          dataSource={documents}
          rowKey={(record) => record._id}
          loading={actionLoading}
          pagination={false}
          locale={{ emptyText: "No documents added yet" }}
        />
      </Card>

      {/* Add Document Modal */}
      <Modal
        title="Add Document"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={actionLoading}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="docName"
            label="Document Name"
            rules={[{ required: true, message: "Please enter document name" }]}>
            <Input placeholder="e.g., Certificate of Incorporation" />
          </Form.Item>

          <Form.Item
            name="docType"
            label="Document Type"
            rules={[
              { required: true, message: "Please select document type" },
            ]}>
            <Select>
              {DOCUMENT_TYPES.map((t) => (
                <Option key={t.value} value={t.value}>
                  {t.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="originalKeptByFirm"
            label="Original Kept by Firm"
            valuePropName="checked"
            initialValue={false}>
            <Switch />
          </Form.Item>

          <Form.Item name="receivedDate" label="Received Date">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        title="Update Document Status"
        open={statusModalVisible}
        onCancel={() => {
          setStatusModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={actionLoading}>
        <Form form={form} layout="vertical" onFinish={handleStatusUpdate}>
          <Form.Item name="receivedDate" label="Received Date">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="returnDate" label="Return Date (if returned)">
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="receiptNumber" label="Receipt Number">
            <Input placeholder="Receipt/acknowledgement number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DocumentsManager;
