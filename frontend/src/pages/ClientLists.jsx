import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link } from "react-router-dom";
import { Space, Table, Button, Spin, Alert, Modal, Divider } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import AddClientForm from "../components/AddClientForm";
import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import { useAdminHook } from "../hooks/useAdminHook";
import { useAuthContext } from "../hooks/useAuthContext";
import { useSelector } from "react-redux";

const ClientLists = () => {
  const {
    clients,
    loading: loadingClients,
    error: errorClients,
  } = useDataGetterHook();
  const [searchResults, setSearchResults] = useState([]);

  const { Column, ColumnGroup } = Table;
  const { isStaff, isAdminOrHr, isAdmin, isSuperOrAdmin } = useAdminHook();
  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);

  const clientID = user?.data?.user?._id;

  const { data, loading, error, dataFetcher } = useDataFetch();

  // console.log(clients?.data, "C");

  useEffect(() => {
    if (clients?.data) {
      setSearchResults(clients?.data);
    }
  }, [clients]);

  // handles search filter
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();

    if (!searchTerm) {
      setSearchResults(clients?.data);
      return;
    }

    const results = clients?.data.filter((d) => {
      // Check in user names
      const firstUsernameMatch = d?.firstName
        ?.toLowerCase()
        .includes(searchTerm);

      // Check in user names
      const secondUsernameMatch = d?.secondName
        ?.toLowerCase()
        .includes(searchTerm);

      // check by email
      const emailMatch = d.email?.toLowerCase().includes(searchTerm);

      // Check in position
      const phoneMatch = d?.phone?.toLowerCase().includes(searchTerm);

      return (
        firstUsernameMatch || secondUsernameMatch || emailMatch || phoneMatch
      );
    });

    setSearchResults(results);
  };

  if (loadingClients.clients) {
    return (
      <Spin size="large" className="flex justify-center items-center h-full" />
    );
  }

  // filter clients list by current clientId
  const filteredClients = (clientId) => {
    return clients?.data?.filter((client) => client?._id === clientId);
  };

  if (errorClients.clients) {
    return (
      <Alert
        message="Error"
        description={errorClients.clients}
        type="error"
        showIcon
      />
    );
  }
  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };
  // delete leave app
  const handleDeleteApp = async (id) => {
    await dataFetcher(`clients/${id}`, "delete", fileHeaders);
  };

  return (
    <>
      <div
        className={`flex md:flex-row flex-col justify-between items-center `}>
        {isStaff && <AddClientForm />}
        <SearchBar onSearch={handleSearchChange} />
      </div>

      <Divider />
      <Table dataSource={isStaff ? searchResults : filteredClients(clientID)}>
        <ColumnGroup title="Client Lists">
          <Column title="Client's Name" dataIndex="firstName" key="firstName" />
          <Column title="Second Name" dataIndex="secondName" key="secondName" />
        </ColumnGroup>

        <Column title="Client Email" dataIndex="email" key="email" />
        <Column title="Phone" dataIndex="phone" key="phone" />
        {/* <Column title="Type of Leave" dataIndex="typeOfLeave" key="typeOfLeave" /> */}

        <Column
          title="Action"
          key="action"
          render={(text, record) => (
            <Space size="middle">
              <Button type="link">
                <Link to={`${record?.id}/details`}>Get Details</Link>
              </Button>
              {isSuperOrAdmin && (
                <Button
                  onClick={() => {
                    Modal.confirm({
                      title:
                        "Are you sure you want to delete this client information?",
                      onOk: () => handleDeleteApp(record?.id),
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

export default ClientLists;
