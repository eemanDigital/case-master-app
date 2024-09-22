import PropTypes from "prop-types";
import { Card, Avatar, Tooltip, Typography, Tag, Divider } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

function ClientCaseInfo({ cases }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {cases?.map((singleCase, index) => (
        <Card
          key={index}
          className="w-full shadow-md hover:shadow-lg transition-shadow duration-300"
          hoverable>
          <Title level={4} className="mb-2">
            Case {index + 1}: {singleCase?.firstParty?.name[0]?.name} vs{" "}
            {singleCase?.secondParty?.name[0]?.name}
          </Title>
          <Divider className="my-3" />
          <div className="flex justify-between items-center mb-4">
            <Text strong>Status:</Text>
            <Tag
              color={
                singleCase.caseStatus === "decided" ? "success" : "warning"
              }
              icon={
                singleCase.caseStatus === "decided" ? (
                  <CheckCircleOutlined />
                ) : (
                  <ClockCircleOutlined />
                )
              }>
              {singleCase.caseStatus.toUpperCase()}
            </Tag>
          </div>
          <Divider className="my-3" />
          <Title level={5} className="mb-2">
            Account Officers:
          </Title>
          <div className="flex flex-wrap gap-2">
            {singleCase?.accountOfficer?.map((officer, officerIndex) => (
              <Tooltip
                key={officerIndex}
                title={
                  <div>
                    <p>
                      <strong>Name:</strong> {officer.firstName}{" "}
                      {officer.lastName}
                    </p>
                    <p>
                      <strong>Email:</strong> {officer?.email}
                    </p>
                    <p>
                      <strong>Phone:</strong> {officer?.phone}
                    </p>
                  </div>
                }>
                <Avatar
                  src={officer?.photo}
                  icon={!officer?.photo && <UserOutlined />}
                  size="large"
                  className="cursor-pointer"
                />
              </Tooltip>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

ClientCaseInfo.propTypes = {
  cases: PropTypes.arrayOf(
    PropTypes.shape({
      firstParty: PropTypes.shape({
        name: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired,
          })
        ),
      }),
      secondParty: PropTypes.shape({
        name: PropTypes.arrayOf(
          PropTypes.shape({
            name: PropTypes.string.isRequired,
          })
        ),
      }),
      caseStatus: PropTypes.string.isRequired,
      accountOfficer: PropTypes.arrayOf(
        PropTypes.shape({
          photo: PropTypes.string,
          firstName: PropTypes.string.isRequired,
          lastName: PropTypes.string.isRequired,
          email: PropTypes.string.isRequired,
          phone: PropTypes.string.isRequired,
        })
      ),
    })
  ).isRequired,
};

export default ClientCaseInfo;
