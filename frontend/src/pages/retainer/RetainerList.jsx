import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  Button,
  Space,
  Tag,
  Avatar,
  Tooltip,
  message,
  Empty,
  Progress,
  Modal,
  Segmented,
  Badge,
  Alert,
  Table,
} from "antd";
import Typography from "antd/es/typography";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  SyncOutlined,
  StopOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  UserOutlined,
  AppstoreOutlined,
  BarsOutlined,
  RightOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  fetchRetainerMatters,
  deleteRetainerDetails,
  restoreRetainerDetails,
  fetchRetainerStats,
  fetchExpiringRetainers,
} from "../../redux/features/retainer/retainerSlice";
import {
  MatterPageHeader,
  MatterStatCards,
  MatterToolbar,
  MatterTableCard,
  MatterNumberTag,
  MatterRowActions,
  ClientCell,
  StatusPill,
  MoneyText,
} from "../../components/matters/ui/matterListKit";

dayjs.extend(relativeTime);

const { Text: AntText } = Typography;
const { confirm } = Modal;

const RETAINER_STATUS_MAP = {
  active: { color: "success", label: "Active" },
  inactive: { color: "default", label: "Inactive" },
  expired: { color: "error", label: "Expired" },
  pending: { color: "processing", label: "Pending" },
  terminated: { color: "default", label: "Terminated" },
};

const TYPE_COLORS = {
  "general-legal": "blue",
  "company-secretarial": "purple",
  "retainer-deposit": "green",
  specialized: "orange",
};

