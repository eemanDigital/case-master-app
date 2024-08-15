import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Alert, Col, Descriptions, Divider } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import UpdateClientInfo from "./UpdateClientInfo";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAdminHook } from "../hooks/useAdminHook";

const ClientDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { isClient } = useAdminHook();

  useEffect(() => {
    dataFetcher(`users/${id}`, "GET");
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <Alert message={error} />;
  }

  return (
    <>
      {isClient && <UpdateClientInfo />}

      <Divider />
      <Descriptions title="Client Details" bordered>
        <Descriptions.Item label="First Name">
          {data?.data?.firstName}
        </Descriptions.Item>
        <Descriptions.Item label="Second Name">
          {data?.data?.secondName || <p>N/A</p>}
        </Descriptions.Item>
        <Descriptions.Item label="Email">{data?.data?.email}</Descriptions.Item>
        <Descriptions.Item label="Phone">{data?.data?.phone}</Descriptions.Item>

        <Descriptions.Item label="Address">
          {data?.data?.address}
        </Descriptions.Item>
        <Descriptions.Item label="Case">
          {data?.data?.case?.map((c, index) => (
            <div key={index}>
              <p>
                {index + 1}: {c.firstParty?.name[0]?.name} vs{" "}
                {c.secondParty?.name[0]?.name}
              </p>
              {index < data.data.case.length - 1 ? <br /> : ""}
            </div>
          ))}
        </Descriptions.Item>
        <Descriptions.Item label="Is Active">
          {data?.data?.active && "Yes, an active Client"}
        </Descriptions.Item>
      </Descriptions>
      <Divider />

      {/* <PaymentMadeOnCase
        clientId={data?.data?._id}
        caseId={data?.data?.case?._id}
      /> */}
    </>
  );
};

export default ClientDetails;
