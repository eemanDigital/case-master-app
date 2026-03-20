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
  Progress,
  Descriptions,
  Divider,
  Alert,
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
  DeleteOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchProtectedDocuments,
  uploadProtectedDocument,
  confirmPayment,
  verifyPayment,
  downloadWatermarked,
  fetchStats,
  selectProtectedDocuments,
  selectFeeProtectorStats,
  selectFeeProtectorLoading,
  selectFeeProtectorActionLoading,
} from "../../redux/features/feeProtector/feeProtectorSlice";

const { Title, Text, Paragraph } = Typography;

const FeeProtectorUpload = ({ visible, onClose, onSuccess, loading }) => {
  const dispatch = useDispatch();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) { message.error("Please select a file"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      await dispatch(uploadProtectedDocument(formData)).unwrap();
      message.success("Document uploaded and protected");
      setFile(null);
      onSuccess();
      onClose();
    } catch (err) {
      message.error(err || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title="Upload Protected Document" open={visible} onCancel={onClose} onOk={handleUpload} confirmLoading={uploading || loading} width={500}>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <Upload.Dragger
          accept=".pdf,.doc,.docx"
          maxCount={1}
          beforeUpload={(f) => { setFile(f); return false; }}
          showUploadList={false}>
          <p><UploadOutlined style={{ fontSize: 40, color: "#3b82f6" }} /></p>
          <p>Click or drag file to upload</p>
          <Text type="secondary">PDF, DOC, DOCX supported</Text>
        </Upload.Dragger>
        {file && (
          <div style={{ marginTop: 12 }}>
            <Tag icon={<FileProtectOutlined />} color="blue">{file.name}</Tag>
          </div>
        )}
      </div>
      <Divider />
      <Alert
        message="How it works"
        description="The document will be watermarked with the recipient's details until payment is confirmed. They'll see a preview but cannot download the clean version without payment."
        type="info"
        showIcon
      />
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
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    dispatch(fetchProtectedDocuments());
    dispatch(fetchStats());
  }, [dispatch]);

  const handleConfirmPayment = async (doc) => {
    try {
      await dispatch(confirmPayment({ id: doc._id, data: { transactionRef: `TXN-${Date.now()}` } })).unwrap();
      message.success("Payment confirmed - watermark removed");
      dispatch(fetchProtectedDocuments());
    } catch {
      message.error("Failed to confirm payment");
    }
  };

  const handleDownload = async (doc) => {
    try {
      await dispatch(downloadWatermarked(doc._id)).unwrap();
      message.success("Document downloaded");
    } catch {
      message.error("Download failed");
    }
  };

  const columns = [
    { title: "Document", dataIndex: "title", key: "title", render: (v) => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><FileProtectOutlined style={{ color: "#3b82f6" }} /><Text strong>{v}</Text></div> },
    { title: "Status", dataIndex: "paymentStatus", key: "paymentStatus", render: (v) => <Tag color={v === "paid" ? "green" : v === "pending" ? "orange" : "default"}>{v?.toUpperCase()}</Tag> },
    { title: "Fee", dataIndex: "agreedFee", key: "agreedFee", render: (v) => v ? `₦${Number(v).toLocaleString()}` : "—" },
    { title: "Client", dataIndex: "clientName", key: "clientName", render: (v) => v || "—" },
    { title: "Uploaded", dataIndex: "createdAt", key: "createdAt", render: (d) => dayjs(d).format("DD MMM YYYY") },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <Space>
          {r.paymentStatus === "protected" && (
            <Button size="small" type="primary" icon={<DollarOutlined />} onClick={() => handleConfirmPayment(r)}>
              Confirm Payment
            </Button>
          )}
          <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewDoc(r)}>Preview</Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(r)}>Download</Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');`}</style>
      <div style={{ padding: 24, background: "#f1f5f9", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <Title level={3} style={{ margin: 0, fontWeight: 800 }}>Fee Protector</Title>
            <Text type="secondary">Milestone-based document protection with watermarking</Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => { dispatch(fetchProtectedDocuments()); dispatch(fetchStats()); }}>Refresh</Button>
            <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadVisible(true)}>Upload Document</Button>
          </Space>
        </div>

        <Alert
          message="Watermarked Document Access"
          description="Protected documents show a preview with watermark until payment is confirmed. Only after payment will the clean document be available for download."
          type="info"
          showIcon
          icon={<SafetyCertificateOutlined />}
          style={{ marginBottom: 24, borderRadius: 12 }}
        />

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Protected Documents" value={stats?.protected || 0} prefix={<LockOutlined style={{ color: "#3b82f6" }} />} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Pending Payment" value={stats?.pending || 0} valueStyle={{ color: "#f59e0b" }} prefix={<DollarOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card bordered={false} style={{ borderRadius: 12 }}>
              <Statistic title="Paid & Released" value={stats?.paid || 0} valueStyle={{ color: "#10b981" }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
        </Row>

        <Card bordered={false} style={{ borderRadius: 12 }} title="Protected Documents">
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>
          ) : (
            <Table dataSource={documents} columns={columns} rowKey="_id" pagination={{ pageSize: 10 }} />
          )}
        </Card>
      </div>

      <FeeProtectorUpload
        visible={uploadVisible}
        onClose={() => setUploadVisible(false)}
        onSuccess={() => { dispatch(fetchProtectedDocuments()); dispatch(fetchStats()); }}
        loading={actionLoading}
      />

      <Modal
        title="Document Preview"
        open={!!previewDoc}
        onCancel={() => setPreviewDoc(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewDoc(null)}>Close</Button>,
          previewDoc?.paymentStatus === "protected" && (
            <Button key="pay" type="primary" icon={<DollarOutlined />} onClick={() => { handleConfirmPayment(previewDoc); setPreviewDoc(null); }}>
              Confirm Payment
            </Button>
          ),
        ]}
        width={700}>
        {previewDoc && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Title" span={2}>{previewDoc.title}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color={previewDoc.paymentStatus === "paid" ? "green" : "orange"}>{previewDoc.paymentStatus?.toUpperCase()}</Tag></Descriptions.Item>
            <Descriptions.Item label="Agreed Fee">{previewDoc.agreedFee ? `₦${Number(previewDoc.agreedFee).toLocaleString()}` : "—"}</Descriptions.Item>
            <Descriptions.Item label="Client">{previewDoc.clientName || "—"}</Descriptions.Item>
            <Descriptions.Item label="Uploaded">{dayjs(previewDoc.createdAt).format("DD MMM YYYY HH:mm")}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </>
  );
};

export default FeeProtectorPage;
