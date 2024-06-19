import { Link } from "react-router-dom";
import { Table, Modal, Space, Button, Card } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";
import CreatePaymentForm from "./CreatePaymentForm";

const PaymentList = () => {
  const { payments, loadingPayments, errorPayments } = useDataGetterHook();
  const { dataFetcher } = useDataFetch();
  //   console.log("PAY", payments.data?.payments);
  // Handle delete function

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };
  const handleDeletePayment = async (id) => {
    // Implement delete functionality here
    await dataFetcher(`payments/${id}`, "delete", fileHeaders);
  };

  // Define table columns
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
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => formatDate(date),
    },

    {
      title: "Balance",
      dataIndex: "balance",
      key: "balance",
      render: (balance) => `₦${balance}`,
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <Space size="middle">
          <Button type="link">
            <Link to={`payments/${record?._id}/details`}>Get Details</Link>
          </Button>
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
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-700 mb-7">Payments</h1>
      <CreatePaymentForm />

      <Table
        columns={columns}
        dataSource={payments.data?.payments}
        rowKey="_id"
        loading={loadingPayments}
        pagination={{ pageSize: 10 }}
      />
      {errorPayments && <p>Error: {errorPayments.message}</p>}
    </div>
  );
};

export default PaymentList;
