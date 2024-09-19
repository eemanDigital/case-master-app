import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Card, Divider, Row, Col, Typography, Avatar, Space, Tag } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  BookOutlined,
  CalendarOutlined,
  BankOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { useAdminHook } from "../hooks/useAdminHook";
import { formatDate } from "../utils/formatDate";
import UpdateUserPositionAndRole from "./UpdateUserPositionAndRole";
import LeaveBalanceDisplay from "../components/LeaveBalanceDisplay";
import PageErrorAlert from "../components/PageErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import GoBackButton from "../components/GoBackButton";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const { Title, Text, Paragraph } = Typography;

const StaffDetails = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const loggedInClientId = user?.data?._id;
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { isAdminOrHr } = useAdminHook();
  useRedirectLogoutUser("/users/login");

  useEffect(() => {
    if (id) {
      dataFetcher(`users/${id}`, "GET");
    }
  }, [id, dataFetcher]);

  const isCurrentUser = loggedInClientId === id;

  const renderProfileSection = () => (
    <Card className="mb-6 shadow-lg">
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <GoBackButton />
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={8} md={6} className="text-center">
            <Avatar
              size={128}
              src={data?.data?.photo}
              icon={<UserOutlined />}
              className="shadow-md"
            />
          </Col>
          <Col xs={24} sm={16} md={18}>
            <Title level={2}>
              {`${data?.data?.firstName} ${data?.data?.lastName}`}
            </Title>
            <Space>
              <Tag color="blue">{data?.data?.role}</Tag>
              <Tag color="green">{data?.data?.position}</Tag>
            </Space>
            <Divider />
            {isAdminOrHr && <UpdateUserPositionAndRole userId={id} />}
          </Col>
        </Row>
      </Space>
    </Card>
  );

  const renderPersonalInformation = () => (
    <Card
      title={
        <>
          <BookOutlined /> Personal Information
        </>
      }
      className="mb-6 shadow-lg">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Text strong>
            <CalendarOutlined /> Year of Call:
          </Text>{" "}
          {formatDate(data?.data?.yearOfCall)}
        </Col>
        <Col span={12}>
          <Text strong>
            <BankOutlined /> University:
          </Text>{" "}
          {data?.data?.universityAttended}
        </Col>
        <Col span={12}>
          <Text strong>
            <BankOutlined /> Law School:
          </Text>{" "}
          {data?.data?.lawSchoolAttended}
        </Col>
        <Col span={12}>
          <Text strong>
            <TeamOutlined /> Practice Area:
          </Text>{" "}
          {data?.data?.practiceArea}
        </Col>
      </Row>
    </Card>
  );

  const renderContactDetails = () => (
    <Card
      title={
        <>
          <UserOutlined /> Contact Details
        </>
      }
      className="mb-6 shadow-lg">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Text strong>
            <MailOutlined /> Email:
          </Text>{" "}
          {data?.data?.email}
        </Col>
        <Col span={12}>
          <Text strong>
            <PhoneOutlined /> Phone:
          </Text>{" "}
          {data?.data?.phone}
        </Col>
        <Col span={24}>
          <Text strong>
            <HomeOutlined /> Address:
          </Text>{" "}
          {data?.data?.address}
        </Col>
        <Col span={24}>
          <Text strong>Bio:</Text>
          <Paragraph ellipsis={{ rows: 3, expandable: true, symbol: "more" }}>
            {data?.data?.bio}
          </Paragraph>
        </Col>
      </Row>
    </Card>
  );

  if (loading) return <LoadingSpinner />;
  if (error)
    return <PageErrorAlert errorCondition={error} errorMessage={error} />;

  return (
    <div className="p-4">
      {renderProfileSection()}
      {isAdminOrHr || isCurrentUser ? (
        <>
          {renderPersonalInformation()}
          {renderContactDetails()}
          <LeaveBalanceDisplay userId={id} />
        </>
      ) : (
        renderPersonalInformation()
      )}
    </div>
  );
};

export default StaffDetails;
