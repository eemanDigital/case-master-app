import PropTypes from "prop-types";
import { useEffect } from "react";
import { Descriptions, Card, Statistic, Row, Col } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import LoadingSpinner from "./LoadingSpinner";
import PageErrorAlert from "./PageErrorAlert";
import {
  CalendarOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  // BabyCarriageOutlined,
  ManOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import CreateLeaveBalanceForm from "./CreateLeaveBalanceForm";

const LeaveBalanceDisplay = ({ userId }) => {
  const { data, loading, error, dataFetcher } = useDataFetch();

  console.log("Leave balance data:", data);

  // Fetch leave balance data
  useEffect(() => {
    const getBalance = async () => {
      if (userId) {
        await dataFetcher(`leaves/balances/${userId}`, "GET");
      }
    };
    getBalance();
  }, [userId, dataFetcher]);

  if (loading) return <LoadingSpinner />;
  if (error) return <PageErrorAlert message={error.message} />;

  // Extract balance data from response
  const balanceData = data?.data?.leaveBalance || data?.data;

  return (
    <Card title="Leave Balance" bordered={false} className="shadow-sm">
      {/* Column 2: Leave Management */}

      <Row gutter={[16, 16]}>
        {/* Annual Leave */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small" className="border-l-4 border-l-blue-500">
            <Statistic
              title="Annual Leave"
              value={balanceData?.annualLeaveBalance ?? 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: "#1890ff" }}
              suffix="days"
            />
          </Card>
        </Col>

        {/* Sick Leave */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small" className="border-l-4 border-l-red-500">
            <Statistic
              title="Sick Leave"
              value={balanceData?.sickLeaveBalance ?? 0}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
              suffix="days"
            />
          </Card>
        </Col>

        {/* Compassionate Leave */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small" className="border-l-4 border-l-purple-500">
            <Statistic
              title="Compassionate Leave"
              value={balanceData?.compassionateLeaveBalance ?? 0}
              prefix={<HeartOutlined />}
              valueStyle={{ color: "#722ed1" }}
              suffix="days"
            />
          </Card>
        </Col>

        {/* Maternity Leave */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small" className="border-l-4 border-l-pink-500">
            <Statistic
              title="Maternity Leave"
              value={balanceData?.maternityLeaveBalance ?? 0}
              // prefix={<BabyCarriageOutlined />}
              valueStyle={{ color: "#eb2f96" }}
              suffix="days"
            />
          </Card>
        </Col>

        {/* Paternity Leave */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small" className="border-l-4 border-l-cyan-500">
            <Statistic
              title="Paternity Leave"
              value={balanceData?.paternityLeaveBalance ?? 0}
              prefix={<ManOutlined />}
              valueStyle={{ color: "#13c2c2" }}
              suffix="days"
            />
          </Card>
        </Col>

        {/* Carry Over Days */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card size="small" className="border-l-4 border-l-orange-500">
            <Statistic
              title="Carry Over Days"
              value={balanceData?.carryOverDays ?? 0}
              prefix={<PlusCircleOutlined />}
              valueStyle={{ color: "#fa8c16" }}
              suffix="days"
            />
          </Card>
        </Col>

        {/* Total Available Leave */}
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card
            size="small"
            className="border-l-4 border-l-green-500 bg-green-50">
            <Statistic
              title="Total Available Leave"
              value={balanceData?.totalAvailableLeave ?? 0}
              valueStyle={{
                color: "#52c41a",
                fontWeight: "bold",
                fontSize: "24px",
              }}
              suffix="days"
            />
          </Card>
        </Col>
      </Row>

      {/* Additional Details in Descriptions */}
      <Descriptions
        title="Additional Information"
        bordered
        size="small"
        column={{ xs: 1, sm: 2, md: 3 }}
        className="mt-6">
        <Descriptions.Item label="Year">
          {balanceData?.year ?? new Date().getFullYear()}
        </Descriptions.Item>
        <Descriptions.Item label="Last Updated">
          {balanceData?.updatedAt
            ? new Date(balanceData.updatedAt).toLocaleDateString()
            : "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Created">
          {balanceData?.createdAt
            ? new Date(balanceData.createdAt).toLocaleDateString()
            : "N/A"}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

LeaveBalanceDisplay.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default LeaveBalanceDisplay;
