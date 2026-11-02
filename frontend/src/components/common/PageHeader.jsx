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
      <div className="px-3 py-4 sm:px-6">
        <Flex vertical gap="middle">
          <Flex
            justify="space-between"
            align="center"
            wrap
            gap="small">
            <Flex align="center" gap="middle" className="min-w-0 flex-1">
              {showBack && (
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBack}
                  size="large"
                />
              )}
              <Flex vertical className="min-w-0">
                <Title level={3} className="!mb-0 !text-xl sm:!text-2xl">
                  {title}
                </Title>
                {subtitle && (
                  <Text type="secondary" className="text-xs sm:text-sm">
                    {subtitle}
                  </Text>
                )}
              </Flex>
            </Flex>

            {extra && (
              <Space size="small" wrap className="max-w-full">
                {extra}
              </Space>
            )}
          </Flex>

          {children && <div>{children}</div>}
        </Flex>
      </div>
    </div>
  );
};

export default PageHeader;
