import { useEffect, useState, useMemo } from "react";
import { Space, Table, Button, Modal, Tooltip, Tag, Progress } from "antd";
import {
  DeleteOutlined,
  ReloadOutlined,
  TrophyOutlined,
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
import CreateLeaveBalanceForm from "../components/CreateLeaveBalanceForm";

const { Column, ColumnGroup } = Table;

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
  useEffect(() => {
    if (leaveBalance?.data && Array.isArray(leaveBalance.data)) {
      setSearchResults(leaveBalance.data);
    } else if (
      leaveBalance?.data?.leaveBalances &&
      Array.isArray(leaveBalance.data.leaveBalances)
    ) {
      // Handle nested data structure
      setSearchResults(leaveBalance.data.leaveBalances);
    } else {
      setSearchResults([]);
    }
  }, [leaveBalance?.data]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm) => {
        const dataArray = Array.isArray(leaveBalance?.data)
          ? leaveBalance.data
          : leaveBalance?.data?.leaveBalances || [];

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
      toast.success("Leave balance deleted successfully");
    } catch (error) {
      toast.error("Failed to delete leave balance");
    }
  };

  // Get progress bar color based on balance
  const getBalanceColor = (balance, total = 30) => {
    const percentage = (balance / total) * 100;
    if (percentage > 60) return "#52c41a"; // green
    if (percentage > 30) return "#faad14"; // orange
    return "#f5222d"; // red
  };

  // Calculate total available leave
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

  // Columns for the table
  const columns = [
    {
      title: "Photo",
      dataIndex: ["employee", "photo"],
      key: "photo",
      width: 80,
      render: (photo) => (
        <div className="flex items-center justify-center">
          <img
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            src={photo || avatar}
            alt="Employee"
          />
        </div>
      ),
    },
    {
      title: "Employee Name",
      key: "employeeName",
      width: 200,
      render: (_, record) => (
        <div className="capitalize font-medium">
          {`${record.employee?.firstName} ${record.employee?.lastName}`}
        </div>
      ),
    },
    {
      title: "Annual Leave",
      dataIndex: "annualLeaveBalance",
      key: "annualLeaveBalance",
      width: 150,
      render: (balance) => (
        <div>
          <div className="font-semibold">{balance} days</div>
          <Progress
            percent={Math.round((balance / 30) * 100)}
            size="small"
            strokeColor={getBalanceColor(balance, 30)}
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: "Sick Leave",
      dataIndex: "sickLeaveBalance",
      key: "sickLeaveBalance",
      width: 130,
      render: (balance) => (
        <div>
          <div className="font-semibold">{balance} days</div>
          <Progress
            percent={Math.round((balance / 14) * 100)}
            size="small"
            strokeColor={getBalanceColor(balance, 14)}
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: "Maternity",
      dataIndex: "maternityLeaveBalance",
      key: "maternityLeaveBalance",
      width: 100,
      render: (balance) => (
        <Tag color={balance > 0 ? "magenta" : "default"}>{balance} days</Tag>
      ),
    },
    {
      title: "Paternity",
      dataIndex: "paternityLeaveBalance",
      key: "paternityLeaveBalance",
      width: 100,
      render: (balance) => (
        <Tag color={balance > 0 ? "purple" : "default"}>{balance} days</Tag>
      ),
    },
    {
      title: "Compassionate",
      dataIndex: "compassionateLeaveBalance",
      key: "compassionateLeaveBalance",
      width: 120,
      render: (balance) => (
        <Tag color={balance > 0 ? "orange" : "default"}>{balance} days</Tag>
      ),
    },
    {
      title: "Carry Over",
      dataIndex: "carryOverDays",
      key: "carryOverDays",
      width: 100,
      render: (days) => (
        <Tag color={days > 0 ? "blue" : "default"} icon={<TrophyOutlined />}>
          {days} days
        </Tag>
      ),
    },
    {
      title: "Total Available",
      key: "totalAvailable",
      width: 120,
      render: (_, record) => {
        const total = calculateTotalLeave(record);
        return <div className="font-bold text-green-600">{total} days</div>;
      },
    },
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      width: 80,
      render: (year) => <Tag>{year}</Tag>,
    },
  ];

  // Add action column only for admin/HR
  if (isAdminOrHr || isSuperAdmin) {
    columns.push({
      title: "Action",
      key: "action",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Delete Balance">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              loading={deleteState.isLoading}
              onClick={() => {
                Modal.confirm({
                  title: "Delete Leave Balance",
                  content:
                    "Are you sure you want to delete this leave balance? This action cannot be undone.",
                  okText: "Yes, Delete",
                  okType: "danger",
                  onOk: () => removeBalance(record.id),
                });
              }}
            />
          </Tooltip>
        </Space>
      ),
    });
  }

  // Filter leave balance based on user role
  const filteredLeaveBalance = useMemo(() => {
    const results = Array.isArray(searchResults) ? searchResults : [];

    if (isAdminOrHr) {
      return results;
    }

    return results.filter(
      (balance) => balance?.employee?._id === user?.data?._id
    );
  }, [searchResults, isAdminOrHr, user?.data?._id]);

  if (loading.leaveBalance) {
    return <LoadingSpinner />;
  }

  if (error.leaveBalance) {
    return (
      <PageErrorAlert
        errorCondition={error.leaveBalance}
        errorMessage={error.leaveBalance}
      />
    );
  }

  return (
    <div className="p-4">
      <CreateLeaveBalanceForm />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Leave Balance Overview
          {!isAdminOrHr && " - My Balance"}
        </h1>

        <div className="flex gap-2 items-center">
          <SearchBar onSearch={handleSearchChange} />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchLeaveBalance}
            title="Refresh">
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards (for non-admin users) */}
      {!isAdminOrHr && filteredLeaveBalance.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {filteredLeaveBalance.map((balance) => (
            <>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-blue-600 text-sm font-medium">
                  Annual Leave
                </div>
                <div className="text-2xl font-bold text-blue-700 mt-1">
                  {balance.annualLeaveBalance}
                </div>
                <div className="text-xs text-gray-500">days available</div>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-red-600 text-sm font-medium">
                  Sick Leave
                </div>
                <div className="text-2xl font-bold text-red-700 mt-1">
                  {balance.sickLeaveBalance}
                </div>
                <div className="text-xs text-gray-500">days available</div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-purple-600 text-sm font-medium">
                  Special Leave
                </div>
                <div className="text-2xl font-bold text-purple-700 mt-1">
                  {(balance.maternityLeaveBalance || 0) +
                    (balance.paternityLeaveBalance || 0) +
                    (balance.compassionateLeaveBalance || 0)}
                </div>
                <div className="text-xs text-gray-500">days available</div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-green-600 text-sm font-medium">
                  Total Available
                </div>
                <div className="text-2xl font-bold text-green-700 mt-1">
                  {calculateTotalLeave(balance)}
                </div>
                <div className="text-xs text-gray-500">days total</div>
              </div>
            </>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <Table
          dataSource={
            Array.isArray(filteredLeaveBalance) ? filteredLeaveBalance : []
          }
          columns={columns}
          rowKey={(record) => record._id || record.id}
          scroll={{ x: 1200 }}
          loading={loading.leaveBalance}
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} records`,
          }}
        />
      </div>
    </div>
  );
};

export default LeaveBalanceList;
