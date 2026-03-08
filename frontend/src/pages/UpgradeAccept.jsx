import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, Result, Button, Spin, Alert, Typography } from "antd";
import axios from "axios";
import CheckCircleOutlined from "@ant-design/icons";

const { Text } = Typography;

const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:5000/api/v1";

const UpgradeAcceptPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const [planName, setPlanName] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid or missing invitation token");
      return;
    }

    const acceptUpgrade = async () => {
      try {
        const response = await axios.post(
          `${baseURL}/platform/upgrade/accept/${token}`,
        );
        setStatus("success");
        setMessage(response.data.message || "Upgrade successful!");
      } catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Failed to accept upgrade invitation. The invitation may be invalid or expired.",
        );
      }
    };

    acceptUpgrade();
  }, [token]);

  if (status === "loading") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}>
        <Card>
          <Spin size="large" />
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <Text>Processing your upgrade...</Text>
          </div>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: 24,
        }}>
        <Card style={{ maxWidth: 500, width: "100%" }}>
          <Result
            status="error"
            title="Upgrade Failed"
            subTitle={message}
            extra={
              <Button type="primary" onClick={() => navigate("/users/login")}>
                Go to Login
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        padding: 24,
      }}>
      <Card style={{ maxWidth: 500, width: "100%" }}>
        <Result
          icon={
            <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 72 }} />
          }
          title="Upgrade Successful!"
          subTitle={message}
          extra={
            <Button type="primary" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          }
        />
      </Card>
    </div>
  );
};

export default UpgradeAcceptPage;
