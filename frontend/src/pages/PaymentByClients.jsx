
import { useNavigate } from "react-router-dom";
import { Button, Card, Alert, Table } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

const PaymentByClient = () => {
  const { clientPayments, loadingClientPayments, errorClientPayments } =
    useDataGetterHook();

  if (loadingClientPayments) return <h1>Loading... </h1>;
  if (errorClientPayments)
    return (
      <Alert
        message="Error"
        description={errorClientPayments.message}
        type="error"
        showIcon
      />
    );

  const paymentData = clientPayments?.data || [];

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
          dataSource={paymentData}
          columns={columns}
          rowKey={(record) => record._id}
          pagination={false}
        />
      </Card>
    </>
  );
};

export default PaymentByClient;
