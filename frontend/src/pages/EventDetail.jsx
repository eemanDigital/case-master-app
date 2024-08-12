import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Descriptions, Spin } from "antd";

import { useDataFetch } from "../hooks/useDataFetch";
import LoadingSpinner from "../components/LoadingSpinner";

const EventDetail = () => {
  const { id } = useParams();
  const { dataFetcher, error, loading, data } = useDataFetch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEventDetail = async () => {
      await dataFetcher(`events/${id}`, "get");
    };

    fetchEventDetail();
  }, [id]);

  if (loading || !data) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Button onClick={() => navigate(-1)}>Go Back</Button>
      <Descriptions title="Event Details" bordered>
        <Descriptions.Item label="Title">{data?.data?.title}</Descriptions.Item>
        <Descriptions.Item label="Start">
          {new Date(data?.data?.start).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="End">
          {new Date(data?.data?.end).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="Description">
          {data?.data?.description}
        </Descriptions.Item>
        <Descriptions.Item label="Location">
          {data?.data?.location}
        </Descriptions.Item>
        <Descriptions.Item label="Participants">
          {data?.data?.participants
            .map((p) => `${p.firstName} ${p.lastName}`)
            .join(", ")}
        </Descriptions.Item>
      </Descriptions>
    </>
  );
};

export default EventDetail;
