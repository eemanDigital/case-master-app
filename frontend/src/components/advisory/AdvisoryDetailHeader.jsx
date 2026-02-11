/ ─── AdvisoryDetailHeader.jsx ─────────────────────────────────────────────────
import React from "react";
import { Button, Tag, Tooltip, Dropdown, Space, Typography, Avatar } from "antd";
import {
  EditOutlined, DeleteOutlined, CheckCircleOutlined,
  ReloadOutlined, EllipsisOutlined, LockOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { ADVISORY_TYPE_LABELS } from "../../../features/advisory/constants/advisoryConstants";

const { Text, Title } = Typography;

const STATUS_COLORS = {
  active:    "bg-blue-100 text-blue-700 border-blue-200",
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed:    "bg-slate-100 text-slate-600 border-slate-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
};

const PRIORITY_COLORS = {
  high:   "text-red-600",
  medium: "text-amber-500",
  low:    "text-emerald-600",
};

export const AdvisoryDetailHeader = ({ detail, matterId, onComplete, onDelete, onRestore, onEdit, onRefresh }) => {
  const matter       = detail?.matter || detail;
  const advisoryType = detail?.advisoryType;
  const status       = matter?.status || "pending";
  const isDeleted    = detail?.isDeleted;
  const isCompleted  = status === "completed";

  const overdue =
    matter?.expectedClosureDate &&
    dayjs(matter.expectedClosureDate).isBefore(dayjs()) &&
    !["completed", "closed", "cancelled"].includes(status);

  return (
    <div className="pb-3">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
              {matter?.matterNumber}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
              {status}
            </span>
            {matter?.priority && (
              <span className={`text-xs font-semibold capitalize ${PRIORITY_COLORS[matter.priority]}`}>
                ● {matter.priority}
              </span>
            )}
            {matter?.isConfidential && (
              <Tooltip title="Confidential">
                <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
                  <LockOutlined className="text-[10px]" /> Confidential
                </span>
              </Tooltip>
            )}
            {overdue && (
              <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full">
                <ExclamationCircleOutlined className="text-[10px]" /> Overdue
              </span>
            )}
            {advisoryType && (
              <span className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full">
                {ADVISORY_TYPE_LABELS[advisoryType] || advisoryType}
              </span>
            )}
          </div>

          <Title level={4} className="!mb-1 !text-slate-800 font-bold leading-snug line-clamp-2">
            {matter?.title || "Advisory Matter"}
          </Title>

          {matter?.natureOfMatter && (
            <Text className="text-sm text-slate-400 capitalize">{matter.natureOfMatter}</Text>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Tooltip title="Refresh">
            <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh}
              className="text-slate-500" />
          </Tooltip>
          {!isDeleted && !isCompleted && (
            <Button size="small" icon={<CheckCircleOutlined />}
              onClick={onComplete}
              className="border-emerald-300 text-emerald-600 hover:border-emerald-500">
              Complete
            </Button>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={onEdit}
            className="text-slate-600">
            Edit
          </Button>
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                isDeleted
                  ? { key: "restore", label: "Restore Advisory", onClick: onRestore }
                  : { key: "delete", label: "Delete Advisory", danger: true, icon: <DeleteOutlined />, onClick: onDelete },
              ],
            }}
            placement="bottomRight"
          >
            <Button size="small" icon={<EllipsisOutlined />} className="text-slate-500" />
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default AdvisoryDetailHeader;
