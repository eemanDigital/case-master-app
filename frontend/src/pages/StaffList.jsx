import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Space, Table, Button, Modal } from "antd";
import avatar from "../assets/avatar.png";
import LeaveBalanceList from "./leaveBalanceList";
import CreateLeaveBalanceForm from "../components/CreateLeaveBalanceForm";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBar from "../components/SearchBar";
import { deleteUser, getUsers } from "../redux/features/auth/authSlice";
import { useAdminHook } from "../hooks/useAdminHook";

const StaffList = () => {
  const [searchResults, setSearchResults] = useState([]);
  const dispatch = useDispatch();
  const { isSuccess, isError, isLoading, users } = useSelector(
    (state) => state.auth
  );

  const { Column, ColumnGroup } = Table;
  const { isAdminOrHr, isAdmin, isSuperOrAdmin } = useAdminHook();

  // fetch users
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  // render all cases initially before filter
  useEffect(() => {
    if (users?.data) {
      setSearchResults(users?.data);
    }
  }, [users?.data]); // Only depend on users.data to avoid unnecessary re-renders

  // handles search filter
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();

    if (!searchTerm) {
      setSearchResults(users?.data);
      return;
    }

    const results = users?.data.filter((d) => {
      const usernameMatch = d.fullName.toLowerCase().includes(searchTerm);
      const roleMatch = d.role?.toLowerCase().includes(searchTerm);
      const emailMatch = d.email?.toLowerCase().includes(searchTerm);
      const positionMatch = d.position?.toLowerCase().includes(searchTerm);
      return usernameMatch || emailMatch || positionMatch || roleMatch;
    });
    setSearchResults(results);
  };

  const removeUser = async (id) => {
    await dispatch(deleteUser(id));
    await dispatch(getUsers());
  };

  return (
    <>
      <div className="flex md:flex-row flex-col justify-between items-center gap-3 my-4">
        {isAdminOrHr && (
          <>
            <Link to="add-user">
              <Button className="blue-btn">Add User</Button>
            </Link>
            <Link to="leave-application-list">
              <Button className="blue-btn">
                {isAdminOrHr
                  ? "Manage Leave Applications"
                  : "Your Leave Applications"}
              </Button>
            </Link>
            <CreateLeaveBalanceForm /> <LeaveBalanceList />
          </>
        )}

        <SearchBar onSearch={handleSearchChange} />
      </div>

      <Table dataSource={searchResults}>
        <ColumnGroup title="Employee's Name">
          <Column
            title="Photo"
            dataIndex="photo"
            key="photo"
            render={(photo) => (
              <div className="flex items-center justify-center">
                <img
                  className="w-12 h-12 object-cover rounded-full"
                  src={photo ? photo : avatar}
                  alt="staff"
                />
              </div>
            )}
          />

          <Column title="First Name" dataIndex="firstName" key="firstName" />
          <Column title="Last Name" dataIndex="lastName" key="lastName" />
        </ColumnGroup>

        <Column title="Email" dataIndex="email" key="email" />
        <Column title="Role" dataIndex="role" key="role" />
        <Column title="Position" dataIndex="position" key="position" />

        <Column
          title="Action"
          key="action"
          render={(text, record) => (
            <Space size="middle">
              <Button type="link">
                <Link to={`/dashboard/staff/${record?._id}/details`}>
                  Get Details
                </Link>
              </Button>
              {isSuperOrAdmin && (
                <Button
                  onClick={() => {
                    Modal.confirm({
                      title: "Are you sure you want to delete this user?",
                      onOk: () => removeUser(record._id),
                    });
                  }}
                  type="primary"
                  danger>
                  Delete
                </Button>
              )}
            </Space>
          )}
        />
      </Table>
    </>
  );
};

export default StaffList;
