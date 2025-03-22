import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Card, Divider, Row, Col, Typography, Avatar, Space, Tag } from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  SendOutlined,
  InboxOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import PageErrorAlert from "../components/PageErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import GoBackButton from "../components/GoBackButton";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const { Title, Text, Paragraph } = Typography;

const DocumentRecordDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();
  useRedirectLogoutUser("/users/login");

  useEffect(() => {
    if (id) {
      dataFetcher(`documentRecord/${id}`, "GET");
    }
  }, [id, dataFetcher]);

  if (loading) return <LoadingSpinner />;
  if (error)
    return <PageErrorAlert errorCondition={error} errorMessage={error} />;

  const documentData = data?.data.docRecord;

  return (
    <div className="p-4">
      <Card className="mb-6 shadow-lg">
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <GoBackButton />
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} sm={8} md={6} className="text-center">
              <Avatar
                size={128}
                icon={<FileTextOutlined />}
                className="shadow-md"
              />
            </Col>
            <Col xs={24} sm={16} md={18}>
              <Title level={2}>{documentData?.documentName}</Title>
              <Space>
                <Tag color="blue">{documentData?.documentType}</Tag>
                <Tag color="green">Ref: {documentData?.docRef}</Tag>
              </Space>
              <Divider />
            </Col>
          </Row>
        </Space>
      </Card>

      <Card
        title={
          <>
            <InfoCircleOutlined /> Document Details
          </>
        }
        className="mb-6 shadow-lg">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text strong>
              <CalendarOutlined /> Date Received:
            </Text>{" "}
            {formatDate(documentData?.dateReceived)}
          </Col>
          <Col span={12}>
            <Text strong>
              <CalendarOutlined /> Created At:
            </Text>{" "}
            {formatDate(documentData?.createdAt)}
          </Col>
          <Col span={12}>
            <Text strong>
              <SendOutlined /> Sender:
            </Text>{" "}
            {documentData?.sender}
          </Col>
          <Col span={12}>
            <Text strong>
              <InboxOutlined /> Recipient:
            </Text>{" "}
            {`${documentData?.recipient?.firstName} ${documentData?.recipient?.lastName}`}
          </Col>
          <Col span={12}>
            <Text strong>
              <SendOutlined /> Forwarded To:
            </Text>{" "}
            {`${documentData?.forwardedTo?.firstName} ${documentData?.forwardedTo?.lastName}`}
          </Col>
          <Col span={24}>
            <Text strong>
              <InfoCircleOutlined /> Note:
            </Text>
            <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: "more" }}>
              {documentData?.note}
            </Paragraph>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default DocumentRecordDetails;
