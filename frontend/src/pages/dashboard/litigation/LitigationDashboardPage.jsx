// pages/dashboard/litigation/LitigationDashboardPage.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Tabs, Spin, Alert, Button, Row, Col } from "antd";
import {
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

import {
  fetchLitigationMatters,
  fetchLitigationStats,
  fetchUpcomingHearings,
  selectLitigationMatters,
  selectPagination,
  selectFilters,
  selectLitigationLoading,
  selectLitigationError,
  selectLitigationStats,
  selectUpcomingHearings,
  setFilters,
  clearFilters,
} from "../../../redux/features/litigation/litigationSlice";

import LitigationDashboardHeader from "../../../components/litigation/dashboard/LitigationDashboardHeader";
import LitigationStatsGrid from "../../../components/litigation/dashboard/LitigationStatsGrid";
import LitigationTable from "../../../components/litigation/LitigationTable";
import LitigationFilters from "../../../components/litigation/filters/LitigationFilters";
// import LitigationBulkActions from "../../../components/litigation/dashboard/LitigationBulkActions";
import UpcomingHearingsWidget from "../../../components/litigation/dashboard/UpcomingHearingsWidget";
import CourtDistributionChart from "../../../components/litigation/dashboard/CourtDistributionChart";
import CaseStageChart from "../../../components/litigation/dashboard/CaseStageChart";
import HearingsTimeline from "../../../components/litigation/dashboard/HearingsTimeline";
import CourtOrderDeadlinesWidget from "../../../components/calender/CourtOrderDeadlinesWidget";
// import CourtHearingsWidget from "../../../components/calender/CourtHearingsWidget";

const { TabPane } = Tabs;

const LitigationDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Local state
  const [activeView, setActiveView] = useState("list");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filterVisible, setFilterVisible] = useState(true);
  const [searchText, setSearchText] = useState("");

  // Redux state
  const matters = useSelector(selectLitigationMatters);
  const pagination = useSelector(selectPagination);
  const filters = useSelector(selectFilters);
  const stats = useSelector(selectLitigationStats);
  const upcomingHearings = useSelector(selectUpcomingHearings);

  const loading = useSelector(selectLitigationLoading);
  const statsLoading = useSelector((state) => state.litigation.statsLoading);
  const error = useSelector(selectLitigationError);

  // Initial data fetch
  useEffect(() => {
    loadMatters();
    dispatch(fetchLitigationStats());

    // Fetch upcoming hearings - these come from litigation details
    dispatch(
      fetchUpcomingHearings({
        // Optional: filter by date range
        fromDate: new Date().toISOString(),
        limit: 20,
      }),
    );
  }, []);

  const loadMatters = useCallback(
    (params = {}) => {
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params,
      };

      // Remove empty values
      Object.keys(queryParams).forEach(
        (key) =>
          (queryParams[key] === "" ||
            queryParams[key] === null ||
            queryParams[key] === undefined) &&
          delete queryParams[key],
      );

      dispatch(fetchLitigationMatters(queryParams));
    },
    [dispatch, pagination.page, pagination.limit, filters],
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadMatters();
    dispatch(fetchLitigationStats());
    dispatch(
      fetchUpcomingHearings({
        fromDate: new Date().toISOString(),
        limit: 20,
      }),
    );
  }, [loadMatters, dispatch]);

  // Handle filter submission
  const handleFilter = useCallback(
    (filterValues) => {
      dispatch(setFilters(filterValues));
      loadMatters({ ...filterValues, page: 1 });
    },
    [dispatch, loadMatters],
  );

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
    loadMatters({ page: 1 });
    setSearchText("");
  }, [dispatch, loadMatters]);

  // Handle table change
  const handleTableChange = useCallback(
    (paginationConfig, _, sorter) => {
      const params = {
        page: paginationConfig.current,
        limit: paginationConfig.pageSize,
      };

      if (sorter.field && sorter.order) {
        params.sortField = sorter.field;
        params.sortOrder = sorter.order === "ascend" ? "asc" : "desc";
      }

      loadMatters(params);
    },
    [loadMatters],
  );

  // Handle selection clear
  const handleClearSelection = useCallback(() => {
    setSelectedRowKeys([]);
  }, []);

  // Calculate if filters are active
  const isFiltersActive = useMemo(
    () =>
      Object.values(filters).some(
        (value) => value !== "" && value !== null && value !== undefined,
      ),
    [filters],
  );

  // Loading state
  if (loading && matters.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" className="mb-4" />
          <div className="text-gray-600">Loading litigation dashboard...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && matters.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Alert
          type="error"
          message="Failed to load litigation dashboard"
          description={typeof error === "string" ? error : "An error occurred"}
          showIcon
          action={
            <Button onClick={handleRefresh} icon={<ReloadOutlined />}>
              Retry
            </Button>
          }
          className="max-w-2xl shadow-lg"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LitigationDashboardHeader
        totalMatters={pagination.total || 0}
        onRefresh={handleRefresh}
        isLoading={loading || statsLoading}
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <LitigationStatsGrid stats={stats} loading={statsLoading} />

        {/* Charts Row */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <CourtDistributionChart data={stats?.byCourt || []} />
          </Col>
          <Col xs={24} lg={8}>
            <CaseStageChart data={stats?.byStage || []} />
          </Col>
          <Col xs={24} lg={8}>
            <UpcomingHearingsWidget
              hearings={upcomingHearings}
              loading={loading}
              onViewAll={() => navigate("#dashboard/calendar")}
            />
          </Col>
        </Row>

        <Row gutter={[24, 24]}>
          {/* Hearings Section */}

          {/* Deadlines Section */}
          <Col xs={24} xl={8}>
            <CourtOrderDeadlinesWidget limit={5} showStatistics={true} />
          </Col>
        </Row>

        {/* Hearings Timeline */}
        <HearingsTimeline data={stats?.hearingsByMonth || []} />

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* View Toggle & Filters */}
          <div className="px-6 pt-5 pb-3 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Tabs
                  activeKey={activeView}
                  onChange={setActiveView}
                  size="small"
                  className="[&_.ant-tabs-nav]:!mb-0">
                  <TabPane
                    tab={
                      <span className="flex items-center gap-2">
                        <UnorderedListOutlined />
                        List View
                      </span>
                    }
                    key="list"
                  />
                  <TabPane
                    tab={
                      <span className="flex items-center gap-2">
                        <AppstoreOutlined />
                        Calendar
                      </span>
                    }
                    key="calendar"
                    disabled
                  />
                </Tabs>

                <span className="text-sm text-gray-500">
                  {pagination.total || 0}{" "}
                  {pagination.total === 1 ? "matter" : "matters"}
                  {isFiltersActive && " (filtered)"}
                </span>
              </div>

              <LitigationFilters
                onFilter={handleFilter}
                onClear={handleClearFilters}
                loading={loading}
                initialValues={filters}
                compact={!filterVisible}
                onToggleVisibility={() => setFilterVisible(!filterVisible)}
              />
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {/* {selectedRowKeys.length > 0 && (
            <LitigationBulkActions
              selectedCount={selectedRowKeys.length}
              selectedIds={selectedRowKeys}
              onClearSelection={handleClearSelection}
              onSuccess={() => {
                loadMatters();
                setSelectedRowKeys([]);
              }}
            />
          )} */}

          {/* Content Area */}
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                <Spin tip="Loading matters..." />
              </div>
            )}

            {activeView === "list" && (
              <LitigationTable
                data={matters}
                loading={loading}
                pagination={{
                  current: pagination.page || 1,
                  pageSize: pagination.limit || 20,
                  total: pagination.total || 0,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  pageSizeOptions: ["10", "20", "50", "100"],
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} matters`,
                }}
                onChange={handleTableChange}
                onView={(record) =>
                  navigate(`/dashboard/matters/litigation/${record._id}`)
                }
                onEdit={(record) =>
                  navigate(`/dashboard/matters/litigation/${record._id}/edit`)
                }
                rowSelection={{
                  selectedRowKeys,
                  onChange: setSelectedRowKeys,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LitigationDashboardPage;
