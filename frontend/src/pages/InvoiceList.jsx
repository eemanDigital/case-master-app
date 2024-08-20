import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Table, Modal, Space, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { PlusOutlined } from "@ant-design/icons";
import moment from "moment";
import ButtonWithIcon from "../components/ButtonWithIcon";
import { formatDate } from "../utils/formatDate";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAdminHook } from "../hooks/useAdminHook";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBar from "../components/SearchBar";
import { deleteData } from "../redux/features/delete/deleteSlice";
import PageErrorAlert from "../components/PageErrorAlert";

const InvoiceList = () => {
  const {
    invoices,
    loading: loadingInvoices,
    error: errorInvoices,
    fetchData,
  } = useDataGetterHook();
  const [searchResults, setSearchResults] = useState([]);
  const { isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.delete
  );
  const dispatch = useDispatch();
  const { isClient, isSuperOrAdmin } = useAdminHook();
  const { user } = useSelector((state) => state.auth);
  const loggedInClientId = user?.data?.id;

  const fetchInvoices = useCallback(() => {
    fetchData("invoices", "invoices");
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    if (invoices?.data) {
      setSearchResults(invoices.data);
    }
  }, [invoices]);

  const handleSearchChange = useCallback(
    (e) => {
      const searchTerm = e.target.value.trim().toLowerCase();

      if (!searchTerm) {
        setSearchResults(invoices?.data);
        return;
      }

      const results = invoices?.data.filter((d) => {
        const clientNameMatch = `${d.client?.firstName} ${d.client?.secondName}`
          .toLowerCase()
          .includes(searchTerm);
        const referenceMatch = d.invoiceReference
          ?.toLowerCase()
          .includes(searchTerm);
        const workTitleMatch = d.workTitle?.toLowerCase().includes(searchTerm);
        const statusMatch = d.status.toLowerCase() === searchTerm.toLowerCase();

        return (
          clientNameMatch || referenceMatch || workTitleMatch || statusMatch
        );
      });

      setSearchResults(results);
    },
    [invoices?.data]
  );

  const filteredInvoiceForClient = searchResults.filter(
    (item) => item.client?.id === loggedInClientId
  );

  // handle delete
  const deleteInvoice = async (id) => {
    try {
      await dispatch(deleteData(`invoices/${id}`));
    } catch (error) {
      toast.error("Failed to delete invoice");
    }
  };

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    if (isSuccess) {
      toast.success(message);
      // Refetch the data after any successful operation
      fetchInvoices();
    }
  }, [isError, isSuccess, message, fetchInvoices]);

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
      render: (client) =>
        client ? `${client.firstName} ${client.secondName || ""}` : "N/A",
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
                  onOk: () => deleteInvoice(record?._id),
                });
              }}
              type="primary"
              danger>
              {isLoading && <LoadingSpinner />}
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // loading state
  if (loadingInvoices.invoices) return <LoadingSpinner />;
  return (
    <>
      {errorInvoices ? (
        <PageErrorAlert
          errorCondition={errorInvoices.invoices}
          errorMessage={errorInvoices.invoices}
        />
      ) : (
        <div>
          <div className="flex md:flex-row flex-col justify-between items-center mt-4">
            <ButtonWithIcon
              onClick={() => {}}
              icon={<PlusOutlined className="mr-2" />}
              text="Create Invoice"
            />

            <SearchBar onSearch={handleSearchChange} />
          </div>
          <h1 className="text-3xl font-bold text-gray-700 mb-7">Invoices</h1>
          <Table
            columns={columns}
            dataSource={isClient ? filteredInvoiceForClient : searchResults}
            rowKey="_id"
            scroll={{ x: 1000 }}
          />
        </div>
      )}
    </>
  );
};

export default InvoiceList;
