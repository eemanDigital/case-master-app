export const AdvisoryMetaPanel = ({ detail }) => {
  const matter = detail?.matter;

  const Row = ({ label, value }) =>
    value ? (
      <div className="flex items-start justify-between gap-2 py-2 border-b border-slate-100 last:border-0">
        <Text className="text-xs text-slate-400 shrink-0 w-28">{label}</Text>
        <Text className="text-xs text-slate-700 text-right font-medium">
          {value}
        </Text>
      </div>
    ) : null;

  const fmt = (d) => (d ? dayjs(d).format("DD MMM YYYY") : null);
  const client = matter?.client;
  const officers = matter?.accountOfficer || [];

  return (
    <div className="space-y-4">
      {/* Client card */}
      {client && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
            Client
          </Text>
          <div className="flex items-center gap-3">
            <Avatar
              size={36}
              className="bg-indigo-100 text-indigo-700 font-bold text-sm">
              {client.firstName?.[0]}
              {client.lastName?.[0]}
            </Avatar>
            <div>
              <div className="text-sm font-semibold text-slate-800">
                {client.firstName} {client.lastName}
              </div>
              <div className="text-xs text-slate-400">{client.email}</div>
              {client.phone && (
                <div className="text-xs text-slate-400">{client.phone}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Officers */}
      {officers.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
            Account Officers
          </Text>
          <div className="space-y-2">
            {officers.map((o) => (
              <div key={o._id} className="flex items-center gap-2.5">
                <Avatar
                  size={28}
                  className="bg-slate-100 text-slate-600 text-xs font-bold">
                  {o.firstName?.[0]}
                  {o.lastName?.[0]}
                </Avatar>
                <div>
                  <div className="text-xs font-medium text-slate-700">
                    {o.firstName} {o.lastName}
                  </div>
                  <div className="text-xs text-slate-400 capitalize">
                    {o.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dates & billing */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <Text className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Details
        </Text>
        <Row label="Date Opened" value={fmt(matter?.dateOpened)} />
        <Row
          label="Expected Closure"
          value={fmt(matter?.expectedClosureDate)}
        />
        <Row label="Target Delivery" value={fmt(detail?.targetDeliveryDate)} />
        <Row label="Actual Delivery" value={fmt(detail?.actualDeliveryDate)} />
        <Row label="Billing Type" value={matter?.billingType} />
        <Row
          label="Est. Value"
          value={
            matter?.estimatedValue
              ? `${matter.currency} ${Number(matter.estimatedValue).toLocaleString()}`
              : null
          }
        />
        <Row
          label="Conflict Checked"
          value={
            matter?.conflictChecked
              ? `Yes — ${fmt(matter.conflictCheckDate)}`
              : "No"
          }
        />
        <Row
          label="Filed by Office"
          value={matter?.isFiledByTheOffice ? "Yes" : "No"}
        />
      </div>
    </div>
  );
};

// ============================================================
// src/components/advisory/shared/SectionHeader.jsx
// ============================================================
import React from "react";
import { Typography, Button } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Text } = Typography;

export const SectionHeader = ({
  title,
  icon,
  count,
  onAdd,
  addLabel = "Add",
  extra,
  loading,
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      {icon && <span className="text-indigo-500 text-base">{icon}</span>}
      <Text className="font-semibold text-slate-700 text-sm uppercase tracking-wider">
        {title}
      </Text>
      {count !== undefined && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
          {count}
        </span>
      )}
    </div>
    <div className="flex items-center gap-2">
      {extra}
      {onAdd && (
        <Button
          size="small"
          type="primary"
          icon={<PlusOutlined />}
          onClick={onAdd}
          loading={loading}
          className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-xs font-medium">
          {addLabel}
        </Button>
      )}
    </div>
  </div>
);

export default SectionHeader;

// ============================================================
// src/components/advisory/shared/EmptySection.jsx
// ============================================================
export const EmptySection = ({
  description = "Nothing here yet",
  onAdd,
  addLabel = "Add one",
  icon,
}) => (
  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400 text-xl">
      {icon || "📂"}
    </div>
    <p className="text-sm text-slate-500 mb-1">{description}</p>
    {onAdd && (
      <button
        onClick={onAdd}
        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-2 underline underline-offset-2">
        {addLabel}
      </button>
    )}
  </div>
);

// ============================================================
// src/components/advisory/shared/CharacterCounter.jsx
// ============================================================
export const CharacterCounter = ({ value = "", max }) => {
  const len = (value || "").length;
  const pct = len / max;
  const color =
    pct >= 0.95
      ? "text-red-500"
      : pct >= 0.8
        ? "text-amber-500"
        : "text-slate-400";
  return (
    <span className={`text-xs tabular-nums ${color}`}>
      {len.toLocaleString()}/{max.toLocaleString()}
    </span>
  );
};

// ============================================================
// src/components/advisory/shared/TagInput.jsx
// ============================================================
import { Tag, Input } from "antd";
import { useState } from "react";

export const TagInput = ({
  value = [],
  onChange,
  placeholder = "Type and press Enter…",
  maxTags = 30,
}) => {
  const [inputVal, setInputVal] = useState("");

  const add = () => {
    const v = inputVal.trim();
    if (!v || value.includes(v) || value.length >= maxTags) return;
    onChange([...value, v]);
    setInputVal("");
  };

  const remove = (tag) => onChange(value.filter((t) => t !== tag));

  return (
    <div
      className="min-h-[42px] border border-slate-200 rounded-lg p-2
      focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-100
      bg-white transition-all">
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {value.map((tag) => (
          <Tag
            key={tag}
            closable
            onClose={() => remove(tag)}
            className="rounded-full text-xs bg-indigo-50 text-indigo-700 border-indigo-200 m-0">
            {tag}
          </Tag>
        ))}
      </div>
      <Input
        bordered={false}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onPressEnter={add}
        onBlur={add}
        placeholder={value.length === 0 ? placeholder : "Add another…"}
        className="p-0 text-sm h-auto"
        size="small"
        disabled={value.length >= maxTags}
      />
    </div>
  );
};

// ============================================================
// src/components/advisory/shared/InlineEditWrapper.jsx
// ============================================================
import { Button as AntButton } from "antd";
import { EditOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons";

export const InlineEditWrapper = ({
  displayNode,
  editNode,
  onSave,
  onCancel,
  isEditing,
  setEditing,
  loading,
}) => {
  if (!isEditing) {
    return (
      <div className="group relative">
        {displayNode}
        <button
          onClick={() => setEditing(true)}
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100
            transition-opacity text-xs text-indigo-500 hover:text-indigo-700
            bg-white border border-indigo-200 rounded px-2 py-0.5 shadow-sm">
          <EditOutlined className="mr-1" />
          Edit
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {editNode}
      <div className="flex gap-2">
        <AntButton
          size="small"
          type="primary"
          icon={<CheckOutlined />}
          onClick={onSave}
          loading={loading}
          className="bg-indigo-600 border-indigo-600 text-xs">
          Save
        </AntButton>
        <AntButton
          size="small"
          icon={<CloseOutlined />}
          onClick={onCancel}
          className="text-xs">
          Cancel
        </AntButton>
      </div>
    </div>
  );
};

// ============================================================
// BADGE COMPONENTS
// ============================================================

// src/components/advisory/shared/StatusBadge.jsx
const STATUS_MAP = {
  active: { cls: "bg-blue-50 text-blue-700 border-blue-200", label: "Active" },
  pending: {
    cls: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Pending",
  },
  completed: {
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    label: "Completed",
  },
  closed: {
    cls: "bg-slate-100 text-slate-600 border-slate-200",
    label: "Closed",
  },
  cancelled: {
    cls: "bg-red-50 text-red-600 border-red-200",
    label: "Cancelled",
  },
};

export const AdvisoryStatusBadge = ({ status }) => {
  const cfg = STATUS_MAP[status] || STATUS_MAP.pending;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// src/components/advisory/shared/AdvisoryTypeBadge.jsx
import { ADVISORY_TYPE_LABELS } from "../../../features/advisory/constants/advisoryConstants";

const TYPE_COLORS = {
  legal_opinion: "#6366f1",
  regulatory_compliance: "#0ea5e9",
  due_diligence: "#8b5cf6",
  contract_review: "#ec4899",
  policy_development: "#14b8a6",
  legal_research: "#f97316",
  risk_assessment: "#ef4444",
  litigation_risk_analysis: "#dc2626",
  regulatory_strategy: "#7c3aed",
  transaction_advisory: "#0891b2",
  other: "#6b7280",
};

export const AdvisoryTypeBadge = ({ type }) => {
  const label = ADVISORY_TYPE_LABELS[type] || type || "N/A";
  const color = TYPE_COLORS[type] || "#6b7280";
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: `${color}15`,
        color,
        border: `1px solid ${color}28`,
      }}>
      {label}
    </span>
  );
};

// src/components/advisory/shared/PriorityBadge.jsx
const PRIORITY_MAP = {
  high: { cls: "bg-red-50 text-red-600 border-red-200", dot: "bg-red-500" },
  medium: {
    cls: "bg-amber-50 text-amber-600 border-amber-200",
    dot: "bg-amber-500",
  },
  low: {
    cls: "bg-emerald-50 text-emerald-600 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

export const PriorityBadge = ({ priority }) => {
  const cfg = PRIORITY_MAP[priority] || PRIORITY_MAP.low;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {priority}
    </span>
  );
};

// src/components/advisory/shared/ConfidenceBadge.jsx
const CONFIDENCE_MAP = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-red-50 text-red-600 border-red-200",
};

export const ConfidenceBadge = ({ confidence }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${CONFIDENCE_MAP[confidence] || CONFIDENCE_MAP.medium}`}>
    {confidence} confidence
  </span>
);

// src/components/advisory/shared/RiskLevelBadge.jsx
const RISK_MAP = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-600 border-red-200",
  critical: "bg-red-100 text-red-800 border-red-300 font-bold",
};

export const RiskLevelBadge = ({ level }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${RISK_MAP[level] || RISK_MAP.medium}`}>
    {level === "critical" ? "⛔ " : ""}
    {level}
  </span>
);

// src/components/advisory/shared/ImplementationStatusBadge.jsx
const IMPL_MAP = {
  pending: "bg-slate-100 text-slate-600 border-slate-200",
  "in-progress": "bg-blue-50 text-blue-600 border-blue-200",
  implemented: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
};

export const ImplementationStatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize ${IMPL_MAP[status] || IMPL_MAP.pending}`}>
    {status?.replace(/-/g, " ")}
  </span>
);

// src/components/advisory/shared/DeliverableStatusBadge.jsx
const DELIV_MAP = {
  pending: "bg-slate-100 text-slate-500 border-slate-200",
  "in-progress": "bg-blue-50 text-blue-600 border-blue-200",
  delivered: "bg-indigo-50 text-indigo-600 border-indigo-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const DeliverableStatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize ${DELIV_MAP[status] || DELIV_MAP.pending}`}>
    {status?.replace(/-/g, " ")}
  </span>
);

// src/components/advisory/shared/ResearchQuestionStatusBadge.jsx
const RQ_MAP = {
  pending: "bg-slate-100 text-slate-500 border-slate-200",
  researching: "bg-blue-50 text-blue-600 border-blue-200",
  answered: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const ResearchQuestionStatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize ${RQ_MAP[status] || RQ_MAP.pending}`}>
    {status}
  </span>
);

// src/components/advisory/shared/ComplianceStatusBadge.jsx
const COMP_MAP = {
  compliant: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "non-compliant": "bg-red-50 text-red-600 border-red-200",
  "partially-compliant": "bg-amber-50 text-amber-600 border-amber-200",
  "not-applicable": "bg-slate-100 text-slate-500 border-slate-200",
};

export const ComplianceStatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${COMP_MAP[status] || COMP_MAP["not-applicable"]}`}>
    {status?.replace(/-/g, " ")}
  </span>
);

export const DeliverableOverdueTag = ({ dueDate, status }) => {
  const isOverdue =
    dueDate &&
    ["pending", "in-progress"].includes(status) &&
    dayjs(dueDate).isBefore(dayjs());

  if (!isOverdue) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-600 border border-red-200">
      ⚠ Overdue
    </span>
  );
};
