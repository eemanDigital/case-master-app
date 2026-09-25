import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Button,
  Tag,
  Select,
  Row,
  Col,
  message,
  Modal,
  Typography,
  Segmented,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  RiseOutlined,
  CheckOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

import {
  fetchGeneralMatters,
  fetchGeneralStats,
  deleteGeneralDetails,
  setFilters,
  clearFilters,
  setPagination,
} from "../../redux/features/general/generalSlice";
import { NIGERIAN_GENERAL_SERVICE_TYPES } from "../../utils/generalConstants";

import DistributionChart from "../../components/general/DistributionChart";
import ComplianceCard from "../../components/general/ComplianceCard";
import RecentMattersCard from "../../components/general/RecentMattersCard";

import {
  MatterPageHeader,
  MatterStatCards,
  MatterToolbar,
  MatterTableCard,
  MatterNumberTag,
  MatterRowActions,
  buildRowMenu,
  ClientCell,
  StatusPill,
  MoneyText,
  DateCell,
} from "../../components/matters/ui/matterListKit";

const { Option } = Select;
const { Text } = Typography;

const STATUS_MAP = {
  active: { color: "success", label: "Active" },
  pending: { color: "warning", label: "Pending" },
  completed: { color: "processing", label: "Completed" },
  closed: { color: "default", label: "Closed" },
};

