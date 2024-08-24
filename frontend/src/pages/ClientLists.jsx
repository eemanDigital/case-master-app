import { Link } from "react-router-dom";
import { Space, Table, Button, Modal, Divider } from "antd";
import AddClientForm from "../components/AddClientForm";
import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import { useAdminHook } from "../hooks/useAdminHook";
import { useDispatch, useSelector } from "react-redux";
import { deleteUser, getUsers } from "../redux/features/auth/authSlice";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";

const ClientLists = () => {
  const [searchResults, setSearchResults] = useState([]);
  const dispatch = useDispatch();

  const { Column, ColumnGroup } = Table;
  const { isStaff, isSuperOrAdmin, isClient } = useAdminHook();
  const {
    isError,
    isLoading,
    message,
    user,
    users: clients,
  } = useSelector((state) => state.auth); // get all users

  const loggedInClient = user?.data?._id; // get current user id

  // fetch client
  useEffect(() => {
    dispatch(getUsers());
  }, [dispatch]);

  useEffect(() => {
    // clients only see there cases
    if (clients?.data) {
      let filteredClients = clients.data;
      // if current user his client show client's cases
      if (isClient) {
        filteredClients = clients.data.filter(
          (client) => client._id === loggedInClient
        );
      } else {
        // show client list to others
        filteredClients = clients.data.filter(
          (client) => client.role === "client"
        );
      }
      setSearchResults(filteredClients);
    }
  }, [clients, isClient, loggedInClient]);

  // filter all users to extract client only data
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();
    if (!searchTerm) {
      setSearchResults(
        clients?.data.filter((client) => client.role === "client")
      );
      return;
    }

    // filter results
    const results = clients?.data.filter((d) => {
      const firstUsernameMatch = d?.firstName
        ?.toLowerCase()
        .includes(searchTerm);

      const secondUsernameMatch = d?.secondName
        ?.toLowerCase()
        .includes(searchTerm);
      const emailMatch = d.email?.toLowerCase().includes(searchTerm);
      const phoneMatch = d?.phone?.toLowerCase().includes(searchTerm);

      return (
        (firstUsernameMatch ||
          secondUsernameMatch ||
          emailMatch ||
          phoneMatch) &&
        d.role === "client"
      );
    });

    setSearchResults(results);
  };

  // load spinner
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // remove client handler
  const removeClient = async (id) => {
    await dispatch(deleteUser(id));
    await dispatch(getUsers());
  };

  return (
    <>
      {isError ? (
        <PageErrorAlert errorCondition={isError} errorMessage={message} />
      ) : (
        <>
          <div
            className={`flex md:flex-row flex-col justify-between items-center  `}>
            {isStaff && <AddClientForm />}
            <SearchBar onSearch={handleSearchChange} />
          </div>
          <Divider />
          <div className=" overflow-x-auto font-medium font-poppins">
            <Table dataSource={searchResults} scroll={{ x: 400 }}>
              <ColumnGroup title="Client Lists">
                <Column
                  title="Name"
                  key="name"
                  render={(text, record) => (
                    <Link
                      className="capitalize text-gray-700  hover:text-gray-800 cursor-pointer font-medium"
                      to={`${record?._id}/details`}
                      title="Click for details">
                      {`${record.firstName} ${record.secondName || ""}`}
                    </Link>
                  )}
                />
              </ColumnGroup>

              <Column title="Client Email" dataIndex="email" key="email" />
              <Column title="Phone" dataIndex="phone" key="phone" />
              <Column
                title="Is Active"
                dataIndex="isActive"
                key="isActive"
                render={(isActive) => {
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
                    {/* <Button type="link">
                      <Link to={`${record?._id}/details`}>Get Details</Link>
                    </Button> */}
                    {isSuperOrAdmin && (
                      <Button
                        onClick={() => {
                          Modal.confirm({
                            title:
                              "Are you sure you want to delete this client information?",
                            onOk: () => removeClient(record?.id),
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
          </div>{" "}
        </>
      )}
    </>
  );
};

export default ClientLists;
