import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Tag,
  Modal,
  Upload,
  Typography,
  Space,
  Spin,
  message,
  Descriptions,
  Divider,
  Statistic,
  Alert,
  Input,
  InputNumber,
  Select,
  Form,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  UploadOutlined,
  FileProtectOutlined,
  CheckCircleOutlined,
  LockOutlined,
  EyeOutlined,
  DownloadOutlined,
  DollarOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  LinkOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchProtectedDocuments,
  uploadProtectedDocument,
  confirmPayment,
  downloadWatermarked,
  fetchStats,
  updateProtectedDocument,
  deleteProtectedDocument,
  selectProtectedDocuments,
  selectFeeProtectorStats,
  selectFeeProtectorLoading,
  selectFeeProtectorActionLoading,
} from "../../redux/features/feeProtector/feeProtectorSlice";

const { Title, Text } = Typography;
const { TextArea } = Input;

const FeeProtectorUploadModal = ({
  visible,
  onClose,
  onSuccess,
  loading,
  clients,
}) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      if (!file) {
        message.error("Please select a file");
        return;
      }
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", values.title || file.name);
      formData.append("amount", values.amount || 0);
      formData.append("notes", values.notes || "");
      formData.append("clientId", values.clientId || "");
      formData.append("entityType", "other");
      await dispatch(uploadProtectedDocument(formData)).unwrap();
      message.success("Document uploaded and protected successfully!");
      form.resetFields();
      setFile(null);
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      title="Upload Protected Document"
      open={visible}
      onCancel={onClose}
      onOk={handleUpload}
      okText="Upload & Protect"
      confirmLoading={uploading || loading}
      width={600}>
      <Form form={form} layout="vertical">
        <Alert
          message="How Fee Protector Works"
          description={
            <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
              <li>Upload your document and set the amount client must pay</li>
              <li>
                Document gets watermarked - client can preview but not download
                clean version
              </li>
              <li>
                Once payment is confirmed, client gets access to clean document
              </li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          label="Document Title"
          name="title"
          rules={[{ required: true, message: "Enter document title" }]}>
          <Input placeholder="e.g., CAC Certificate for ABC Ltd" />
        </Form.Item>

        <Form.Item label="Client" name="clientId">
          <Select
            placeholder="Select client (optional)"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={clients?.map((c) => ({
              value: c._id,
              label: `${c.firstName} ${c.lastName}`,
            }))}
          />
        </Form.Item>

        <Form.Item
          label="Amount (₦)"
          name="amount"
          rules={[{ required: true, message: "Enter amount" }]}>
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            placeholder="50000"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
          />
        </Form.Item>

        <Form.Item label="Notes / Description" name="notes">
          <TextArea
            rows={2}
            placeholder="Brief description for internal use..."
          />
        </Form.Item>

        <Divider>Upload Document</Divider>

        <Upload.Dragger
          accept=".pdf,.doc,.docx"
          maxCount={1}
          beforeUpload={(f) => {
            setFile(f);
            return false;
          }}
          showUploadList={false}>
          <p>
            <UploadOutlined style={{ fontSize: 40, color: "#3b82f6" }} />
          </p>
          <p>Click or drag file to upload</p>
          <Text type="secondary">PDF, DOC, DOCX supported (max 20MB)</Text>
        </Upload.Dragger>
        {file && (
          <div style={{ marginTop: 12, textAlign: "center" }}>
            <Tag icon={<FileProtectOutlined />} color="blue">
              {file.name}
            </Tag>
            <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </Text>
          </div>
        )}
      </Form>
    </Modal>
  );
};

