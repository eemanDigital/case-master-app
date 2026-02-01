import React from "react";
import { Flex, Button, Space, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const PageHeader = ({
  title,
  subtitle,
  showBack = false,
  backPath,
  extra = null,
  children,
  className = "",
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backPath) {
      navigate(backPath);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="px-6 py-4">
        <Flex vertical gap="middle">
          <Flex justify="space-between" align="center">
            <Flex align="center" gap="middle">
              {showBack && (
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBack}
                  size="large"
                />
              )}
              <Flex vertical>
                <Title level={3} className="!mb-0">
                  {title}
                </Title>
                {subtitle && <Text type="secondary">{subtitle}</Text>}
              </Flex>
            </Flex>

            {extra && <Space size="middle">{extra}</Space>}
          </Flex>

          {children && <div>{children}</div>}
        </Flex>
      </div>
    </div>
  );
};

export default PageHeader;
