// components/StatusUserList.jsx
import React, { useState, memo } from "react";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Row,
  Col,
  Statistic,
  Select,
  Input,
  Pagination,
  Spin,
  Alert,
  Tabs,
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useUserStatusList } from "../hooks/useUserStatusList";
import UserListTable from "../components/UserListTable";

const { TabPane } = Tabs;
const { Option } = Select;
const { Search } = Input;

const StatusUserList = memo(() => {
  const [activeTab, setActiveTab] = useState("staff");
  const [statusFilter, setStatusFilter] = useState("active");

  const {
    users,
    loading,
    error,
    pagination,
    statistics,
    handleFilterChange,
    handlePageChange,
    refresh,
    changeStatus,
    changeUserType,
  } = useUserStatusList(activeTab, statusFilter);

  // Handle search
  const handleSearch = (value) => {
    handleFilterChange({ search: value });
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    changeUserType(tab);
  };

  // Handle status change
  const handleStatusChange = (status) => {
    setStatusFilter(status);
    changeStatus(status);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    return status === "active" ? (
      <Tag icon={<CheckCircleOutlined />} color="success" className="ml-2">
        Active
      </Tag>
    ) : (
      <Tag icon={<CloseCircleOutlined />} color="default" className="ml-2">
        Inactive
      </Tag>
    );
  };

  // Get title based on selection
  const getTitle = () => {
    const typeMap = {
      staff: "Staff Members",
      clients: "Clients",
      all: "All Users",
    };
    return `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} ${
      typeMap[activeTab]
    }`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <TeamOutlined className="text-blue-500" />
            User Status Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and monitor active/inactive users across the system
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-6 shadow-sm">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={8}>
              <div className="flex items-center gap-2">
                <span className="font-medium">Filter by:</span>
                <Select
                  value={statusFilter}
                  onChange={handleStatusChange}
                  style={{ width: 120 }}>
                  <Option value="active">
                    <CheckCircleOutlined className="text-green-500 mr-2" />
                    Active
                  </Option>
                  <Option value="inactive">
                    <CloseCircleOutlined className="text-gray-500 mr-2" />
                    Inactive
                  </Option>
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={8}>
              <Search
                placeholder="Search users..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
                loading={loading}
              />
            </Col>

            <Col xs={24} sm={8} className="text-right">
              <Button
                icon={<ReloadOutlined />}
                onClick={refresh}
                loading={loading}>
                Refresh
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Tabs for User Type */}
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          className="mb-6"
          type="card">
          <TabPane
            tab={
              <span>
                <TeamOutlined />
                Staff
              </span>
            }
            key="staff">
            {statistics?.staff && (
              <Row gutter={[16, 16]} className="mb-6">
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title="Total Staff"
                      value={statistics.staff.total}
                      prefix={<TeamOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title={`${
                        statusFilter === "active" ? "Active" : "Inactive"
                      } Staff`}
                      value={
                        statusFilter === "active"
                          ? statistics.staff.active
                          : statistics.staff.inactive
                      }
                      valueStyle={{
                        color:
                          statusFilter === "active" ? "#52c41a" : "#fa8c16",
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title="Active Rate"
                      value={`${statistics.staff.activePercentage}%`}
                      suffix="%"
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title="Page Count"
                      value={users.length}
                      suffix={`/ ${pagination.totalRecords}`}
                    />
                  </Card>
                </Col>
              </Row>
            )}
          </TabPane>

          <TabPane
            tab={
              <span>
                <UserOutlined />
                Clients
              </span>
            }
            key="clients">
            {statistics?.clients && (
              <Row gutter={[16, 16]} className="mb-6">
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title="Total Clients"
                      value={statistics.clients.total}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title={`${
                        statusFilter === "active" ? "Active" : "Inactive"
                      } Clients`}
                      value={
                        statusFilter === "active"
                          ? statistics.clients.active
                          : statistics.clients.inactive
                      }
                      valueStyle={{
                        color:
                          statusFilter === "active" ? "#52c41a" : "#fa8c16",
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title="Active Rate"
                      value={`${statistics.clients.activePercentage}%`}
                      suffix="%"
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title="Page Count"
                      value={users.length}
                      suffix={`/ ${pagination.totalRecords}`}
                    />
                  </Card>
                </Col>
              </Row>
            )}
          </TabPane>

          <TabPane
            tab={
              <span>
                <TeamOutlined />
                <UserOutlined />
                All Users
              </span>
            }
            key="all">
            {statistics?.overall && (
              <Row gutter={[16, 16]} className="mb-6">
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title="Total Users"
                      value={statistics.overall.grandTotal}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title={`${
                        statusFilter === "active" ? "Active" : "Inactive"
                      } Total`}
                      value={
                        statusFilter === "active"
                          ? statistics.overall.totalActive
                          : statistics.overall.totalInactive
                      }
                      valueStyle={{
                        color:
                          statusFilter === "active" ? "#52c41a" : "#fa8c16",
                      }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title="Overall Active Rate"
                      value={`${statistics.overall.overallActivePercentage}%`}
                      suffix="%"
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card size="small">
                    <Statistic
                      title="Page Count"
                      value={users.length}
                      suffix={`/ ${pagination.totalRecords}`}
                    />
                  </Card>
                </Col>
              </Row>
            )}
          </TabPane>
        </Tabs>

        {/* Error Display */}
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            closable
            className="mb-6"
          />
        )}

        {/* Main Content */}
        <Card
          title={
            <div className="flex items-center">
              {getTitle()}
              {getStatusBadge(statusFilter)}
              <span className="text-gray-500 text-sm font-normal ml-4">
                ({pagination.totalRecords} total)
              </span>
            </div>
          }
          className="shadow-sm"
          extra={
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
            </div>
          }>
          {loading ? (
            <div className="text-center py-12">
              <Spin size="large" tip={`Loading ${getTitle()}...`} />
            </div>
          ) : (
            <>
              <UserListTable
                dataSource={users}
                loading={false}
                showActions={true}
                showRole={activeTab !== "clients"}
                showPosition={activeTab === "staff"}
                showLawyer={activeTab === "staff"}
                userType={activeTab === "clients" ? "client" : "staff"}
                basePath={`/dashboard/${
                  activeTab === "clients" ? "clients" : "staff"
                }`}
              />

              {users.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">
                    No {statusFilter} {activeTab} found
                  </p>
                  <p className="text-sm mt-2">
                    {statusFilter === "active"
                      ? "All users are currently inactive"
                      : "All users are currently active"}
                  </p>
                </div>
              )}
            </>
          )}
        </Card>

        {/* Pagination */}
        {pagination.totalRecords > 0 && (
          <Row justify="center" className="mt-6">
            <Pagination
              current={pagination.currentPage}
              total={pagination.totalRecords}
              pageSize={pagination.limit}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} of ${total} items`
              }
              pageSizeOptions={["10", "20", "50", "100"]}
              disabled={loading}
              className="pagination-custom"
            />
          </Row>
        )}
      </div>
    </div>
  );
});

StatusUserList.displayName = "StatusUserList";
export default StatusUserList;
