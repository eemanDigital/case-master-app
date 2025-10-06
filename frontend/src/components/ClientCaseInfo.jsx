import PropTypes from "prop-types";
import { Card, Avatar, Tooltip, Typography, Tag, Badge, Divider } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  ScaleIcon,
  UserGroupIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

const { Title, Text } = Typography;

function ClientCaseInfo({ cases }) {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "decided":
        return {
          color: "success",
          icon: <CheckCircleOutlined />,
          label: "Decided",
        };
      case "pending":
        return {
          color: "warning",
          icon: <ClockCircleOutlined />,
          label: "Pending",
        };
      case "active":
        return {
          color: "processing",
          icon: <ClockCircleOutlined />,
          label: "Active",
        };
      case "closed":
        return {
          color: "default",
          icon: <CheckCircleOutlined />,
          label: "Closed",
        };
      default:
        return {
          color: "default",
          icon: <ClockCircleOutlined />,
          label: status,
        };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "blue";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {cases?.map((singleCase, index) => {
        const status = getStatusColor(singleCase.caseStatus);
        const priority = getPriorityColor(singleCase.priority);

        return (
          <Card
            key={singleCase._id || index}
            className="bg-gradient-to-br from-white to-blue-50/50 border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
            hoverable
            styles={{
              body: { padding: "20px" },
            }}>
            {/* Case Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ScaleIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <Badge
                    count={`#${index + 1}`}
                    color="blue"
                    className="mb-1"
                  />
                  <Title level={4} className="m-0 text-gray-900 line-clamp-2">
                    {singleCase?.firstParty?.name[0]?.name} vs{" "}
                    {singleCase?.secondParty?.name[0]?.name}
                  </Title>
                </div>
              </div>
            </div>

            {/* Case Status & Priority */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <Tag
                color={status.color}
                icon={status.icon}
                className="flex items-center gap-1 font-semibold text-sm">
                {status.label}
              </Tag>
              {singleCase.priority && (
                <Tag color={priority} className="text-xs font-medium">
                  {singleCase.priority} Priority
                </Tag>
              )}
            </div>

            {/* Case Details */}
            {singleCase.caseType && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                  <Text className="text-sm font-medium text-gray-700">
                    Case Type
                  </Text>
                </div>
                <Text className="text-gray-900 font-medium">
                  {singleCase.caseType}
                </Text>
              </div>
            )}

            {singleCase.courtName && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ScaleIcon className="w-4 h-4 text-gray-500" />
                  <Text className="text-sm font-medium text-gray-700">
                    Court
                  </Text>
                </div>
                <Text className="text-gray-900 font-medium">
                  {singleCase.courtName.toUpperCase()}
                </Text>
              </div>
            )}

            <Divider className="my-4" />

            {/* Account Officers Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TeamOutlined className="text-blue-600" />
                <Title level={5} className="m-0 text-gray-900">
                  Account Officer(s)
                </Title>
              </div>

              <div className="flex flex-wrap gap-3">
                {singleCase?.accountOfficer?.map((officer, officerIndex) => (
                  <Tooltip
                    key={officerIndex}
                    title={
                      <div className="space-y-2 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <UserGroupIcon className="w-4 h-4 text-blue-600" />
                          <Text strong className="text-gray-300 text-sm">
                            {officer.firstName} {officer.lastName}
                          </Text>
                        </div>
                        <div className="flex items-center gap-2">
                          <MailOutlined className="text-gray-500" />
                          <Text className="text-gray-300 text-sm">
                            {officer?.email}
                          </Text>
                        </div>
                        <div className="flex items-center gap-2">
                          <PhoneOutlined className="text-gray-500" />
                          <Text className="text-gray-300 text-sm">
                            {officer?.phone}
                          </Text>
                        </div>
                        {officer.role && (
                          <Tag color="blue" className="text-xs">
                            {officer.role}
                          </Tag>
                        )}
                      </div>
                    }
                    placement="top">
                    <div className="flex flex-col items-center gap-2 cursor-pointer group">
                      <Avatar
                        src={officer?.photo}
                        icon={!officer?.photo && <UserOutlined />}
                        size="large"
                        className="border-2 border-transparent group-hover:border-blue-500 transition-colors duration-200 shadow-sm"
                      />
                      <div className="text-center">
                        <Text className="text-xs font-medium text-gray-900 block">
                          {officer.firstName}
                        </Text>
                        <Text className="text-xs text-gray-500 block">
                          {officer.lastName}
                        </Text>
                      </div>
                    </div>
                  </Tooltip>
                ))}
              </div>

              {/* Empty State for Officers */}
              {(!singleCase?.accountOfficer ||
                singleCase.accountOfficer.length === 0) && (
                <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                  <UserOutlined className="text-gray-400 text-2xl mb-2" />
                  <Text className="text-gray-500 text-sm block">
                    No legal team assigned yet
                  </Text>
                </div>
              )}
            </div>

            {/* Case Footer */}
            <Divider className="my-4" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <Text>Suit No.</Text>
              <Text className="font-mono font-medium">
                {singleCase.suitNo || `CASE-${index + 1}`}
              </Text>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

ClientCaseInfo.propTypes = {
  cases: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
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
      caseType: PropTypes.string,
      courtName: PropTypes.string,
      suitNo: PropTypes.string,
      priority: PropTypes.string,
      accountOfficer: PropTypes.arrayOf(
        PropTypes.shape({
          photo: PropTypes.string,
          firstName: PropTypes.string.isRequired,
          lastName: PropTypes.string.isRequired,
          email: PropTypes.string.isRequired,
          phone: PropTypes.string.isRequired,
          role: PropTypes.string,
        })
      ),
    })
  ).isRequired,
};

export default ClientCaseInfo;
