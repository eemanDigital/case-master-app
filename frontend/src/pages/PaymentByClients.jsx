import { Card, Alert, Table, Divider } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAuthContext } from "../hooks/useAuthContext";
import { useAdminHook } from "../hooks/useAdminHook";
import AllCasesListForPayment from "./AllCasesListForPayment";

const PaymentByClient = () => {
  const { clientPayments, cases, loading, error } = useDataGetterHook();
  const { user } = useAuthContext();
  const { isClient } = useAdminHook();
  const loggedInClientId = user?.data?.user.id;
  // const { clientId, caseId } = useParams();

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
      <Card className="text-black mt-4" bordered={false}>
        <Table
          dataSource={isClient ? filteredPaymentForClient : paymentData}
          columns={columns}
          rowKey={(record) => record._id}
          pagination={false}
        />
      </Card>
      <Divider />

      <AllCasesListForPayment />
    </>
  );
};

export default PaymentByClient;
