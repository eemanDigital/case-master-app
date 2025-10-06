// Updated StaffList.js - Enhanced for User schema
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Space,
  Table,
  Button,
  Modal,
  Tooltip,
  Pagination,
  Row,
  Card,
  Tag,
} from "antd";
import avatar from "../assets/avatar.png";
import CreateLeaveBalanceForm from "../components/CreateLeaveBalanceForm";
import { DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
import { PlusOutlined } from "@ant-design/icons";
import StaffSearchBar from "../components/StaffSearchBar";
import { deleteUser, getUsers } from "../redux/features/auth/authSlice";
import { useAdminHook } from "../hooks/useAdminHook";
import ButtonWithIcon from "../components/ButtonWithIcon";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import EventList from "./EventList";
import { useDataFetch } from "../hooks/useDataFetch";

const StaffList = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const dispatch = useDispatch();
  const { isError, users, message, loading } = useSelector(
    (state) => state.auth
  );
  const { dataFetcher } = useDataFetch();

  const { Column, ColumnGroup } = Table;
  const { isAdminOrHr, isSuperOrAdmin } = useAdminHook();
  useRedirectLogoutUser("/users/login");

  // Build query string for API calls
  const buildQueryString = (filters, pagination) => {
    const params = new URLSearchParams();

    // Add pagination
    params.append("page", pagination.current);
    params.append("limit", pagination.limit);

    // Add filters
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== "") {
        if (Array.isArray(value)) {
          value.forEach((item) => params.append(key, item));
        } else {
          params.append(key, value);
        }
      }
    });

    return params.toString();
  };

  // Fetch users with filters
  const fetchUsers = async (newFilters = filters, page = currentPage) => {
    try {
      const queryString = buildQueryString(newFilters, {
        current: page,
        limit: itemsPerPage,
      });
      const url = queryString ? `users?${queryString}` : "users";

      const result = await dataFetcher(url, "GET");

      if (result && !result.error) {
        setSearchResults(result.data || []);

        if (result.pagination) {
          setCurrentPage(result.pagination.current || 1);
          setItemsPerPage(result.pagination.limit || 10);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      // Fallback to Redux if API fails
      dispatch(getUsers());
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search results from API
  useEffect(() => {
    if (users?.data && !filters.search) {
      setSearchResults(users.data);
    }
  }, [users?.data, filters.search]);

  // Handle advanced filter changes
  const handleFiltersChange = async (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    await fetchUsers(newFilters, 1);
  };

  // Reset all filters
  const resetFilters = async () => {
    setFilters({});
    setCurrentPage(1);
    await fetchUsers({}, 1);
  };

  // Remove user with refresh
  const removeUser = async (id) => {
    await dispatch(deleteUser(id));
    await fetchUsers();
  };

  // Filter user data to get staff alone (exclude clients)
  const staffList = searchResults?.filter(
    (user) => user?.role !== "client" && user?.role !== "user"
  );

  // Handle pagination change
  const handlePageChange = async (page, pageSize) => {
    setCurrentPage(page);
    setItemsPerPage(pageSize);
    await fetchUsers(filters, page);
  };

  // Helper function to get role color
  const getRoleColor = (role) => {
    switch (role) {
      case "super-admin":
        return "red";
      case "admin":
        return "orange";
      case "hr":
        return "purple";
      case "lawyer":
        return "blue";
      case "secretary":
        return "green";
      default:
        return "gray";
    }
  };

  return (
    <>
      <div className="flex md:flex-row flex-col justify-between items-center gap-3 my-4">
        {isAdminOrHr && (
          <div className="flex gap-2">
            <Link to="add-user">
              <ButtonWithIcon
                onClick={() => {}}
                icon={<PlusOutlined className="mr-2" />}
                text="Add User"
              />
            </Link>
            {/* <CreateLeaveBalanceForm /> */}
          </div>
        )}

        {/* <EventList /> */}

        <div className="w-full md:w-96">
          <StaffSearchBar
            onFiltersChange={handleFiltersChange}
            filters={filters}
            loading={loading}
            searchPlaceholder="Search staff by name, email, position..."
            showUserFilters={true}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {Object.keys(filters).length > 0 && (
        <Card size="small" className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {Object.keys(filters).map(
              (key) =>
                filters[key] && (
                  <Tag
                    key={key}
                    closable
                    onClose={() => {
                      const newFilters = { ...filters };
                      delete newFilters[key];
                      handleFiltersChange(newFilters);
                    }}
                    className="bg-blue-100 border-blue-300">
                    {key === "search"
                      ? `Search: ${filters[key]}`
                      : key === "role"
                      ? `Role: ${filters[key]}`
                      : key === "isActive"
                      ? `Status: ${
                          filters[key] === "true" ? "Active" : "Inactive"
                        }`
                      : key === "isLawyer"
                      ? `Lawyer: ${filters[key] === "true" ? "Yes" : "No"}`
                      : key === "position"
                      ? `Position: ${filters[key]}`
                      : key === "gender"
                      ? `Gender: ${filters[key]}`
                      : `${key}: ${filters[key]}`}
                  </Tag>
                )
            )}
            <Button
              type="link"
              size="small"
              onClick={resetFilters}
              icon={<ReloadOutlined />}
              className="p-0 h-auto">
              Clear all
            </Button>
          </div>
        </Card>
      )}

      {isError ? (
        <PageErrorAlert errorCondition={isError} errorMessage={message} />
      ) : (
        <>
          <div className="overflow-x-auto font-medium font-poppins">
            <Table
              dataSource={staffList}
              scroll={{ x: 800 }}
              loading={loading}
              pagination={false}
              rowKey="_id">
              <ColumnGroup title="Employee Details">
                <Column
                  title="Photo"
                  dataIndex="photo"
                  key="photo"
                  width={80}
                  render={(photo) => (
                    <div className="flex items-center justify-center">
                      <img
                        className="w-10 h-10 object-cover rounded-full"
                        src={photo || avatar}
                        alt="staff"
                      />
                    </div>
                  )}
                />
                <Column
                  title="Name"
                  key="name"
                  width={200}
                  render={(text, record) => (
                    <Tooltip title="Click for details">
                      <Link
                        className="text-md font-bold capitalize text-blue-600 hover:text-blue-800 cursor-pointer flex items-center"
                        to={`/dashboard/staff/${record?._id}/details`}>
                        {`${record.firstName} ${record.lastName}`}
                        {record.middleName && ` ${record.middleName}`}
                      </Link>
                    </Tooltip>
                  )}
                />
                <Column
                  title="Email"
                  dataIndex="email"
                  key="email"
                  width={200}
                />
              </ColumnGroup>

              <Column
                title="Role"
                dataIndex="role"
                key="role"
                width={120}
                render={(role) => (
                  <Tag color={getRoleColor(role)} className="capitalize">
                    {role?.replace("-", " ")}
                  </Tag>
                )}
              />

              <Column
                title="Position"
                dataIndex="position"
                key="position"
                width={150}
                render={(position) => position || "N/A"}
              />

              <Column
                title="Lawyer"
                dataIndex="isLawyer"
                key="isLawyer"
                width={100}
                render={(isLawyer) => (
                  <Tag color={isLawyer ? "green" : "orange"}>
                    {isLawyer ? "Yes" : "No"}
                  </Tag>
                )}
              />

              <Column
                title="Status"
                dataIndex="isActive"
                key="isActive"
                width={100}
                render={(isActive) => (
                  <Tag
                    color={isActive ? "green" : "red"}
                    className="capitalize">
                    {isActive ? "Active" : "Inactive"}
                  </Tag>
                )}
              />

              <Column
                title="Action"
                key="action"
                width={120}
                fixed="right"
                render={(text, record) => (
                  <Space size="small">
                    {isSuperOrAdmin && (
                      <Tooltip title="Delete Staff">
                        <Button
                          icon={<DeleteOutlined />}
                          className="bg-red-200 text-red-500 hover:text-red-700"
                          onClick={() => {
                            Modal.confirm({
                              title:
                                "Are you sure you want to delete this user?",
                              onOk: () =>
                                removeUser(`soft-delete/${record._id}`),
                            });
                          }}
                          size="small"
                        />
                      </Tooltip>
                    )}
                  </Space>
                )}
              />
            </Table>
          </div>

          {/* Pagination */}
          {(users?.pagination?.totalRecords > 0 || staffList.length > 0) && (
            <Row justify="center" style={{ marginTop: 16 }}>
              <Pagination
                current={currentPage}
                total={users?.pagination?.totalRecords || staffList.length}
                pageSize={itemsPerPage}
                onChange={handlePageChange}
                onShowSizeChange={handlePageChange}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) =>
                  `Showing ${range[0]}-${range[1]} of ${total} staff members`
                }
                pageSizeOptions={["10", "20", "50", "100"]}
              />
            </Row>
          )}
        </>
      )}
    </>
  );
};

export default StaffList;
