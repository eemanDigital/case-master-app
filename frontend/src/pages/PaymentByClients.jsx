import { useEffect, useState } from "react";
import { Card, Alert, Table, Divider } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAuthContext } from "../hooks/useAuthContext";
import { useAdminHook } from "../hooks/useAdminHook";
import AllCasesListForPayment from "./AllCasesListForPayment";
import { useSelector } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";
import { toast } from "react-toastify";

const PaymentByClient = () => {
  const { clientPayments, cases, loading, error, fetchData } =
    useDataGetterHook();
  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);
  const { isClient } = useAdminHook();
  const loggedInClientId = user?.data?.id;

  const [pagination, setPagination] = useState({ pageSize: 8, current: 1 });

  // fetch data
  useEffect(() => {
    fetchData("payments/paymentEachClient", "clientPayments");
  }, []);

  if (loading.clientPayments) return <h1>Loading... </h1>;
  if (error.clientPayments) return toast.error(error.clientPayments);

  const paymentData = clientPayments?.data || [];

  // filter payment base on clientId
  const filteredPaymentForClient = paymentData.filter(
    (items) => items.client?._id === loggedInClientId
  );

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  console.log(clientPayments, "payment");

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
      {loading.clientPayments && <LoadingSpinner />}

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
