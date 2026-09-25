import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Select, DatePicker, Tag, Button, Input, Alert, Modal } from "antd";
import {
  PlusOutlined,
  BarChartOutlined,
  FileTextOutlined,
  DollarOutlined,
  DownloadOutlined,
  SyncOutlined,
  AlertOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import {
  fetchCorporateMatters,
  searchCorporateMatters,
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSelectedMatter,
  fetchCorporateStats,
  clearError,
  selectCorporateMatters,
  selectPagination,
  selectFilters,
  selectCorporateLoading,
  selectCorporateError,
  selectCorporateStats,
} from "../../redux/features/corporate/corporateSlice";
import {
  TRANSACTION_TYPES,
  COMPANY_TYPES,
  DATE_FORMAT,
  formatCurrency,
  getTransactionTypeLabel,
} from "../../utils/corporateConstants";
import {
  MatterPageHeader,
  MatterStatCards,
  MatterToolbar,
  MatterTableCard,
  MatterNumberTag,
  MatterRowActions,
  buildRowMenu,
  StatusPill,
  MoneyText,
} from "../../components/matters/ui/matterListKit";

const { Option } = Select;
const { RangePicker } = DatePicker;

const STATUS_MAP = {
  active: { color: "green", label: "Active" },
  pending: { color: "blue", label: "Pending" },
  closed: { color: "default", label: "Closed" },
  on_hold: { color: "orange", label: "On Hold" },
};

const CorporateList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const matters = useSelector(selectCorporateMatters);
  const pagination = useSelector(selectPagination);
  const filters = useSelector(selectFilters);
  const loading = useSelector(selectCorporateLoading);
  const error = useSelector(selectCorporateError);
  const stats = useSelector(selectCorporateStats);

  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    await dispatch(fetchCorporateStats());
    setStatsLoading(false);
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchCorporateMatters({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      }),
    );
    loadStats();
  }, [dispatch, pagination.page, pagination.limit, filters, loadStats]);

  const handleSearch = (value) => {
    if (value.trim()) {
      dispatch(
        searchCorporateMatters({
          criteria: { $text: { $search: value } },
          params: { page: 1, limit: pagination.limit },
        }),
      );
    } else {
      dispatch(
        fetchCorporateMatters({ ...filters, page: 1, limit: pagination.limit }),
      );
    }
  };

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setSearchText("");
  };

  const handleViewDetails = (matter) => {
    dispatch(setSelectedMatter(matter));
    navigate(`/dashboard/matters/corporate/${matter._id}`);
  };

  const handleCreateNew = () => {
    navigate("/dashboard/matters/corporate/create");
  };

  const handleExport = () => {
    Modal.info({
      title: "Export Corporate Matters",
      content: "Export feature will be implemented soon.",
    });
  };

  const columns = [
    {
      title: "Matter No.",
      dataIndex: "matterNumber",
      key: "matterNumber",
      width: 120,
      render: (text, record) => (
        <MatterNumberTag value={text || "-"} onClick={() => handleViewDetails(record)} />
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (text, record) => (
        <div>
          <button
            type="button"
            onClick={() => handleViewDetails(record)}
            className="font-medium text-slate-800 hover:text-indigo-600 text-left">
            {text || "-"}
          </button>
          <div className="text-xs text-slate-400">{record.client?.name || "No client"}</div>
        </div>
      ),
    },
    {
      title: "Transaction Type",
      dataIndex: "corporateDetail.transactionType",
      key: "transactionType",
      width: 180,
      render: (transactionType) => {
        if (!transactionType) return "-";
        const typeConfig = TRANSACTION_TYPES.find((t) => t.value === transactionType);
        return (
          <Tag color={typeConfig?.color || "default"} className="capitalize m-0">
            {typeConfig?.icon} {getTransactionTypeLabel(transactionType)}
          </Tag>
        );
      },
    },
    {
      title: "Company",
      dataIndex: "corporateDetail.companyName",
      key: "companyName",
      width: 180,
      ellipsis: true,
      render: (text) => text || "-",
    },
    {
      title: "Deal Value",
      dataIndex: "corporateDetail.dealValue",
      key: "dealValue",
      width: 150,
      align: "right",
      render: (dealValue) =>
        dealValue?.amount ? (
          <MoneyText amount={dealValue.amount} formatter={(a, c) => formatCurrency(a, c)} />
        ) : (
          "-"
        ),
    },
    {
      title: "Closing Date",
      dataIndex: "corporateDetail.expectedClosingDate",
      key: "expectedClosingDate",
      width: 140,
      render: (date) => {
        if (!date) return "-";
        const daysUntil = Math.ceil(
          (new Date(date) - new Date()) / (1000 * 60 * 60 * 24),
        );
        const isOverdue = daysUntil < 0;
        const suffix = isOverdue
          ? "Overdue"
          : daysUntil <= 30
            ? `${daysUntil} days left`
            : undefined;
        return <div className="whitespace-nowrap">
          <div className="text-sm text-slate-700">{dayjs(date).format(DATE_FORMAT)}</div>
          <div className={`text-xs ${isOverdue ? "text-red-500" : "text-orange-500"}`}>{suffix}</div>
        </div>;
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
      title: "Actions",
      key: "actions",
      width: 56,
      fixed: "right",
      render: (_, record) => (
        <MatterRowActions
          menuItems={buildRowMenu({ record, onView: handleViewDetails })}
        />
      ),
    },
  ];

  const handleTableChange = (newPagination) => {
    dispatch(setCurrentPage(newPagination.current));
    dispatch(setPageSize(newPagination.pageSize));
  };

  const statsCards = [
    {
      label: "Total Matters",
      value: stats?.totalMatters || 0,
      icon: FileTextOutlined,
      color: "#1890ff",
    },
    {
      label: "Active Transactions",
      value: stats?.activeMatters || 0,
      icon: SyncOutlined,
      color: "#52c41a",
    },
    {
      label: "Total Deal Value",
      value: formatCurrency(stats?.totalDealValue || 0, "NGN"),
      icon: DollarOutlined,
      color: "#722ed1",
    },
    {
      label: "Pending Approvals",
      value: stats?.pendingApprovals || 0,
      icon: AlertOutlined,
      color: "#fa8c16",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <MatterPageHeader
        icon={<BarChartOutlined />}
        title="Corporate Matters"
        subtitle="Manage all corporate transactions and matters"
        count={pagination.total}
        actions={
          <>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNew}>
              New Corporate Matter
            </Button>
          </>
        }
      />

      <div className="p-4 sm:p-6 flex flex-col gap-4 max-w-[1600px] mx-auto">
        <MatterStatCards loading={statsLoading} stats={statsCards} />

        <MatterToolbar
          searchValue={searchText}
          setSearchValue={setSearchText}
          onSearch={handleSearch}
          searchPlaceholder="Search matters, companies, or clients..."
          filtersOpen={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          showClear
          onClear={handleClearFilters}
        />

        {showFilters && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Select
                  placeholder="Transaction Type"
                  style={{ width: "100%" }}
                  value={filters.transactionType || undefined}
                  onChange={(value) => handleFilterChange("transactionType", value)}
                  allowClear>
                  {TRANSACTION_TYPES.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} md={8}>
                <Select
                  placeholder="Company Type"
                  style={{ width: "100%" }}
                  value={filters.companyType || undefined}
                  onChange={(value) => handleFilterChange("companyType", value)}
                  allowClear>
                  {COMPANY_TYPES.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} md={8}>
                <Select
                  placeholder="Status"
                  style={{ width: "100%" }}
                  value={filters.status || undefined}
                  onChange={(value) => handleFilterChange("status", value)}
                  allowClear>
                  <Option value="active">Active</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="closed">Closed</Option>
                  <Option value="on_hold">On Hold</Option>
                </Select>
              </Col>

              <Col xs={24} md={12}>
                <Input
                  placeholder="Company Name"
                  value={filters.companyName || ""}
                  onChange={(e) => handleFilterChange("companyName", e.target.value)}
                  allowClear
                />
              </Col>

              <Col xs={24} md={12}>
                <RangePicker
                  style={{ width: "100%" }}
                  placeholder={["Start Date", "End Date"]}
                  onChange={(dates) => handleFilterChange("dateRange", dates)}
                />
              </Col>
            </Row>
          </div>
        )}

        {error && (
          <Alert
            message="Error"
            description={
              typeof error === "string" ? error : "Failed to load corporate matters"
            }
            type="error"
            showIcon
            closable
            onClose={() => dispatch(clearError())}
          />
        )}

        <MatterTableCard
          columns={columns}
          dataSource={matters}
          rowKey="_id"
          loading={loading}
          onChange={handleTableChange}
          onRowClick={handleViewDetails}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} matters`,
          }}
          scrollX={1300}
          emptyTitle="No corporate matters found"
          emptyDescription="Create your first corporate matter to get started"
          onCreate={handleCreateNew}
          createLabel="Create your first corporate matter"
        />
      </div>
    </div>
  );
};

export default CorporateList;