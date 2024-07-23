import { useEffect } from "react";
import { Descriptions, Spin, Alert, Empty } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import { useAuthContext } from "../hooks/useAuthContext";
import LeaveResponseForm from "../components/LeaveResponseForm";
import useErrorMessage from "../hooks/useErrorMessage";
import { useAdminHook } from "../hooks/useAdminHook";

const LeaveApplicationDetails = ({ userId }) => {
  const { dataFetcher, data, loading, error } = useDataFetch();
  useErrorMessage(error); //custom hook for error message
  const { isAdminOrHr } = useAdminHook();

  useEffect(() => {
    if (userId) {
      dataFetcher(`leaves/applications/${userId}`, "GET");
    }
  }, [userId]);

  console.log("LA", data);

  return (
    <Spin spinning={loading}>
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
              {isAdminOrHr && <LeaveResponseForm appId={data?.data?.id} />}
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
