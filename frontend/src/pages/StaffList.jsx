import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Space, Table, Button, Modal, Tooltip } from "antd";
import avatar from "../assets/avatar.png";
import CreateLeaveBalanceForm from "../components/CreateLeaveBalanceForm";
import { DeleteOutlined } from "@ant-design/icons";
import { PlusOutlined } from "@ant-design/icons";
import SearchBar from "../components/SearchBar";
import { deleteUser, getUsers } from "../redux/features/auth/authSlice";
import { useAdminHook } from "../hooks/useAdminHook";
import ButtonWithIcon from "../components/ButtonWithIcon";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import EventList from "./EventList";

const StaffList = () => {
  const [searchResults, setSearchResults] = useState([]);
  const dispatch = useDispatch();
  const { isLoading, isError, users, message } = useSelector(
    (state) => state.auth
  );

  const { Column, ColumnGroup } = Table;
  const { isAdminOrHr, isSuperOrAdmin } = useAdminHook();
  useRedirectLogoutUser("/users/login"); // redirect to login if user is not logged in

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
      const usernameMatch = `${d.firstName}${d.lastName}`
        .toLowerCase()
        .includes(searchTerm);
      const roleMatch = d.role?.toLowerCase().includes(searchTerm);
      const emailMatch = d.email?.toLowerCase().includes(searchTerm);
      const positionMatch = d.position?.toLowerCase().includes(searchTerm);
      return usernameMatch || emailMatch || positionMatch || roleMatch;
    });
    setSearchResults(results);
  };

  // filter user data to get staff alone
  const staffList = searchResults?.filter((staff) => staff?.role !== "client");

  // remove users
  const removeUser = async (id) => {
    await dispatch(deleteUser(id));
    await dispatch(getUsers());
  };

  // if (isLoading) return <div>Loading...</div>; this is causing infinite loop, requires fix

  return (
    <>
      {isError ? (
        <PageErrorAlert errorCondition={isError} errorMessage={message} />
      ) : (
        <>
          <div className="flex md:flex-row flex-col justify-evenly  gap-3 my-4">
            {isAdminOrHr && (
              <>
                <Link to="add-user">
                  <ButtonWithIcon
                    onClick={() => {}}
                    icon={<PlusOutlined className="mr-2" />}
                    text="Add User"
                  />
                </Link>
                {/* leave balance form */}
                <CreateLeaveBalanceForm />

                {/* <div className="w-full md:w-auto"></div> */}
              </>
            )}
            <EventList />
            <SearchBar onSearch={handleSearchChange} />
          </div>
          <div className="overflow-x-auto font-medium font-poppins">
            <Table dataSource={staffList} scroll={{ x: 700 }}>
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
                <Column
                  title="Name"
                  key="name"
                  render={(text, record) => (
                    <Tooltip title="Click for details">
                      <Link
                        className="text-md font-bold capitalize text-gray-700 hover:text-gray-400 cursor-pointer  flex items-center"
                        to={`/dashboard/staff/${record?._id}/details`}>
                        {`${record.firstName} ${record.lastName}`}
                      </Link>
                    </Tooltip>
                  )}
                />
              </ColumnGroup>

              {/* <Column title="Email" dataIndex="email" key="email" /> */}
              <Column title="Role" dataIndex="role" key="role" />
              <Column title="Position" dataIndex="position" key="position" />
              <Column
                title="Is Active"
                dataIndex="isActive"
                key="isActive"
                render={(isActive) => {
                  console.log("isActive:", isActive);
                  return (
                    <span style={{ color: isActive ? "green" : "red" }}>
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  );
                }}
              />

              <Column
                title="Action"
                key="action"
                render={(text, record) => (
                  <Space size="middle">
                    {isSuperOrAdmin && (
                      <Tooltip title="Delete Staff">
                        <Button
                          icon={<DeleteOutlined />}
                          className="mx-6 bg-red-200 text-red-500 hover:text-red-700"
                          onClick={() => {
                            Modal.confirm({
                              title:
                                "Are you sure you want to delete this user?",
                              onOk: () => removeUser(record._id),
                            });
                          }}
                          type="primary"></Button>
                      </Tooltip>
                    )}
                  </Space>
                )}
              />
            </Table>
          </div>
        </>
      )}
    </>
  );
};

export default StaffList;
