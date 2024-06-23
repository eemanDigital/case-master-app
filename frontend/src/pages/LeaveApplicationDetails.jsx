import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Descriptions } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import { useAuthContext } from "../hooks/useAuthContext";
import LeaveResponseForm from "../components/LeaveResponseForm";

const LeaveApplicationDetails = () => {
  const { id } = useParams();

  const { dataFetcher, data, loading, error } = useDataFetch();
  const { user } = useAuthContext();
  const isAdmin =
    user?.data?.user?.role === "admin" || user?.data?.user?.role === "hr";

  // console.log("LEAVE DE", data?.data.id);

  useEffect(() => {
    dataFetcher(`leaves/applications/${id}`, "GET");
  }, [id]);

  return (
    <>
      <Descriptions title="Leave Details" bordered>
        <Descriptions.Item label="Created On">
          {formatDate(data?.data?.createdAt ? data?.data?.createdAt : null)}
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
          {formatDate(data?.data?.startDate ? data?.data?.startDate : null)}
        </Descriptions.Item>
        <Descriptions.Item label="End Date">
          {formatDate(data?.data?.endDate ? data?.data?.endDate : null)}
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
  );
};

export default LeaveApplicationDetails;
