// components/litigation/LitigationTable.jsx
import { Table, Button, Space, Dropdown, Tag, Tooltip, Avatar } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CalendarOutlined,
  FileTextOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import {
  formatDate,
  formatName,
  getRelativeTime,
} from "../../utils/formatters";
import StatusTag from "../common/StatusTag";
import {
  MATTER_STATUS,
  CASE_STAGES,
  COURT_TYPES,
} from "../../utils/litigationConstants";

const LitigationTable = ({
  data,
  loading,
  pagination,
  onChange,
  onView,
  onEdit,
  onDelete,
  onExport,
  rowSelection,
}) => {
  const navigate = useNavigate();

  const getCourtLabel = (courtName) => {
    const court = COURT_TYPES.find((c) => c.value === courtName);
    return court?.label || courtName || "—";
  };

  const getActionItems = (record) => {
    const hasLitigationDetail = !!record.litigationDetail;

    const items = [
      {
        key: "view",
        label: "View Details",
        icon: <EyeOutlined />,
        onClick: () => onView(record),
      },
      {
        key: "edit",
        label: "Edit Matter",
        icon: <EditOutlined />,
        onClick: () => onEdit(record),
      },
    ];

    // Add setup option if litigation details don't exist
    if (!hasLitigationDetail) {
      items.push({
        key: "setup",
        label: "Setup Litigation",
        icon: <FileTextOutlined />,
        onClick: () =>
          navigate(`/dashboard/matters/litigation/${record._id}/create`),
      });
    }

    items.push({ type: "divider" });

    items.push({
      key: "export",
      label: "Export",
      icon: <FileTextOutlined />,
      onClick: () => onExport?.(record),
    });

    items.push({
      key: "delete",
      label: "Delete",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete(record),
    });

    return items;
  };

  const columns = [
    {
      title: "Case Details",
      key: "caseDetails",
      width: 250,
      fixed: "left",
      render: (_, record) => {
        const suitNo = record.litigationDetail?.suitNo || "—";
        return (
          <div className="py-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {record.matterNumber}
              </span>
              {record.isConfidential && (
                <Tooltip title="Confidential Matter">
                  <span className="text-xs text-amber-600">🔒</span>
                </Tooltip>
              )}
            </div>
            <div
              className="text-sm font-semibold text-indigo-600 cursor-pointer hover:underline"
              onClick={() => onView(record)}>
              {suitNo}
            </div>
            <div className="text-xs text-gray-500 mt-1 line-clamp-1">
              {record.title}
            </div>
          </div>
        );
      },
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      width: 200,
      render: (client) => {
        if (!client) return <span className="text-gray-400">—</span>;
        const initials = `${client.firstName?.[0] || ""}${
          client.lastName?.[0] || ""
        }`.toUpperCase();
        return (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar
              size={32}
              className="flex-shrink-0 bg-indigo-100 text-indigo-700 text-xs font-bold">
              {initials || <UserOutlined />}
            </Avatar>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-800 truncate">
                {formatName(client.firstName, client.lastName)}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {client.email}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Court",
      key: "court",
      width: 180,
      render: (_, record) => {
        const detail = record.litigationDetail;
        if (!detail)
          return <span className="text-gray-400 text-sm">Not set</span>;

        return (
          <div className="space-y-1">
            <div className="text-sm font-medium text-gray-800">
              {getCourtLabel(detail.courtName)}
            </div>
            {detail.courtLocation && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <EnvironmentOutlined />
                {detail.courtLocation}, {detail.state}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Stage",
      key: "stage",
      width: 120,
      render: (_, record) => {
        const stage = record.litigationDetail?.currentStage;
        return stage ? (
          <StatusTag status={stage} configArray={CASE_STAGES} />
        ) : (
          <Tag className="rounded-full">—</Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <StatusTag status={status} configArray={MATTER_STATUS} />
      ),
    },
    {
      title: "Next Hearing",
      key: "nextHearing",
      width: 150,
      sorter: true,
      render: (_, record) => {
        const date = record.litigationDetail?.nextHearingDate;
        if (!date)
          return <span className="text-gray-400 text-sm">Not scheduled</span>;

        const isUpcoming = new Date(date) > new Date();
        const isPast = new Date(date) < new Date();

        return (
          <div className="flex items-start gap-2">
            <CalendarOutlined
              className={
                isUpcoming
                  ? "text-emerald-500 mt-0.5"
                  : isPast
                    ? "text-red-500 mt-0.5"
                    : "text-gray-400 mt-0.5"
              }
            />
            <div>
              <div
                className={`text-sm font-medium ${
                  isUpcoming
                    ? "text-emerald-700"
                    : isPast
                      ? "text-red-700"
                      : "text-gray-700"
                }`}>
                {formatDate(date)}
              </div>
              <div
                className={`text-xs ${
                  isUpcoming
                    ? "text-emerald-600"
                    : isPast
                      ? "text-red-600"
                      : "text-gray-500"
                }`}>
                {getRelativeTime(date)}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Filed Date",
      key: "filedDate",
      width: 120,
      sorter: true,
      render: (_, record) => {
        const date = record.litigationDetail?.filingDate;
        return date ? (
          <span className="text-sm text-gray-700">{formatDate(date)}</span>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        );
      },
    },
    {
      title: "Officers",
      dataIndex: "accountOfficer",
      key: "accountOfficer",
      width: 120,
      render: (officers) => {
        if (!officers?.length) return <span className="text-gray-400">—</span>;

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
                title={`${officer.firstName} ${officer.lastName}`}
                placement="top">
                <Avatar
                  size={28}
                  src={officer.photo}
                  className="bg-gray-200 text-gray-600 text-xs font-semibold border-2 border-white">
                  {!officer.photo &&
                    `${officer.firstName?.[0]}${officer.lastName?.[0]}`}
                </Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 80,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
              className="text-gray-600 hover:text-indigo-600"
            />
          </Tooltip>
          <Dropdown
            menu={{ items: getActionItems(record) }}
            trigger={["click"]}
            placement="bottomRight">
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
              className="text-gray-600 hover:text-gray-900"
            />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      onChange={onChange}
      rowKey="_id"
      rowSelection={rowSelection}
      scroll={{ x: 1400 }}
      className="litigation-table"
      size="middle"
      rowClassName={(record) =>
        `hover:bg-gray-50/80 transition-colors ${
          record.isConfidential ? "border-l-4 border-l-amber-400" : ""
        }`
      }
      onRow={(record) => ({
        onDoubleClick: () => onView(record),
      })}
    />
  );
};

export default LitigationTable;