const GeneralList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { matters, pagination, filters, loading, stats, statsLoading } =
    useSelector((state) => state.general);

  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkActionModal, setBulkActionModal] = useState({
    visible: false,
    action: null,
  });
  const [viewMode, setViewMode] = useState("dashboard");

  useEffect(() => {
    dispatch(
      fetchGeneralMatters({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      }),
    );
    dispatch(fetchGeneralStats());
  }, [dispatch, pagination.page, pagination.limit, filters]);

  const handleTableChange = useCallback(
    (pag) => {
      dispatch(setPagination({ page: pag.current, limit: pag.pageSize }));
    },
    [dispatch],
  );

  const handleSearch = useCallback(
    (value) => {
      dispatch(setFilters({ search: value }));
      dispatch(setPagination({ page: 1 }));
    },
    [dispatch],
  );

  const handleFilterChange = useCallback(
    (key, value) => {
      dispatch(setFilters({ [key]: value }));
      dispatch(setPagination({ page: 1 }));
    },
    [dispatch],
  );

  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
    dispatch(setPagination({ page: 1 }));
  }, [dispatch]);

  const handleDelete = useCallback(
    async (matterId) => {
      Modal.confirm({
        title: "Delete General Matter",
        content: "Are you sure you want to delete this general matter?",
        okText: "Delete",
        okType: "danger",
        onOk: async () => {
          try {
            await dispatch(deleteGeneralDetails(matterId)).unwrap();
            message.success("General matter deleted successfully");
            dispatch(
              fetchGeneralMatters({
                page: pagination.page,
                limit: pagination.limit,
                ...filters,
              }),
            );
          } catch (error) {
            message.error(error || "Failed to delete");
          }
        },
      });
    },
    [dispatch, pagination, filters],
  );

  const handleCreateGeneral = useCallback(
    (matterId) => {
      navigate(`/dashboard/matters/general/${matterId}/create`);
    },
    [navigate],
  );

  const handleViewDetails = useCallback(
    (matter) => {
      navigate(`/dashboard/matters/general/${matter._id}/details`);
    },
    [navigate],
  );

  const handleRefresh = useCallback(() => {
    dispatch(
      fetchGeneralMatters({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      }),
    );
    dispatch(fetchGeneralStats());
  }, [dispatch, pagination, filters]);

  const statsCards = useMemo(() => {
    if (!stats) return [];

    const { overview, requirements, deliverables, documents, revenue } = stats;

    return [
      {
        key: "total",
        label: "Total Matters",
        value: overview?.totalGeneralMatters || 0,
        icon: FileTextOutlined,
        color: "#1890ff",
      },
      {
        key: "active",
        label: "Active",
        value: overview?.activeGeneralMatters || 0,
        icon: RiseOutlined,
        color: "#52c41a",
        onClick: () => {
          handleFilterChange("status", "active");
          setViewMode("table");
        },
      },
      {
        key: "pending",
        label: "Pending",
        value: overview?.pendingGeneralMatters || 0,
        icon: WarningOutlined,
        color: "#faad14",
        onClick: () => {
          handleFilterChange("status", "pending");
          setViewMode("table");
        },
      },
      {
        key: "completed",
        label: "Completed",
        value: overview?.completedGeneralMatters || 0,
        icon: CheckCircleOutlined,
        color: "#722ed1",
        onClick: () => {
          handleFilterChange("status", "completed");
          setViewMode("table");
        },
      },
      {
        key: "revenue",
        label: "Total Revenue",
        value: `₦${(revenue?.totalRevenue || 0).toLocaleString()}`,
        description: `Avg: ₦${(revenue?.avgRevenue || 0).toLocaleString()}`,
        icon: DollarOutlined,
        color: "#13c2c2",
      },
      {
        key: "requirements",
        label: "Requirements Met",
        value: requirements?.completed || 0,
        description: `${requirements?.pending || 0} pending`,
        icon: CheckOutlined,
        color: "#52c41a",
      },
      {
        key: "deliverables",
        label: "Pending Deliverables",
        value: deliverables?.pending || 0,
        description:
          deliverables?.overdue > 0 ? `${deliverables.overdue} overdue` : undefined,
        icon: FileTextOutlined,
        color: "#fa8c16",
      },
      {
        key: "documents",
        label: "Documents Received",
        value: documents?.received || 0,
        description:
          documents?.missing > 0 ? `${documents.missing} missing` : undefined,
        icon: CheckCircleOutlined,
        color: "#eb2f96",
      },
    ];
  }, [stats, handleFilterChange]);

  const serviceTypeData = useMemo(() => {
    if (!stats?.byServiceType || !stats?.overview) return [];

    return stats.byServiceType.map((service) => ({
      ...service,
      name:
        NIGERIAN_GENERAL_SERVICE_TYPES.find((s) => s.value === service._id)
          ?.label || service._id,
      formattedAvgFee: `₦${(service.avgFee || 0).toLocaleString()}`,
      percentage: (service.count / stats.overview.totalGeneralMatters) * 100,
      description: `${service.count} matters • ₦${service.avgFee.toLocaleString()} avg`,
    }));
  }, [stats]);

  const requirementsData = useMemo(() => {
    if (!stats?.requirements?.byStatus) return [];

    return stats.requirements.byStatus.map((req) => ({
      ...req,
      name: req._id === "met" ? "Met" : "Pending",
      color: req._id === "met" ? "#52c41a" : "#faad14",
    }));
  }, [stats]);

  const deliverablesData = useMemo(() => {
    if (!stats?.deliverables?.byStatus) return [];

    return stats.deliverables.byStatus.map((del) => ({
      ...del,
      name: del._id === "pending" ? "Pending" : "Completed",
      color: del._id === "pending" ? "#faad14" : "#52c41a",
    }));
  }, [stats]);

  const recentMatters = useMemo(() => {
    if (!stats?.recentMatters) return [];

    return stats.recentMatters.slice(0, 5).map((matter) => ({
      ...matter,
      formattedDate: dayjs(matter.dateOpened).format("DD MMM YYYY"),
    }));
  }, [stats]);

  const columns = useMemo(
    () => [
      {
        title: "Matter Number",
        dataIndex: "matterNumber",
        key: "matterNumber",
        width: 150,
        fixed: "left",
        render: (text, record) => (
          <MatterNumberTag value={text || "-"} onClick={() => handleViewDetails(record)} />
        ),
      },
      {
        title: "Service Type",
        dataIndex: ["generalDetail", "serviceType"],
        key: "serviceType",
        width: 180,
        render: (type) => {
          if (!type) return <Tag color="default" className="m-0">Not Set</Tag>;
          const service = NIGERIAN_GENERAL_SERVICE_TYPES.find(
            (s) => s.value === type,
          );
          return <Tag color="blue" className="m-0">{service?.label || type}</Tag>;
        },
      },
      {
        title: "Client",
        dataIndex: "client",
        key: "client",
        width: 200,
        render: (client) => <ClientCell client={client} />,
      },
      {
        title: "Fee",
        dataIndex: ["generalDetail", "financialSummary"],
        key: "fee",
        width: 130,
        render: (financialSummary, record) => {
          const baseFee = financialSummary?.baseFee;
          const billing = record?.generalDetail?.billing;
          const fee =
            baseFee ||
            billing?.fixedFee?.amount ||
            billing?.lproScale?.calculatedAmount ||
            billing?.percentage?.calculatedFee;
          return fee !== undefined && fee !== null ? (
            <MoneyText
              amount={fee}
              formatter={(a) => `₦${Number(a).toLocaleString()}`}
            />
          ) : (
            <Text type="secondary">N/A</Text>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 120,
        render: (status) => <StatusPill status={status} map={STATUS_MAP} />,
      },
      {
        title: "Expected Completion",
        dataIndex: ["generalDetail", "expectedCompletionDate"],
        key: "expectedCompletionDate",
        width: 150,
        render: (date) => <DateCell date={date} empty="Not set" />,
      },
      {
        title: "Actions",
        key: "actions",
        width: 100,
        fixed: "right",
        render: (_, record) => {
          const hasGeneralDetail = !!record.generalDetail;
          if (!hasGeneralDetail) {
            return (
              <Button
                type="primary"
                ghost
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleCreateGeneral(record._id)}>
                Setup
              </Button>
            );
          }
          return (
            <MatterRowActions
              menuItems={buildRowMenu({
                record,
                onView: handleViewDetails,
                onEdit: (m) =>
                  navigate(`/dashboard/matters/general/${m._id}/edit`),
                onDelete: (m) => handleDelete(m._id),
              })}
            />
          );
        },
      },
    ],
    [navigate, handleDelete, handleCreateGeneral, handleViewDetails],
  );

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: setSelectedRowKeys,
    }),
    [selectedRowKeys],
  );

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some((v) => v),
    [filters],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <MatterPageHeader
        icon={<FileTextOutlined />}
        title="General Matters"
        subtitle="Manage and track all general legal services"
        count={pagination.total}
        actions={
          <>
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[
                {
                  label: "Dashboard",
                  value: "dashboard",
                  icon: <AppstoreOutlined />,
                },
                {
                  label: "Table",
                  value: "table",
                  icon: <UnorderedListOutlined />,
                },
              ]}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading || statsLoading}>
              Refresh
            </Button>
            <Button icon={<DownloadOutlined />}>Export</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/dashboard/matters/create?type=general")}>
              New Matter
            </Button>
          </>
        }
      />

      <div className="p-4 sm:p-6 flex flex-col gap-4 max-w-[1600px] mx-auto">
        <MatterStatCards
          loading={statsLoading}
          stats={statsCards}
          cols={Math.min(statsCards?.length || 4, 8)}
        />

        {viewMode === "dashboard" ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DistributionChart
                title="Service Type Distribution"
                data={serviceTypeData}
                loading={statsLoading}
                onItemClick={(item) =>
                  handleFilterChange("serviceType", item._id)
                }
                onViewAll={() => setViewMode("table")}
                emptyMessage="No service type data available"
              />

              <ComplianceCard
                requirementsData={requirementsData}
                deliverablesData={deliverablesData}
                stats={stats}
              />
            </div>

            <RecentMattersCard
              recentMatters={recentMatters}
              loading={statsLoading}
              onViewMatter={(matter) => handleViewDetails(matter)}
              onViewAll={() => setViewMode("table")}
            />
          </>
        ) : (
          <>
            <MatterToolbar
              searchPlaceholder="Search matters..."
              onSearch={handleSearch}
              filtersOpen={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              showClear={hasActiveFilters}
              onClear={handleClearFilters}
            />

            {showFilters && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Select
                      placeholder="Service Type"
                      style={{ width: "100%" }}
                      allowClear
                      onChange={(v) => handleFilterChange("serviceType", v)}
                      value={filters.serviceType}>
                      {NIGERIAN_GENERAL_SERVICE_TYPES.map((t) => (
                        <Option key={t.value} value={t.value}>
                          {t.label}
                        </Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Select
                      placeholder="Status"
                      style={{ width: "100%" }}
                      allowClear
                      onChange={(v) => handleFilterChange("status", v)}
                      value={filters.status}>
                      <Option value="active">Active</Option>
                      <Option value="pending">Pending</Option>
                      <Option value="completed">Completed</Option>
                      <Option value="closed">Closed</Option>
                    </Select>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Select
                      placeholder="Jurisdiction"
                      style={{ width: "100%" }}
                      allowClear
                      onChange={(v) => handleFilterChange("jurisdictionState", v)}
                      value={filters.jurisdictionState}>
                      <Option value="Lagos">Lagos</Option>
                      <Option value="Abuja">Abuja</Option>
                      <Option value="Rivers">Rivers</Option>
                    </Select>
                  </Col>
                </Row>
              </div>
            )}

            <MatterTableCard
              columns={columns}
              dataSource={matters}
              rowKey="_id"
              loading={loading}
              rowSelection={rowSelection}
              onChange={handleTableChange}
              onRowClick={handleViewDetails}
              pagination={{
                current: pagination.page,
                pageSize: pagination.limit,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Total ${total} matters`,
                position: ["bottomCenter"],
              }}
              scrollX={1200}
              emptyTitle="No general matters found"
              emptyDescription="Create a new general matter to get started"
              onCreate={() => navigate("/dashboard/matters/create?type=general")}
              createLabel="New Matter"
            />
          </>
        )}

        <Modal
          title={`Bulk Update: ${bulkActionModal.action}`}
          open={bulkActionModal.visible}
          onCancel={() => setBulkActionModal({ visible: false, action: null })}
          onOk={() => {
            setBulkActionModal({ visible: false, action: null });
          }}>
          <p>Update {selectedRowKeys.length} selected matter(s)</p>
        </Modal>
      </div>
    </div>
  );
};

export default GeneralList;