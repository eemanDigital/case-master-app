// pages/dashboard/advisory/AdvisoryDashboardPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Tabs, Spin, Alert, Empty, Button } from "antd";
import {
  ReloadOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";

import {
  fetchAllAdvisoryMatters,
  fetchAdvisoryStats,
  selectAdvisoryLoading,
  selectAdvisoryError,
} from "../../redux/features/advisory/advisorySlice";
import { ADVISORY_LOADING_KEYS } from "../../utils/advisoryConstants";

import AdvisoryStatsGrid from "../../components/advisory/dashboard/AdvisoryStatsGrid";
import AdvisoryListTable from "../../components/advisory/dashboard/AdvisoryListTable";
import AdvisoryFiltersBar from "../../components/advisory/dashboard/AdvisoryFiltersBar";
import AdvisoryBulkActions from "../../components/advisory/dashboard/AdvisoryBulkActions";
import AdvisoryDashboardHeader from "../../components/advisory/dashboard/AdvisoryDashboardHeader";

const { TabPane } = Tabs;

const AdvisoryDashboardPage = () => {
  const dispatch = useDispatch();

  const [activeView, setActiveView] = useState("list");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const loadingStates = {
    matters: useSelector(
      selectAdvisoryLoading(ADVISORY_LOADING_KEYS.FETCH_ALL),
    ),
    stats: useSelector(
      selectAdvisoryLoading(ADVISORY_LOADING_KEYS.FETCH_STATS),
    ),
  };

  const errors = {
    matters: useSelector(selectAdvisoryError(ADVISORY_LOADING_KEYS.FETCH_ALL)),
    stats: useSelector(selectAdvisoryError(ADVISORY_LOADING_KEYS.FETCH_STATS)),
  };

  // Initial data fetch
  useEffect(() => {
    dispatch(fetchAllAdvisoryMatters());
    dispatch(fetchAdvisoryStats());
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchAllAdvisoryMatters());
    dispatch(fetchAdvisoryStats());
  }, [dispatch]);

  const handleClearSelection = useCallback(() => {
    setSelectedRowKeys([]);
  }, []);

  // Check if any loading state is active
  const isLoading = useMemo(
    () => Object.values(loadingStates).some(Boolean),
    [loadingStates],
  );

  // Check if any error exists
  const hasError = useMemo(() => Object.values(errors).some(Boolean), [errors]);

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Alert
          type="error"
          message="Failed to load advisory dashboard"
          description={Object.values(errors).find(Boolean)}
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
      <AdvisoryDashboardHeader
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats Section */}
        <AdvisoryStatsGrid loading={loadingStates.stats} />

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* View Toggle & Filters */}
          <div className="px-6 pt-5 pb-3 border-b border-slate-100">
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
                        Kanban
                      </span>
                    }
                    key="kanban"
                    disabled
                  />
                </Tabs>
              </div>

              <AdvisoryFiltersBar
                searchText={searchText}
                onSearchChange={setSearchText}
                filterVisible={filterVisible}
                onFilterToggle={() => setFilterVisible(!filterVisible)}
              />
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedRowKeys.length > 0 && (
            <AdvisoryBulkActions
              selectedCount={selectedRowKeys.length}
              selectedIds={selectedRowKeys}
              onClearSelection={handleClearSelection}
            />
          )}

          {/* Content Area */}
          <div className="relative">
            {loadingStates.matters && (
              <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                <Spin size="large" tip="Loading matters..." />
              </div>
            )}

            {activeView === "list" && (
              <AdvisoryListTable
                selectedRowKeys={selectedRowKeys}
                onSelectionChange={setSelectedRowKeys}
                searchText={searchText}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisoryDashboardPage;
