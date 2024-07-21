import { useEffect } from "react";
import { Descriptions, Spin, Alert, Empty } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import { useAuthContext } from "../hooks/useAuthContext";
import LeaveResponseForm from "../components/LeaveResponseForm";

const LeaveApplicationDetails = ({ userId }) => {
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { user } = useAuthContext();
  const isAdmin =
    user?.data?.user?.role === "admin" || user?.data?.user?.role === "hr";

  useEffect(() => {
    if (userId) {
      dataFetcher(`leaves/applications/${userId}`, "GET");
    }
  }, [userId]);

  return (
    <Spin spinning={loading}>
      {/* {error && (
        <Notification
          message="Error"
          description={error?.response?.data?.message || "Something went wrong"}
          type="error"
          showIcon
        />
      )} */}
      {!loading && (
        <>
          {data ? (
            <>
              <Descriptions title="Leave Details" bordered>
                <Descriptions.Item label="Created On">
                  {formatDate(data?.data?.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Days Applied For">
                  {data?.data?.daysAppliedFor}
                </Descriptions.Item>
                <Descriptions.Item label="Days Approved">
                  {data?.data?.daysApproved}
                </Descriptions.Item>
                <Descriptions.Item label="Employee Name">
                  {data?.data?.employee?.fullName}
                </Descriptions.Item>
                <Descriptions.Item label="Start Date">
                  {formatDate(data?.data?.startDate)}
                </Descriptions.Item>
                <Descriptions.Item label="End Date">
                  {formatDate(data?.data?.endDate)}
                </Descriptions.Item>
                <Descriptions.Item label="Reason">
                  {data?.data?.reason}
                </Descriptions.Item>
                <Descriptions.Item label="Response Message">
                  {data?.data?.responseMessage}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {data?.data?.status}
                </Descriptions.Item>
                <Descriptions.Item label="Type of Leave">
                  {data?.data?.typeOfLeave}
                </Descriptions.Item>
              </Descriptions>
              {isAdmin && <LeaveResponseForm appId={data?.data?.id} />}
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
