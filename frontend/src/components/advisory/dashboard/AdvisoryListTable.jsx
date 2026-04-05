// components/advisory/dashboard/AdvisoryListTable.jsx
import React, { useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Tag,
  Button,
  Avatar,
  Tooltip,
  Dropdown,
  Typography,
  Empty,
} from "antd";
import {
  EllipsisOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import {
  selectAdvisoryMatters,
  selectAdvisoryPagination,
  selectAdvisoryFilters,
  setFilters,
  fetchAllAdvisoryMatters,
  deleteAdvisoryDetails,
} from "../../../redux/features/advisory/advisorySlice";

dayjs.extend(relativeTime);

const { Text } = Typography;

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: {
      icon: <SyncOutlined spin />,
      label: "Active",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
    pending: {
      icon: <ClockCircleOutlined />,
      label: "Pending",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    closed: {
      icon: <ExclamationCircleOutlined />,
      label: "Closed",
      className: "bg-slate-50 text-slate-600 border-slate-200",
    },
    completed: {
      icon: <CheckCircleOutlined />,
      label: "Completed",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    cancelled: {
      icon: <ExclamationCircleOutlined />,
      label: "Cancelled",
      className: "bg-red-50 text-red-700 border-red-200",
    },
    "in-progress": {
      icon: <SyncOutlined spin />,
      label: "In Progress",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.className}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// Priority Dot Component
const PriorityDot = ({ priority }) => {
  const priorityConfig = {
    high: { className: "bg-red-500", text: "text-red-600" },
    medium: { className: "bg-amber-500", text: "text-amber-600" },
    low: { className: "bg-emerald-500", text: "text-emerald-600" },
  };

  const config = priorityConfig[priority] || priorityConfig.low;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${config.className}`} />
      <span className={`text-xs font-medium capitalize ${config.text}`}>
        {priority}
      </span>
    </span>
  );
};

// Advisory Type Pill Component
const AdvisoryTypePill = ({ type }) => {
  const typeColors = {
    legal_opinion: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
    },
    regulatory_compliance: {
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      border: "border-cyan-200",
    },
    due_diligence: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
    },
    contract_review: {
      bg: "bg-pink-50",
      text: "text-pink-700",
      border: "border-pink-200",
    },
    policy_development: {
      bg: "bg-teal-50",
      text: "text-teal-700",
      border: "border-teal-200",
    },
    legal_research: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    risk_assessment: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    other: {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
    },
  };

  const config = typeColors[type] || typeColors.other;
  const label = type?.replace(/_/g, " ") || "Advisory";

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}>
      {label}
    </span>
  );
};

// Client Cell Component
const ClientCell = ({ client }) => {
  if (!client) return <Text type="secondary">—</Text>;

  const initials =
    `${client.firstName?.[0] || ""}${client.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar
        size={32}
        className="flex-shrink-0 bg-indigo-100 text-indigo-700 text-xs font-bold">
        {initials || <UserOutlined />}
      </Avatar>
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-800 truncate">
          {client.firstName} {client.lastName}
        </div>
        <div className="text-xs text-slate-500 truncate">{client.email}</div>
      </div>
    </div>
  );
};

// Officers Cell Component
const OfficersCell = ({ officers = [] }) => {
  if (!officers?.length) return <Text type="secondary">—</Text>;

  return (
    <Avatar.Group
      maxCount={2}
      size={28}
      maxStyle={{
        background: "#e0e7ff",
        color: "#4f46e5",
        fontSize: 11,
        border: "2px solid white",
      }}>
      {officers.map((officer) => (
        <Tooltip
          key={officer._id}
          title={`${officer.firstName} ${officer.lastName} (${officer.role})`}
          placement="top">
          <Avatar
            size={28}
            src={officer.photo}
            className="bg-slate-200 text-slate-600 text-xs font-semibold cursor-pointer border-2 border-white">
            {!officer.photo &&
              `${officer.firstName?.[0]}${officer.lastName?.[0]}`}
          </Avatar>
        </Tooltip>
      ))}
    </Avatar.Group>
  );
};

// Setup Status Tag Component
const SetupStatusTag = ({ hasSetup }) => {
  if (hasSetup) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircleOutlined className="text-[10px]" />
        Setup Complete
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-700 border border-amber-200">
      <ExclamationCircleOutlined className="text-[10px]" />
      Setup Pending
    </span>
  );
};

// Main Table Component
const AdvisoryListTable = ({
  selectedRowKeys,
  onSelectionChange,
  searchText,
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const matters = useSelector(selectAdvisoryMatters);
  const pagination = useSelector(selectAdvisoryPagination);
  const filters = useSelector(selectAdvisoryFilters);

  // Handle table change (pagination, sorting)
  const handleTableChange = useCallback(
    (pag, _, sorter) => {
      const newFilters = {
        page: pag.current,
        limit: pag.pageSize,
        sort: sorter.order
          ? `${sorter.order === "descend" ? "-" : ""}${sorter.field}`
          : filters.sort,
      };
      dispatch(setFilters(newFilters));
      dispatch(fetchAllAdvisoryMatters(newFilters));
    },
    [dispatch, filters.sort],
  );

  // Handle delete
  const handleDelete = useCallback(
    async (matterId) => {
      await dispatch(deleteAdvisoryDetails({ matterId, deletionType: "soft" }));
      dispatch(fetchAllAdvisoryMatters(filters));
    },
    [dispatch, filters],
  );

  // Filter matters based on search text
  const filteredMatters = useMemo(() => {
    if (!searchText) return matters;

    const searchLower = searchText.toLowerCase();
    return matters.filter(
      (m) =>
        m.title?.toLowerCase().includes(searchLower) ||
        m.matterNumber?.toLowerCase().includes(searchLower) ||
        m.client?.firstName?.toLowerCase().includes(searchLower) ||
        m.client?.lastName?.toLowerCase().includes(searchLower) ||
        m.natureOfMatter?.toLowerCase().includes(searchLower),
    );
  }, [matters, searchText]);

  // Table columns
  const columns = useMemo(
    () => [
      {
        title: "Matter",
        dataIndex: "title",
        key: "title",
        sorter: true,
        width: 320,
        fixed: "left",
        render: (title, record) => (
          <div className="py-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {record.matterNumber}
              </span>
              {record.isConfidential && (
                <Tooltip title="Confidential Matter">
                  <span className="text-xs text-amber-600">🔒</span>
                </Tooltip>
              )}
            </div>
            <button
              onClick={() =>
                navigate(`/dashboard/matters/advisory/${record._id}/details`)
              }
              className="text-left text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors line-clamp-2">
              {title}
            </button>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              {record.natureOfMatter}
            </p>
          </div>
        ),
      },
      {
        title: "Client",
        dataIndex: "client",
        key: "client",
        width: 200,
        render: (client) => <ClientCell client={client} />,
      },
      {
        title: "Advisory Details",
        key: "advisory",
        width: 240,
        render: (_, record) => {
          const hasSetup = !!record.advisoryDetail;
          return (
            <div className="space-y-2">
              {hasSetup ? (
                <>
                  <AdvisoryTypePill
                    type={record.advisoryDetail?.advisoryType}
                  />
                  <div className="flex items-center gap-2">
                    <SetupStatusTag hasSetup={true} />
                    {record.advisoryDetail?.deliverables?.length > 0 && (
                      <span className="text-xs text-slate-500">
                        {record.advisoryDetail.deliverables.length} deliverables
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <SetupStatusTag hasSetup={false} />
              )}
            </div>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        sorter: true,
        width: 120,
        render: (status) => <StatusBadge status={status} />,
      },
      {
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
        sorter: true,
        width: 100,
        render: (priority) => <PriorityDot priority={priority} />,
      },
      {
        title: "Officers",
        dataIndex: "accountOfficer",
        key: "accountOfficer",
        width: 110,
        render: (officers) => <OfficersCell officers={officers} />,
      },
      {
        title: "Dates",
        key: "dates",
        width: 180,
        render: (_, record) => (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <CalendarOutlined className="text-slate-400" />
              <span>
                Opened: {dayjs(record.dateOpened).format("DD MMM YYYY")}
              </span>
            </div>
            {record.expectedClosureDate && (
              <div className="flex items-center gap-1.5 text-xs">
                <ClockCircleOutlined
                  className={
                    dayjs(record.expectedClosureDate).isBefore(dayjs()) &&
                    record.status !== "completed" &&
                    record.status !== "closed"
                      ? "text-red-400"
                      : "text-slate-400"
                  }
                />
                <span
                  className={
                    dayjs(record.expectedClosureDate).isBefore(dayjs()) &&
                    record.status !== "completed" &&
                    record.status !== "closed"
                      ? "text-red-600 font-medium"
                      : "text-slate-600"
                  }>
                  Due: {dayjs(record.expectedClosureDate).format("DD MMM YYYY")}
                </span>
              </div>
            )}
            <div className="text-xs text-slate-400">
              {dayjs(record.lastActivityDate).fromNow()}
            </div>
          </div>
        ),
      },
      {
        title: "Value",
        dataIndex: "estimatedValue",
        key: "estimatedValue",
        sorter: true,
        width: 140,
        align: "right",
        render: (val, record) =>
          val ? (
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-800">
                {record.currency} {Number(val).toLocaleString("en-NG")}
              </div>
              <div className="text-xs text-slate-500 capitalize">
                {record.billingType}
              </div>
            </div>
          ) : (
            <Text type="secondary" className="text-right block">
              —
            </Text>
          ),
      },
      {
        title: "",
        key: "actions",
        fixed: "right",
        width: 60,
        render: (_, record) => {
          const hasSetup = !!record.advisoryDetail;

          const menuItems = [
            {
              key: "view",
              icon: <EyeOutlined />,
              label: "View Details",
              onClick: () =>
                navigate(`/dashboard/matters/advisory/${record._id}/details`),
            },
            {
              key: "edit",
              icon: <EditOutlined />,
              label: "Edit Matter",
              onClick: () =>
                navigate(`/dashboard/matters/advisory/${record._id}/edit`),
            },
            !hasSetup && {
              key: "setup",
              icon: <FileTextOutlined />,
              label: "Setup Advisory",
              onClick: () =>
                navigate(`/dashboard/matters/advisory/${record._id}/create`),
            },
            hasSetup && {
              key: "create-deliverable",
              icon: <PlusOutlined />,
              label: "Add Deliverable",
              onClick: () =>
                navigate(
                  `/dashboard/matters/advisory/${record._id}/deliverables/add`,
                ),
            },
            { type: "divider" },
            {
              key: "delete",
              icon: <DeleteOutlined />,
              label: "Delete",
              danger: true,
              onClick: () => handleDelete(record._id),
            },
          ].filter(Boolean);

          return (
            <Dropdown
              trigger={["click"]}
              menu={{ items: menuItems }}
              placement="bottomRight">
              <Button
                type="text"
                size="small"
                icon={<EllipsisOutlined />}
                className="text-slate-400 hover:text-slate-600"
              />
            </Dropdown>
          );
        },
      },
    ],
    [navigate, handleDelete],
  );

  return (
    <Table
      rowKey="_id"
      dataSource={filteredMatters}
      columns={columns}
      scroll={{ x: 1400 }}
      rowSelection={{
        selectedRowKeys,
        onChange: onSelectionChange,
        columnWidth: 48,
      }}
      onChange={handleTableChange}
      pagination={{
        current: pagination.currentPage ?? pagination.page ?? 1,
        pageSize: pagination.limit ?? 50,
        total: pagination.total ?? 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} of ${total} matters`,
        pageSizeOptions: ["20", "50", "100"],
        className: "px-6 py-4",
      }}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="py-8">
                <p className="text-slate-600 font-medium mb-2">
                  No advisory matters found
                </p>
                <p className="text-slate-400 text-sm mb-4">
                  {searchText
                    ? "Try adjusting your search or filters"
                    : "Create your first advisory matter to get started"}
                </p>
                {!searchText && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      navigate("/dashboard/matters/create?type=advisory")
                    }
                    className="bg-indigo-600 hover:bg-indigo-700 border-indigo-600">
                    New Advisory
                  </Button>
                )}
              </div>
            }
          />
        ),
      }}
      rowClassName={(record) =>
        `hover:bg-slate-50/80 transition-colors cursor-pointer ${
          record.isConfidential ? "border-l-4 border-l-amber-400" : ""
        }`
      }
      onRow={(record) => ({
        onDoubleClick: () =>
          navigate(`/dashboard/matters/advisory/${record._id}`),
      })}
    />
  );
};

export default AdvisoryListTable;
