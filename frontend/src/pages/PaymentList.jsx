import { Link } from "react-router-dom";
import { Table, Modal, Space, Button } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";
import CreatePaymentForm from "./CreatePaymentForm";
import SearchBar from "../components/SearchBar";
import { useEffect, useState } from "react";
import { useAuthContext } from "../hooks/useAuthContext";
import { useAdminHook } from "../hooks/useAdminHook";

const PaymentList = () => {
  const {
    payments,
    loading: loadingPayment,
    error: paymentError,
  } = useDataGetterHook();
  const [searchResults, setSearchResults] = useState([]);
  const { user } = useAuthContext();
  const { isClient, isSuperOrAdmin } = useAdminHook();
  const loggedInClientId = user?.data?.user.id;
  const { dataFetcher, loading, error } = useDataFetch();

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  const handleDeletePayment = async (id) => {
    // Implement delete functionality here
    await dataFetcher(`payments/${id}`, "delete", fileHeaders);
  };

  // Render all cases initially before filter
  useEffect(() => {
    if (payments.data?.payments) {
      setSearchResults(payments.data?.payments);
    }
  }, [payments]);

  // Handles search filter
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();

    if (!searchTerm) {
      setSearchResults(payments?.data?.payments);
      return;
    }

    const results = payments?.data?.payments.filter((d) => {
      // Check in client names
      const clientNameMatch =
        d.invoiceId?.client?.fullName.toLowerCase().includes(searchTerm) ||
        d.invoiceId?.client?.firstName.toLowerCase().includes(searchTerm);

      // Check in invoice reference
      const referenceMatch = d.invoiceId?.invoiceReference
        ?.toLowerCase()
        .includes(searchTerm);

      return clientNameMatch || referenceMatch;
    });
    setSearchResults(results);
  };

  // filter payment base on clientId
  const filteredPaymentForClient = searchResults.filter(
    (item) => item.clientId === loggedInClientId
  );

  const columns = [
    {
      title: "Invoice Reference",
      dataIndex: ["invoiceId", "invoiceReference"],
      key: "invoiceReference",
    },
    {
      title: "Client",
      dataIndex: ["invoiceId", "client", "firstName"],
      key: "client",
    },
    {
      title: "Amount Paid",
      dataIndex: "amountPaid",
      key: "amountPaid",
      render: (amount) => `₦${amount}`,
    },
    {
      title: "Total Amount Due",
      dataIndex: "totalAmountDue",
      key: "totalAmountDue",
      render: (amount) => `₦${amount}`,
    },
    {
      title: "Payment Date",
      dataIndex: "date",
      key: "date",
      render: (date) => (
        <div className="text-green-600">{formatDate(date)}</div>
      ),
    },
    {
      title: "Balance",
      dataIndex: "balance",
      key: "balance",
      render: (balance) => (
        <div className={`${balance === 0 ? "text-green-600" : "text-red-500"}`}>
          {balance === 0 ? <p>Payment Completed</p> : `₦${balance}`}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <Space size="middle">
          <Button type="link">
            <Link to={`payments/${record?._id}/details`}>Get Details</Link>
          </Button>
          {isSuperOrAdmin && (
            <Button
              onClick={() => {
                Modal.confirm({
                  title: "Are you sure you want to delete this payment?",
                  onOk: () => handleDeletePayment(record?._id),
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
      <h1 className="text-3xl font-bold text-gray-700 mb-7">Payments</h1>
      <div className="flex flex-col md:flex-row justify-between items-center m-3">
        <CreatePaymentForm />
        <SearchBar onSearch={handleSearchChange} />
      </div>

      <Table
        columns={columns}
        dataSource={isClient ? filteredPaymentForClient : searchResults}
        rowKey="_id"
        loading={loadingPayment.payments}
        pagination={{ pageSize: 10 }}
      />
      {paymentError.payments && <p>Error: {paymentError.payments}</p>}
    </div>
  );
};

export default PaymentList;
