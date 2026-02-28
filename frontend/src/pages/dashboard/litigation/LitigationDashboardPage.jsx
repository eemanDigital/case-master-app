// pages/dashboard/litigation/LitigationDashboardPage.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Tabs, Spin, Alert, Button, Row, Col, Card, Typography } from "antd";
import {
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  CalendarOutlined,
  BellOutlined,
  ScheduleOutlined,
  DownloadOutlined,
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

import { useDownloadPdfHandler } from "../../../hooks/useDownloadPdfHandler";

import LitigationDashboardHeader from "../../../components/litigation/dashboard/LitigationDashboardHeader";
import LitigationStatsGrid from "../../../components/litigation/dashboard/LitigationStatsGrid";
import LitigationTable from "../../../components/litigation/LitigationTable";
import LitigationFilters from "../../../components/litigation/filters/LitigationFilters";
import UpcomingHearingsWidget from "../../../components/litigation/dashboard/UpcomingHearingsWidget";
import CourtDistributionChart from "../../../components/litigation/dashboard/CourtDistributionChart";
import CaseStageChart from "../../../components/litigation/dashboard/CaseStageChart";
import HearingsTimeline from "../../../components/litigation/dashboard/HearingsTimeline";
import CourtOrderDeadlinesWidget from "../../../components/calender/CourtOrderDeadlinesWidget";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const LitigationDashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { handleDownloadPdf, loading: downloadLoading } = useDownloadPdfHandler();

  // Local state
  const [activeView, setActiveView] = useState("list");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filterVisible, setFilterVisible] = useState(true);
  const [searchText, setSearchText] = useState("");

  // Download handlers
  const downloadUrl = import.meta.env.VITE_BASE_URL;

  const handleDownloadThisWeek = (e) => {
    handleDownloadPdf(
      e,
      `${downloadUrl}/litigation/upcoming-hearings/download?range=this-week`,
      `hearings-this-week-${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  const handleDownloadNextWeek = (e) => {
    handleDownloadPdf(
      e,
      `${downloadUrl}/litigation/upcoming-hearings/download?range=next-week`,
      `hearings-next-week-${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  const handleDownloadThisMonth = (e) => {
    handleDownloadPdf(
      e,
      `${downloadUrl}/litigation/upcoming-hearings/download?range=this-month`,
      `hearings-this-month-${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" className="mb-4" />
          <div className="text-slate-600">Loading litigation dashboard...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && matters.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
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
    <div className="min-h-screen bg-slate-50">
      <LitigationDashboardHeader
        totalMatters={pagination.total || 0}
        onRefresh={handleRefresh}
        isLoading={loading || statsLoading}
      />

      <div className="px-6 pb-6 space-y-6">
        {/* Stats Grid */}
        <LitigationStatsGrid stats={stats} loading={statsLoading} />

        {/* Analytics Section */}
        <Card
          className="rounded-xl border-slate-200 shadow-sm"
          bodyStyle={{ padding: "24px" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-100">
              <BarChartOutlined className="text-white text-lg" />
            </div>
            <div>
              <Title level={5} className="!mb-0 !text-slate-800">
                Analytics Overview
              </Title>
              <Text type="secondary" className="text-xs">
                Court distribution and case stages
              </Text>
            </div>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <div className="h-[300px]">
                <CourtDistributionChart data={stats?.byCourt || []} />
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div className="h-[300px]">
                <CaseStageChart data={stats?.byStage || []} />
              </div>
            </Col>
          </Row>
        </Card>

        {/* Upcoming Hearings & Deadlines Row */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card
              className="rounded-xl border-slate-200 shadow-sm h-full"
              bodyStyle={{ padding: "0" }}>
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
                    <ScheduleOutlined className="text-white" />
                  </div>
                  <div>
                    <Title level={5} className="!mb-0 !text-sm !text-slate-800">
                      Upcoming Hearings
                    </Title>
                    <Text type="secondary" className="text-xs">
                      Next 7 days
                    </Text>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={handleDownloadThisWeek}
                      loading={downloadLoading}
                    >
                      This Week
                    </Button>
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={handleDownloadNextWeek}
                      loading={downloadLoading}
                    >
                      Next Week
                    </Button>
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={handleDownloadThisMonth}
                      loading={downloadLoading}
                    >
                      Month
                    </Button>
                  </div>
                </div>
              </div>
              <UpcomingHearingsWidget
                hearings={upcomingHearings}
                loading={loading}
                onViewAll={() => navigate("#dashboard/calendar")}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              className="rounded-xl border-slate-200 shadow-sm h-full"
              bodyStyle={{ padding: "0" }}>
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-500 to-red-500 flex items-center justify-center shadow-md">
                    <BellOutlined className="text-white" />
                  </div>
                  <div>
                    <Title level={5} className="!mb-0 !text-sm !text-slate-800">
                      Court Deadlines
                    </Title>
                    <Text type="secondary" className="text-xs">
                      Upcoming order deadlines
                    </Text>
                  </div>
                </div>
              </div>
              <CourtOrderDeadlinesWidget limit={5} showStatistics={true} />
            </Card>
          </Col>
        </Row>

        {/* Hearings Timeline */}
        <Card
          className="rounded-xl border-slate-200 shadow-sm"
          bodyStyle={{ padding: "24px" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-100">
              <CalendarOutlined className="text-white text-lg" />
            </div>
            <div>
              <Title level={5} className="!mb-0 !text-slate-800">
                Hearings Timeline
              </Title>
              <Text type="secondary" className="text-xs">
                Monthly hearing activity
              </Text>
            </div>
          </div>
          <HearingsTimeline data={stats?.hearingsByMonth || []} />
        </Card>

        {/* Matters Table */}
        <Card
          className="rounded-xl border-slate-200 shadow-sm overflow-hidden"
          bodyStyle={{ padding: "0" }}>
          {/* Table Header */}
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

                <span className="text-sm text-slate-500">
                  <span className="font-medium text-slate-700">
                    {pagination.total || 0}
                  </span>{" "}
                  {pagination.total === 1 ? "matter" : "matters"}
                  {isFiltersActive && (
                    <span className="ml-1 text-amber-600">(filtered)</span>
                  )}
                </span>
              </div>

              <LitigationFilters
                onFilter={handleFilter}
                onClear={handleClearFilters}
                loading={loading}
                initialValues={filters}
              />
            </div>
          </div>

          {/* Table Content */}
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center py-12">
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
        </Card>
      </div>
    </div>
  );
};

export default LitigationDashboardPage;
