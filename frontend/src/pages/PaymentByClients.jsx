import { useState } from "react";
import { Card, Alert, Table, Divider } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAuthContext } from "../hooks/useAuthContext";
import { useAdminHook } from "../hooks/useAdminHook";
import AllCasesListForPayment from "./AllCasesListForPayment";
import { useSelector } from "react-redux";

const PaymentByClient = () => {
  const { clientPayments, cases, loading, error } = useDataGetterHook();
  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);
  const { isClient } = useAdminHook();
  const loggedInClientId = user?.data?.user.id;

  const [pagination, setPagination] = useState({ pageSize: 8, current: 1 });

  if (loading.clientPayments) return <h1>Loading... </h1>;
  if (error.clientPayments)
    return (
      <Alert
        message="Error"
        description={error.clientPayments}
        type="error"
        showIcon
      />
    );

  const paymentData = clientPayments?.data || [];

  // filter payment base on clientId
  const filteredPaymentForClient = paymentData.filter(
    (items) => items.client?._id === loggedInClientId
  );

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const columns = [
    {
      title: "Client Name",
      dataIndex: ["client", "firstName"],
      key: "clientName",
    },
    {
      title: "Total Payment",
      dataIndex: "totalAmount",
      key: "totalPayment",
      render: (amount) => `₦${amount.toLocaleString()}`,
    },
  ];

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between md:items-start items-center gap-3 w-full">
        <Card
          title="Total Payment By Each Client"
          className="text-black mt-4 w-[70%] "
          bordered={false}>
          <Table
            dataSource={isClient ? filteredPaymentForClient : paymentData}
            columns={columns}
            rowKey={(record) => record._id}
            pagination={pagination}
            onChange={handleTableChange}
          />
        </Card>

        <AllCasesListForPayment />
      </div>
    </>
  );
};

export default PaymentByClient;
