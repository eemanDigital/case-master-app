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
  Badge,
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
  CloseCircleOutlined,
  BankOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchProtectedDocuments,
  uploadProtectedDocument,
  confirmPayment,
  revokePayment,
  updateProtectedDocument,
  deleteProtectedDocument,
  fetchStats,
  selectProtectedDocuments,
  selectFeeProtectorStats,
  selectFeeProtectorLoading,
  selectFeeProtectorActionLoading,
} from "../../redux/features/feeProtector/feeProtectorSlice";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// ─── Upload Modal ───────────────────────────────────────────────────────────

const UploadModal = ({ visible, onClose, onSuccess, loading, clients }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      if (!file) return message.error("Please select a file to upload");
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", values.title || file.name);
      fd.append("amount", values.amount || 0);
      fd.append("notes", values.notes || "");
      if (values.clientId) fd.append("clientId", values.clientId);
      fd.append("entityType", "other");
      await dispatch(uploadProtectedDocument(fd)).unwrap();
      message.success("Document uploaded and protected!");
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

  const handleClose = () => {
    form.resetFields();
    setFile(null);
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <FileProtectOutlined /> Upload Protected Document
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      onOk={handleUpload}
      okText="Upload & Protect"
      confirmLoading={uploading || loading}
      width={600}
      destroyOnClose>
      <Alert
        message="How Fee Protector works"
        description={
          <ul style={{ margin: "8px 0", paddingLeft: 20 }}>
            <li>Upload your document and set the amount the client must pay</li>
            <li>
              Share the generated link — client sees a watermarked preview only
            </li>
            <li>
              Once you confirm payment, the client can download the clean
              document
            </li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical">
        <Form.Item
          label="Document Title"
          name="title"
          rules={[{ required: true, message: "Enter a document title" }]}>
          <Input placeholder="e.g. CAC Certificate for ABC Ltd" />
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
          rules={[{ required: true, message: "Enter the amount due" }]}>
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            placeholder="50000"
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(v) => v.replace(/₦\s?|(,*)/g, "")}
          />
        </Form.Item>

        <Form.Item label="Notes" name="notes">
          <TextArea
            rows={2}
            placeholder="Internal notes about this document..."
          />
        </Form.Item>

        <Divider>Select File</Divider>

        <Upload.Dragger
          accept=".pdf,.doc,.docx"
          maxCount={1}
          beforeUpload={(f) => {
            setFile(f);
            return false;
          }}
          onRemove={() => setFile(null)}
          showUploadList={!!file}>
          <p>
            <UploadOutlined style={{ fontSize: 36, color: "#3b82f6" }} />
          </p>
          <p style={{ margin: "8px 0 4px" }}>Click or drag file here</p>
          <Text type="secondary">PDF, DOC, DOCX — max 20MB</Text>
        </Upload.Dragger>
      </Form>
    </Modal>
  );
};

// ─── Edit Modal ─────────────────────────────────────────────────────────────

const EditModal = ({ visible, onClose, onSuccess, loading, doc, clients }) => {
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
            clientId: values.clientId || null,
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
      width={500}
      destroyOnClose>
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
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(v) => v.replace(/₦\s?|(,*)/g, "")}
          />
        </Form.Item>
        <Form.Item label="Notes" name="notes">
          <TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ─── Confirm Payment Modal ──────────────────────────────────────────────────

