// components/user-forms/steps/UserTypeStep.jsx
import { Card, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import PropTypes from "prop-types";

const { Title, Text } = Typography;

const UserTypeStep = ({ userTypeOptions, selectedUserType, onSelect }) => {
  return (
    <Card className="step-card">
      <Title level={4} className="text-center mb-6">
        <UserOutlined className="mr-2" />
        Select User Type
      </Title>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {userTypeOptions.map((type) => (
          <Card
            key={type.value}
            hoverable
            className={`user-type-card ${
              selectedUserType === type.value ? "selected" : ""
            }`}
            onClick={() => onSelect(type.value)}>
            <div className="text-center">
              <div className="user-type-icon mb-3">
                {type.icon || <UserOutlined />}
              </div>
              <Title level={5}>{type.label}</Title>
              <Text type="secondary" className="text-xs">
                {type.description}
              </Text>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};

UserTypeStep.propTypes = {
  userTypeOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      icon: PropTypes.node,
    }),
  ).isRequired,
  selectedUserType: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default UserTypeStep;
