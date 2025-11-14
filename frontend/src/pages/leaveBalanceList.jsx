// ============================================================================

// components/LeaveBalanceList.jsx
import { useEffect, useState, useMemo } from "react";
import {
  Space,
  Table,
  Button,
  Modal,
  Tooltip,
  Tag,
  Progress,
  Card,
  Statistic,
  notification,
} from "antd";
import {
  DeleteOutlined,
  ReloadOutlined,
  TrophyOutlined,
  UserOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import debounce from "lodash/debounce";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAdminHook } from "../hooks/useAdminHook";
import { deleteData } from "../redux/features/delete/deleteSlice";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBar from "../components/SearchBar";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import avatar from "../assets/avatar.png";

const { Column } = Table;

const LeaveBalanceList = () => {
  const { leaveBalance, loading, error, fetchData } = useDataGetterHook();
  const [searchResults, setSearchResults] = useState([]);
  const { user } = useSelector((state) => state.auth);
  const { isAdminOrHr, isSuperAdmin } = useAdminHook();
  const dispatch = useDispatch();
  const deleteState = useSelector((state) => state.delete);

  useRedirectLogoutUser("/users/login");

  // Fetch leave balance data
  const fetchLeaveBalance = async () => {
    await fetchData("leaves/balances", "leaveBalance");
  };

  useEffect(() => {
    fetchLeaveBalance();
  }, []);

  // Update search results when data changes
  // In LeaveBalanceList.jsx, replace the useEffect:

  useEffect(() => {
    if (leaveBalance?.data) {
      // Handle both single object and array responses
      let dataArray = [];

      if (Array.isArray(leaveBalance.data)) {
        dataArray = leaveBalance.data;
      } else if (leaveBalance.data.leaveBalance) {
        // Handle single object response
        dataArray = [leaveBalance.data.leaveBalance];
      } else if (Array.isArray(leaveBalance.data.data)) {
        // Handle array in data property
        dataArray = leaveBalance.data.data;
      }

      setSearchResults(dataArray);
    } else {
      setSearchResults([]);
    }
  }, [leaveBalance?.data]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm) => {
        // Extract data array using the same logic
        let dataArray = [];
        if (Array.isArray(leaveBalance?.data)) {
          dataArray = leaveBalance.data;
        } else if (leaveBalance?.data?.leaveBalance) {
          dataArray = [leaveBalance.data.leaveBalance];
        } else if (Array.isArray(leaveBalance?.data?.data)) {
          dataArray = leaveBalance.data.data;
        }

        if (!searchTerm) {
          setSearchResults(dataArray);
          return;
        }

        const results = dataArray.filter((d) => {
          const fullName = `${d.employee?.firstName || ""} ${
            d.employee?.lastName || ""
          }`.toLowerCase();
          const employeeId = d.employee?.employeeId?.toLowerCase() || "";
          const department = d.employee?.department?.toLowerCase() || "";

          return (
            fullName.includes(searchTerm.toLowerCase()) ||
            employeeId.includes(searchTerm.toLowerCase()) ||
            department.includes(searchTerm.toLowerCase())
          );
        });
        setSearchResults(results);
      }, 300),
    [leaveBalance?.data]
  );

  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value.trim());
  };

  // Delete leave balance
  const removeBalance = async (id) => {
    try {
      await dispatch(deleteData(`leaves/balances/${id}`)).unwrap();
      await fetchLeaveBalance();
      notification.success({
        message: "Success",
        description: "Leave balance deleted successfully",
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to delete leave balance",
      });
    }
  };

  // Get progress bar color based on balance
  const getBalanceColor = (balance, total = 30) => {
    const percentage = (balance / total) * 100;
    if (percentage > 60) return "#52c41a"; // green
    if (percentage > 30) return "#faad14"; // orange
    return "#f5222d"; // red
  };

  // Calculate total available leave (matches backend virtual field)
  const calculateTotalLeave = (record) => {
    return (
      (record.annualLeaveBalance || 0) +
      (record.sickLeaveBalance || 0) +
      (record.maternityLeaveBalance || 0) +
      (record.paternityLeaveBalance || 0) +
      (record.compassionateLeaveBalance || 0) +
      (record.carryOverDays || 0)
    );
  };

  // Get leave type color
  const getLeaveTypeColor = (type) => {
    const colors = {
      annual: "blue",
      sick: "orange",
      maternity: "magenta",
      paternity: "purple",
      compassionate: "red",
      casual: "green",
      unpaid: "gray",
    };
    return colors[type] || "default";
  };

  // Statistics for admin view
  const summaryStats = useMemo(() => {
    if (!searchResults.length) return null;

    const dataArray = Array.isArray(searchResults) ? searchResults : [];

    return {
      totalEmployees: dataArray.length,
      totalAnnualLeave: dataArray.reduce(
        (sum, item) => sum + (item.annualLeaveBalance || 0),
        0
      ),
      totalSickLeave: dataArray.reduce(
        (sum, item) => sum + (item.sickLeaveBalance || 0),
        0
      ),
      averageAnnual: Math.round(
        dataArray.reduce(
          (sum, item) => sum + (item.annualLeaveBalance || 0),
          0
        ) / dataArray.length
      ),
      lowBalanceCount: dataArray.filter(
        (item) => (item.annualLeaveBalance || 0) < 5
      ).length,
    };
  }, [searchResults]);

  // Filter data based on user role
  const filteredLeaveBalance = useMemo(() => {
    const dataArray = Array.isArray(searchResults) ? searchResults : [];

    if (isAdminOrHr) {
      return dataArray;
    } else {
      return dataArray.filter(
        (balance) => balance?.employee?._id === user?.data?._id
      );
    }
  }, [searchResults, isAdminOrHr, user?.data?._id]);

  // Columns for the table
  const columns = [
    {
      title: "Employee",
      key: "employee",
      fixed: "left",
      width: 220,
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <img
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
            src={record.employee?.photo || avatar}
            alt="Employee"
          />
          <div>
            <div className="font-semibold capitalize">
              {record.employee?.firstName} {record.employee?.lastName}
            </div>
            <div className="text-xs text-gray-500">
              {record.employee?.employeeId} • {record.employee?.department}
            </div>
            <div className="text-xs text-gray-400">
              Year: {record.year || new Date().getFullYear()}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Annual Leave",
      dataIndex: "annualLeaveBalance",
      key: "annualLeaveBalance",
      width: 160,
      sorter: (a, b) =>
        (a.annualLeaveBalance || 0) - (b.annualLeaveBalance || 0),
      render: (balance) => (
        <div className="text-center">
          <div className="font-bold text-lg text-blue-600">{balance || 0}</div>
          <div className="text-xs text-gray-500 mb-1">days</div>
          <Progress
            percent={Math.round(((balance || 0) / 30) * 100)}
            size="small"
            strokeColor={getBalanceColor(balance || 0, 30)}
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: "Sick Leave",
      dataIndex: "sickLeaveBalance",
      key: "sickLeaveBalance",
      width: 140,
      sorter: (a, b) => (a.sickLeaveBalance || 0) - (b.sickLeaveBalance || 0),
      render: (balance) => (
        <div className="text-center">
          <div className="font-bold text-lg text-orange-600">
            {balance || 0}
          </div>
          <div className="text-xs text-gray-500 mb-1">days</div>
          <Progress
            percent={Math.round(((balance || 0) / 14) * 100)}
            size="small"
            strokeColor={getBalanceColor(balance || 0, 14)}
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: "Maternity",
      dataIndex: "maternityLeaveBalance",
      key: "maternityLeaveBalance",
      width: 110,
      render: (balance) => (
        <div className="text-center">
          <Tag color="magenta" className="w-full justify-center">
            <MedicineBoxOutlined /> {balance || 0}
          </Tag>
        </div>
      ),
    },
    {
      title: "Paternity",
      dataIndex: "paternityLeaveBalance",
      key: "paternityLeaveBalance",
      width: 110,
      render: (balance) => (
        <div className="text-center">
          <Tag color="purple" className="w-full justify-center">
            <UserOutlined /> {balance || 0}
          </Tag>
        </div>
      ),
    },
    {
      title: "Compassionate",
      dataIndex: "compassionateLeaveBalance",
      key: "compassionateLeaveBalance",
      width: 130,
      render: (balance) => (
        <div className="text-center">
          <Tag color="red" className="w-full justify-center">
            <HeartOutlined /> {balance || 0}
          </Tag>
        </div>
      ),
    },
    {
      title: "Carry Over",
      dataIndex: "carryOverDays",
      key: "carryOverDays",
      width: 120,
      sorter: (a, b) => (a.carryOverDays || 0) - (b.carryOverDays || 0),
      render: (days) => (
        <div className="text-center">
          <Tag color="blue" className="w-full justify-center">
            <TrophyOutlined /> {days || 0} days
          </Tag>
        </div>
      ),
    },
    {
      title: "Total Available",
      key: "totalAvailableLeave",
      width: 140,
      sorter: (a, b) => calculateTotalLeave(a) - calculateTotalLeave(b),
      render: (_, record) => {
        const total = calculateTotalLeave(record);
        return (
          <div className="text-center">
            <div
              className={`font-bold text-lg ${
                total > 100
                  ? "text-green-600"
                  : total > 50
                  ? "text-blue-600"
                  : "text-orange-600"
              }`}>
              {total}
            </div>
            <div className="text-xs text-gray-500">days</div>
          </div>
        );
      },
    },
    {
      title: "Last Updated",
      dataIndex: "lastUpdated",
      key: "lastUpdated",
      width: 120,
      render: (date) => (
        <div className="text-xs text-gray-500 text-center">
          {date ? new Date(date).toLocaleDateString() : "N/A"}
        </div>
      ),
    },
    ...(isAdminOrHr || isSuperAdmin
      ? [
          {
            title: "Actions",
            key: "actions",
            fixed: "right",
            width: 100,
            render: (_, record) => (
              <Space size="small">
                <Tooltip title="Delete Balance">
                  <Button
                    size="small"
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    loading={deleteState.isLoading}
                    onClick={() => {
                      Modal.confirm({
                        title: "Delete Leave Balance",
                        content: `Are you sure you want to delete leave balance for ${record.employee?.firstName} ${record.employee?.lastName}? This action cannot be undone.`,
                        okText: "Yes, Delete",
                        okType: "danger",
                        cancelText: "Cancel",
                        onOk: () => removeBalance(record._id || record.id),
                      });
                    }}
                  />
                </Tooltip>
              </Space>
            ),
          },
        ]
      : []),
  ];

  if (loading.leaveBalance) {
    return <LoadingSpinner />;
  }

  // return
  <>
    {error.leaveBalance ? (
      <PageErrorAlert
        errorCondition={error.leaveBalance}
        errorMessage={error.leaveBalance}
      />
    ) : (
      <div className="space-y-6">
        {/* Summary Statistics - Only for Admin/HR */}
        {isAdminOrHr && summaryStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card size="small">
              <Statistic
                title="Total Employees"
                value={summaryStats.totalEmployees}
                prefix={<UserOutlined className="text-blue-500" />}
              />
            </Card>
            <Card size="small">
              <Statistic
                title="Total Annual Leave"
                value={summaryStats.totalAnnualLeave}
                suffix="days"
                prefix={<CalendarOutlined className="text-green-500" />}
              />
            </Card>
            <Card size="small">
              <Statistic
                title="Total Sick Leave"
                value={summaryStats.totalSickLeave}
                suffix="days"
                prefix={<MedicineBoxOutlined className="text-orange-500" />}
              />
            </Card>
            <Card size="small">
              <Statistic
                title="Avg Annual Leave"
                value={summaryStats.averageAnnual}
                suffix="days"
                prefix={<TrophyOutlined className="text-purple-500" />}
              />
            </Card>
            <Card size="small">
              <Statistic
                title="Low Balance"
                value={summaryStats.lowBalanceCount}
                suffix="employees"
                prefix={<HeartOutlined className="text-red-500" />}
              />
            </Card>
          </div>
        )}

        <Card
          title={
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Staff Leave Balances
                </h1>
                <p className="text-gray-600 text-sm">
                  {filteredLeaveBalance.length} employee(s) found • Year:{" "}
                  {new Date().getFullYear()}
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <SearchBar
                  onSearch={handleSearchChange}
                  placeholder="Search by name, ID, or department..."
                  className="min-w-[250px]"
                />
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchLeaveBalance}
                  loading={loading.leaveBalance}
                  type="default">
                  Refresh
                </Button>
              </div>
            </div>
          }
          className="shadow-sm">
          <Table
            columns={columns}
            dataSource={filteredLeaveBalance || []}
            scroll={{ x: 1300 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            rowKey={(record) => record._id || record.id}
            loading={loading.leaveBalance}
            size="middle"
            className="leave-balance-table"
          />
        </Card>

        {/* Quick Tips */}
        {!isAdminOrHr && filteredLeaveBalance.length > 0 && (
          <Card size="small" className="bg-blue-50 border-blue-200">
            <div className="text-sm text-blue-700">
              <strong>Note:</strong> Your leave balances are updated
              automatically when leaves are approved. Contact HR if you notice
              any discrepancies in your balance.
            </div>
          </Card>
        )}
      </div>
    )}
  </>;
};

export default LeaveBalanceList;
