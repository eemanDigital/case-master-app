import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Spin,
  Alert,
  Empty,
  Typography,
  Tag,
  Row,
  Col,
  Divider,
} from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import LeaveResponseForm from "../components/LeaveResponseForm";
// import useErrorMessage from "../hooks/useErrorMessage";
import { useAdminHook } from "../hooks/useAdminHook";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import LeaveBalanceDisplay from "../components/LeaveBalanceDisplay";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;

const LeaveApplicationDetails = ({ userId }) => {
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { id } = useParams();
  // useErrorMessage(error);
  const { isAdminOrHr } = useAdminHook();
  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);
  const loggedInClientId = user?.data?.id;

  const isCurrentUser = loggedInClientId === id; //check if id is the same

  useEffect(() => {
    if (id || userId) {
      dataFetcher(`leaves/applications/${id || userId}`, "GET");
    }
  }, [id, userId]);

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "text-white bg-green-600";
      case "pending":
        return " bg-yellow-600";
      case "rejected":
        return "text-white bg-red-600";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const renderLeaveDetails = () => (
    <div className="mt-10">
      <Card>
        <Col span={24}>
          <Title level={4}>Leave Application Response</Title>
          <span
            className={`inline-block px-3 py-1 rounded-md ${getStatusColor(
              data?.data?.status
            )}`}>
            {data?.data?.status}
          </span>
        </Col>
        {data?.data?.responseMessage && (
          <Col span={24}>
            <Text strong>
              <FileTextOutlined /> Response Message:{" "}
            </Text>
            <Text>{data?.data?.responseMessage}</Text>
          </Col>
        )}
        <Col span={12}>
          <Text strong>
            <ClockCircleOutlined /> Days Approved:{" "}
            {data?.data?.status === "rejected" ? (
              "None Approved"
            ) : data?.data?.status === "pending" ? (
              "0"
            ) : (
              <span className="text-2xl bg-gray-600 text-white px-3 rounded-md">
                {data?.data?.daysApproved}
              </span>
            )}
          </Text>
        </Col>
      </Card>
      <Divider />
      <Card>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Title level={4}>Leave Application Details</Title>
          </Col>
          <Col span={12}>
            <Text strong>
              <UserOutlined /> Employee:{" "}
            </Text>
            <Text>{data?.data?.employee?.fullName}</Text>
          </Col>
          <Col span={12}>
            <Text strong>
              <CalendarOutlined /> Created On:{" "}
            </Text>
            <Text>{formatDate(data?.data?.createdAt)}</Text>
          </Col>
          {data?.data?.status === "rejected" ? (
            " "
          ) : (
            <>
              {" "}
              <Col span={12}>
                <Text
                  strong
                  className="bg-yellow-400 p-1 text-center rounded-md">
                  <CalendarOutlined /> Start Date:{" "}
                </Text>
                <Text>{formatDate(data?.data?.startDate)}</Text>
              </Col>
              <Col span={12}>
                <Text
                  strong
                  className="bg-green-400 p-1 text-center rounded-md">
                  <CalendarOutlined /> End Date:{" "}
                </Text>
                <Text>{formatDate(data?.data?.endDate)}</Text>
              </Col>
            </>
          )}

          <Col span={12}>
            <Text strong>
              <ClockCircleOutlined /> Days Applied For:{" "}
            </Text>
            <Text>{data?.data?.daysAppliedFor}</Text>
          </Col>

          <Col span={24}>
            <Text strong>
              <FileTextOutlined /> Type of Leave:{" "}
            </Text>
            <Text>{data?.data?.typeOfLeave}</Text>
          </Col>
          <Col span={24}>
            <Text strong>
              <FileTextOutlined /> Reason:{" "}
            </Text>
            <Text>{data?.data?.reason}</Text>
          </Col>
        </Row>
      </Card>
    </div>
  );

  return (
    <Spin spinning={loading}>
      {!loading && (
        <>
          {data ? (
            <>
              {renderLeaveDetails()}
              {isAdminOrHr && (
                <>
                  <Divider />
                  <LeaveResponseForm appId={data?.data?.id} />
                </>
              )}
            </>
          ) : (
            <Empty description="No Leave Application" />
          )}
        </>
      )}
    </Spin>
  );
};

export default LeaveApplicationDetails;
