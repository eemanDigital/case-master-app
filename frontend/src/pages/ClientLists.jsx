import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link } from "react-router-dom";
import { Space, Table, Button, Spin, Alert, Modal, Divider } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import AddClientForm from "../components/AddClientForm";
import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import { useAdminHook } from "../hooks/useAdminHook";
import { useDispatch, useSelector } from "react-redux";
import { deleteUser, getUsers } from "../redux/features/auth/authSlice";
import { toast } from "react-toastify";

const ClientLists = () => {
  // const {
  //   users: clients,
  //   loading: loadingClients,
  //   error: errorClients,
  // } = useDataGetterHook();
  const [searchResults, setSearchResults] = useState([]);
  const dispatch = useDispatch();

  const { Column, ColumnGroup } = Table;
  const { isStaff, isSuperOrAdmin, isClient } = useAdminHook();
  const {
    isError,
    isSuccess,
    isLoading,
    message,
    user,
    users: clients,
  } = useSelector((state) => state.auth);

  const loggedInClient = user?.data?._id;

  const { data, loading, error, dataFetcher } = useDataFetch();

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

  if (isLoading) {
    return (
      <Spin size="large" className="flex justify-center items-center h-full" />
    );
  }

  if (isError) {
    return toast.error(message);
  }

  // remove client handler
  const removeClient = async (id) => {
    await dispatch(deleteUser(id));
    await dispatch(getUsers());
  };

  return (
    <>
      <div
        className={`flex md:flex-row flex-col justify-between items-center `}>
        {isStaff && <AddClientForm />}
        <SearchBar onSearch={handleSearchChange} />
      </div>

      <Divider />
      <div className=" overflow-x-auto">
        <Table dataSource={searchResults} scroll={{ x: 400 }}>
          <ColumnGroup title="Client Lists">
            <Column
              title="Client's Name"
              dataIndex="firstName"
              key="firstName"
            />
            <Column
              title="Second Name"
              dataIndex="secondName"
              key="secondName"
            />
          </ColumnGroup>

          <Column title="Client Email" dataIndex="email" key="email" />
          <Column title="Phone" dataIndex="phone" key="phone" />

          <Column
            title="Action"
            key="action"
            render={(text, record) => (
              <Space size="middle">
                <Button type="link">
                  <Link to={`${record?._id}/details`}>Get Details</Link>
                </Button>
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
      </div>
    </>
  );
};

export default ClientLists;
