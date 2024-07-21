import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button, Col, Descriptions, Divider, Spin, Alert } from "antd";
import { useNavigate } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import avatar from "../assets/avatar.png";
import { formatDate } from "../utils/formatDate";
// import EditUserProfile from "./EditUserProfile";
import UpdateUserPositionAndRole from "./UpdateUserPositionAndRole";
import LeaveBalanceDisplay from "../components/LeaveBalanceDisplay";
import LeaveApplicationDetails from "./LeaveApplicationDetails";

const StaffDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();
  const navigate = useNavigate();

  useEffect(() => {
    dataFetcher(`users/${id}`, "GET");
  }, [id]);

  return (
    <>
      {loading ? (
        <Spin
          size="large"
          className="flex justify-center items-center h-full"
        />
      ) : error ? (
        <Alert message="Error" description={error} type="error" showIcon />
      ) : (
        <div>
          <div>
            <img
              src={
                data?.data?.photo
                  ? data?.data?.photo // Use the Cloudinary URL directly
                  : avatar // Fallback avatar if photo is not available
              }
              alt={`${data?.data?.firstName}'s profile image`} // Make sure this uses the correct path
              className="w-24 h-24 object-cover rounded-full"
            />
            <UpdateUserPositionAndRole userId={data?.data._id} />
          </div>
          <Divider />
          <Button onClick={() => navigate(-1)} className="m-2">
            Go Back
          </Button>

          <Descriptions title="Staff Details" bordered>
            <Descriptions.Item label="First Name">
              {data?.data?.firstName}
            </Descriptions.Item>
            <Descriptions.Item label="Last Name">
              {data?.data?.lastName}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {data?.data?.email}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {data?.data?.phone}
            </Descriptions.Item>
            <Descriptions.Item label="Address">
              {data?.data?.address}
            </Descriptions.Item>
            <Descriptions.Item label="Role">
              {data?.data?.role}
            </Descriptions.Item>
            <Descriptions.Item label="Position">
              {data?.data?.position}
            </Descriptions.Item>
            <Descriptions.Item label="Bio">{data?.data?.bio}</Descriptions.Item>
            <Descriptions.Item label="Practice Area">
              {data?.data?.practiceArea}
            </Descriptions.Item>
            <Descriptions.Item label="University Attended">
              {data?.data?.universityAttended}
            </Descriptions.Item>
            <Descriptions.Item label="Law School Attended">
              {data?.data?.lawSchoolAttended}
            </Descriptions.Item>
            <Descriptions.Item label="Year of Call">
              {formatDate(data?.data?.yearOfCall)}
            </Descriptions.Item>
          </Descriptions>
          <Divider />
          {/* leave balance component */}
          <LeaveBalanceDisplay userId={id} />
          <Divider />
          <LeaveApplicationDetails userId={id} />
        </div>
      )}
    </>
  );
};

export default StaffDetails;
