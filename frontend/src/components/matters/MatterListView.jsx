import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Row,
  Col,
  Card,
  Button,
  Space,
  Table,
  Tag,
  Avatar,
  Badge,
  Typography,
  Modal,
  message,
  Tooltip,
  Pagination,
  Spin,
  Empty,
  Grid,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";

import MatterCard from "./MatterCard";
import MatterFilters from "./MatterFilters";
import BulkActionsBar from "./BulkActionsBar";

import {
  MATTER_CONFIG,
  getStatusColor,
  formatCurrency,
} from "../../config/matterConfig";
import {
  getMatters,
  deleteMatter,
  resetMatterState,
  bulkUpdateMatters,
  bulkDeleteMatters,
  bulkAssignOfficer,
  bulkExportMatters,
  selectMatter,
  deselectMatter,
  toggleSelectMatter,
  clearSelectedMatters,
} from "../../redux/features/matter/matterSlice";
import { useTheme } from "../../providers/ThemeProvider";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const MatterListView = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();
  const screens = useBreakpoint();

  const {
    matters,
    isLoading,
    isError,
    message: matterMessage,
    selectedMatters,
    bulkLoading,
  } = useSelector((state) => state.matter);

  const [activeFilters, setActiveFilters] = useState({});
  const [initialFilters, setInitialFilters] = useState({});
  const [viewMode, setViewMode] = useState("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    dispatch(getMatters());
    return () => {
      dispatch(resetMatterState());
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(clearSelectedMatters());
  }, [activeFilters, dispatch]);

  useEffect(() => {
    if (isError) {
      message.error(matterMessage);
    }
  }, [isError, matterMessage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const filters = {};

    if (params.get("search")) filters.search = params.get("search");
    if (params.get("status")) filters.status = params.get("status");
    if (params.get("matterType")) filters.matterType = params.get("matterType");
    if (params.get("priority")) filters.priority = params.get("priority");

    if (params.get("startDate") && params.get("endDate")) {
      filters.dateRange = [
        dayjs(params.get("startDate")),
        dayjs(params.get("endDate")),
      ];
    }

    setInitialFilters(filters);
    setActiveFilters(filters);
  }, []);

  const handleFilterChange = (filters) => {
    setActiveFilters(filters);

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        if (key === "dateRange" && Array.isArray(value) && value.length === 2) {
          params.set("startDate", value[0].format("YYYY-MM-DD"));
          params.set("endDate", value[1].format("YYYY-MM-DD"));
        } else if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else {
          params.set(key, value);
        }
      }
    });

    navigate(
      { search: params.toString() ? `?${params.toString()}` : "" },
      { replace: true },
    );
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setInitialFilters({});
    setCurrentPage(1);
    navigate({ search: "" }, { replace: true });
  };

  const handleBulkDelete = useCallback(
    async (matterIds) => {
      try {
        await dispatch(bulkDeleteMatters(matterIds)).unwrap();
        message.success(`Successfully deleted ${matterIds.length} matters`);
        dispatch(clearSelectedMatters());
      } catch (error) {
        message.error(error.message || "Failed to delete matters");
      }
    },
    [dispatch],
  );

  const handleBulkAssign = useCallback(
    async (matterIds, officerId) => {
      try {
        await dispatch(bulkAssignOfficer({ matterIds, officerId })).unwrap();
        message.success(`Officer assigned to ${matterIds.length} matters`);
      } catch (error) {
        message.error(error.message || "Failed to assign officer");
      }
    },
    [dispatch],
  );

  const handleBulkChangeStatus = useCallback(
    async (matterIds, status) => {
      try {
        await dispatch(
          bulkUpdateMatters({ matterIds, updateData: { status } }),
        ).unwrap();
        message.success(`Status updated for ${matterIds.length} matters`);
      } catch (error) {
        message.error(error.message || "Failed to update status");
      }
    },
    [dispatch],
  );

  const handleBulkChangePriority = useCallback(
    async (matterIds, priority) => {
      try {
        await dispatch(
          bulkUpdateMatters({ matterIds, updateData: { priority } }),
        ).unwrap();
        message.success(`Priority updated for ${matterIds.length} matters`);
      } catch (error) {
        message.error(error.message || "Failed to update priority");
      }
    },
    [dispatch],
  );

  const handleBulkExport = useCallback(
    async (matterIds, format) => {
      try {
        const result = await dispatch(
          bulkExportMatters({ matterIds, format }),
        ).unwrap();

        const blob = new Blob([result], {
          type:
            format === "pdf"
              ? "application/pdf"
              : format === "excel"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "text/csv",
        });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const extension = format === "excel" ? "xlsx" : format;
        a.download = `matters-export-${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        message.success(
          `Exported ${matterIds.length} matters as ${format.toUpperCase()}`,
        );
      } catch (error) {
        message.error(error.message || "Failed to export matters");
      }
    },
    [dispatch],
  );

  const handleSelectMatter = useCallback(
    (matterId) => {
      dispatch(toggleSelectMatter(matterId));
    },
    [dispatch],
  );

  const filteredMatters = useMemo(() => {
    if (!matters) return [];

    return matters.filter((matter) => {
      const filters = activeFilters;

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchable = [
          matter.title,
          matter.description,
          matter.matterNumber,
          matter.client?.firstName,
          matter.client?.lastName,
          matter.client?.companyName,
          matter.natureOfMatter,
          matter.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchable.includes(searchLower)) return false;
      }

      if (filters.status && matter.status !== filters.status) return false;
      if (filters.matterType && matter.matterType !== filters.matterType)
        return false;
      if (filters.priority && matter.priority !== filters.priority)
        return false;
      if (filters.client && matter.client?._id !== filters.client) return false;

      if (filters.accountOfficer) {
        const officers = Array.isArray(matter.accountOfficer)
          ? matter.accountOfficer
          : matter.accountOfficer
            ? [matter.accountOfficer]
            : [];

        const filterOfficers = Array.isArray(filters.accountOfficer)
          ? filters.accountOfficer
          : [filters.accountOfficer];

        const hasMatchingOfficer = filterOfficers.some((filterId) =>
          officers.some(
            (officer) => officer._id === filterId || officer === filterId,
          ),
        );

        if (!hasMatchingOfficer) return false;
      }

      if (filters.category && matter.category !== filters.category)
        return false;
      if (
        filters.natureOfMatter &&
        matter.natureOfMatter !== filters.natureOfMatter
      )
        return false;

      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        const matterDate = new Date(matter.dateOpened);
        const startDate = new Date(filters.dateRange[0]);
        const endDate = new Date(filters.dateRange[1]);

        if (matterDate < startDate || matterDate > endDate) return false;
      }

      return true;
    });
  }, [matters, activeFilters]);

  const paginatedMatters = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMatters.slice(startIndex, startIndex + pageSize);
  }, [filteredMatters, currentPage, pageSize]);

  const handleSelectAllOnPage = useCallback(() => {
    const currentPageMatterIds = paginatedMatters.map((m) => m._id);
    const allSelected = currentPageMatterIds.every((id) =>
      selectedMatters.includes(id),
    );

    if (allSelected) {
      currentPageMatterIds.forEach((id) => dispatch(deselectMatter(id)));
    } else {
      currentPageMatterIds.forEach((id) => {
        if (!selectedMatters.includes(id)) {
          dispatch(selectMatter(id));
        }
      });
    }
  }, [dispatch, selectedMatters, paginatedMatters]);

  const handleClearSelection = useCallback(() => {
    dispatch(clearSelectedMatters());
  }, [dispatch]);

  const handleDeleteMatter = (matterId) => {
    Modal.confirm({
      title: "Delete Matter",
      content:
        "Are you sure you want to delete this matter? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      centered: true,
      className: isDarkMode ? "dark-modal" : "",
      onOk: async () => {
        try {
          await dispatch(deleteMatter(matterId)).unwrap();
          message.success("Matter deleted successfully");
        } catch (error) {
          message.error("Failed to delete matter");
        }
      },
    });
  };

  const totalMatters = filteredMatters.length;
  const isAllSelectedOnPage =
    paginatedMatters.length > 0 &&
    paginatedMatters.every((m) => selectedMatters.includes(m._id));
  const isSomeSelectedOnPage =
    paginatedMatters.some((m) => selectedMatters.includes(m._id)) &&
    !isAllSelectedOnPage;

  const columns = [
    {
      title: (
        <Checkbox
          checked={isAllSelectedOnPage}
          indeterminate={isSomeSelectedOnPage}
          onChange={handleSelectAllOnPage}
        />
      ),
      key: "selection",
      width: 50,
      fixed: "left",
      render: (_, record) => (
        <Checkbox
          checked={selectedMatters.includes(record._id)}
          onChange={() => handleSelectMatter(record._id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      title: "Matter",
      dataIndex: "matterNumber",
      key: "matterNumber",
      width: screens.xs ? 120 : 150,
      render: (text, record) => (
        <div className="flex flex-col">
          <Button
            type="link"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/matters/${record._id}`);
            }}
            className="p-0 font-mono font-semibold text-left h-auto">
            {text}
          </Button>
          <Text type="secondary" className="text-xs truncate">
            {record.title}
          </Text>
        </div>
      ),
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      width: screens.xs ? undefined : 150,
      responsive: ["md"],
      render: (client) =>
        client ? (
          <div className="flex items-center gap-2 min-w-0">
            <Avatar
              size="small"
              src={client.photo}
              icon={<UserOutlined />}
              className="flex-shrink-0"
            />
            <div className="truncate min-w-0">
              <div className="truncate">
                {client.firstName} {client.lastName}
              </div>
              {client.companyName && (
                <div className="text-xs text-gray-500 truncate">
                  {client.companyName}
                </div>
              )}
            </div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: "Type",
      dataIndex: "matterType",
      key: "matterType",
      width: 100,
      responsive: ["sm"],
      render: (type) => (
        <Tag
          color={
            MATTER_CONFIG.MATTER_TYPES.find((t) => t.value === type)?.color ||
            "default"
          }
          className="capitalize">
          {screens.xs ? type.charAt(0).toUpperCase() : type}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      responsive: ["md"],
      render: (priority) => (
        <div className="flex items-center gap-2">
          <Badge
            status={
              priority === "high"
                ? "error"
                : priority === "medium"
                  ? "warning"
                  : "success"
            }
          />
          <span className="capitalize">{priority}</span>
        </div>
      ),
    },
    {
      title: "Date",
      dataIndex: "dateOpened",
      key: "dateOpened",
      width: 100,
      responsive: ["lg"],
      render: (date) => (
        <div className="flex items-center gap-1 text-sm">
          <CalendarOutlined className="text-gray-400 flex-shrink-0" />
          <span>
            {dayjs(date).format(screens.xs ? "MM/DD" : "MMM DD, YYYY")}
          </span>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: screens.xs ? "right" : false,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/dashboard/matters/${record._id}`);
              }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/dashboard/matters/${record._id}/edit`);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteMatter(record._id);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const MobileFilterButton = () => (
    <Button
      type="default"
      icon={<FilterOutlined />}
      onClick={() => setShowMobileFilters(!showMobileFilters)}
      className="md:hidden">
      Filters{" "}
      {Object.keys(activeFilters).length > 0 && (
        <Badge
          count={Object.keys(activeFilters).length}
          size="small"
          className="ml-1"
        />
      )}
    </Button>
  );

  return (
    <div
      className={`min-h-screen p-4 md:p-6 ${isDarkMode ? "dark bg-gray-900" : "bg-gray-50"}`}>
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <Title
              level={screens.xs ? 3 : 2}
              className={`mb-1 md:mb-2 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
              Legal Matters
            </Title>
            <Text
              type="secondary"
              className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              Manage and track all legal matters in your practice
            </Text>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Space wrap className="flex-wrap">
              <MobileFilterButton />

              <Button.Group>
                <Tooltip title="Grid View">
                  <Button
                    type={viewMode === "grid" ? "primary" : "default"}
                    icon={<AppstoreOutlined />}
                    onClick={() => setViewMode("grid")}
                  />
                </Tooltip>
                <Tooltip title="List View">
                  <Button
                    type={viewMode === "list" ? "primary" : "default"}
                    icon={<UnorderedListOutlined />}
                    onClick={() => setViewMode("list")}
                  />
                </Tooltip>
              </Button.Group>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate("/dashboard/matters/create")}
                size={screens.xs ? "middle" : "large"}>
                {screens.xs ? "New" : "New Matter"}
              </Button>
            </Space>
          </div>
        </div>
      </div>

      <div className="hidden md:block mb-6">
        <MatterFilters
          onFilter={handleFilterChange}
          onClear={handleClearFilters}
          loading={isLoading}
          initialFilters={initialFilters}
        />
      </div>

      {showMobileFilters && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 h-full w-4/5 max-w-md bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <Title level={4}>Filters</Title>
                <Button type="text" onClick={() => setShowMobileFilters(false)}>
                  Close
                </Button>
              </div>
              <MatterFilters
                onFilter={(filters) => {
                  handleFilterChange(filters);
                  setShowMobileFilters(false);
                }}
                onClear={() => {
                  handleClearFilters();
                  setShowMobileFilters(false);
                }}
                loading={isLoading}
                initialFilters={initialFilters}
                showAdvanced={true}
              />
            </div>
          </div>
        </div>
      )}

      <BulkActionsBar
        selectedCount={selectedMatters.length}
        selectedItems={selectedMatters}
        onBulkDelete={handleBulkDelete}
        onBulkAssign={handleBulkAssign}
        onBulkChangeStatus={handleBulkChangeStatus}
        onBulkChangePriority={handleBulkChangePriority}
        onBulkExport={handleBulkExport}
        onClearSelection={handleClearSelection}
        loading={bulkLoading || isLoading}
      />

      <Card
        className={`shadow-sm border-0 rounded-2xl ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        bodyStyle={{ padding: screens.xs ? "12px" : "20px" }}>
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div
              className={`mb-6 pb-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <Text className="font-medium">
                    Showing {paginatedMatters.length} of {totalMatters} matters
                  </Text>
                  {selectedMatters.length > 0 && (
                    <Text type="secondary" className="block text-sm">
                      {selectedMatters.length} matter
                      {selectedMatters.length > 1 ? "s" : ""} selected
                    </Text>
                  )}
                </div>
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {paginatedMatters?.map((matter) => (
                  <MatterCard
                    key={matter._id}
                    matter={matter}
                    onDelete={() => handleDeleteMatter(matter._id)}
                    onSelect={handleSelectMatter}
                    selected={selectedMatters.includes(matter._id)}
                    compact={!screens.lg}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table
                  columns={columns}
                  dataSource={paginatedMatters}
                  rowKey="_id"
                  onRow={(record) => ({
                    onClick: (e) => {
                      if (!e.target.closest(".ant-checkbox-wrapper")) {
                        navigate(`/dashboard/matters/${record._id}`);
                      }
                    },
                    className:
                      "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700",
                  })}
                  pagination={false}
                  scroll={{ x: true }}
                  size={screens.xs ? "small" : "middle"}
                  className={isDarkMode ? "dark-table" : ""}
                />
              </div>
            )}

            {paginatedMatters.length === 0 && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div className="py-12">
                    <Title level={4} type="secondary" className="mb-2">
                      {Object.keys(activeFilters).length > 0
                        ? "No matters match your filters"
                        : "No matters found"}
                    </Title>
                    <Text type="secondary" className="mb-6 block">
                      {Object.keys(activeFilters).length > 0
                        ? "Try adjusting your search criteria"
                        : "Get started by creating your first legal matter"}
                    </Text>
                    <Space>
                      {Object.keys(activeFilters).length > 0 && (
                        <Button onClick={handleClearFilters}>
                          Clear All Filters
                        </Button>
                      )}
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => navigate("/dashboard/matters/create")}>
                        Create New Matter
                      </Button>
                    </Space>
                  </div>
                }
              />
            )}

            {totalMatters > 0 && (
              <div
                className={`mt-8 pt-6 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Text type="secondary" className="text-sm">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, totalMatters)} of{" "}
                    {totalMatters} matters
                  </Text>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalMatters}
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }}
                    showSizeChanger
                    showQuickJumper={screens.sm}
                    showTotal={(total, range) => (
                      <span className="hidden sm:inline">
                        {range[0]}-{range[1]} of {total}
                      </span>
                    )}
                    pageSizeOptions={[12, 24, 48, 96]}
                    size={screens.xs ? "small" : "default"}
                    responsive
                  />
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default MatterListView;
