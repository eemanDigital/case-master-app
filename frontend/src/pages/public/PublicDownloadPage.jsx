import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, Typography, Space, Tag, Button, Spin, Result, Descriptions, message, Alert, Divider } from "antd";
import {
  FileProtectOutlined,
  DownloadOutlined,
  LockOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;

const BASE_URL = import.meta.env.VITE_BASE_URL?.replace(/\/api\/v1\/?$/, "") || "http://localhost:3000";

const PublicDownloadPage = () => {
  const { id } = useParams();
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
      const response = await axios.get(`${BASE_URL}/api/v1/fee-protector/${id}/preview-info`);
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
      const response = await axios.get(`${BASE_URL}/api/v1/fee-protector/${id}/download`, {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", document?.name || "document.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      message.success("Download complete!");
    } catch (err) {
      message.error(err.response?.data?.message || "Download failed. Payment may be required.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        background: "#f1f5f9"
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: 20
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

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#f0fdf4",
      padding: "40px 20px"
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <Card style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ 
              width: 80, 
              height: 80, 
              borderRadius: "50%", 
              background: isPaid ? "#10b981" : "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              {isPaid ? (
                <DownloadOutlined style={{ fontSize: 40, color: "#fff" }} />
              ) : (
                <LockOutlined style={{ fontSize: 40, color: "#fff" }} />
              )}
            </div>
            
            <Title level={3} style={{ margin: 0 }}>
              {isPaid ? "Download Document" : "Payment Required"}
            </Title>
          </div>

          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Document">
              <Text strong>{document?.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <Text strong style={{ color: "#f59e0b", fontSize: 16 }}>
                ₦{(document?.protectedDocument?.balanceAmount || 0).toLocaleString()}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={isPaid ? "green" : "red"}>
                {isPaid ? "PAID - Ready to Download" : "PAYMENT REQUIRED"}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {isPaid ? (
            <div style={{ textAlign: "center" }}>
              <Alert
                type="success"
                message="Payment confirmed!"
                description="Your download is ready. Click the button below to download your document."
                style={{ marginBottom: 16, textAlign: "left" }}
              />
              <Button
                type="primary"
                size="large"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                loading={downloading}
                style={{ minWidth: 200, height: 48 }}>
                Download Clean Document
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <Alert
                type="error"
                message="Payment Not Received"
                description="Please contact the law firm to arrange payment. Your download will be available after payment is confirmed."
                style={{ marginBottom: 16, textAlign: "left" }}
              />
              <Button
                type="default"
                icon={<EyeOutlined />}
                onClick={() => window.open(`/preview/${id}`, "_blank")}>
                View Preview
              </Button>
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

export default PublicDownloadPage;