const EditDocumentModal = ({
  visible,
  onClose,
  onSuccess,
  loading,
  doc,
  clients,
}) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  useEffect(() => {
    if (doc && visible) {
      form.setFieldsValue({
        title: doc.name,
        amount: doc.protectedDocument?.balanceAmount,
        notes: doc.protectedDocument?.notes,
        clientId: doc.clientId?._id,
      });
    }
  }, [doc, visible, form]);

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      await dispatch(
        updateProtectedDocument({
          id: doc._id,
          data: {
            amount: values.amount,
            notes: values.notes,
            clientId: values.clientId,
          },
        }),
      ).unwrap();
      message.success("Document updated");
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err?.message || "Update failed");
    }
  };

  return (
    <Modal
      title="Edit Document"
      open={visible}
      onCancel={onClose}
      onOk={handleUpdate}
      confirmLoading={loading}
      width={500}>
      <Form form={form} layout="vertical">
        <Form.Item label="Title" name="title">
          <Input disabled />
        </Form.Item>
        <Form.Item label="Client" name="clientId">
          <Select
            placeholder="Select client"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={clients?.map((c) => ({
              value: c._id,
              label: `${c.firstName} ${c.lastName}`,
            }))}
          />
        </Form.Item>
        <Form.Item label="Amount (₦)" name="amount">
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
          />
        </Form.Item>
        <Form.Item label="Notes" name="notes">
          <TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const ShareModal = ({ visible, onClose, doc }) => {
  if (!doc) return null;

  const previewUrl = `${window.location.origin}/preview/${doc._id}`;
  const downloadUrl = `${window.location.origin}/download/${doc._id}`;

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    message.success(`${label} copied to clipboard!`);
  };

  return (
    <Modal
      title="Share Document"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}>
      <Alert
        message="Share these links with your client"
        description={
          <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
            <li>
              <strong>Preview Link:</strong> Client can view watermarked
              document
            </li>
            <li>
              <strong>Download Link:</strong> Only works after payment is
              confirmed
            </li>
          </ul>
        }
        type="info"
        style={{ marginBottom: 16 }}
      />

      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Document">{doc.name}</Descriptions.Item>
        <Descriptions.Item label="Amount Due">
          <Text strong style={{ color: "#f59e0b" }}>
            ₦{(doc.protectedDocument?.balanceAmount || 0).toLocaleString()}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag
            color={doc.protectedDocument?.isBalancePaid ? "green" : "orange"}>
            {doc.protectedDocument?.isBalancePaid
              ? "PAID - Clean Download Available"
              : "PENDING PAYMENT"}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      <Divider>Links for Client</Divider>

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Preview Link (Watermarked)
        </Text>
        <Input.Group compact>
          <Input
            value={previewUrl}
            style={{ width: "calc(100% - 100px)" }}
            readOnly
          />
          <Button
            icon={<CopyOutlined />}
            onClick={() => handleCopy(previewUrl, "Preview link")}>
            Copy
          </Button>
        </Input.Group>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Client can view watermarked preview but cannot download
        </Text>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Download Link (Clean Document)
        </Text>
        <Input.Group compact>
          <Input
            value={downloadUrl}
            style={{ width: "calc(100% - 100px)" }}
            readOnly
          />
          <Button
            icon={<CopyOutlined />}
            onClick={() => handleCopy(downloadUrl, "Download link")}>
            Copy
          </Button>
        </Input.Group>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Only works after you confirm payment
        </Text>
      </div>

      <Divider>Send via Email</Divider>

      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={() => {
          const subject = encodeURIComponent(`Document: ${doc.name}`);
          const body = encodeURIComponent(
            `Dear Client,\n\nPlease find the document "${doc.name}" attached.\n\nAmount Due: ₦${(doc.protectedDocument?.balanceAmount || 0).toLocaleString()}\n\nPreview: ${previewUrl}\n\nDownload (after payment): ${downloadUrl}\n\nRegards`,
          );
          window.open(`mailto:?subject=${subject}&body=${body}`);
        }}>
        Compose Email to Client
      </Button>
    </Modal>
  );
};

