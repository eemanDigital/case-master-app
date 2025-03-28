import { Link } from "react-router-dom";
import { Table, Modal, Space, Button } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";
import CreatePaymentForm from "./CreatePaymentForm";
import SearchBar from "../components/SearchBar";
import { useEffect, useState } from "react";

import { useAdminHook } from "../hooks/useAdminHook";
import { useDispatch, useSelector } from "react-redux";
import { deleteData } from "../redux/features/delete/deleteSlice";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import LoadingSpinner from "../components/LoadingSpinner";

const PaymentList = () => {
  const {
    payments,
    loading: loadingPayment,
    error: paymentError,
    fetchData,
  } = useDataGetterHook();
  const [searchResults, setSearchResults] = useState([]);
  const { user } = useSelector((state) => state.auth);
  const { isClient, isSuperOrAdmin } = useAdminHook();
  const dispatch = useDispatch();
  const loggedInClientId = user?.data?.id;
  useRedirectLogoutUser("/users/login"); // redirect to login if user is not logged in

  // fetch data
  useEffect(() => {
    fetchData("payments", "payments");
  }, [fetchData]);

  const deletePayment = async (id) => {
    // Implement delete functionality here;
    await dispatch(deleteData(`payments/${id}`));

    await fetchData("payments", "payments");
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
    console.log(payments?.data?.payments);
    const results = payments?.data?.payments?.filter((d) => {
      // Check in client names
      const clientNameMatch =
        d.invoiceId?.client?.fullName?.toLowerCase().includes(searchTerm) ||
        d.invoiceId?.client?.firstName?.toLowerCase().includes(searchTerm);

      console.log(
        d.invoiceId?.client?.firstName?.toLowerCase().includes(searchTerm)
      );

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

  // Custom loader
  const customLoader = <LoadingSpinner />;

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
                  onOk: () => deletePayment(record?._id),
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
    <>
      {paymentError.payments ? (
        <PageErrorAlert
          errorCondition={paymentError.paymentError}
          errorMessage={paymentError.payments}
        />
      ) : (
        <div>
          <h1 className=" w-full md:w-auto text-3xl font-bold text-gray-700 mb-7">
            Payments
          </h1>
          <div className="flex flex-col md:flex-row justify-between items-center m-3">
            <CreatePaymentForm />
            <SearchBar onSearch={handleSearchChange} />
          </div>
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={isClient ? filteredPaymentForClient : searchResults}
              rowKey="_id"
              loading={{
                spinning: loadingPayment.payments,
                indicator: customLoader,
              }}
              pagination={{ pageSize: 10 }}
              scroll={{ x: 750 }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentList;
