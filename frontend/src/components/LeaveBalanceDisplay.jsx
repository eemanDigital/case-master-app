import PropTypes from "prop-types";
import { useEffect } from "react";
import { Descriptions, Empty, Card } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import LoadingSpinner from "./LoadingSpinner";
import PageErrorAlert from "./PageErrorAlert";

const LeaveBalanceDisplay = ({ userId }) => {
  const { data, loading, error, dataFetcher } = useDataFetch();

  // Fetch leave balance data
  useEffect(() => {
    const getBalance = async () => {
      if (userId) {
        await dataFetcher(`leaves/balances/${userId}`, "GET");
      }
    };
    getBalance();
  }, [userId]);

  // Display loading spinner
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <PageErrorAlert
        errorCondition={error}
        errorMessage="An error occurred while fetching leave balance data."
      />
    );
  }

  return !loading && !error && data?.data ? (
    <Card>
      <Descriptions title="Leave Balance Information" bordered>
        <Descriptions.Item label="Annual Leave Balance">
          <h1 className="text-2xl font-bold">
            {data?.data?.annualLeaveBalance || 0}
          </h1>
        </Descriptions.Item>
        <Descriptions.Item label="Sick Leave Balance">
          <h1 className="text-2xl font-bold">
            {data?.data?.sickLeaveBalance || 0}
          </h1>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  ) : (
    <Empty description="No leave balance data available." />
  );
};

// Prop types validation
LeaveBalanceDisplay.propTypes = { userId: PropTypes.string.isRequired };

export default LeaveBalanceDisplay;
