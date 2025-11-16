import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Space,
  Table,
  Button,
  Modal,
  Tooltip,
  Tag,
  Select,
  DatePicker,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import debounce from "lodash/debounce";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAdminHook } from "../hooks/useAdminHook";
import { deleteData } from "../redux/features/delete/deleteSlice";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBar from "../components/SearchBar";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import { formatDate } from "../utils/formatDate";
import avatar from "../assets/avatar.png";

const { Column, ColumnGroup } = Table;
const { RangePicker } = DatePicker;

const LeaveApplicationList = () => {
  const {
    leaveApps,
    loading: loadingLeaveApp,
    error: errorLeaveApp,
    fetchData,
  } = useDataGetterHook();

  const [searchResults, setSearchResults] = useState([]);
  const [filters, setFilters] = useState({
    status: null,
    typeOfLeave: null,
    dateRange: null,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const { user } = useSelector((state) => state.auth);
  const { isAdminOrHr } = useAdminHook();
  const dispatch = useDispatch();
  const deleteState = useSelector((state) => state.delete);

  useRedirectLogoutUser("/users/login");

  // Debug logging
  useEffect(() => {
    console.log("LeaveApps Raw Data:", leaveApps);
    console.log("Is Array?:", Array.isArray(leaveApps?.data));
    console.log("Data Type:", typeof leaveApps?.data);
  }, [leaveApps]);

  // Fetch leave applications
  const fetchLeaveApplications = async () => {
    const params = new URLSearchParams({
      page: pagination.current,
      limit: pagination.pageSize,
    });

    if (filters.status) params.append("status", filters.status);
    if (filters.typeOfLeave) params.append("typeOfLeave", filters.typeOfLeave);
    if (filters.dateRange) {
      params.append("startDate", filters.dateRange[0]);
      params.append("endDate", filters.dateRange[1]);
    }

    await fetchData(`leaves/applications?${params.toString()}`, "leaveApps");
  };

  useEffect(() => {
    fetchLeaveApplications();
  }, [pagination.current, pagination.pageSize, filters]);

  // Update search results when data changes
  useEffect(() => {
    if (leaveApps?.data && Array.isArray(leaveApps.data)) {
      setSearchResults(leaveApps.data);
      if (leaveApps.totalResults) {
        setPagination((prev) => ({
          ...prev,
          total: leaveApps.totalResults,
        }));
      }
    } else if (
      leaveApps?.data?.leaveApplications &&
      Array.isArray(leaveApps.data.leaveApplications)
    ) {
      // Handle nested data structure
      setSearchResults(leaveApps.data.leaveApplications);
      if (leaveApps.data.totalResults) {
        setPagination((prev) => ({
          ...prev,
          total: leaveApps.data.totalResults,
        }));
      }
    } else {
      setSearchResults([]);
    }
  }, [leaveApps]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm) => {
        const dataArray = Array.isArray(leaveApps?.data)
          ? leaveApps.data
          : leaveApps?.data?.leaveApplications || [];

        if (!searchTerm) {
          setSearchResults(dataArray);
          return;
        }
        const results = dataArray.filter((d) => {
          const fullName = `${d.employee?.firstName || ""} ${
            d.employee?.lastName || ""
          }`.toLowerCase();
          return fullName.includes(searchTerm.toLowerCase());
        });
        setSearchResults(results);
      }, 300),
    [leaveApps?.data]
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value.trim());
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: null,
      typeOfLeave: null,
      dateRange: null,
    });
    setPagination({ current: 1, pageSize: 10, total: 0 });
  };

  // Delete leave application
  const removeApplication = async (id) => {
    try {
      await dispatch(deleteData(`leaves/applications/${id}`)).unwrap();
      toast.success("Leave application deleted successfully");
      fetchLeaveApplications();
    } catch (error) {
      toast.error("Failed to delete leave application");
    }
  };

  // Get status tag color
  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      approved: "success",
      rejected: "error",
      cancelled: "default",
    };
    return colors[status] || "default";
  };

  // Get leave type color
  const getLeaveTypeColor = (type) => {
    const colors = {
      annual: "blue",
      casual: "cyan",
      sick: "red",
      maternity: "magenta",
      paternity: "purple",
      compassionate: "orange",
      unpaid: "default",
    };
    return colors[type] || "default";
  };

  // Table columns
  const columns = [
    {
      title: "Photo",
      dataIndex: ["employee", "photo"],
      key: "photo",
      width: 80,
      render: (photo) => (
        <div className="flex items-center justify-center">
          <img
            className="w-10 h-10 object-cover rounded-full border-2 border-gray-200"
            src={photo || avatar}
            alt="Employee"
          />
        </div>
      ),
    },
    {
      title: "Employee",
      dataIndex: ["employee", "firstName"],
      key: "employeeName",
      width: 180,
      render: (text, record) => (
        <Link
          to={`${record.id}/details`}
          className="text-blue-600 hover:text-blue-800 font-medium capitalize">
          {`${record.employee?.firstName} ${record.employee?.lastName}`}
        </Link>
      ),
    },
    {
      title: "Leave Type",
      dataIndex: "typeOfLeave",
      key: "typeOfLeave",
      width: 130,
      render: (type) => (
        <Tag color={getLeaveTypeColor(type)} className="capitalize">
          {type}
        </Tag>
      ),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      width: 120,
      render: (date) => formatDate(date),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      width: 120,
      render: (date) => formatDate(date),
    },
    {
      title: "Days",
      dataIndex: "daysAppliedFor",
      key: "daysAppliedFor",
      width: 80,
      render: (days) => <span className="font-semibold">{days}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="capitalize">
          {status}
        </Tag>
      ),
    },
    {
      title: "Applied On",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => formatDate(date),
    },
    {
      title: "Action",
      key: "action",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Link to={`${record.id}/details`}>
              <Button
                type="primary"
                icon={<EyeOutlined />}
                size="small"
                className="bg-blue-500"
              />
            </Link>
          </Tooltip>

          {(isAdminOrHr || record.employee?._id === user?.data?._id) && (
            <Tooltip title="Delete">
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                loading={deleteState.isLoading}
                onClick={() => {
                  Modal.confirm({
                    title: "Delete Leave Application",
                    content:
                      "Are you sure you want to delete this leave application?",
                    okText: "Yes, Delete",
                    okType: "danger",
                    onOk: () => removeApplication(record._id),
                  });
                }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Filter leave applications based on user role
  const filteredLeaveApps = useMemo(() => {
    const results = Array.isArray(searchResults) ? searchResults : [];

    if (isAdminOrHr) {
      return results;
    }

    return results.filter((app) => app?.employee?._id === user?.data?._id);
  }, [searchResults, isAdminOrHr, user?.data?._id]);

  if (loadingLeaveApp?.leaveApps) {
    return <LoadingSpinner />;
  }

  if (errorLeaveApp.leaveApps) {
    return (
      <PageErrorAlert
        errorCondition={errorLeaveApp.leaveApps}
        errorMessage={errorLeaveApp.leaveApps}
      />
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Leave Applications
          {!isAdminOrHr && " - My Applications"}
        </h1>

        <div className="flex flex-wrap gap-2 items-center">
          <SearchBar onSearch={handleSearchChange} />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchLeaveApplications}
            title="Refresh">
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-3">
          <FilterOutlined />
          <span className="font-medium">Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select
            placeholder="All Status"
            allowClear
            value={filters.status}
            onChange={(value) => handleFilterChange("status", value)}
            options={[
              { label: "Pending", value: "pending" },
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
              { label: "Cancelled", value: "cancelled" },
            ]}
          />

          <Select
            placeholder="All Leave Types"
            allowClear
            value={filters.typeOfLeave}
            onChange={(value) => handleFilterChange("typeOfLeave", value)}
            options={[
              { label: "Annual", value: "annual" },
              { label: "Casual", value: "casual" },
              { label: "Sick", value: "sick" },
              { label: "Maternity", value: "maternity" },
              { label: "Paternity", value: "paternity" },
              { label: "Compassionate", value: "compassionate" },
              { label: "Unpaid", value: "unpaid" },
            ]}
          />

          <RangePicker
            placeholder={["Start Date", "End Date"]}
            onChange={(dates, dateStrings) =>
              handleFilterChange("dateRange", dateStrings)
            }
          />

          {(filters.status || filters.typeOfLeave || filters.dateRange) && (
            <Button onClick={clearFilters}>Clear Filters</Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table
          dataSource={Array.isArray(filteredLeaveApps) ? filteredLeaveApps : []}
          columns={columns}
          rowKey={(record) => record._id || record.id}
          scroll={{ x: 1200 }}
          loading={loadingLeaveApp?.leaveApps}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} applications`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }));
            },
          }}
        />
      </div>
    </div>
  );
};

export default LeaveApplicationList;
