import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Typography,
  Tag,
  Button,
  Divider,
  Spin,
  Result,
  Descriptions,
  message,
  Alert,
  Steps,
  Space,
} from "antd";
import {
  FileProtectOutlined,
  DownloadOutlined,
  LockOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  BankOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

const BASE_URL =
  import.meta.env.VITE_BASE_URL?.replace(/\/api\/v1\/?$/, "") ||
  "http://localhost:3000";

// ─── Payment steps shown to client ─────────────────────────────────────────
const PaymentInstructions = ({ doc }) => {
  const amount = (doc?.protectedDocument?.balanceAmount || 0).toLocaleString();

  return (
    <div style={{ marginTop: 24 }}>
      <Alert
        type="warning"
        icon={<LockOutlined />}
        message={<Text strong>Payment required to unlock this document</Text>}
        description={
          <Text>
            This document is protected. Complete payment of{" "}
            <Text strong style={{ color: "#f59e0b" }}>
              ₦{amount}
            </Text>{" "}
            to download the clean, watermark-free version.
          </Text>
        }
        style={{ marginBottom: 24 }}
      />

      <Card
        size="small"
        title={
          <Space>
            <BankOutlined /> How to pay
          </Space>
        }
        style={{ marginBottom: 16 }}>
        <Steps
          direction="vertical"
          size="small"
          current={-1}
          items={[
            {
              title: "Make payment",
              description: (
                <Text type="secondary">
                  Transfer ₦{amount} to the law firm's bank account. Contact the
                  firm for bank details.
                </Text>
              ),
              icon: <BankOutlined />,
            },
            {
              title: "Send proof of payment",
              description: (
                <Text type="secondary">
                  Send your payment receipt or transaction reference to the firm
                  via email or WhatsApp.
                </Text>
              ),
              icon: <SafetyCertificateOutlined />,
            },
            {
              title: "Download unlocks automatically",
              description: (
                <Text type="secondary">
                  Once the firm confirms your payment, return to this page and
                  the download button will be active.
                </Text>
              ),
              icon: <DownloadOutlined />,
            },
          ]}
        />
      </Card>

      <Alert
        type="info"
        message="Already paid?"
        description="If you have already made payment and the download is not yet available, the firm may not have confirmed it yet. Please contact them directly."
        style={{ marginBottom: 8 }}
      />
    </div>
  );
};

// ─── Document preview renderer ──────────────────────────────────────────────
const DocumentPreview = ({ doc, previewUrl }) => {
  const mimeType = doc?.protectedDocument?.mimeType || "";
  const isPdf = mimeType.includes("pdf");
  const isImage = mimeType.startsWith("image/");
  const isWord = mimeType.includes("word") || mimeType.includes("document");

  if (isPdf) {
    return (
      <iframe
        src={previewUrl}
        title="Document Preview"
        style={{
          width: "100%",
          height: 560,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
        }}
      />
    );
  }

  if (isImage) {
    return (
      <img
        src={previewUrl}
        alt="Document preview"
        style={{
          maxWidth: "100%",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
        }}
      />
    );
  }

  // Word docs and others cannot render in browser — show a download-preview option
  return (
    <div
      style={{
        textAlign: "center",
        padding: "40px 24px",
        background: "#f9fafb",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
      }}>
      <FileProtectOutlined
        style={{
          fontSize: 56,
          color: "#9ca3af",
          marginBottom: 16,
          display: "block",
        }}
      />
      <Text strong style={{ display: "block", marginBottom: 8 }}>
        {doc?.protectedDocument?.originalFilename || doc?.name}
      </Text>
      <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
        {isWord
          ? "Word documents cannot be previewed in the browser."
          : "This file type cannot be previewed in the browser."}
      </Text>
      <Button
        icon={<EyeOutlined />}
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer">
        Open Watermarked Preview
      </Button>
    </div>
  );
};

// ─── Main page ──────────────────────────────────────────────────────────────
const PublicPreviewPage = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const fetchDoc = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${BASE_URL}/api/v1/fee-protector/${id}/preview-info`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Document not found");
      setDoc(json.data);
      setError(null);
    } catch (err) {
      setError(err.message || "Document not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  const previewUrl = doc
    ? `${BASE_URL}/api/v1/fee-protector/${id}/preview`
    : null;
  const downloadUrl = doc
    ? `${BASE_URL}/api/v1/fee-protector/${id}/download`
    : null;

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(downloadUrl);

      if (res.status === 403) {
        message.error(
          "Download not available yet. Payment confirmation is pending.",
        );
        return;
      }
      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc?.name || "document.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success("Download started!");
    } catch (err) {
      message.error(err?.message || "Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#f8fafc",
        }}>
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text type="secondary">Loading document...</Text>
        </Space>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#f8fafc",
          padding: 20,
        }}>
        <Result
          status="404"
          icon={<FileProtectOutlined style={{ color: "#9ca3af" }} />}
          title="Document Not Found"
          subTitle={error}
        />
      </div>
    );
  }

  const isPaid = doc?.protectedDocument?.isBalancePaid;
  const amount = (doc?.protectedDocument?.balanceAmount || 0).toLocaleString();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "40px 16px",
      }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header card */}
        <Card
          style={{
            borderRadius: 16,
            marginBottom: 20,
            boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
          }}
          bodyStyle={{ padding: "28px 32px" }}>
          {/* Status icon */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: isPaid ? "#ecfdf5" : "#fff7ed",
                border: `2px solid ${isPaid ? "#10b981" : "#f59e0b"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}>
              {isPaid ? (
                <CheckCircleOutlined
                  style={{ fontSize: 36, color: "#10b981" }}
                />
              ) : (
                <LockOutlined style={{ fontSize: 36, color: "#f59e0b" }} />
              )}
            </div>
            <Title level={3} style={{ margin: 0 }}>
              {doc?.name}
            </Title>
            <Tag
              color={isPaid ? "green" : "orange"}
              icon={isPaid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
              style={{ marginTop: 10, fontSize: 13, padding: "3px 14px" }}>
              {isPaid
                ? "PAYMENT CONFIRMED — DOWNLOAD AVAILABLE"
                : "AWAITING PAYMENT CONFIRMATION"}
            </Tag>
          </div>

          {/* Document info */}
          <Descriptions
            bordered
            column={1}
            size="small"
            style={{ marginBottom: 20 }}>
            <Descriptions.Item label="Document">{doc?.name}</Descriptions.Item>
            <Descriptions.Item label="Amount">
              <Text strong style={{ color: "#f59e0b", fontSize: 18 }}>
                ₦{amount}
              </Text>
            </Descriptions.Item>
            {doc?.protectedDocument?.uploadedAt && (
              <Descriptions.Item label="Date">
                {dayjs(doc.protectedDocument.uploadedAt).format("DD MMMM YYYY")}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Status">
              {isPaid ? (
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  Payment Confirmed
                </Tag>
              ) : (
                <Tag color="orange" icon={<LockOutlined />}>
                  Pending Payment
                </Tag>
              )}
            </Descriptions.Item>
          </Descriptions>

          {/* Download button (paid) or payment info (unpaid) */}
          {isPaid ? (
            <div style={{ textAlign: "center" }}>
              <Alert
                type="success"
                icon={<CheckCircleOutlined />}
                message="Your payment has been confirmed"
                description="You can now download the clean, watermark-free document below."
                style={{ marginBottom: 20, textAlign: "left" }}
              />
              <Button
                type="primary"
                size="large"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                loading={downloading}
                style={{
                  minWidth: 240,
                  height: 52,
                  fontSize: 16,
                  background: "#10b981",
                  borderColor: "#10b981",
                }}>
                Download Clean Document
              </Button>
              <div style={{ marginTop: 10 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Having trouble? Try refreshing the page.
                </Text>
              </div>
            </div>
          ) : (
            <PaymentInstructions doc={doc} />
          )}
        </Card>

        {/* Preview card */}
        {previewUrl && (
          <Card
            title={
              <Space>
                <EyeOutlined />
                Document Preview
                {!isPaid && <Tag color="warning">Watermarked</Tag>}
              </Space>
            }
            style={{
              borderRadius: 16,
              marginBottom: 20,
              boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
            }}>
            <DocumentPreview doc={doc} previewUrl={previewUrl} />
            {!isPaid && (
              <Alert
                type="warning"
                message="This is a watermarked preview"
                description="The final downloaded document will not contain any watermarks."
                style={{ marginTop: 12 }}
                showIcon
              />
            )}
          </Card>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "8px 0 24px" }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Protected by LawMaster Fee Protector &middot; Document ID: {id}
          </Text>
          <br />
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined />}
            onClick={fetchDoc}
            style={{ fontSize: 12, color: "#9ca3af" }}>
            Check payment status
          </Button>
        </div>
      </div>
    </div>
  );
};

// Fix: import missing icon
import { ReloadOutlined } from "@ant-design/icons";

export default PublicPreviewPage;
