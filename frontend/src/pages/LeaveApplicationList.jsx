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
  Card,
  Row,
  Col,
  Grid,
} from "antd";
import {
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  StopOutlined,
  SearchOutlined,
  CloseOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import debounce from "lodash/debounce";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAdminHook } from "../hooks/useAdminHook";
import { deleteData } from "../redux/features/delete/deleteSlice";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import { formatDate } from "../utils/formatDate";
import avatar from "../assets/avatar.png";
import { useDataFetch } from "../hooks/useDataFetch";

const { Column } = Table;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const LeaveApplicationList = () => {
  const {
    leaveApps,
    loading: loadingLeaveApp,
    error: errorLeaveApp,
    fetchData,
  } = useDataGetterHook();

  const { dataFetcher } = useDataFetch();
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
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { user } = useSelector((state) => state.auth);
  const { isAdminOrHr } = useAdminHook();
  const dispatch = useDispatch();
  const deleteState = useSelector((state) => state.delete);
  const screens = useBreakpoint();

  useRedirectLogoutUser("/users/login");

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
    let applications = [];

    if (
      leaveApps?.data?.leaveApplications &&
      Array.isArray(leaveApps.data.leaveApplications)
    ) {
      applications = leaveApps.data.leaveApplications;
      if (leaveApps.data.totalResults) {
        setPagination((prev) => ({
          ...prev,
          total: leaveApps.data.totalResults,
        }));
      }
    } else if (Array.isArray(leaveApps?.data)) {
      applications = leaveApps.data;
      if (leaveApps.totalResults) {
        setPagination((prev) => ({
          ...prev,
          total: leaveApps.totalResults,
        }));
      }
    }

    setSearchResults(applications);
  }, [leaveApps]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((term) => {
        const dataArray = Array.isArray(leaveApps?.data)
          ? leaveApps.data
          : leaveApps?.data?.leaveApplications || [];

        if (!term) {
          setSearchResults(dataArray);
          return;
        }
        const results = dataArray.filter((d) => {
          const fullName = `${d.employee?.firstName || ""} ${
            d.employee?.lastName || ""
          }`.toLowerCase();
          return fullName.includes(term.toLowerCase());
        });
        setSearchResults(results);
      }, 300),
    [leaveApps?.data]
  );

  const handleSearchChange = (e) => {
    const term = e.target.value.trim();
    setSearchTerm(term);
    debouncedSearch(term);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      status: null,
      typeOfLeave: null,
      dateRange: null,
    });
    setPagination({ current: 1, pageSize: 10, total: 0 });
  };

  const cancelApplication = async (id, reason) => {
    try {
      await dataFetcher(`leaves/applications/${id}/cancel`, "PATCH", {
        cancellationReason: reason || "Cancelled by user",
      });
      toast.success("Leave application cancelled successfully");
      fetchLeaveApplications();
    } catch (error) {
      toast.error(error.message || "Failed to cancel leave application");
    }
  };

  const removeApplication = async (id) => {
    try {
      await dispatch(deleteData(`leaves/applications/${id}`)).unwrap();
      toast.success("Leave application deleted successfully");
      fetchLeaveApplications();
    } catch (error) {
      toast.error("Failed to delete leave application");
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      approved: "success",
      rejected: "error",
      cancelled: "default",
    };
    return colors[status] || "default";
  };

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

  // Responsive columns configuration
  const getColumns = () => {
    const baseColumns = [
      {
        title: "Photo",
        dataIndex: ["employee", "photo"],
        key: "photo",
        width: 60,
        responsive: ["sm"],
        render: (photo) => (
          <div className="flex items-center justify-center">
            <img
              className="w-8 h-8 md:w-10 md:h-10 object-cover rounded-full border border-gray-200"
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
        width: 120,
        render: (text, record) => (
          <div>
            <Link
              to={`${record.id || record._id}/details`}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm md:text-base capitalize block">
              {`${record.employee?.firstName} ${record.employee?.lastName}`}
            </Link>
            <span className="text-xs text-gray-500 md:hidden">
              {record.typeOfLeave} • {record.status}
            </span>
          </div>
        ),
      },
      {
        title: "Leave Type",
        dataIndex: "typeOfLeave",
        key: "typeOfLeave",
        width: 100,
        responsive: ["md"],
        render: (type) => (
          <Tag color={getLeaveTypeColor(type)} className="capitalize text-xs">
            {type}
          </Tag>
        ),
      },
      {
        title: "Dates",
        key: "dates",
        width: 120,
        responsive: ["sm"],
        render: (_, record) => (
          <div className="text-xs md:text-sm">
            <div className="font-medium">{formatDate(record.startDate)}</div>
            <div className="text-gray-500">to</div>
            <div className="font-medium">{formatDate(record.endDate)}</div>
          </div>
        ),
      },
      {
        title: "Start",
        dataIndex: "startDate",
        key: "startDate",
        width: 90,
        responsive: ["xs"],
        render: (date) => (
          <div className="text-xs">
            <div className="font-medium">{formatDate(date, "MMM DD")}</div>
          </div>
        ),
      },
      {
        title: "Days",
        dataIndex: "daysAppliedFor",
        key: "daysAppliedFor",
        width: 60,
        render: (days) => (
          <span className="font-semibold text-sm md:text-base">{days}d</span>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 90,
        responsive: ["sm"],
        render: (status) => (
          <Tag
            color={getStatusColor(status)}
            className="capitalize text-xs md:text-sm">
            {status}
          </Tag>
        ),
      },
      {
        title: "Applied",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 90,
        responsive: ["lg"],
        render: (date) => (
          <div className="text-xs md:text-sm">{formatDate(date, "MMM DD")}</div>
        ),
      },
      {
        title: "Action",
        key: "action",
        width: 100,
        fixed: screens.md ? "right" : false,
        render: (_, record) => (
          <Space size="small" className="flex-nowrap">
            <Tooltip title="View Details">
              <Link to={`${record.id || record._id}/details`}>
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  size="small"
                  className="bg-blue-500 text-xs"
                />
              </Link>
            </Tooltip>

            {["pending", "approved"].includes(record.status) &&
              (record.employee?._id === user?.data?._id || isAdminOrHr) && (
                <Tooltip title="Cancel">
                  <Button
                    icon={<StopOutlined />}
                    size="small"
                    className="text-xs"
                    onClick={() => {
                      Modal.confirm({
                        title: "Cancel Leave Application",
                        content:
                          "Are you sure you want to cancel this application?",
                        okText: "Yes, Cancel",
                        okType: "danger",
                        onOk: () => cancelApplication(record._id || record.id),
                      });
                    }}
                  />
                </Tooltip>
              )}

            {isAdminOrHr && (
              <Tooltip title="Delete">
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  className="text-xs"
                  loading={deleteState.isLoading}
                  onClick={() => {
                    Modal.confirm({
                      title: "Delete Leave Application",
                      content:
                        "Are you sure you want to delete this leave application?",
                      okText: "Yes, Delete",
                      okType: "danger",
                      onOk: () => removeApplication(record._id || record.id),
                    });
                  }}
                />
              </Tooltip>
            )}
          </Space>
        ),
      },
    ];

    return baseColumns.filter((col) => {
      if (!col.responsive) return true;
      const responsiveKey = col.responsive[0];
      return screens[responsiveKey];
    });
  };

  const filteredLeaveApps = useMemo(() => {
    const results = Array.isArray(searchResults) ? searchResults : [];
    if (isAdminOrHr) return results;
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
    <div className="px-2 sm:px-4 md:px-6 py-3 md:py-6">
      {/* Header */}
      <Card className="mb-4 md:mb-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
                Leave Applications
                {!isAdminOrHr && (
                  <span className="text-sm md:text-base font-normal text-gray-600 block md:inline md:ml-2">
                    - My Applications
                  </span>
                )}
              </h1>
              <div className="text-xs md:text-sm text-gray-600">
                Showing {filteredLeaveApps.length} of {pagination.total}{" "}
                applications
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchTerm && (
                  <CloseOutlined
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer"
                    onClick={() => {
                      setSearchTerm("");
                      debouncedSearch("");
                    }}
                  />
                )}
              </div>

              <div className="flex gap-2">
                {screens.md ? (
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex-1 sm:flex-none">
                    Filters
                  </Button>
                ) : (
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex-1 sm:flex-none"
                  />
                )}

                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchLeaveApplications}
                  className="flex-1 sm:flex-none">
                  {screens.sm && "Refresh"}
                </Button>
              </div>
            </div>
          </div>

          {/* Filters - Mobile drawer style */}
          {(showFilters || screens.md) && (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <Select
                  placeholder="Status"
                  allowClear
                  size={screens.md ? "middle" : "small"}
                  value={filters.status}
                  onChange={(value) => handleFilterChange("status", value)}
                  options={[
                    { label: "Pending", value: "pending" },
                    { label: "Approved", value: "approved" },
                    { label: "Rejected", value: "rejected" },
                    { label: "Cancelled", value: "cancelled" },
                  ]}
                  className="w-full"
                />

                <Select
                  placeholder="Leave Type"
                  allowClear
                  size={screens.md ? "middle" : "small"}
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
                  className="w-full"
                />

                <RangePicker
                  placeholder={["Start Date", "End Date"]}
                  size={screens.md ? "middle" : "small"}
                  onChange={(dates, dateStrings) =>
                    handleFilterChange("dateRange", dateStrings)
                  }
                  className="w-full"
                  format={screens.sm ? "YYYY-MM-DD" : "MM/DD"}
                />

                {(filters.status ||
                  filters.typeOfLeave ||
                  filters.dateRange) && (
                  <Button
                    onClick={clearFilters}
                    size={screens.md ? "middle" : "small"}
                    className="w-full">
                    Clear Filters
                  </Button>
                )}
              </div>

              {!screens.md && (
                <Button
                  type="link"
                  onClick={() => setShowFilters(false)}
                  className="w-full mt-3">
                  Close Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Stats Cards - Mobile responsive */}
      {screens.md && (
        <Row gutter={[12, 12]} className="mb-4 md:mb-6">
          <Col xs={12} sm={6}>
            <Card size="small" className="text-center">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-xl font-bold">{pagination.total}</div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="text-center">
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-xl font-bold text-yellow-600">
                {filteredLeaveApps.filter((a) => a.status === "pending").length}
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="text-center">
              <div className="text-sm text-gray-600">Approved</div>
              <div className="text-xl font-bold text-green-600">
                {
                  filteredLeaveApps.filter((a) => a.status === "approved")
                    .length
                }
              </div>
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="text-center">
              <div className="text-sm text-gray-600">Rejected</div>
              <div className="text-xl font-bold text-red-600">
                {
                  filteredLeaveApps.filter((a) => a.status === "rejected")
                    .length
                }
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Table */}
      <Card className="shadow-sm overflow-hidden">
        {!screens.md && (
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">
              {filteredLeaveApps.length} applications
            </div>
            <Button
              icon={<MenuOutlined />}
              size="small"
              onClick={() => setShowFilters(!showFilters)}
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <Table
            dataSource={
              Array.isArray(filteredLeaveApps) ? filteredLeaveApps : []
            }
            columns={getColumns()}
            rowKey={(record) => record._id || record.id}
            scroll={{ x: screens.xs ? 600 : 800 }}
            loading={loadingLeaveApp?.leaveApps}
            size={screens.md ? "middle" : "small"}
            pagination={{
              ...pagination,
              size: screens.md ? "default" : "small",
              showSizeChanger: screens.sm,
              showQuickJumper: screens.md,
              showTotal: (total) => (
                <div className="text-xs md:text-sm">
                  Total {total} applications
                </div>
              ),
              onChange: (page, pageSize) => {
                setPagination((prev) => ({ ...prev, current: page, pageSize }));
              },
            }}
            className="text-xs md:text-sm"
            rowClassName="hover:bg-gray-50"
          />
        </div>
      </Card>

      {/* Mobile quick actions */}
      {!screens.md && filteredLeaveApps.length > 0 && (
        <div className="fixed bottom-4 left-0 right-0 px-4 z-10">
          <div className="bg-white rounded-lg shadow-lg p-3 flex justify-between items-center">
            <div className="text-sm">
              <span className="font-medium">{filteredLeaveApps.length}</span>{" "}
              applications
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                size="small"
                onClick={fetchLeaveApplications}
              />
              <Button
                icon={<FilterOutlined />}
                size="small"
                onClick={() => setShowFilters(!showFilters)}>
                Filter
              </Button>
            </Space>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveApplicationList;
