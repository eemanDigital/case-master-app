import { memo, useMemo } from "react";
import { Descriptions, Tag, Space, Alert } from "antd";
import { UserOutlined, FileTextOutlined } from "@ant-design/icons";
import { MATTER_STATUS } from "../../utils/litigationConstants";

const MatterContextCard = memo(({ matter }) => {
  const clientName = useMemo(() => {
    if (!matter?.client) return "-";
    if (matter.client.companyName) return matter.client.companyName;
    return `${matter.client.firstName || ""} ${matter.client.lastName || ""}`.trim() || "-";
  }, [matter?.client]);

  const accountOfficers = useMemo(() => {
    if (!matter?.accountOfficer || !Array.isArray(matter.accountOfficer)) return [];
    return matter.accountOfficer.map((officer) => {
      if (officer.firstName || officer.lastName) {
        return `${officer.firstName || ""} ${officer.lastName || ""}`.trim();
      }
      return officer.label || officer.name || "Unknown";
    }).filter(Boolean);
  }, [matter?.accountOfficer]);

  if (!matter) return null;

  return (
    <Alert
      type="info"
      icon={<FileTextOutlined />}
      message="Matter Information"
      description={
        <Descriptions size="small" column={4} className="mt-2">
          <Descriptions.Item label="Matter Number">
            <Tag color="blue">{matter?.matterNumber || "-"}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Title">{matter?.title || "-"}</Descriptions.Item>
          <Descriptions.Item label="Client">
            <Space>
              <UserOutlined />
              {clientName}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Account Officer(s)">
            <Space direction="vertical" size={0}>
              {accountOfficers.length > 0 ? (
                accountOfficers.map((name, idx) => (
                  <Tag key={idx}><UserOutlined /> {name}</Tag>
                ))
              ) : (
                "-"
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={matter?.status === "active" ? "green" : matter?.status === "pending" ? "orange" : "default"}>
              {MATTER_STATUS.find(s => s.value === matter?.status)?.label || matter?.status || "-"}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Priority">
            <Tag color={
              matter?.priority === "urgent" ? "red" :
              matter?.priority === "high" ? "orange" :
              matter?.priority === "medium" ? "blue" : "gray"
            }>
              {matter?.priority || "-"}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      }
      className="mb-6"
    />
  );
});

MatterContextCard.displayName = "MatterContextCard";

export default MatterContextCard;
