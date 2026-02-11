// components/advisory/dashboard/AdvisoryFiltersBar.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Input, Button, Select, Space, Tooltip } from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  ClearOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from "@ant-design/icons";

import {
  setFilters,
  resetFilters,
  selectAdvisoryFilters,
  fetchAllAdvisoryMatters,
} from "../../../redux/features/advisory/advisorySlice";

import {
  ADVISORY_STATUS_OPTIONS,
  ADVISORY_TYPE_OPTIONS,
} from "../../../utils/advisoryConstants";

const { Option } = Select;

const AdvisoryFiltersBar = ({
  searchText,
  onSearchChange,
  filterVisible,
  onFilterToggle,
}) => {
  const dispatch = useDispatch();
  const filters = useSelector(selectAdvisoryFilters);
  const [localSearch, setLocalSearch] = useState(searchText);
  const [sortOrder, setSortOrder] = useState("descend");

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        dispatch(setFilters({ search: localSearch, page: 1 }));
        dispatch(fetchAllAdvisoryMatters({ search: localSearch, page: 1 }));
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [localSearch, dispatch, filters.search]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    onSearchChange(value);
  };

  const handleFilterChange = useCallback(
    (key, value) => {
      dispatch(setFilters({ [key]: value, page: 1 }));
      dispatch(fetchAllAdvisoryMatters({ [key]: value, page: 1 }));
    },
    [dispatch],
  );

  const handleClearSearch = useCallback(() => {
    setLocalSearch("");
    onSearchChange("");
    dispatch(setFilters({ search: "", page: 1 }));
    dispatch(fetchAllAdvisoryMatters({ search: "", page: 1 }));
  }, [dispatch, onSearchChange]);

  const handleReset = useCallback(() => {
    dispatch(resetFilters());
    setLocalSearch("");
    onSearchChange("");
    dispatch(fetchAllAdvisoryMatters({ page: 1 }));
  }, [dispatch, onSearchChange]);

  const handleSortToggle = useCallback(() => {
    const newOrder = sortOrder === "descend" ? "ascend" : "descend";
    setSortOrder(newOrder);
    dispatch(
      setFilters({
        sort: newOrder === "descend" ? "-dateOpened" : "dateOpened",
      }),
    );
    dispatch(fetchAllAdvisoryMatters());
  }, [dispatch, sortOrder]);

  // Count active filters
  const activeFilterCount = [
    filters.status,
    filters.advisoryType,
    filters.priority,
    filters.billingType,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search by title, number, client..."
          prefix={<SearchOutlined className="text-slate-400" />}
          value={localSearch}
          onChange={handleSearchChange}
          allowClear
          className="w-full sm:w-64 lg:w-80"
          size="middle"
        />

        <Tooltip title="Toggle filters">
          <Button
            icon={<FilterOutlined />}
            onClick={onFilterToggle}
            type={filterVisible ? "primary" : "default"}
            className={filterVisible ? "bg-indigo-600 border-indigo-600" : ""}>
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-indigo-600 text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </Tooltip>

        <Tooltip title="Toggle sort order">
          <Button
            icon={
              sortOrder === "descend" ? (
                <SortDescendingOutlined />
              ) : (
                <SortAscendingOutlined />
              )
            }
            onClick={handleSortToggle}
            className="text-slate-600"
          />
        </Tooltip>

        {activeFilterCount > 0 && (
          <Tooltip title="Clear all filters">
            <Button
              icon={<ClearOutlined />}
              onClick={handleReset}
              className="text-slate-600">
              <span className="hidden sm:inline">Clear</span>
            </Button>
          </Tooltip>
        )}
      </div>

      {/* Expanded Filters */}
      {filterVisible && (
        <div className="pt-3 border-t border-slate-100">
          <Space wrap size={[8, 8]}>
            <Select
              placeholder="Status"
              allowClear
              style={{ minWidth: 130 }}
              value={filters.status || undefined}
              onChange={(v) => handleFilterChange("status", v ?? "")}
              className="[&_.ant-select-selector]:rounded-lg">
              {ADVISORY_STATUS_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Advisory Type"
              allowClear
              style={{ minWidth: 160 }}
              value={filters.advisoryType || undefined}
              onChange={(v) => handleFilterChange("advisoryType", v ?? "")}
              className="[&_.ant-select-selector]:rounded-lg">
              {ADVISORY_TYPE_OPTIONS.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Priority"
              allowClear
              style={{ minWidth: 120 }}
              onChange={(v) => handleFilterChange("priority", v ?? "")}
              className="[&_.ant-select-selector]:rounded-lg">
              <Option value="high">High</Option>
              <Option value="medium">Medium</Option>
              <Option value="low">Low</Option>
            </Select>

            <Select
              placeholder="Billing Type"
              allowClear
              style={{ minWidth: 130 }}
              onChange={(v) => handleFilterChange("billingType", v ?? "")}
              className="[&_.ant-select-selector]:rounded-lg">
              <Option value="fixed">Fixed</Option>
              <Option value="hourly">Hourly</Option>
              <Option value="retainer">Retainer</Option>
            </Select>

            <Select
              placeholder="Setup Status"
              allowClear
              style={{ minWidth: 140 }}
              onChange={(v) => handleFilterChange("hasDetail", v ?? "")}
              className="[&_.ant-select-selector]:rounded-lg">
              <Option value="true">Setup Complete</Option>
              <Option value="false">Pending Setup</Option>
            </Select>
          </Space>
        </div>
      )}
    </div>
  );
};

export default AdvisoryFiltersBar;
