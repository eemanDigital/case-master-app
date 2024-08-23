import { useEffect, useState } from "react";
import { Card, Table } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

import { useAdminHook } from "../hooks/useAdminHook";
import AllCasesListForPayment from "./AllCasesListForPayment";
import { useSelector } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const PaymentByClient = () => {
  const { clientPayments, loading, error, fetchData } = useDataGetterHook();
  const { user } = useSelector((state) => state.auth);
  const { isClient } = useAdminHook();
  const loggedInClientId = user?.data?.id;
  useRedirectLogoutUser("users/login"); // redirect to login if user is not logged in

  const [pagination, setPagination] = useState({ pageSize: 8, current: 1 });

  // fetch data
  useEffect(() => {
    fetchData("payments/paymentEachClient", "clientPayments");
  }, []);

  // loading spinner
  if (loading.clientPayments) return <h1>Loading... </h1>;

  //  error toast
  if (error.clientPayments)
    return (
      <PageErrorAlert
        errorCondition={error.clientPayments}
        errorMessage={error.clientPayments}
      />
    );

  //  get payment data
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
      {loading.clientPayments && <LoadingSpinner />}

      <div className="flex flex-col md:flex-row justify-between md:items-start items-center gap-3 w-full px-2">
        <Card
          title="Total Payment By Each Client"
          className="text-black mt-4 xl:w-[70%] md:w-[100%] "
          bordered={false}>
          <Table
            dataSource={isClient ? filteredPaymentForClient : paymentData}
            columns={columns}
            rowKey={(record) => record._id}
            pagination={pagination}
            onChange={handleTableChange}
            // scroll={{ x: 1000 }}
          />
        </Card>

        <AllCasesListForPayment />
      </div>
    </>
  );
};

export default PaymentByClient;
