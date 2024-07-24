import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button, Descriptions, Divider, Spin, Alert, Card } from "antd";
import { useNavigate } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import avatar from "../assets/avatar.png";
import { formatDate } from "../utils/formatDate";
import UpdateUserPositionAndRole from "./UpdateUserPositionAndRole";
import LeaveBalanceDisplay from "../components/LeaveBalanceDisplay";
import LeaveApplicationDetails from "./LeaveApplicationDetails";
import { useAdminHook } from "../hooks/useAdminHook";
import { useAuthContext } from "../hooks/useAuthContext";
// import useErrorMessage from "../hooks/useErrorMessage";

const StaffDetails = () => {
  const { id } = useParams();
  const { user } = useAuthContext();
  const loggedInClientId = user?.data?.user.id;
  const { dataFetcher, data, loading, error } = useDataFetch();
  const navigate = useNavigate();
  const { isAdminOrHr } = useAdminHook();

  // useErrorMessage(error);

  useEffect(() => {
    dataFetcher(`users/${id}`, "GET");
  }, [id]);

  // console.log(data?.data.photo, "USERPH");

  const isCurrentUser = loggedInClientId === id; //check if id is the same

  const renderFullDetails = () => (
    <Card title="Staff Details">
      <Descriptions bordered>
        <Descriptions.Item label="First Name">
          {data?.data?.firstName}
        </Descriptions.Item>
        <Descriptions.Item label="Last Name">
          {data?.data?.lastName}
        </Descriptions.Item>
        <Descriptions.Item label="Year of Call">
          {formatDate(data?.data?.yearOfCall)}
        </Descriptions.Item>
        <Descriptions.Item label="Role">{data?.data?.role}</Descriptions.Item>
        <Descriptions.Item label="Position">
          {data?.data?.position}
        </Descriptions.Item>
        <Descriptions.Item label="Practice Area">
          {data?.data?.practiceArea}
        </Descriptions.Item>
        <Descriptions.Item label="University Attended">
          {data?.data?.universityAttended}
        </Descriptions.Item>
        <Descriptions.Item label="Law School Attended">
          {data?.data?.lawSchoolAttended}
        </Descriptions.Item>
        <Descriptions.Item label="Email">{data?.data?.email}</Descriptions.Item>
        <Descriptions.Item label="Phone">{data?.data?.phone}</Descriptions.Item>
        <Descriptions.Item label="Address">
          {data?.data?.address}
        </Descriptions.Item>
        <Descriptions.Item label="Bio">{data?.data?.bio}</Descriptions.Item>
      </Descriptions>
    </Card>
  );

  const renderLimitedDetails = () => (
    <Card title="Staff Details">
      <Descriptions bordered>
        <Descriptions.Item label="First Name">
          {data?.data?.firstName}
        </Descriptions.Item>
        <Descriptions.Item label="Last Name">
          {data?.data?.lastName}
        </Descriptions.Item>
        <Descriptions.Item label="Year of Call">
          {formatDate(data?.data?.yearOfCall)}
        </Descriptions.Item>
        <Descriptions.Item label="Role">{data?.data?.role}</Descriptions.Item>
        <Descriptions.Item label="Position">
          {data?.data?.position}
        </Descriptions.Item>
        <Descriptions.Item label="Practice Area">
          {data?.data?.practiceArea}
        </Descriptions.Item>
        <Descriptions.Item label="University Attended">
          {data?.data?.universityAttended}
        </Descriptions.Item>
        <Descriptions.Item label="Law School Attended">
          {data?.data?.lawSchoolAttended}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );

  // render either full detail or limited detail
  const renderStaffDetails = () => {
    if (isAdminOrHr || isCurrentUser) {
      return renderFullDetails();
    } else {
      return renderLimitedDetails();
    }
  };

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
              src={data?.data?.photo ? data?.data?.photo : avatar}
              alt={`${data?.data?.firstName}'s profile image`}
              className="w-24 h-24 object-cover rounded-full"
            />
            {isAdminOrHr && (
              <UpdateUserPositionAndRole userId={data?.data._id} />
            )}
          </div>
          <Divider />
          <Button onClick={() => navigate(-1)} className="m-2">
            Go Back
          </Button>

          {renderStaffDetails()}
        </div>
      )}
    </>
  );
};

export default StaffDetails;
