import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllMattersWithOfficers } from "../redux/features/matter/matterSlice";
import { 
  Card, 
  Table, 
  Tag, 
  Avatar, 
  Input, 
  Select, 
  Button, 
  Space, 
  Skeleton, 
  Empty,
  Tooltip,
  Row,
  Col,
  Statistic
} from "antd";
import { 
  FaSearch, 
  FaFilter, 
  FaUserTie, 
  FaBriefcase,
  FaRedo,
  FaEye
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const { Search } = Input;

const getStatusColor = (status) => {
  const colors = {
    active: "green",
    pending: "orange",
    completed: "blue",
    closed: "default",
    "on-hold": "gold",
    archived: "default",
    settled: "purple",
    withdrawn: "red",
    won: "green",
    lost: "red",
  };
  return colors[status] || "default";
};

const getPriorityColor = (priority) => {
  const colors = {
    urgent: "red",
    high: "orange",
    medium: "blue",
    low: "default",
  };
  return colors[priority] || "default";
};

const AllMattersWithOfficers = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { mattersWithOfficers, officerStatistics, isLoading, pagination } = 
    useSelector((state) => state.matter);
  
  const [filters, setFilters] = useState({
    search: "",
    status: null,
    priority: null,
    matterType: null,
    officerId: null,
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    fetchMatters();
  }, [dispatch, filters]);

  const fetchMatters = () => {
    dispatch(getAllMattersWithOfficers(filters));
  };

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleTableChange = (paginationConfig) => {
    setFilters((prev) => ({
      ...prev,
      page: paginationConfig.current,
      limit: paginationConfig.pageSize,
    }));
  };

  const refreshData = () => {
    fetchMatters();
  };

  const columns = [
    {
      title: "Matter No.",
      dataIndex: "matterNumber",
      key: "matterNumber",
      width: 140,
      fixed: "left",
      render: (text, record) => (
        <div className="flex flex-col">
          <span className="font-semibold text-blue-600">{text}</span>
          <span className="text-xs text-gray-500 capitalize">{record.matterType}</span>
        </div>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (text, record) => (
        <Tooltip title={text}>
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-500">{record.natureOfMatter}</div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      width: 150,
      render: (client) => (
        client ? (
          <div>
            <div className="font-medium">
              {client.firstName} {client.lastName}
            </div>
            <div className="text-xs text-gray-500">{client.email}</div>
          </div>
        ) : (
          <span className="text-gray-400">N/A</span>
        )
      ),
    },
    {
      title: "Account Officer(s)",
      dataIndex: "accountOfficer",
      key: "accountOfficer",
      width: 200,
      render: (officers, record) => (
        <div className="flex flex-wrap gap-1">
          {officers && officers.length > 0 ? (
            officers.map((officer, idx) => (
              <Tooltip 
                key={idx} 
                title={`${officer.firstName} ${officer.lastName} - ${officer.role}`}
              >
                <Avatar
                  src={officer.photo}
                  size="small"
                  className="cursor-pointer"
                >
                  {officer.firstName?.[0]}{officer.lastName?.[0]}
                </Avatar>
              </Tooltip>
            ))
          ) : (
            <Tag color="default">Unassigned</Tag>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)} className="uppercase text-xs">
          {status}
        </Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)} className="uppercase text-xs">
          {priority}
        </Tag>
      ),
    },
    {
      title: "Date Opened",
      dataIndex: "dateOpened",
      key: "dateOpened",
      width: 120,
      render: (date) => (
        <span className="text-sm">
          {date ? new Date(date).toLocaleDateString() : "N/A"}
        </span>
      ),
    },
    {
      title: "Expected Closure",
      dataIndex: "expectedClosureDate",
      key: "expectedClosureDate",
      width: 120,
      render: (date) => (
        <span className="text-sm">
          {date ? new Date(date).toLocaleDateString() : "N/A"}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      fixed: "right",
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="text"
            icon={<FaEye />}
            onClick={() => navigate(`/cases/${record._id}`)}
            className="text-blue-600 hover:text-blue-800"
          />
        </Tooltip>
      ),
    },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "pending", label: "Pending" },
    { value: "completed", label: "Completed" },
    { value: "closed", label: "Closed" },
    { value: "on-hold", label: "On Hold" },
    { value: "archived", label: "Archived" },
  ];

  const priorityOptions = [
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const matterTypeOptions = [
    { value: "litigation", label: "Litigation" },
    { value: "corporate", label: "Corporate" },
    { value: "advisory", label: "Advisory" },
    { value: "retainer", label: "Retainer" },
    { value: "property", label: "Property" },
    { value: "general", label: "General" },
  ];

  const officerOptions = officerStatistics.map((officer) => ({
    value: officer.officerId,
    label: officer.officerName,
  }));

  const totalMatters = mattersWithOfficers?.length || 0;
  const activeOfficers = officerStatistics?.length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            All Matters with Account Officers
          </h1>
          <p className="text-gray-500 mt-1">
            View all matters and their assigned account officers
          </p>
        </div>
        <Button 
          icon={<FaRedo />} 
          onClick={refreshData}
          loading={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl shadow-md">
            <Statistic
              title="Total Matters"
              value={totalMatters}
              prefix={<FaBriefcase className="mr-2 text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl shadow-md">
            <Statistic
              title="Active Officers"
              value={activeOfficers}
              prefix={<FaUserTie className="mr-2 text-green-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl shadow-md">
            <Statistic
              title="Active Matters"
              value={mattersWithOfficers?.filter(m => m.status === "active").length || 0}
              prefix={<Tag color="green">Active</Tag>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="rounded-xl shadow-md">
            <Statistic
              title="Pending Matters"
              value={mattersWithOfficers?.filter(m => m.status === "pending").length || 0}
              prefix={<Tag color="orange">Pending</Tag>}
            />
          </Card>
        </Col>
      </Row>

      {/* Officer Statistics */}
      {officerStatistics && officerStatistics.length > 0 && (
        <Card 
          className="rounded-xl shadow-md" 
          title={
            <span className="flex items-center gap-2">
              <FaUserTie /> Account Officer Workload
            </span>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {officerStatistics.map((officer, idx) => (
              <div 
                key={idx}
                className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => handleFilterChange("officerId", officer.officerId)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar src={officer.officerPhoto} size="large">
                    {officer.officerName?.[0]}
                  </Avatar>
                  <div>
                    <div className="font-semibold">{officer.officerName}</div>
                    <div className="text-xs text-gray-500">
                      {officer.officerPosition || officer.officerRole}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {officer.matterCount}
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {officer.activeCount}
                    </div>
                    <div className="text-xs text-gray-500">Active</div>
                  </div>
                  <div className="bg-white p-2 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {officer.completedCount}
                    </div>
                    <div className="text-xs text-gray-500">Done</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="rounded-xl shadow-md">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm text-gray-600 mb-1 block">Search</label>
            <Search
              placeholder="Search by matter number or title..."
              allowClear
              prefix={<FaSearch className="text-gray-400" />}
              onSearch={handleSearch}
              className="w-full"
            />
          </div>
          <div className="w-40">
            <label className="text-sm text-gray-600 mb-1 block">Status</label>
            <Select
              placeholder="All Status"
              allowClear
              style={{ width: "100%" }}
              options={statusOptions}
              value={filters.status}
              onChange={(value) => handleFilterChange("status", value)}
            />
          </div>
          <div className="w-40">
            <label className="text-sm text-gray-600 mb-1 block">Priority</label>
            <Select
              placeholder="All Priority"
              allowClear
              style={{ width: "100%" }}
              options={priorityOptions}
              value={filters.priority}
              onChange={(value) => handleFilterChange("priority", value)}
            />
          </div>
          <div className="w-40">
            <label className="text-sm text-gray-600 mb-1 block">Type</label>
            <Select
              placeholder="All Types"
              allowClear
              style={{ width: "100%" }}
              options={matterTypeOptions}
              value={filters.matterType}
              onChange={(value) => handleFilterChange("matterType", value)}
            />
          </div>
          <div className="w-48">
            <label className="text-sm text-gray-600 mb-1 block">Account Officer</label>
            <Select
              placeholder="All Officers"
              allowClear
              showSearch
              style={{ width: "100%" }}
              options={officerOptions}
              value={filters.officerId}
              onChange={(value) => handleFilterChange("officerId", value)}
              optionFilterProp="label"
            />
          </div>
          <Button 
            icon={<FaFilter />} 
            onClick={() => setFilters({
              search: "",
              status: null,
              priority: null,
              matterType: null,
              officerId: null,
              page: 1,
              limit: 20,
            })}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Matters Table */}
      <Card className="rounded-xl shadow-md">
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 10 }} />
        ) : mattersWithOfficers && mattersWithOfficers.length > 0 ? (
          <Table
            dataSource={mattersWithOfficers}
            columns={columns}
            rowKey="_id"
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total: pagination?.total || mattersWithOfficers.length,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ["10", "20", "50", "100"],
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} matters`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            className="mt-4"
            onRow={(record) => ({
              onClick: () => navigate(`/cases/${record._id}`),
              className: "cursor-pointer hover:bg-gray-50",
            })}
          />
        ) : (
          <Empty 
            description="No matters found" 
            className="py-12"
          >
            <Button 
              type="primary" 
              onClick={() => navigate('/cases/new')}
            >
              Create New Matter
            </Button>
          </Empty>
        )}
      </Card>
    </div>
  );
};

export default AllMattersWithOfficers;
