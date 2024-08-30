import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, Divider, Row, Col, Typography } from "antd";
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

const { Title, Text } = Typography;

const StaffDetails = () => {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const loggedInClientId = user?.data?._id;
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { isAdminOrHr } = useAdminHook();
  useRedirectLogoutUser("/users/login"); // redirect to login if user is not logged in

  useEffect(() => {
    if (id) {
      dataFetcher(`users/${id}`, "GET");
    }
  }, [id, dataFetcher]);

  const isCurrentUser = loggedInClientId === id; //check if id is the same

  const renderProfileSection = () => (
    <Card className="mb-6 shadow-lg">
      <GoBackButton />

      <Row gutter={[16, 16]} className="items-center">
        <Col xs={24} sm={8} md={6} className="flex justify-center">
          <img
            src={data?.data?.photo ? data?.data?.photo : avatar}
            alt={`${data?.data?.firstName}'s profile image`}
            className="w-32 h-32 object-cover rounded-full shadow-md"
          />
        </Col>
        <Col xs={24} sm={16} md={18}>
          <Title level={3}>
            {`${data?.data?.firstName} ${data?.data?.lastName}`} (
            <Text type="secondary">{data?.data?.role}</Text>)
          </Title>

          <Text type="secondary">{data?.data?.position}</Text>
          <Divider />
          <div className="flex gap-4">
            {isAdminOrHr && <UpdateUserPositionAndRole userId={id} />}
          </div>
        </Col>
      </Row>
    </Card>
  );

  const renderPersonalInformation = () => (
    <Card title="Personal Information" className="mb-6 shadow-lg">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Text strong>Year of Call:</Text> {formatDate(data?.data?.yearOfCall)}
        </Col>
        <Col span={12}>
          <Text strong>University Attended:</Text>{" "}
          {data?.data?.universityAttended}
        </Col>
        <Col span={12}>
          <Text strong>Law School Attended:</Text>{" "}
          {data?.data?.lawSchoolAttended}
        </Col>
        <Col span={12}>
          <Text strong>Practice Area:</Text> {data?.data?.practiceArea}
        </Col>
      </Row>
    </Card>
  );

  const renderContactDetails = () => (
    <Card title="Contact Details" className="mb-6 shadow-lg">
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Text strong>Email:</Text> {data?.data?.email}
        </Col>
        <Col span={12}>
          <Text strong>Phone:</Text> {data?.data?.phone}
        </Col>
        <Col span={24}>
          <Text strong>Address:</Text> {data?.data?.address}
        </Col>
        <Col span={24}>
          <Text strong>Bio:</Text> {data?.data?.bio}
        </Col>
      </Row>
    </Card>
  );

  return (
    <>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <PageErrorAlert errorCondition={error} errorMessage={error} />
      ) : (
        <div className="p-4">
          {renderProfileSection()}
          {isAdminOrHr || isCurrentUser ? (
            <>
              {renderPersonalInformation()}
              {renderContactDetails()}
              <LeaveBalanceDisplay userId={id} />
            </>
          ) : (
            renderPersonalInformation()
          )}
        </div>
      )}
    </>
  );
};

export default StaffDetails;