const ConfirmPaymentModal = ({ visible, onClose, onSuccess, loading, doc }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [confirming, setConfirming] = useState(false);

  if (!doc) return null;

  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();
      setConfirming(true);
      await dispatch(
        confirmPayment({
          id: doc._id,
          data: {
            paymentMethod: values.paymentMethod,
            transactionRef: values.transactionRef || `MANUAL-${Date.now()}`,
            notes: values.notes || "",
          },
        }),
      ).unwrap();
      message.success(
        "Payment confirmed! Client can now download the clean document.",
      );
      form.resetFields();
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err?.message || "Failed to confirm payment");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined style={{ color: "#10b981" }} /> Confirm Payment
        </Space>
      }
      open={visible}
      onCancel={onClose}
      onOk={handleConfirm}
      okText="Confirm Payment Received"
      okButtonProps={{
        style: { background: "#10b981", borderColor: "#10b981" },
      }}
      confirmLoading={confirming || loading}
      width={500}
      destroyOnClose>
      <Alert
        message="Manual payment confirmation"
        description="Use this when the client has paid by bank transfer, cash, or cheque. Once confirmed, the client's download link will unlock immediately."
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />

      <Descriptions
        bordered
        column={1}
        size="small"
        style={{ marginBottom: 20 }}>
        <Descriptions.Item label="Document">{doc.name}</Descriptions.Item>
        <Descriptions.Item label="Amount Due">
          <Text strong style={{ color: "#f59e0b", fontSize: 16 }}>
            ₦{(doc.protectedDocument?.balanceAmount || 0).toLocaleString()}
          </Text>
        </Descriptions.Item>
        {doc.clientId && (
          <Descriptions.Item label="Client">
            {doc.clientId.firstName} {doc.clientId.lastName}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Form form={form} layout="vertical">
        <Form.Item
          label="Payment Method"
          name="paymentMethod"
          rules={[{ required: true, message: "Select payment method" }]}
          initialValue="bank_transfer">
          <Select>
            <Select.Option value="bank_transfer">
              <Space>
                <BankOutlined /> Bank Transfer
              </Space>
            </Select.Option>
            <Select.Option value="cash">
              <Space>
                <DollarOutlined /> Cash
              </Space>
            </Select.Option>
            <Select.Option value="cheque">Cheque</Select.Option>
            <Select.Option value="pos">POS / Card</Select.Option>
            <Select.Option value="other">Other</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Transaction Reference / Receipt No."
          name="transactionRef"
          extra="Optional — helps with your records">
          <Input placeholder="e.g. TRF2024112301 or Receipt #001" />
        </Form.Item>

        <Form.Item label="Internal Notes" name="notes">
          <TextArea rows={2} placeholder="Any notes about this payment..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

// ─── Share Modal ────────────────────────────────────────────────────────────

const ShareModal = ({ visible, onClose, doc }) => {
  if (!doc) return null;

  const origin = window.location.origin;
  const previewUrl = `${origin}/preview/${doc._id}`;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${label} copied to clipboard`);
    });
  };

  const composeEmail = () => {
    const clientName = doc.clientId
      ? `${doc.clientId.firstName} ${doc.clientId.lastName}`
      : "Valued Client";
    const amount = (doc.protectedDocument?.balanceAmount || 0).toLocaleString();
    const subject = encodeURIComponent(`Your Document is Ready — ${doc.name}`);
    const body = encodeURIComponent(
      `Dear ${clientName},\n\n` +
        `Please find your document "${doc.name}" available for preview at the link below.\n\n` +
        `Amount Due: ₦${amount}\n\n` +
        `Preview & Download Link:\n${previewUrl}\n\n` +
        `You will be able to download the clean document once payment of ₦${amount} has been confirmed.\n\n` +
        `To make payment, please use the following details:\n` +
        `[ADD YOUR BANK DETAILS HERE]\n\n` +
        `Once payment is received, your download link will be activated automatically.\n\n` +
        `Regards`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <Modal
      title={
        <Space>
          <LinkOutlined /> Share Document Link
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={580}>
      <Alert
        message="One link does everything"
        description="Send the client this single link. They can preview the watermarked document now. Once you confirm payment, the same link unlocks the clean download — no second link needed."
        type="info"
        style={{ marginBottom: 20 }}
      />

      <Descriptions
        bordered
        column={1}
        size="small"
        style={{ marginBottom: 20 }}>
        <Descriptions.Item label="Document">
          <Text strong>{doc.name}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Amount Due">
          <Text strong style={{ color: "#f59e0b" }}>
            ₦{(doc.protectedDocument?.balanceAmount || 0).toLocaleString()}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <Tag
            color={doc.protectedDocument?.isBalancePaid ? "green" : "orange"}>
            {doc.protectedDocument?.isBalancePaid
              ? "PAID — Download Unlocked"
              : "PENDING PAYMENT"}
          </Tag>
        </Descriptions.Item>
      </Descriptions>

      <Text strong style={{ display: "block", marginBottom: 8 }}>
        Client Link (Preview + Download)
      </Text>
      <Space.Compact style={{ width: "100%", marginBottom: 4 }}>
        <Input value={previewUrl} readOnly />
        <Button
          icon={<CopyOutlined />}
          onClick={() => copyToClipboard(previewUrl, "Link")}>
          Copy
        </Button>
      </Space.Compact>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Client sees watermarked preview. Download activates after you confirm
        payment.
      </Text>

      <Divider />

      <Space>
        <Button type="primary" icon={<SendOutlined />} onClick={composeEmail}>
          Compose Email to Client
        </Button>
        <Button
          icon={<CopyOutlined />}
          onClick={() => copyToClipboard(previewUrl, "Link")}>
          Copy Link
        </Button>
      </Space>
    </Modal>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────

const FeeProtectorPage = () => {
  const dispatch = useDispatch();
  const documents = useSelector(selectProtectedDocuments);
  const stats = useSelector(selectFeeProtectorStats);
  const loading = useSelector(selectFeeProtectorLoading);
  const actionLoading = useSelector(selectFeeProtectorActionLoading);

  const [uploadVisible, setUploadVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [clients, setClients] = useState([]);

  const refresh = () => {
    dispatch(fetchProtectedDocuments());
    dispatch(fetchStats());
  };

  useEffect(() => {
    refresh();
    loadClients();
  }, [dispatch]);

  const loadClients = async () => {
    try {
      const api = (await import("../../services/api")).default;
      const res = await api.get("/users/clients");
      setClients(res?.data || res || []);
    } catch {
      setClients([]);
    }
  };

  const openConfirm = (doc) => {
    setSelectedDoc(doc);
    setConfirmVisible(true);
  };
  const openEdit = (doc) => {
    setSelectedDoc(doc);
    setEditVisible(true);
  };
  const openShare = (doc) => {
    setSelectedDoc(doc);
    setShareVisible(true);
  };

  const handleRevoke = async (doc) => {
    try {
      await dispatch(revokePayment(doc._id)).unwrap();
      message.success("Payment confirmation revoked");
      refresh();
    } catch (err) {
      message.error(err?.message || "Failed to revoke payment");
    }
  };

  const handleDelete = async (doc) => {
    try {
      await dispatch(deleteProtectedDocument(doc._id)).unwrap();
      message.success("Document deleted");
      refresh();
    } catch (err) {
      message.error(err?.message || "Delete failed");
    }
  };

  const handleDownload = async (doc) => {
    try {
      const baseUrl =
        import.meta.env.VITE_BASE_URL?.replace(/\/api\/v1\/?$/, "") ||
        "http://localhost:3000";
      const token =
        localStorage.getItem("jwt") || sessionStorage.getItem("jwt");
      const res = await fetch(
        `${baseUrl}/api/v1/fee-protector/${doc._id}/download`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name || "document.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success("Download complete");
    } catch (err) {
      message.error(err?.message || "Download failed");
    }
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
                {r.clientId.firstName} {r.clientId.lastName}
              </Text>
            </div>
          )}
          {r.protectedDocument?.notes && (
            <div>
              <Text
                type="secondary"
                style={{ fontSize: 11, fontStyle: "italic" }}>
                {r.protectedDocument.notes}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Amount Due",
      key: "amount",
      width: 130,
      render: (_, r) => (
        <Text strong style={{ color: "#f59e0b" }}>
          ₦{(r.protectedDocument?.balanceAmount || 0).toLocaleString()}
        </Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 160,
      render: (_, r) => {
        const paid = r.protectedDocument?.isBalancePaid;
        return (
          <div>
            <Tag
              color={paid ? "green" : "orange"}
              icon={paid ? <CheckCircleOutlined /> : <LockOutlined />}>
              {paid ? "PAID" : "PENDING"}
            </Tag>
            {paid && r.protectedDocument?.paymentMethod && (
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  via {r.protectedDocument.paymentMethod.replace("_", " ")}
                </Text>
              </div>
            )}
            {paid && r.protectedDocument?.balancePaidAt && (
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {dayjs(r.protectedDocument.balancePaidAt).format("DD MMM YY")}
                </Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Uploaded",
      key: "date",
      width: 90,
      render: (_, r) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(r.createdAt).format("DD MMM YY")}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 300,
      render: (_, r) => {
        const paid = r.protectedDocument?.isBalancePaid;
        return (
          <Space size={4} wrap>
            <Tooltip title="Share link with client">
              <Button
                size="small"
                icon={<LinkOutlined />}
                onClick={() => openShare(r)}
              />
            </Tooltip>
            <Tooltip title="Edit details">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEdit(r)}
              />
            </Tooltip>
            <Tooltip title="Preview document">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => window.open(`/preview/${r._id}`, "_blank")}
              />
            </Tooltip>
            <Tooltip title="Download (admin)">
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(r)}
              />
            </Tooltip>

            {!paid ? (
              <Tooltip title="Confirm payment received">
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => openConfirm(r)}
                  style={{ background: "#10b981", borderColor: "#10b981" }}>
                  Confirm Payment
                </Button>
              </Tooltip>
            ) : (
              <Popconfirm
                title="Revoke payment confirmation?"
                description="This will lock the document again until payment is re-confirmed."
                onConfirm={() => handleRevoke(r)}
                okText="Revoke"
                okType="danger">
                <Tooltip title="Revoke payment (e.g. bounced cheque)">
                  <Button size="small" icon={<CloseCircleOutlined />} danger>
                    Revoke
                  </Button>
                </Tooltip>
              </Popconfirm>
            )}

            <Popconfirm
              title="Delete this document?"
              description="This cannot be undone."
              onConfirm={() => handleDelete(r)}
              okText="Delete"
              okType="danger">
              <Tooltip title="Delete">
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const pending = documents.filter(
    (d) => !d.protectedDocument?.isBalancePaid,
  ).length;

  return (
    <div style={{ padding: 24, background: "#f1f5f9", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            Fee Protector
            {pending > 0 && (
              <Badge
                count={pending}
                style={{ marginLeft: 10, background: "#f59e0b" }}
              />
            )}
          </Title>
          <Text type="secondary">
            Watermark documents and release them only after payment is confirmed
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refresh}>
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

      {/* How it works */}
      <Alert
        message="Manual payment flow"
        description={
          <span>
            Upload a document → share the link with your client → client
            previews the watermarked version → client pays by bank transfer,
            cash, or POS → click <strong>Confirm Payment</strong> on the
            document → client's download link unlocks automatically.
          </span>
        }
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined />}
        style={{ marginBottom: 24 }}
        closable
      />

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Total Protected"
              value={stats?.totalProtected || 0}
              prefix={<FileProtectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Awaiting Payment"
              value={stats?.totalUnpaid || 0}
              valueStyle={{ color: "#f59e0b" }}
              prefix={<LockOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Payment Confirmed"
              value={stats?.totalPaid || 0}
              valueStyle={{ color: "#10b981" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={`₦${(stats?.totalAmount || 0).toLocaleString()}`}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card
        title="Protected Documents"
        extra={
          <Space>
            <Text type="secondary">{documents.length} document(s)</Text>
            {pending > 0 && (
              <Tag color="orange" icon={<InfoCircleOutlined />}>
                {pending} awaiting payment
              </Tag>
            )}
          </Space>
        }>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : documents.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <FileProtectOutlined
              style={{
                fontSize: 48,
                color: "#ccc",
                display: "block",
                marginBottom: 16,
              }}
            />
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 16 }}>
              No protected documents yet
            </Text>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadVisible(true)}>
              Upload Your First Document
            </Button>
          </div>
        ) : (
          <Table
            dataSource={documents}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 20, showSizeChanger: true }}
            rowClassName={(r) =>
              !r.protectedDocument?.isBalancePaid ? "row-pending" : ""
            }
          />
        )}
      </Card>

      {/* Modals */}
      <UploadModal
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onSuccess={refresh}
        loading={actionLoading}
        clients={clients}
      />
      <EditModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        onSuccess={refresh}
        loading={actionLoading}
        doc={selectedDoc}
        clients={clients}
      />
      <ShareModal
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        doc={selectedDoc}
      />
      <ConfirmPaymentModal
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        onSuccess={refresh}
        loading={actionLoading}
        doc={selectedDoc}
      />
    </div>
  );
};

export default FeeProtectorPage;
