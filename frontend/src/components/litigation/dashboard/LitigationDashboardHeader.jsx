// components/litigation/dashboard/LitigationDashboardHeader.jsx
import { Button, Typography, Badge, Tooltip, Space } from "antd";
import {
  PlusOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FileTextOutlined,
  //   ScaleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

const LitigationDashboardHeader = ({ totalMatters, onRefresh, isLoading }) => {
  const navigate = useNavigate();

  const handleCreate = () => {
    const returnPath = `/dashboard/matters/litigation/:matterId/create`;
    navigate(
      `/dashboard/matters/create?type=litigation&returnTo=${encodeURIComponent(
        returnPath,
      )}`,
    );
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Section */}
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
              {/* <ScaleOutlined className="text-indigo-600 text-xl" /> */}
            </div>
            <Badge
              count={totalMatters}
              showZero
              className="absolute -top-1 -right-1"
              style={{
                backgroundColor: totalMatters > 0 ? "#4f46e5" : "#9ca3af",
                color: "white",
                fontSize: "10px",
                fontWeight: 600,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Title level={4} className="!mb-0 !text-gray-900 font-semibold">
                Litigation Matters
              </Title>
              <Badge
                count="Case Management"
                style={{
                  backgroundColor: "#e0e7ff",
                  color: "#4f46e5",
                  fontSize: "11px",
                  fontWeight: 500,
                  padding: "0 8px",
                  borderRadius: "12px",
                  border: "1px solid #c7d2fe",
                }}
              />
            </div>
            <Text type="secondary" className="text-sm">
              Track court cases, hearings, judgments, and case outcomes
            </Text>
          </div>
        </div>

        {/* Right Section */}
        <Space size={12}>
          <Tooltip title="Refresh data">
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={isLoading}
              className="text-gray-600 hover:text-indigo-600"
            />
          </Tooltip>

          <Tooltip title="Export matters">
            <Button
              icon={<DownloadOutlined />}
              className="hidden sm:inline-flex text-gray-600 hover:text-indigo-600">
              Export
            </Button>
          </Tooltip>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
            className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600 shadow-sm">
            New Litigation Matter
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default LitigationDashboardHeader;
