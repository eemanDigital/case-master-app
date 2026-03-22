import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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
} from "antd";
import {
  FileProtectOutlined,
  DownloadOutlined,
  LockOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;

const BASE_URL =
  import.meta.env.VITE_BASE_URL?.replace(/\/api\/v1\/?$/, "") ||
  "http://localhost:3000";

const PublicPreviewPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "preview";
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/api/v1/fee-protector/${id}/preview-info`,
      );
      setDocument(response.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Document not found");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const response = await axios.get(
        `${BASE_URL}/api/v1/fee-protector/${id}/download`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", document?.name || "document.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success("Download started!");
    } catch (err) {
      message.error(err.response?.data?.message || "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const getPreviewUrl = () => {
    if (!document?.protectedDocument) return null;
    if (document.protectedDocument.isBalancePaid) {
      return document.protectedDocument.originalFileUrl
        ? `${BASE_URL}${document.protectedDocument.originalFileUrl}`
        : null;
    }
    return document.protectedDocument.watermarkedFileUrl
      ? `${BASE_URL}${document.protectedDocument.watermarkedFileUrl}`
      : document.protectedDocument.thumbnailUrl
        ? `${BASE_URL}${document.protectedDocument.thumbnailUrl}`
        : null;
  };

  const previewUrl = getPreviewUrl();
  const isImage =
    previewUrl?.endsWith(".jpg") ||
    previewUrl?.endsWith(".jpeg") ||
    previewUrl?.endsWith(".png");

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#f1f5f9",
        }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "#f1f5f9",
          padding: 20,
        }}>
        <Result
          status="error"
          icon={<FileProtectOutlined />}
          title="Document Not Found"
          subTitle={error}
        />
      </div>
    );
  }

  const isPaid = document?.protectedDocument?.isBalancePaid;
  const isPreviewMode = mode === "preview";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: isPreviewMode ? "#fff5e6" : "#f0f9ff",
        padding: "40px 20px",
      }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <Card
          style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: isPaid ? "#10b981" : "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}>
              {isPaid ? (
                <CheckCircleOutlined style={{ fontSize: 40, color: "#fff" }} />
              ) : (
                <LockOutlined style={{ fontSize: 40, color: "#fff" }} />
              )}
            </div>

            <Title level={2} style={{ margin: 0 }}>
              {document?.name || "Protected Document"}
            </Title>

            <Tag
              color={isPaid ? "green" : "orange"}
              style={{ marginTop: 12, fontSize: 14, padding: "4px 16px" }}
              icon={isPaid ? <CheckCircleOutlined /> : <LockOutlined />}>
              {isPaid ? "PAYMENT CONFIRMED" : "PAYMENT REQUIRED"}
            </Tag>
          </div>

          <Alert
            type={isPreviewMode ? "warning" : "success"}
            icon={isPreviewMode ? <LockOutlined /> : <CheckCircleOutlined />}
            message={
              isPreviewMode ? (
                <div>
                  <strong>This is a preview version.</strong>
                  <br />
                  The document is watermarked. Payment is required to download
                  the clean version.
                </div>
              ) : (
                <div>
                  <strong>Payment confirmed!</strong>
                  <br />
                  You can now download the clean document.
                </div>
              )
            }
            style={{ marginBottom: 24, textAlign: "left" }}
          />

          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Document">
              <Text strong>{document?.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Amount Due">
              <Text strong style={{ color: "#f59e0b", fontSize: 18 }}>
                ₦
                {(
                  document?.protectedDocument?.balanceAmount || 0
                ).toLocaleString()}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {isPaid ? (
                <Tag color="green" icon={<CheckCircleOutlined />}>
                  PAID
                </Tag>
              ) : (
                <Tag color="orange" icon={<LockOutlined />}>
                  PENDING PAYMENT
                </Tag>
              )}
            </Descriptions.Item>
          </Descriptions>

          {previewUrl && (
            <div style={{ marginTop: 24 }}>
              <Divider>Document Preview</Divider>
              <div
                style={{
                  background: "#f5f5f5",
                  padding: 16,
                  borderRadius: 8,
                  textAlign: "center",
                  maxHeight: 500,
                  overflow: "auto",
                }}>
                {isImage ? (
                  <img
                    src={previewUrl}
                    alt="Document preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: 450,
                      border: "1px solid #ddd",
                      borderRadius: 4,
                    }}
                  />
                ) : (
                  <div>
                    <FileProtectOutlined
                      style={{ fontSize: 64, color: "#ccc" }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Button
                        type="link"
                        href={previewUrl}
                        target="_blank"
                        icon={<EyeOutlined />}>
                        View Document
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {!isPaid && (
                <Alert
                  type="warning"
                  message="This is a watermarked preview"
                  description="The final document will not have this watermark after payment."
                  style={{ marginTop: 8 }}
                />
              )}
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: "center" }}>
            {isPaid ? (
              <Button
                type="primary"
                size="large"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                loading={downloading}
                style={{ minWidth: 200, height: 48 }}>
                Download Clean Document
              </Button>
            ) : (
              <div>
                <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                  Please complete payment to unlock the clean document.
                </Paragraph>
                <Alert
                  type="info"
                  message="How to Pay"
                  description={
                    <div>
                      <p style={{ margin: "8px 0" }}>
                        Contact the law firm to arrange payment.
                      </p>
                      <p style={{ margin: "8px 0" }}>
                        Once payment is confirmed, you will be able to download
                        the clean document using this link.
                      </p>
                    </div>
                  }
                />
              </div>
            )}
          </div>

          {isPreviewMode && (
            <div
              style={{
                marginTop: 32,
                padding: 20,
                background: "#fafafa",
                borderRadius: 8,
                textAlign: "center",
              }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                This document is protected by Fee Protector. The preview version
                contains a watermark.
                <br />
                For a clean copy, please complete payment.
              </Text>
            </div>
          )}
        </Card>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Powered by LawMaster
          </Text>
        </div>
      </div>
    </div>
  );
};

export default PublicPreviewPage;
