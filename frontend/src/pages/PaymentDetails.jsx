import { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Descriptions, Button, Card, Spin, Alert, Row, Col } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import CreatePaymentForm from "./CreatePaymentForm";

const PaymentDetails = () => {
  const { id } = useParams();

  const { dataFetcher, data, loading, error } = useDataFetch();
  const navigate = useNavigate();

  //   console.log(data);

  useEffect(() => {
    dataFetcher(`payments/${id}`, "GET");
  }, [id]);

  if (loading) return <Spin tip="Loading..." />;
  if (error)
    return (
      <Alert
        message="Error"
        description={error.message}
        type="error"
        showIcon
      />
    );

  const payment = data?.data;
  const invoice = payment?.invoiceId;

  return (
    <>
      <Button onClick={() => navigate(-1)}>Go Back</Button>
      <CreatePaymentForm />
      <Card
        className="text-black w-[100%] mt-4"
        title="Payment Details"
        bordered={false}>
        <Descriptions
          bordered
          column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
          size="middle">
          <Descriptions.Item label="Payment ID">
            {payment?._id}
          </Descriptions.Item>
          <Descriptions.Item label="Amount Paid">
            ₦{payment?.amountPaid.toFixed(2).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Total Amount Due">
            ₦{payment?.totalAmountDue.toFixed(2).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Method">
            {payment?.method}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Date">
            {formatDate(payment?.date)}
          </Descriptions.Item>
          <Descriptions.Item label="Balance">
            ₦{payment?.balance.toFixed(2).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        className="text-black w-[100%] mt-4"
        title="Invoice Details"
        bordered={false}>
        <Descriptions
          bordered
          column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 3 }}
          size="middle">
          <Descriptions.Item label="Invoice Reference">
            {invoice?.invoiceReference}
          </Descriptions.Item>
          <Descriptions.Item label="Client">
            {invoice?.client?.firstName} {invoice?.client?.secondName}
          </Descriptions.Item>
          <Descriptions.Item label="Work Title">
            {invoice?.workTitle}
          </Descriptions.Item>
          <Descriptions.Item label="Services" span={3}>
            {invoice?.services.map((service, index) => (
              <Card
                key={index}
                type="inner"
                title={`Service ${index + 1}`}
                bordered={false}
                style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                    <Descriptions column={1} size="small" bordered={false}>
                      <Descriptions.Item label="Service Descriptions">
                        {service?.serviceDescriptions}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                    <Descriptions column={1} size="small" bordered={false}>
                      <Descriptions.Item label="Hours">
                        {service?.hours}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                    <Descriptions column={1} size="small" bordered={false}>
                      <Descriptions.Item label="Date">
                        {formatDate(service?.date)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                    <Descriptions column={1} size="small" bordered={false}>
                      <Descriptions.Item label="Fee Rate per Hour">
                        ₦{service?.feeRatePerHour?.toFixed(2)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                    <Descriptions column={1} size="small" bordered={false}>
                      <Descriptions.Item label="Amount">
                        ₦{service?.amount.toFixed(2)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                </Row>
              </Card>
            ))}
          </Descriptions.Item>
          <Descriptions.Item label="Expenses" span={3}>
            {invoice?.expenses.map((expense, index) => (
              <Card
                key={index}
                type="inner"
                title={`Expense ${index + 1}`}
                bordered={false}
                style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                    <Descriptions column={1} size="small" bordered={false}>
                      <Descriptions.Item label="Description">
                        {expense?.description}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                    <Descriptions column={1} size="small" bordered={false}>
                      <Descriptions.Item label="Amount">
                        ₦{expense?.amount.toFixed(2)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                  <Col xs={24} sm={24} md={12} lg={8} xl={8}>
                    <Descriptions column={1} size="small" bordered={false}>
                      <Descriptions.Item label="Date">
                        {formatDate(expense?.date)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                </Row>
              </Card>
            ))}
          </Descriptions.Item>
          <Descriptions.Item label="Due Date">
            {formatDate(invoice?.dueDate)}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {invoice?.status}
          </Descriptions.Item>
          <Descriptions.Item label="Total Hours">
            {invoice?.totalHours}
          </Descriptions.Item>
          <Descriptions.Item label="Total Professional Fees">
            ₦{invoice?.totalProfessionalFees.toFixed(2).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Total Expenses">
            ₦{invoice?.totalExpenses.toFixed(2).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Previous Balance">
            ₦{invoice?.previousBalance.toFixed(2).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Tax Amount">
            ₦{invoice?.taxAmount.toFixed(2).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Total Amount With Tax">
            ₦{invoice?.totalAmountWithTax.toFixed(2).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Total Invoice Amount">
            ₦{invoice?.totalInvoiceAmount.toFixed(2).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Total Amount Due">
            ₦{invoice?.totalAmountDue.toFixed(2).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Amount Paid">
            ₦{invoice?.amountPaid.toFixed(2).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Account Name">
            {invoice?.accountDetails?.accountName}
          </Descriptions.Item>
          <Descriptions.Item label="Account Number">
            {invoice?.accountDetails?.accountNumber}
          </Descriptions.Item>
          <Descriptions.Item label="Bank">
            {invoice?.accountDetails?.bank}
          </Descriptions.Item>
          <Descriptions.Item
            label="Payment Instructions/Terms and Conditions"
            span={3}>
            {invoice?.paymentInstructionTAndC}
          </Descriptions.Item>
        </Descriptions>

        <Link to={`../billings/invoices/${invoice._id}/update`}>
          <Button>Update Payment</Button>
        </Link>
      </Card>
    </>
  );
};

export default PaymentDetails;
