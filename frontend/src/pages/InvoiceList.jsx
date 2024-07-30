import { Link } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";
import { Table, Modal, Space, Button } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import moment from "moment";
import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import { useAdminHook } from "../hooks/useAdminHook";
import { useSelector } from "react-redux";

const InvoiceList = () => {
  const { data, loading, error, dataFetcher } = useDataFetch();
  const {
    invoices,
    loading: loadingInvoices,
    error: errorInvoices,
  } = useDataGetterHook();
  const [searchResults, setSearchResults] = useState([]);

  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);
  const { isClient, isSuperOrAdmin } = useAdminHook();
  const loggedInClientId = user?.data?.user.id;

  //   handle delete
  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  const handleDeleteInvoice = async (id) => {
    await dataFetcher(`invoices/${id}`, "delete", fileHeaders);
  };

  // render all cases initially before filter
  useEffect(() => {
    if (invoices?.data) {
      setSearchResults(invoices?.data);
    }
  }, [invoices]);

  // handles search filter
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();

    if (!searchTerm) {
      setSearchResults(invoices?.data);
      return;
    }

    const results = invoices?.data.filter((d) => {
      // Check in client names
      const clientNameMatch = d.client?.fullName
        .toLowerCase()
        .includes(searchTerm);
      // Check in invoice reference
      const referenceMatch = d.invoiceReference
        ?.toLowerCase()
        .includes(searchTerm);

      // check by work title
      const workTitleMatch = d.workTitle?.toLowerCase().includes(searchTerm);

      // Check in invoice status //this is a strict match
      const statusMatch = d.status.toLowerCase() === searchTerm.toLowerCase();

      return clientNameMatch || referenceMatch || workTitleMatch || statusMatch;
    });

    setSearchResults(results);
  };

  // filter payment base on clientId
  const filteredInvoiceForClient = searchResults.filter(
    (item) => item.client?.id === loggedInClientId
  );

  const columns = [
    {
      title: "Invoice Reference",
      dataIndex: "invoiceReference",
      key: "invoiceReference",
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      render: (client) => (client ? client.firstName : "N/A"),
      responsive: ["md"],
    },
    {
      title: "Work Title",
      dataIndex: "workTitle",
      key: "workTitle",
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (dueDate) => {
        const isPastDue = moment(dueDate).isBefore(moment());
        return (
          <div style={{ color: isPastDue ? "red" : "black" }}>
            {formatDate(dueDate)}
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <div
          className={`${
            status === "paid"
              ? "bg-green-400 text-white text-center px-3 py-1 rounded-md"
              : "bg-yellow-500 p-1 text-center text-white rounded-md"
          }`}>
          {status}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <Space size="middle">
          <Button type="link">
            <Link to={`invoices/${record?._id}/details`}>Get Details</Link>
          </Button>
          {isSuperOrAdmin && (
            <Button
              onClick={() => {
                Modal.confirm({
                  title: "Are you sure you want to delete this invoice?",
                  onOk: () => handleDeleteInvoice(record?._id),
                });
              }}
              type="primary"
              danger>
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex md:flex-row flex-col  justify-between items-center mt-4">
        <Link to="invoices/add-invoices">
          <Button className="bg-blue-500  text-white">Create Invoice</Button>
        </Link>

        <SearchBar onSearch={handleSearchChange} />
      </div>
      <h1 className="text-3xl font-bold text-gray-700 mb-7">Invoices</h1>
      <Table
        columns={columns}
        dataSource={isClient ? filteredInvoiceForClient : searchResults}
        rowKey="_id"
      />
    </div>
  );
};

export default InvoiceList;
