import PropTypes from "prop-types";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, Typography, Spin, Alert } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import GoBackButton from "../components/GoBackButton";

const { Title, Text } = Typography;

const EventDetail = () => {
  const { id } = useParams();
  const { dataFetcher, error, loading, data } = useDataFetch();
  useRedirectLogoutUser("/users/login");

  useEffect(() => {
    const fetchEventDetail = async () => {
      await dataFetcher(`events/${id}`, "get");
    };
    fetchEventDetail();
  }, [id, dataFetcher]);

  if (loading || !data) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error || "Failed to fetch data"}
        type="error"
        showIcon
        className="m-4"
      />
    );
  }

  const { title, start, end, description, location, participants } =
    data?.data || {};

  return (
    <div className="max-w-4xl mx-auto p-4">
      <GoBackButton />
      <Card className="shadow-lg rounded-lg">
        <Title level={2} className="mb-6 text-center text-blue-600">
          {title}
        </Title>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailItem label="Start" value={new Date(start).toLocaleString()} />
          <DetailItem label="End" value={new Date(end).toLocaleString()} />
          <DetailItem label="Location" value={location} />
          <DetailItem
            label="Participants"
            value={participants
              ?.map((p) => `${p.firstName} ${p.lastName}`)
              .join(", ")}
          />
        </div>
        <div className="mt-6">
          <Text strong className="text-lg">
            Description:
          </Text>
          <p className="mt-2 text-gray-700">{description}</p>
        </div>
      </Card>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div className="mb-4">
    <Text strong className="text-gray-600">
      {label}:
    </Text>
    <div className="mt-1 text-black">{value}</div>
  </div>
);

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.node,
  ]).isRequired,
};
export default EventDetail;
