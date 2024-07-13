import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Descriptions, Button, Card, Spin, Alert } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";

const PaymentMadeOnCase = () => {
  const { dataFetcher, data, loading, error } = useDataFetch();
  const navigate = useNavigate();
  const { clientId, caseId } = useParams();

  useEffect(() => {
    if (clientId && caseId) {
      dataFetcher(`payments/client/${clientId}/case/${caseId}`, "GET");
    }
  }, [clientId, caseId]);

  if (loading)
    return (
      <Spin
        tip="Loading..."
        size="large"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      />
    );
  if (error)
    return (
      <Alert message="Error" description={error} type="error" showIcon banner />
    );

  const totalPayment = data?.totalPayment || 0;
  const paymentData = data?.data || [];

  return (
    <>
      <Button key="1" type="primary" onClick={() => navigate(-1)}>
        Go Back
      </Button>
      ,
      <Card className="mt-4">
        {paymentData.map((payment, index) => (
          <Descriptions
            key={index}
            bordered
            column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
            size="middle"
            title={`Payment ${index + 1} Details`}
            className="mt-4">
            <Descriptions.Item label="Amount Paid">
              ₦{payment.amountPaid.toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {new Date(payment.date).toLocaleDateString()}
            </Descriptions.Item>
            <Descriptions.Item label="Client">
              {payment.client.firstName} {payment.client.secondName}
            </Descriptions.Item>
            <Descriptions.Item label="First Party">
              {payment.case.firstParty.join(", ")}
            </Descriptions.Item>
            <Descriptions.Item label="Second Party">
              {payment.case.secondParty.join(", ")}
            </Descriptions.Item>
          </Descriptions>
        ))}

        <Descriptions
          bordered
          column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
          size="middle"
          title="Total Payment Summary">
          <Descriptions.Item label="Total Payment">
            <h1 className=" font-bold"> ₦{totalPayment.toLocaleString()}</h1>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </>
  );
};

export default PaymentMadeOnCase;
