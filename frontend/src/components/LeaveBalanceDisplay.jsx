import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spin, Descriptions, Empty, Card } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";

const LeaveBalanceDisplay = ({ userId }) => {
  const { data, loading, error, dataFetcher } = useDataFetch();

  // useErrorMessage(error); // Use the custom hook

  useEffect(() => {
    const getBalance = async () => {
      if (userId) {
        await dataFetcher(`leaves/balances/${userId}`, "GET");
      }
    };
    getBalance();
  }, [userId]);

  return (
    <Spin spinning={loading}>
      {loading && <Empty description="Fetching leave balance..." />}

      {!loading && !error && data?.data ? (
        <Card>
          <Descriptions title="Leave Balance Information" bordered>
            <Descriptions.Item label="Annual Leave Balance">
              <h1 className="text-2xl font-bold">
                {" "}
                {data?.data?.annualLeaveBalance || 0}
              </h1>
            </Descriptions.Item>
            <Descriptions.Item label="Sick Leave Balance">
              <h1 className="text-2xl font-bold">
                {" "}
                {data?.data?.sickLeaveBalance || 0}
              </h1>
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
