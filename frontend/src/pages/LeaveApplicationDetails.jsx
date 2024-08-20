import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, Empty, Typography, Row, Col, Divider, Button } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import LeaveResponseForm from "../components/LeaveResponseForm";
import PropTypes from "prop-types";
import { useAdminHook } from "../hooks/useAdminHook";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import LeaveBalanceDisplay from "../components/LeaveBalanceDisplay";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";

const { Title, Text } = Typography;

const LeaveApplicationDetails = () => {
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { id } = useParams();
  const navigate = useNavigate();
  // useErrorMessage(error);
  const { isAdminOrHr } = useAdminHook();

  useEffect(() => {
    if (id) {
      dataFetcher(`leaves/applications/${id}`, "GET");
    }
  }, [id]);

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

  if (loading) return <LoadingSpinner />;
  if (error)
    return <PageErrorAlert errorCondition={error} errorMessage={error} />;

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
    <>
      {data ? (
        <>
          {isAdminOrHr && (
            <>
              <LeaveResponseForm appId={data?.data?.id} />

              <Button onClick={() => navigate(-1)}>Go Back</Button>

              <Divider />
            </>
          )}
          {renderLeaveDetails()}
        </>
      ) : (
        <Empty description="No Leave Application" />
      )}
      <Divider />
      <LeaveBalanceDisplay userId={data?.data?.employee?._id} />
    </>
  );
};

export default LeaveApplicationDetails;
