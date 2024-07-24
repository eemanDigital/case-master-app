import { useEffect } from "react";
import { Spin, Descriptions, Empty, Card } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
// import useErrorMessage from "../hooks/useErrorMessage";

const LeaveBalanceDisplay = ({ userId }) => {
  const { data, loading, error, dataFetcher } = useDataFetch();

  // useErrorMessage(error); // Use the custom hook

  useEffect(() => {
    if (userId) {
      dataFetcher(`leaves/balances/${userId}`, "GET");
    }
  }, [userId]);

  return (
    <Spin spinning={loading}>
      {loading && <Empty description="Fetching leave balance..." />}

      {!loading && !error && data?.data ? (
        <Card>
          <Descriptions title="Leave Balance Information" bordered>
            <Descriptions.Item label="Annual Leave Balance">
              {data?.data?.annualLeaveBalance || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Sick Leave Balance">
              {data?.data?.sickLeaveBalance || 0}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ) : (
        <Empty description="No leave balance data available." />
      )}
    </Spin>
  );
};

export default LeaveBalanceDisplay;
