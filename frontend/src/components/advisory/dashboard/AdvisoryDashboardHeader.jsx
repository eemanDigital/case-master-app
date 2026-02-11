// components/advisory/dashboard/AdvisoryDashboardHeader.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Button, Tooltip, Badge, Typography } from "antd";
import {
  ReloadOutlined,
  PlusOutlined,
  DownloadOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const AdvisoryDashboardHeader = ({ onRefresh, isLoading }) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20">
      <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <FolderOpenOutlined className="text-indigo-600 text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <Title level={4} className="!mb-0 !text-slate-800 font-semibold">
                Advisory Matters
              </Title>
              <Badge
                count="Beta"
                style={{
                  background: "#e0e7ff",
                  color: "#4f46e5",
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "0 8px",
                  borderRadius: "12px",
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage legal opinions, regulatory compliance and advisory work
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip title="Refresh dashboard">
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={isLoading}
              className="text-slate-600 hover:text-indigo-600"
            />
          </Tooltip>

          <Tooltip title="Export data">
            <Button
              icon={<DownloadOutlined />}
              className="hidden sm:inline-flex text-slate-600 hover:text-indigo-600">
              Export
            </Button>
          </Tooltip>

          <Link to="/dashboard/matters/create?type=advisory">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600 shadow-sm">
              New Advisory
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdvisoryDashboardHeader;
