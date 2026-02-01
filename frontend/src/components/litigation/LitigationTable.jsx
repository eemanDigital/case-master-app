import { Table, Button, Space, Dropdown, Tag, Tooltip } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CalendarOutlined,
  FileTextOutlined,
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
}) => {
  const navigate = useNavigate();

  const getCourtLabel = (courtName) => {
    const court = COURT_TYPES.find((c) => c.value === courtName);
    return court?.label || courtName;
  };

  const getActionItems = (record) => [
    {
      key: "view",
      label: "View Details",
      icon: <EyeOutlined />,
      onClick: () => onView(record),
    },
    {
      key: "edit",
      label: "Edit",
      icon: <EditOutlined />,
      onClick: () => onEdit(record),
    },
    {
      type: "divider",
    },
    {
      key: "export",
      label: "Export",
      icon: <FileTextOutlined />,
      onClick: () => onExport(record),
    },
    {
      key: "delete",
      label: "Delete",
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete(record),
    },
  ];

  const columns = [
    {
      title: "Suit No.",
      dataIndex: ["litigationDetail", "suitNo"],
      key: "suitNo",
      width: 180,
      fixed: "left",
      render: (suitNo, record) => (
        <div>
          <div
            className="font-medium text-blue-600 cursor-pointer hover:underline"
            onClick={() => onView(record)}>
            {suitNo || "-"}
          </div>
          <div className="text-xs text-gray-500">{record.matterNumber}</div>
        </div>
      ),
    },
    {
      title: "Matter Title",
      dataIndex: "title",
      key: "title",
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (title) => (
        <Tooltip title={title}>
          <span>{title}</span>
        </Tooltip>
      ),
    },
    {
      title: "Court",
      dataIndex: ["litigationDetail", "courtName"],
      key: "courtName",
      width: 200,
      render: (courtName) => (
        <span className="text-sm">{getCourtLabel(courtName)}</span>
      ),
    },
    {
      title: "Stage",
      dataIndex: ["litigationDetail", "currentStage"],
      key: "currentStage",
      width: 120,
      render: (stage) => <StatusTag status={stage} configArray={CASE_STAGES} />,
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
      title: "Client",
      dataIndex: "client",
      key: "client",
      width: 180,
      render: (client) => {
        if (!client) return "-";
        return (
          <div>
            <div className="font-medium">
              {client.companyName ||
                formatName(client.firstName, client.lastName)}
            </div>
            {client.email && (
              <div className="text-xs text-gray-500">{client.email}</div>
            )}
          </div>
        );
      },
    },
    {
      title: "Next Hearing",
      dataIndex: ["litigationDetail", "nextHearingDate"],
      key: "nextHearingDate",
      width: 150,
      sorter: true,
      render: (date) => {
        if (!date) return <span className="text-gray-400">-</span>;

        const isUpcoming = new Date(date) > new Date();
        const isPast = new Date(date) < new Date();

        return (
          <div className="flex items-center gap-2">
            <CalendarOutlined
              className={
                isUpcoming
                  ? "text-green-500"
                  : isPast
                    ? "text-red-500"
                    : "text-gray-400"
              }
            />
            <div>
              <div className="text-sm">{formatDate(date)}</div>
              <div
                className={`text-xs ${
                  isUpcoming
                    ? "text-green-600"
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
      dataIndex: ["litigationDetail", "filingDate"],
      key: "filingDate",
      width: 120,
      sorter: true,
      render: (date) => formatDate(date),
    },
    {
      title: "Account Officer",
      dataIndex: "accountOfficer",
      key: "accountOfficer",
      width: 150,
      render: (officer) =>
        officer ? formatName(officer.firstName, officer.lastName) : "-",
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          <Dropdown
            menu={{ items: getActionItems(record) }}
            trigger={["click"]}
            placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} />
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
      scroll={{ x: 1800 }}
      className="litigation-table"
      size="middle"
    />
  );
};

export default LitigationTable;
