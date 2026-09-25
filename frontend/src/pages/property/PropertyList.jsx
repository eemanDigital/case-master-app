import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Row, Col, Select, DatePicker, Tag, Button, Input, Alert, Modal } from "antd";
import {
  PlusOutlined,
  HomeOutlined,
  DollarOutlined,
  DownloadOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import {
  fetchPropertyMatters,
  searchPropertyMatters,
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  setSelectedMatter,
  fetchPropertyStats,
  clearError,
  selectPropertyMatters,
  selectPagination,
  selectFilters,
  selectPropertyLoading,
  selectPropertyError,
  selectPropertyStats,
} from "../../redux/features/property/propertySlice";
import {
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
  NIGERIAN_STATES,
  formatCurrency,
  getTransactionTypeLabel,
  getPropertyTypeLabel,
} from "../../utils/propertyConstants";
import {
  MatterPageHeader,
  MatterStatCards,
  MatterToolbar,
  MatterTableCard,
  MatterNumberTag,
  ClientCell,
  MatterRowActions,
  buildRowMenu,
  StatusPill,
  MoneyText,
  DateCell,
} from "../../components/matters/ui/matterListKit";

const { Option } = Select;
const { RangePicker } = DatePicker;

const STATUS_MAP = {
  active: { color: "green", label: "Active" },
  pending: { color: "orange", label: "Pending" },
  completed: { color: "blue", label: "Completed" },
  on_hold: { color: "red", label: "On Hold" },
};

const PropertyList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const matters = useSelector(selectPropertyMatters);
  const pagination = useSelector(selectPagination);
  const filters = useSelector(selectFilters);
  const loading = useSelector(selectPropertyLoading);
  const error = useSelector(selectPropertyError);
  const stats = useSelector(selectPropertyStats);

  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    await dispatch(fetchPropertyStats());
    setStatsLoading(false);
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchPropertyMatters({
        ...filters,
        page: pagination.currentPage || pagination.current || 1,
        limit: pagination.limit || 20,
      }),
    );
    loadStats();
  }, [
    dispatch,
    pagination,
    filters,
    loadStats,
  ]);

  const handleSearch = (value) => {
    if (value.trim()) {
      dispatch(
        searchPropertyMatters({
          criteria: { $text: { $search: value } },
          params: { page: 1, limit: pagination.limit },
        }),
      );
    } else {
      dispatch(
        fetchPropertyMatters({ ...filters, page: 1, limit: pagination.limit }),
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
    navigate(`/dashboard/matters/property/${matter._id}/details`);
  };

  const handleCreateNew = () => {
    navigate(`/dashboard/matters/create`);
  };

  const handleExport = () => {
    Modal.info({
      title: "Export Property Matters",
      content: "Export feature will be implemented soon.",
    });
  };

  const columns = [
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
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 200,
      ellipsis: true,
      render: (text, record) => (
        <button
          type="button"
          onClick={() => handleViewDetails(record)}
          className="font-medium text-slate-800 hover:text-indigo-600 text-left">
          {text || "-"}
        </button>
      ),
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      width: 180,
      render: (client) => <ClientCell client={client} />,
    },
    {
      title: "Transaction",
      key: "transactionType",
      width: 150,
      render: (_, record) => {
        if (!record.propertyDetail) return <Tag color="default" className="m-0">Not Started</Tag>;
        const transactionType = record.propertyDetail?.transactionType;
        if (!transactionType) return <Tag color="default" className="m-0">Not Set</Tag>;
        return (
          <Tag color="blue" className="capitalize m-0">
            {getTransactionTypeLabel(transactionType)}
          </Tag>
        );
      },
    },
    {
      title: "Property Type",
      key: "propertyType",
      width: 140,
      render: (_, record) => {
        if (!record.propertyDetail) return "-";
        const properties = record.propertyDetail?.properties;
        if (!properties || properties.length === 0) return "-";
        const type = properties[0]?.propertyType;
        return <Tag color="green" className="m-0">{getPropertyTypeLabel(type) || "Property"}</Tag>;
      },
    },
    {
      title: "Location",
      key: "location",
      width: 180,
      ellipsis: true,
      render: (_, record) => {
        if (!record.propertyDetail) return "-";
        const properties = record.propertyDetail?.properties;
        if (!properties || properties.length === 0) return "-";
        const prop = properties[0];
        return prop.address || prop.state || prop.city || "-";
      },
    },
    {
      title: "Price/Value",
      key: "purchasePrice",
      width: 150,
      align: "right",
      render: (_, record) => {
        if (!record.propertyDetail) return "-";
        const purchasePrice = record.propertyDetail?.purchasePrice;
        if (!purchasePrice?.amount) return "-";
        return (
          <MoneyText amount={purchasePrice.amount} formatter={(a, c) => formatCurrency(a, c)} />
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
      title: "Date Opened",
      dataIndex: "dateOpened",
      key: "dateOpened",
      width: 130,
      render: (date) => <DateCell date={date} />,
    },
    {
      title: "Actions",
      key: "actions",
      width: 56,
      fixed: "right",
      render: (_, record) => (
        <MatterRowActions
          menuItems={buildRowMenu({
            record,
            onView: handleViewDetails,
            onEdit: (m) =>
              navigate(`/dashboard/matters/property/${m._id}/edit`),
          })}
        />
      ),
    },
  ];

  const handleTableChange = (newPagination) => {
    dispatch(setCurrentPage(newPagination.current));
    if (newPagination.pageSize !== pagination.limit) {
      dispatch(setPageSize(newPagination.pageSize));
    }
  };

  const statsCards = [
    {
      label: "Total Property Matters",
      value: stats?.overview?.totalPropertyMatters || 0,
      icon: HomeOutlined,
      color: "#1890ff",
    },
    {
      label: "Active Transactions",
      value: stats?.overview?.activePropertyMatters || 0,
      icon: SyncOutlined,
      color: "#52c41a",
    },
    {
      label: "Pending Gov. Consents",
      value: stats?.pendingConsents || 0,
      icon: CheckCircleOutlined,
      color: "#fa8c16",
    },
    {
      label: "Completed Matters",
      value: stats?.overview?.completedPropertyMatters || 0,
      icon: CheckCircleOutlined,
      color: "#722ed1",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <MatterPageHeader
        icon={<HomeOutlined />}
        title="Property Matters"
        subtitle="Manage all property transactions and real estate matters"
        count={pagination.totalRecords || pagination.count || 0}
        actions={
          <>
            <Button
              icon={<KeyOutlined />}
              onClick={() => navigate("/dashboard/matters/property/lease-dashboard")}>
              Lease Dashboard
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNew}>
              New Property Matter
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
          searchPlaceholder="Search matters, properties, addresses, or clients..."
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
                  placeholder="Property Type"
                  style={{ width: "100%" }}
                  value={filters.propertyType || undefined}
                  onChange={(value) => handleFilterChange("propertyType", value)}
                  allowClear>
                  {PROPERTY_TYPES.map((type) => (
                    <Option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} md={8}>
                <Select
                  placeholder="State/Location"
                  style={{ width: "100%" }}
                  value={filters.state || undefined}
                  onChange={(value) => handleFilterChange("state", value)}
                  allowClear>
                  {NIGERIAN_STATES.map((state) => (
                    <Option key={state.value} value={state.value}>
                      {state.label}
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
                  <Option value="completed">Completed</Option>
                  <Option value="on_hold">On Hold</Option>
                </Select>
              </Col>

              <Col xs={24} md={8}>
                <Input
                  placeholder="Min Price"
                  value={filters.minPrice || ""}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  prefix={<DollarOutlined />}
                  allowClear
                />
              </Col>

              <Col xs={24} md={8}>
                <Input
                  placeholder="Max Price"
                  value={filters.maxPrice || ""}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  prefix={<DollarOutlined />}
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
              typeof error === "string" ? error : "Failed to load property matters"
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
            current: pagination.currentPage || pagination.current || 1,
            pageSize: pagination.limit || 20,
            total: pagination.totalRecords || pagination.count || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} matters`,
            pageSizeOptions: ["10", "20", "50", "100"],
          }}
          scrollX={1400}
          emptyTitle="No property matters found"
          emptyDescription="Create your first property matter to get started"
          onCreate={handleCreateNew}
          createLabel="Create your first property matter"
        />
      </div>
    </div>
  );
};

export default PropertyList;