const RetainerList = React.memo(() => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const retainers = useSelector((state) => state.retainer.matters);
  const loading = useSelector((state) => state.retainer.loading);
  const pagination = useSelector((state) => state.retainer.pagination);
  const stats = useSelector((state) => state.retainer.stats);
  const statsLoading = useSelector((state) => state.retainer.statsLoading);
  const expiringRetainers = useSelector((state) => state.retainer.expiringRetainers);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [activeFilter, setActiveFilter] = useState("all");

  const isMobile = screenWidth < 768;

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    dispatch(fetchRetainerMatters());
    dispatch(fetchRetainerStats());
    dispatch(fetchExpiringRetainers({ days: 60 }));
  }, [dispatch]);

  const handleSearch = useCallback(
    (value) => {
      setSearchTerm(value);
      dispatch(fetchRetainerMatters({ search: value }));
    },
    [dispatch],
  );

  const handleTableChange = useCallback(
    (paginationConfig, filters, sorter) => {
      dispatch(
        fetchRetainerMatters({
          page: paginationConfig.current,
          limit: paginationConfig.pageSize,
          sortBy: sorter.field,
          sortOrder: sorter.order,
          ...filters,
        }),
      );
    },
    [dispatch],
  );

  const handleRefresh = useCallback(() => {
    dispatch(fetchRetainerMatters());
    dispatch(fetchRetainerStats());
    dispatch(fetchExpiringRetainers({ days: 60 }));
    message.success("Data refreshed");
  }, [dispatch]);

  const handleViewDetails = useCallback(
    (matterId) => {
      navigate(`/dashboard/matters/retainers/${matterId}/details`);
    },
    [navigate],
  );

  const handleEdit = useCallback(
    (matterId) => {
      navigate(`/dashboard/matters/retainers/${matterId}/edit`);
    },
    [navigate],
  );

  const handleDelete = useCallback(
    async (matterId) => {
      confirm({
        title: "Delete Retainer",
        icon: <ExclamationCircleOutlined />,
        content: "Are you sure you want to delete this retainer?",
        okText: "Delete",
        okType: "danger",
        cancelText: "Cancel",
        onOk: async () => {
          try {
            await dispatch(deleteRetainerDetails(matterId)).unwrap();
            message.success("Retainer deleted successfully");
            dispatch(fetchRetainerMatters());
          } catch (error) {
            message.error(error.message || "Failed to delete retainer");
          }
        },
      });
    },
    [dispatch],
  );

  const handleRestore = useCallback(
    async (matterId) => {
      try {
        await dispatch(restoreRetainerDetails(matterId)).unwrap();
        message.success("Retainer restored successfully");
        dispatch(fetchRetainerMatters());
      } catch (error) {
        message.error(error.message || "Failed to restore retainer");
      }
    },
    [dispatch],
  );

  const handleCreateMatter = useCallback(() => {
    const returnPath = `/dashboard/matters/retainers/:matterId/create`;
    navigate(
      `/dashboard/matters/create?type=retainer&returnTo=${encodeURIComponent(returnPath)}`,
    );
  }, [navigate]);

  const getExpiryStatus = useCallback((endDate) => {
    if (!endDate) return { color: "default", text: "N/A", urgency: 0 };
    const daysRemaining = dayjs(endDate).diff(dayjs(), "day");
    if (daysRemaining < 0)
      return { color: "error", text: "Expired", urgency: 3 };
    if (daysRemaining <= 7)
      return { color: "warning", text: `${daysRemaining}d left`, urgency: 3 };
    if (daysRemaining <= 30)
      return { color: "warning", text: `${daysRemaining}d left`, urgency: 2 };
    return { color: "success", text: `${daysRemaining}d`, urgency: 1 };
  }, []);

  const formatRetainerType = useCallback((type) => {
    if (!type) return "Standard";
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, []);

  const filteredRetainers = useMemo(() => {
    if (activeFilter === "all") return retainers;
    return retainers.filter((r) => r.status === activeFilter);
  }, [retainers, activeFilter]);

  const overview = useMemo(() => stats?.overview || {}, [stats?.overview]);

  const statCards = useMemo(
    () => [
      {
        label: "Total",
        value: overview.totalRetainerMatters || 0,
        icon: FileTextOutlined,
        color: "#6366f1",
      },
      {
        label: "Active",
        value: overview.activeRetainerMatters || 0,
        icon: CheckCircleOutlined,
        color: "#10b981",
      },
      {
        label: "Pending",
        value: overview.pendingRetainerMatters || 0,
        icon: ClockCircleOutlined,
        color: "#f59e0b",
      },
      {
        label: "Expiring",
        value: stats?.expiringSoon || 0,
        icon: WarningOutlined,
        color: "#ef4444",
      },
    ],
    [overview, stats?.expiringSoon],
  );

  const columns = useMemo(
    () => [
      {
        title: "Client",
        dataIndex: "client",
        key: "client",
        width: 250,
        fixed: !isMobile ? "left" : false,
        sorter: true,
        render: (client) => <ClientCell client={client} />,
      },
      {
        title: "Matter",
        dataIndex: "matterNumber",
        key: "matterNumber",
        width: 120,
        sorter: true,
        render: (text, record) => (
          <MatterNumberTag
            value={text || "N/A"}
            onClick={() => handleViewDetails(record._id)}
          />
        ),
      },
      {
        title: "Type",
        dataIndex: ["retainerDetail", "retainerType"],
        key: "retainerType",
        width: 150,
        filters: [
          { text: "General Legal", value: "general-legal" },
          { text: "Company Secretarial", value: "company-secretarial" },
          { text: "Retainer Deposit", value: "retainer-deposit" },
          { text: "Specialized", value: "specialized" },
        ],
        render: (type) => (
          <Tag color={TYPE_COLORS[type] || "default"} className="m-0 capitalize">
            {formatRetainerType(type)}
          </Tag>
        ),
      },
      {
        title: "Fee",
        dataIndex: ["retainerDetail", "billing", "retainerFee"],
        key: "retainerFee",
        width: 130,
        align: "right",
        sorter: true,
        render: (fee) =>
          fee !== undefined && fee !== null ? (
            <MoneyText
              amount={fee}
              formatter={(a) => `₦${Number(a).toLocaleString()}`}
            />
          ) : (
            <AntText type="secondary">N/A</AntText>
          ),
      },
      {
        title: "Duration",
        key: "duration",
        width: 150,
        render: (_, record) => {
          const start = record.retainerDetail?.agreementStartDate;
          const end = record.retainerDetail?.agreementEndDate;
          if (!start) return <AntText type="secondary">N/A</AntText>;
          return (
            <div className="whitespace-nowrap">
              <div className="text-sm text-slate-700">
                {dayjs(start).format("DD MMM YYYY")}
              </div>
              <div className="text-xs text-slate-400">
                to {end ? dayjs(end).format("DD MMM YYYY") : "Ongoing"}
              </div>
            </div>
          );
        },
      },
      {
        title: "Days Left",
        key: "daysRemaining",
        width: 110,
        align: "center",
        sorter: (a, b) => {
          const aDate = a.retainerDetail?.agreementEndDate;
          const bDate = b.retainerDetail?.agreementEndDate;
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return (
            dayjs(aDate).diff(dayjs(), "day") - dayjs(bDate).diff(dayjs(), "day")
          );
        },
        render: (_, record) => {
          const endDate = record.retainerDetail?.agreementEndDate;
          const expiry = getExpiryStatus(endDate);
          const progress = endDate
            ? Math.max(
                0,
                Math.min(100, (dayjs(endDate).diff(dayjs(), "day") / 365) * 100),
              )
            : 100;
          return (
            <Tooltip title={expiry.text}>
              <div className="flex items-center justify-center">
                <Progress
                  percent={progress}
                  size="small"
                  strokeColor={
                    expiry.color === "error"
                      ? "#ef4444"
                      : expiry.color === "warning"
                        ? "#f59e0b"
                        : "#10b981"
                  }
                  trailColor="#f3f4f6"
                  showInfo={false}
                  className="w-16"
                />
              </div>
            </Tooltip>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 110,
        filters: [
          { text: "Active", value: "active" },
          { text: "Inactive", value: "inactive" },
          { text: "Expired", value: "expired" },
          { text: "Pending", value: "pending" },
        ],
        render: (status) => <StatusPill status={status} map={RETAINER_STATUS_MAP} />,
      },
      {
        title: "",
        key: "actions",
        width: 56,
        fixed: !isMobile ? "right" : false,
        render: (_, record) => {
          const items = [
            {
              key: "view",
              label: "View Details",
              icon: <EyeOutlined />,
              onClick: () => handleViewDetails(record._id),
            },
            {
              key: "edit",
              label: "Edit",
              icon: <EditOutlined />,
              onClick: () => handleEdit(record._id),
              disabled: !record.retainerDetail,
            },
            { type: "divider" },
            {
              key: "renew",
              label: "Renew",
              icon: <SyncOutlined />,
              onClick: () => handleViewDetails(record._id),
              disabled: !record.retainerDetail,
            },
            {
              key: "terminate",
              label: "Terminate",
              icon: <StopOutlined />,
              danger: true,
              onClick: () => handleViewDetails(record._id),
              disabled: !record.retainerDetail,
            },
            { type: "divider" },
            {
              key: "delete",
              label: record.isDeleted ? "Restore" : "Delete",
              icon: record.isDeleted ? <ReloadOutlined /> : <StopOutlined />,
              danger: !record.isDeleted,
              onClick: () =>
                record.isDeleted
                  ? handleRestore(record._id)
                  : handleDelete(record._id),
            },
          ];
          return <MatterRowActions menuItems={items} />;
        },
      },
    ],
    [
      isMobile,
      formatRetainerType,
      getExpiryStatus,
      handleViewDetails,
      handleEdit,
      handleDelete,
      handleRestore,
    ],
  );

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: setSelectedRowKeys,
      selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
    }),
    [selectedRowKeys],
  );

  const renderRetainerCard = useCallback(
    (record) => {
      const client = record.client;
      const displayName =
        client?.companyName ||
        `${client?.firstName || ""} ${client?.lastName || ""}`.trim() ||
        "N/A";
      const initial =
        client?.companyName?.charAt(0) || client?.firstName?.charAt(0) || "C";
      const endDate = record.retainerDetail?.agreementEndDate;
      const expiry = getExpiryStatus(endDate);
      const fee = record.retainerDetail?.billing?.retainerFee;
      const daysRemaining = endDate ? dayjs(endDate).diff(dayjs(), "day") : null;

      return (
        <Card
          key={record._id}
          className="mb-4 hover:shadow-md transition-all duration-300 cursor-pointer border border-slate-200 rounded-xl shadow-sm"
          onClick={() => handleViewDetails(record._id)}
          styles={{ body: { padding: isMobile ? 12 : 20 } }}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Avatar
                size={isMobile ? 40 : 48}
                className="bg-indigo-600"
                icon={<UserOutlined />}>
                {initial}
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <AntText strong className="text-base truncate">
                    {displayName}
                  </AntText>
                  <Tag className="font-mono text-xs m-0">
                    {record.matterNumber || "N/A"}
                  </Tag>
                </div>
                <AntText type="secondary" className="text-sm truncate block">
                  {record.title || "No title"}
                </AntText>
                <Space className="mt-2" size="small">
                  <Tag
                    color={TYPE_COLORS[record.retainerDetail?.retainerType]}
                    className="m-0">
                    {formatRetainerType(record.retainerDetail?.retainerType)}
                  </Tag>
                  <StatusPill status={record.status} map={RETAINER_STATUS_MAP} />
                </Space>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <AntText strong className="text-emerald-600 text-lg block">
                {fee !== undefined && fee !== null
                  ? `₦${Number(fee).toLocaleString()}`
                  : "N/A"}
              </AntText>
              <div
                className={`mt-1 px-2 py-0.5 rounded-full text-xs font-medium inline-block ${
                  daysRemaining !== null && daysRemaining <= 7
                    ? "bg-red-100 text-red-700"
                    : daysRemaining !== null && daysRemaining <= 30
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                }`}>
                {expiry.text}
              </div>
            </div>
          </div>
          {endDate && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {dayjs(record.retainerDetail?.agreementStartDate).format(
                    "DD MMM YYYY",
                  )}{" "}
                  → {dayjs(endDate).format("DD MMM YYYY")}
                </span>
                <RightOutlined className="text-indigo-400" />
              </div>
            </div>
          )}
        </Card>
      );
    },
    [isMobile, getExpiryStatus, formatRetainerType, handleViewDetails],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <MatterPageHeader
        icon={<FileTextOutlined />}
        title="Retainer Agreements"
        subtitle={`${pagination?.totalRecords || 0} total retainer(s)`}
        count={pagination?.totalRecords || 0}
        actions={
          <>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              {!isMobile && "Refresh"}
            </Button>
            {!isMobile && (
              <>
                <Button
                  type={viewMode === "table" ? "primary" : "default"}
                  icon={<BarsOutlined />}
                  onClick={() => setViewMode("table")}
                />
                <Button
                  type={viewMode === "card" ? "primary" : "default"}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode("card")}
                />
              </>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateMatter}>
              {isMobile ? "New" : "New Matter"}
            </Button>
          </>
        }
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        <MatterStatCards loading={statsLoading} stats={statCards} cols={4} />

        <div className="mt-4 mb-4">
          <MatterToolbar
            searchValue={searchTerm}
            setSearchValue={setSearchTerm}
            onSearch={handleSearch}
            searchPlaceholder="Search clients, matters..."
            extra={
              <Segmented
                options={[
                  { label: "All", value: "all" },
                  { label: "Active", value: "active" },
                  { label: "Pending", value: "pending" },
                  { label: "Expired", value: "expired" },
                ]}
                value={activeFilter}
                onChange={setActiveFilter}
                size={isMobile ? "small" : "middle"}
              />
            }
          />
        </div>

        {selectedRowKeys.length > 0 && (
          <Alert
            message={`${selectedRowKeys.length} retainer(s) selected`}
            type="info"
            showIcon
            className="mb-4"
            action={
              <Button size="small" type="primary">
                Bulk Operations
              </Button>
            }
            closable
            onClose={() => setSelectedRowKeys([])}
          />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className={isMobile ? "col-span-1" : "xl:col-span-3"}>
            {viewMode === "table" ? (
              <MatterTableCard
                columns={columns}
                dataSource={filteredRetainers}
                rowKey={(record) => record._id}
                loading={loading}
                rowSelection={isMobile ? undefined : rowSelection}
                onChange={handleTableChange}
                onRowClick={(record) => handleViewDetails(record._id)}
                pagination={{
                  current: pagination?.currentPage || 1,
                  pageSize: pagination?.pageSize || 50,
                  total: pagination?.totalRecords || 0,
                  showSizeChanger: !isMobile,
                  showTotal: (total) => `Total ${total} retainer(s)`,
                  pageSizeOptions: ["10", "20", "50", "100"],
                  size: isMobile ? "small" : "default",
                }}
                scrollX={1200}
                size={isMobile ? "small" : "middle"}
                emptyTitle="No retainer agreements found"
                emptyDescription="Create your first retainer agreement to get started"
                onCreate={handleCreateMatter}
                createLabel="Create First Retainer"
              />
            ) : (
              <div>
                {filteredRetainers.length === 0 ? (
                  <Card className="border-slate-200 rounded-xl shadow-sm">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <div className="text-center py-8">
                          <AntText type="secondary" className="block mb-4">
                            No retainer agreements found
                          </AntText>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreateMatter}>
                            Create First Retainer
                          </Button>
                        </div>
                      }
                    />
                  </Card>
                ) : (
                  filteredRetainers.map(renderRetainerCard)
                )}
              </div>
            )}
          </div>

          {!isMobile && (
            <div className="col-span-1">
              <Card
                title={
                  <Space>
                    <BellOutlined className="text-amber-500" />
                    <span>Expiring Soon</span>
                    {expiringRetainers?.length > 0 && (
                      <Badge
                        count={expiringRetainers.length}
                        style={{ backgroundColor: "#ef4444" }}
                      />
                    )}
                  </Space>
                }
                className="rounded-xl shadow-sm sticky top-24"
                extra={
                  <Button
                    type="text"
                    size="small"
                    icon={<SyncOutlined />}
                    onClick={() => dispatch(fetchExpiringRetainers({ days: 60 }))}
                  />
                }>
                {expiringRetainers?.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="No expiring retainers"
                  />
                ) : (
                  <div className="space-y-3">
                    {expiringRetainers?.slice(0, 5).map((item) => {
                      const endDate = item.retainerDetail?.agreementEndDate;
                      const daysRemaining = endDate
                        ? dayjs(endDate).diff(dayjs(), "day")
                        : null;
                      const client = item.client;
                      const displayName =
                        client?.companyName ||
                        `${client?.firstName || ""} ${client?.lastName || ""}`.trim() ||
                        "N/A";

                      return (
                        <div
                          key={item._id}
                          className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                          onClick={() => handleViewDetails(item._id)}>
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <AntText strong className="block truncate">
                                {displayName}
                              </AntText>
                              <AntText type="secondary" className="text-xs block truncate">
                                {item.matterNumber || "N/A"}
                              </AntText>
                            </div>
                            <div
                              className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                daysRemaining !== null && daysRemaining <= 7
                                  ? "bg-red-100 text-red-700"
                                  : daysRemaining !== null && daysRemaining <= 30
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700"
                              }`}>
                              {daysRemaining !== null && daysRemaining < 0
                                ? "Expired"
                                : daysRemaining !== null && daysRemaining <= 7
                                  ? `${Math.abs(daysRemaining)}d overdue`
                                  : `${daysRemaining}d left`}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {expiringRetainers?.length > 5 && (
                      <Button
                        type="link"
                        block
                        onClick={() => navigate("/dashboard/matters/retainers")}>
                        View All {expiringRetainers.length} Expiring Retainers
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

RetainerList.displayName = "RetainerList";

export default RetainerList;