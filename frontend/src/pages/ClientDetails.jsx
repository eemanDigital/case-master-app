import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, Typography, Descriptions, Tag, Divider, Space } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { useDataFetch } from "../hooks/useDataFetch";
import { useAdminHook } from "../hooks/useAdminHook";
import UpdateClientInfo from "./UpdateClientInfo";
import UpdateClientStatus from "./UpDateClientStatus";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";
import GoBackButton from "../components/GoBackButton";

const { Title, Text } = Typography;

const ClientDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();
  const { isClient, isSuperOrAdmin } = useAdminHook();

  useEffect(() => {
    dataFetcher(`users/${id}`, "GET");
  }, [id, dataFetcher]);

  if (loading) return <LoadingSpinner />;
  if (error)
    return <PageErrorAlert errorCondition={error} errorMessage={error} />;

  const clientData = data?.data;

  return (
    <Card className="shadow-lg">
      <GoBackButton />

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <Title level={2}>
            <UserOutlined className="mr-2" />
            Client Details
          </Title>
          <Space wrap>
            {isClient && <UpdateClientInfo />}
            {isSuperOrAdmin && <UpdateClientStatus clientId={id} />}
          </Space>
        </div>

        <Divider />

        <Descriptions
          bordered
          column={{ xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
          <Descriptions.Item label="First Name">
            {clientData?.firstName}
          </Descriptions.Item>
          <Descriptions.Item label="Second Name">
            {clientData?.secondName || "N/A"}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={clientData?.isActive ? "green" : "red"}>
              {clientData?.isActive ? "Active" : "Inactive"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <>
                <MailOutlined /> Email
              </>
            }>
            {clientData?.email}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <>
                <PhoneOutlined /> Phone
              </>
            }>
            {clientData?.phone}
          </Descriptions.Item>
          <Descriptions.Item
            label={
              <>
                <HomeOutlined /> Address
              </>
            }>
            {clientData?.address}
          </Descriptions.Item>
        </Descriptions>

        {/* <Card
          title={
            <>
              <FileOutlined /> Cases
            </>
          }
          className="mt-4">
          {clientData?.case?.length > 0 ? (
            clientData.case.map((c, index) => (
              <div key={index} className="mb-2">
                <Text strong>Case {index + 1}:</Text>{" "}
                {c.firstParty?.name[0]?.name} vs {c.secondParty?.name[0]?.name}
              </div>
            ))
          ) : (
            <Text type="secondary">No cases associated with this client.</Text>
          )}
        </Card> */}
      </Space>
    </Card>
  );
};

export default ClientDetails;
