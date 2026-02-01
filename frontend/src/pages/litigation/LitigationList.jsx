import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Space, Modal, message } from "antd";
import {
  PlusOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import LoadingScreen from "../../components/common/LoadingScreen";
import LitigationFilters from "../../components/litigation/filters/LitigationFilters";
import LitigationTable from "../../components/litigation/LitigationTable";
import {
  setFilters,
  clearFilters,
  setCurrentPage,
  setPageSize,
  selectLitigationMatters,
  selectPagination,
  selectFilters,
  selectLitigationLoading,
  fetchLitigationMatters,
  deleteLitigationDetails,
} from "../../redux/features/litigation/litigationSlice";

import {
  downloadFile,
  getExportFilename,
  buildQueryString,
} from "../../utils/formatters";
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from "../../utils/litigationConstants";
import litigationService from "../../redux/features/litigation/litigationService";

const { confirm } = Modal;

const LitigationList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const matters = useSelector(selectLitigationMatters);
  const pagination = useSelector(selectPagination);
  const total = pagination?.total || 0;
  const currentPage = pagination?.page || 1;
  const pageSize = pagination?.limit || DEFAULT_PAGE_SIZE;
  const filters = useSelector(selectFilters);
  const loading = useSelector(selectLitigationLoading);

  // Local state
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Fetch data on mount and when pagination/filters change
  useEffect(() => {
    loadMatters();
  }, [currentPage, pageSize, filters]);

  const loadMatters = () => {
    const params = {
      page: currentPage,
      limit: pageSize,
      ...filters,
    };

    // Remove empty/null filter values
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined,
      ),
    );

    dispatch(fetchLitigationMatters(cleanParams));
  };

  // Handle filter submission
  const handleFilter = (filterValues) => {
    dispatch(setFilters(filterValues));
  };

  // Handle filter clear
  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  // Handle table pagination/sorting change
  const handleTableChange = (pagination, _, sorter) => {
    if (pagination.current !== currentPage) {
      dispatch(setCurrentPage(pagination.current));
    }
    if (pagination.pageSize !== pageSize) {
      dispatch(setPageSize(pagination.pageSize));
    }

    // Handle sorting if needed
    if (sorter.field && sorter.order) {
      const sortField = sorter.field;
      const sortOrder = sorter.order === "ascend" ? "asc" : "desc";
      dispatch(
        setFilters({
          ...filters,
          sortField,
          sortOrder,
        }),
      );
    }
  };

  // Handle view matter
  const handleView = (record) => {
    navigate(`/dashboard/matters/litigation/${record._id}`);
  };

  // Handle edit matter
  const handleEdit = (record) => {
    navigate(`/dashboard/matters/litigation/${record._id}/edit`);
  };

  // Handle delete matter
  const handleDelete = (record) => {
    confirm({
      title: "Delete Litigation Matter",
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${record.title}"? This will soft delete the litigation details.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      async onOk() {
        try {
          await dispatch(deleteLitigationDetails(record._id)).unwrap();
          message.success("Matter deleted successfully");
          loadMatters();
        } catch (error) {
          message.error(error.message || "Failed to delete matter");
        }
      },
    });
  };

  // Handle export single matter
  const handleExportSingle = async (record) => {
    try {
      setExportLoading(true);
      const blob = await litigationService.exportSingleMatter(
        record._id,
        "pdf",
      );
      const filename = getExportFilename(
        `litigation_${record.matterNumber}`,
        "pdf",
      );
      downloadFile(blob, filename);
      message.success("Matter exported successfully");
    } catch (error) {
      message.error(error.message || "Failed to export matter");
    } finally {
      setExportLoading(false);
    }
  };

  // Handle bulk export
  const handleBulkExport = async () => {
    if (matters.length === 0) {
      message.warning("No matters to export");
      return;
    }

    try {
      setExportLoading(true);
      let exportParams = { ...filters };

      // Add selected IDs if any
      if (selectedRowKeys.length > 0) {
        exportParams.ids = selectedRowKeys.join(",");
      }

      // Remove empty values
      const cleanParams = Object.fromEntries(
        Object.entries(exportParams).filter(
          ([_, v]) => v !== "" && v !== null && v !== undefined,
        ),
      );

      // Convert to query string
      const queryString = buildQueryString(cleanParams);
      const url = `/litigation/export${queryString}`;

      // Use apiService directly for blob downloads
      const apiService = await import("../../services/api");
      const blob = await apiService.default.download(url);

      const filename = getExportFilename(
        `litigation_matters_${new Date().toISOString().split("T")[0]}`,
        "xlsx",
      );
      downloadFile(blob, filename);
      message.success("Matters exported successfully");
      setSelectedRowKeys([]);
    } catch (error) {
      console.error("Export error:", error);
      message.error(error.message || "Failed to export matters");
    } finally {
      setExportLoading(false);
    }
  };

  // Handle create new matter - redirect to matter creation with litigation type
  const handleCreate = () => {
    const returnPath = `/dashboard/matters/litigation/:matterId/create`;
    navigate(
      `/dashboard/matters/create?type=litigation&returnTo=${encodeURIComponent(returnPath)}`,
    );
  };

  // Table row selection
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [
      {
        key: "all",
        text: "Select All",
        onSelect: () => {
          setSelectedRowKeys(matters.map((m) => m._id));
        },
      },
      {
        key: "invert",
        text: "Select Invert",
        onSelect: () => {
          const currentKeys = new Set(selectedRowKeys);
          const invertedKeys = matters
            .map((m) => m._id)
            .filter((id) => !currentKeys.has(id));
          setSelectedRowKeys(invertedKeys);
        },
      },
      {
        key: "none",
        text: "Clear Selection",
        onSelect: () => {
          setSelectedRowKeys([]);
        },
      },
    ],
  };

  // Pagination config
  const paginationConfig = {
    current: currentPage,
    pageSize: pageSize,
    total: total,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} matters`,
    onChange: (page, newPageSize) => {
      if (page !== currentPage) {
        dispatch(setCurrentPage(page));
      }
      if (newPageSize !== pageSize) {
        dispatch(setPageSize(newPageSize));
      }
    },
  };

  // Calculate if filters are active
  const isFiltersActive = Object.values(filters).some(
    (value) => value !== "" && value !== null && value !== undefined,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Litigation Matters"
        subtitle={`${total} ${total === 1 ? "matter" : "matters"} found${
          isFiltersActive ? " (filtered)" : ""
        }`}
        extra={[
          <Button
            key="export"
            icon={<DownloadOutlined />}
            onClick={handleBulkExport}
            loading={exportLoading}
            disabled={matters.length === 0}>
            Export {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
          </Button>,
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}>
            New Litigation Matter
          </Button>,
        ]}
      />

      <div className="p-6">
        {/* Filters */}
        <LitigationFilters
          onFilter={handleFilter}
          onClear={handleClearFilters}
          loading={loading}
          initialValues={filters}
        />

        {/* Bulk selection info */}
        {selectedRowKeys.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Space>
              <span className="text-blue-700 font-medium">
                {selectedRowKeys.length} matters selected
              </span>
              <Button
                size="small"
                type="link"
                onClick={() => setSelectedRowKeys([])}>
                Clear selection
              </Button>
            </Space>
          </div>
        )}

        {/* Table */}
        {loading && matters.length === 0 ? (
          <LoadingScreen tip="Loading litigation matters..." />
        ) : matters.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200">
            <EmptyState
              title="No litigation matters found"
              description={
                isFiltersActive
                  ? "Try adjusting your filters or clear them to see all matters"
                  : "Get started by creating your first litigation matter"
              }
              actionText="Create Litigation Matter"
              onAction={handleCreate}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            <LitigationTable
              data={matters}
              loading={loading}
              pagination={paginationConfig}
              onChange={handleTableChange}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onExport={handleExportSingle}
              rowSelection={rowSelection}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LitigationList;
