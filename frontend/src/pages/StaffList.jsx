import { useEffect, useState } from "react";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import { useAdminHook } from "../hooks/useAdminHook";
import { Space, Table, Button, Spin, Alert, Modal } from "antd";
import avatar from "../assets/avatar.png";
import LeaveBalanceList from "./leaveBalanceList";
import { useAuthContext } from "../hooks/useAuthContext";
import CreateLeaveBalanceForm from "../components/CreateLeaveBalanceForm";
import SearchBar from "../components/SearchBar";

const StaffList = () => {
  const {
    users,
    loading: loadingUsers,
    error: errorUsers,
  } = useDataGetterHook();
  const [searchResults, setSearchResults] = useState([]);

  const { Column, ColumnGroup } = Table;
  //   const { user } = useAuthContext();
  const { dataFetcher, loading, error } = useDataFetch();
  //  const { user } = useAuthContext();
  // const loggedInUserId = user?.data?.user.id;
  const { isAdminOrHr, isAdmin, isSuperOrAdmin } = useAdminHook();

  //render all cases initially before filter
  useEffect(() => {
    if (users?.data) {
      setSearchResults(users?.data);
    }
  }, [users]);

  // handles search filter
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();

    if (!searchTerm) {
      setSearchResults(users?.data);
      return;
    }

    const results = users?.data.filter((d) => {
      // Check in user names
      const usernameMatch = d.fullName.toLowerCase().includes(searchTerm);
      // Check in role
      const roleMatch = d.role?.toLowerCase().includes(searchTerm);

      // check by email
      const emailMatch = d.email?.toLowerCase().includes(searchTerm);

      // Check in position
      const positionMatch = d.position?.toLowerCase().includes(searchTerm);

      return usernameMatch || emailMatch || positionMatch || roleMatch;
    });

    setSearchResults(results);
  };

  if (loadingUsers.users) {
    return (
      <div>
        <Spin
          size="large"
          className="flex justify-center items-center h-full"
        />
      </div>
    );
  }

  if (errorUsers.users) {
    return (
      <Alert
        message="Error"
        description={errorUsers.user}
        type="error"
        showIcon
      />
    );
  }

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };
  const handleDeleteUser = async (id) => {
    await dataFetcher(`users/${id}`, "delete", fileHeaders);
  };

  // format position
  const formatPosition = (position) => {
    return position
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      <div className="flex md:flex-row flex-col justify-between items-center gap-3 my-4">
        {isAdminOrHr && <LeaveBalanceList />}

        <Link to="leave-application-list">
          <Button className="bg-blue-500 text-white">
            {isAdminOrHr
              ? "Manage Leave Applications"
              : "Your Leave Applications"}
          </Button>
        </Link>
        {isAdmin && <CreateLeaveBalanceForm />}

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
        <Column
          title="Position"
          dataIndex="position"
          key="position"
          render={(text) => formatPosition(text)}
        />
        {/* <Column title="Phone" dataIndex="phone" key="phone" /> */}

        <Column
          title="Action"
          key="action"
          render={(text, record) => (
            <Space size="middle">
              <Button type="link">
                <Link to={`/dashboard/staff/${record.id}/details`}>
                  Get Details
                </Link>
              </Button>
              {isSuperOrAdmin && (
                <Button
                  onClick={() => {
                    Modal.confirm({
                      title: "Are you sure you want to delete this user?",
                      onOk: () => handleDeleteUser(record.id),
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