const FeeProtectorPage = () => {
  const dispatch = useDispatch();
  const documents = useSelector(selectProtectedDocuments);
  const stats = useSelector(selectFeeProtectorStats);
  const loading = useSelector(selectFeeProtectorLoading);
  const actionLoading = useSelector(selectFeeProtectorActionLoading);

  const [uploadVisible, setUploadVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    dispatch(fetchProtectedDocuments());
    dispatch(fetchStats());
    fetchClients();
  }, [dispatch]);

  const fetchClients = async () => {
    try {
      const apiService = (await import("../../services/api")).default;
      const response = await apiService.get("/users/clients");
      setClients(response?.data || response || []);
    } catch (err) {
      console.log("No clients found, using empty list");
      setClients([]);
    }
  };

  const handleConfirmPayment = async (doc) => {
    try {
      await dispatch(
        confirmPayment({
          id: doc._id,
          data: { transactionRef: `TXN-${Date.now()}` },
        }),
      ).unwrap();
      message.success(
        "Payment confirmed! Client can now download clean document.",
      );
      dispatch(fetchProtectedDocuments());
      dispatch(fetchStats());
    } catch (err) {
      message.error(err?.message || "Failed to confirm payment");
    }
  };

  const handleDownload = async (doc) => {
    try {
      const baseUrl =
        import.meta.env.VITE_BASE_URL?.replace(/\/api\/v1\/?$/, "") ||
        "http://localhost:3000";
      const token =
        localStorage.getItem("jwt") || sessionStorage.getItem("jwt");

      const response = await fetch(
        `${baseUrl}/api/v1/fee-protector/${doc._id}/download`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name || "document.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success("Download complete!");
    } catch (err) {
      message.error(
        err?.message || "Download failed. Payment may be required.",
      );
    }
  };

  const handleDelete = async (doc) => {
    try {
      await dispatch(deleteProtectedDocument(doc._id)).unwrap();
      message.success("Document deleted");
      dispatch(fetchProtectedDocuments());
      dispatch(fetchStats());
    } catch (err) {
      message.error(err?.message || "Delete failed");
    }
  };

  const handleShare = (doc) => {
    setSelectedDoc(doc);
    setShareVisible(true);
  };

  const handleEdit = (doc) => {
    setSelectedDoc(doc);
    setEditVisible(true);
  };

  const columns = [
    {
      title: "Document",
      key: "name",
      render: (_, r) => (
        <div>
          <Text strong>{r.name}</Text>
          {r.clientId && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Client: {r.clientId.firstName} {r.clientId.lastName}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      width: 120,
      render: (_, r) => (
        <Text strong style={{ color: "#f59e0b" }}>
          ₦{(r.protectedDocument?.balanceAmount || 0).toLocaleString()}
        </Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 150,
      render: (_, r) => (
        <Tag
          color={r.protectedDocument?.isBalancePaid ? "green" : "orange"}
          icon={
            r.protectedDocument?.isBalancePaid ? (
              <CheckCircleOutlined />
            ) : (
              <LockOutlined />
            )
          }>
          {r.protectedDocument?.isBalancePaid ? "PAID" : "PENDING"}
        </Tag>
      ),
    },
    {
      title: "Uploaded",
      key: "date",
      width: 100,
      render: (_, r) => dayjs(r.createdAt).format("DD MMM YY"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="Share with client">
            <Button
              size="small"
              icon={<LinkOutlined />}
              onClick={() => handleShare(r)}
            />
          </Tooltip>
          <Tooltip title="Edit details">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(r)}
            />
          </Tooltip>
          <Tooltip title="Preview">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => window.open(`/preview/${r._id}`, "_blank")}
            />
          </Tooltip>
          <Tooltip title="Download">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(r)}
            />
          </Tooltip>
          {!r.protectedDocument?.isBalancePaid && (
            <Tooltip title="Confirm payment received">
              <Button
                size="small"
                type="primary"
                icon={<DollarOutlined />}
                onClick={() => handleConfirmPayment(r)}>
                Paid
              </Button>
            </Tooltip>
          )}
          <Popconfirm
            title="Delete this document?"
            onConfirm={() => handleDelete(r)}
            okText="Delete"
            okType="danger">
            <Tooltip title="Delete">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#f1f5f9", minHeight: "100vh" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Fee Protector
          </Title>
          <Text type="secondary">
            Protect documents with watermarks until payment is confirmed
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              dispatch(fetchProtectedDocuments());
              dispatch(fetchStats());
            }}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadVisible(true)}>
            Upload & Protect
          </Button>
        </Space>
      </div>

      <Alert
        message="How it works"
        description={
          <span>
            Upload documents, set an amount, and share with clients. They see a
            watermarked preview but must pay before downloading the clean
            version. Confirm payment to release the document.
          </span>
        }
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Total Documents"
              value={stats?.totalProtected || 0}
              prefix={<FileProtectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Pending Payment"
              value={stats?.totalUnpaid || 0}
              valueStyle={{ color: "#f59e0b" }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Paid & Released"
              value={stats?.totalPaid || 0}
              valueStyle={{ color: "#10b981" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={`₦${(stats?.totalAmount || 0).toLocaleString()}`}
              prefix={<LockOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Protected Documents"
        extra={<Text type="secondary">{documents.length} document(s)</Text>}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <FileProtectOutlined
              style={{ fontSize: 48, color: "#ccc", marginBottom: 16 }}
            />
            <div>
              <Text type="secondary">No protected documents yet</Text>
            </div>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              style={{ marginTop: 16 }}
              onClick={() => setUploadVisible(true)}>
              Upload Your First Document
            </Button>
          </div>
        ) : (
          <Table
            dataSource={documents}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <FeeProtectorUploadModal
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onSuccess={() => {
          dispatch(fetchProtectedDocuments());
          dispatch(fetchStats());
        }}
        loading={actionLoading}
        clients={clients}
      />

      <EditDocumentModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        onSuccess={() => {
          dispatch(fetchProtectedDocuments());
          dispatch(fetchStats());
        }}
        loading={actionLoading}
        doc={selectedDoc}
        clients={clients}
      />

      <ShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        doc={selectedDoc}
      />
    </div>
  );
};

export default FeeProtectorPage;
