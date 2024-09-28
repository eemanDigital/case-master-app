import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Table, Button, Modal, Divider, Tooltip, Typography, Card } from "antd";
import { DeleteOutlined, UserOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { deleteUser, getUsers } from "../redux/features/auth/authSlice";
import AddClientForm from "../components/AddClientForm";
import SearchBar from "../components/SearchBar";
import { useAdminHook } from "../hooks/useAdminHook";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";

const { Title } = Typography;

const ClientLists = () => {
  const [searchResults, setSearchResults] = useState([]);
  const dispatch = useDispatch();

  const { Column } = Table;
  const { isStaff, isSuperOrAdmin, isClient } = useAdminHook();
  const {
    isError,
    isLoading,
    message,
    user,
    users: clients,
  } = useSelector((state) => state.auth);

  const loggedInClient = user?.data?._id;

  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  useEffect(() => {
    if (clients?.data) {
      let filteredClients = isClient
        ? clients.data.filter((client) => client._id === loggedInClient)
        : clients.data.filter((client) => client.role === "client");
      setSearchResults(filteredClients);
    }
  }, [clients, isClient, loggedInClient]);

  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();
    if (!searchTerm) {
      setSearchResults(
        clients?.data.filter((client) => client.role === "client")
      );
      return;
    }

    const results = clients?.data.filter((d) => {
      const fullName = `${d.firstName} ${d.secondName}`.toLowerCase();
      return (
        (fullName.includes(searchTerm) ||
          d.email?.toLowerCase().includes(searchTerm) ||
          d.phone?.toLowerCase().includes(searchTerm)) &&
        d.role === "client"
      );
    });

    setSearchResults(results);
  };

  const removeClient = async (id) => {
    await dispatch(deleteUser(id));
    await dispatch(getUsers());
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {isError ? (
        <PageErrorAlert errorCondition={isError} errorMessage={message} />
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <Title level={2} className="mb-4 md:mb-0">
              <UserOutlined className="mr-2" />
              Client Management
            </Title>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
              {isStaff && <AddClientForm />}
              <SearchBar onSearch={handleSearchChange} />
            </div>
          </div>
          <Divider />
          <Table
            dataSource={searchResults}
            rowKey="_id"
            scroll={{ x: 750 }}
            className="font-poppins">
            <Column
              title="Name"
              key="name"
              render={(text, record) => (
                <Tooltip title="View Details">
                  <Link
                    className="text-blue-600 hover:text-blue-800 font-bold"
                    to={`${record?._id}/details`}>
                    {`${record.firstName} ${record.secondName || ""}`}
                  </Link>
                </Tooltip>
              )}
            />
            <Column title="Email" dataIndex="email" key="email" />
            <Column title="Phone" dataIndex="phone" key="phone" />
            <Column
              title="Status"
              dataIndex="isActive"
              key="isActive"
              render={(isActive) => (
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                  {isActive ? "Active" : "Inactive"}
                </span>
              )}
            />
            {isSuperOrAdmin && (
              <Column
                title="Action"
                key="action"
                render={(text, record) => (
                  <Tooltip title="Delete Client">
                    <Button
                      icon={<DeleteOutlined />}
                      className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 border-red-200"
                      onClick={() => {
                        Modal.confirm({
                          title: "Delete Client",
                          content:
                            "Are you sure you want to delete this client's information?",
                          okText: "Delete",
                          okButtonProps: { danger: true },
                          onOk: () => removeClient(record?._id),
                        });
                      }}
                    />
                  </Tooltip>
                )}
              />
            )}
          </Table>
        </>
      )}
    </div>
  );
};

export default ClientLists;
