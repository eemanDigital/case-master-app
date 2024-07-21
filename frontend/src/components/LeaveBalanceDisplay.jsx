import { useEffect } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { Spin, Alert, Descriptions } from "antd";

const LeaveBalanceDisplay = ({ userId }) => {
  const { data, loading, error, dataFetcher } = useDataFetch();

  useEffect(() => {
    if (userId) {
      dataFetcher(`leaves/balances/${userId}`, "get");
    }
  }, [userId]);

  return (
    <Spin spinning={loading}>
      {error && (
        <Alert
          message="Error"
          description={error?.response?.data?.message || "Something went wrong"}
          type="error"
          showIcon
        />
      )}
      {!loading && !error && (
        <Descriptions title="Leave Balance Information" bordered>
          <Descriptions.Item label="Annual Leave Balance">
            {data?.data?.annualLeaveBalance || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Sick Leave Balance">
            {data?.data?.sickLeaveBalance || 0}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Spin>
  );
};

export default LeaveBalanceDisplay;
