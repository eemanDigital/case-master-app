import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Descriptions, Divider, Card } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import avatar from "../assets/avatar.png";
import { formatDate } from "../utils/formatDate";
import UpdateUserPositionAndRole from "./UpdateUserPositionAndRole";
import LeaveBalanceDisplay from "../components/LeaveBalanceDisplay";
import { useAdminHook } from "../hooks/useAdminHook";
import { useSelector } from "react-redux";
import PageErrorAlert from "../components/PageErrorAlert";
import LoadingSpinner from "../components/LoadingSpinner";
import GoBackButton from "../components/GoBackButton";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const StaffDetails = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const loggedInClientId = user?.data?.id;
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { isAdminOrHr } = useAdminHook();
  useRedirectLogoutUser("/users/login"); // redirect to login if user is not logged in

  useEffect(() => {
    if (id) {
      dataFetcher(`users/${id}`, "GET");
    }
  }, [id, dataFetcher]);

  console.log(id, "ID");

  const isCurrentUser = loggedInClientId === id; //check if id is the same

  // full data detail for current user
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

  // limited details for non-admin users
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
        <LoadingSpinner />
      ) : error ? (
        <PageErrorAlert errorCondition={error} errorMessage={error} />
      ) : (
        <div>
          <div>
            <img
              src={data?.data?.photo ? data?.data?.photo : avatar}
              alt={`${data?.data?.firstName}'s profile image`}
              className="w-24 h-24 object-cover rounded-full"
            />

            <GoBackButton />
            {isAdminOrHr && <UpdateUserPositionAndRole userId={id} />}
          </div>
          <Divider />
          {renderStaffDetails()}

          <Divider />

          {(isAdminOrHr || isCurrentUser) && (
            <>
              <LeaveBalanceDisplay userId={id} />
            </>
          )}
        </div>
      )}
    </>
  );
};

export default StaffDetails;
