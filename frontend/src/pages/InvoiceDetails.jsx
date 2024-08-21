import { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Descriptions, Button, Card, Row, Col } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import { handleDownload } from "../utils/downloadHandler";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";

const downloadURL = import.meta.env.VITE_BASE_URL;

const InvoiceDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();
  const navigate = useNavigate();

  // fetch data
  useEffect(() => {
    dataFetcher(`invoices/${id}`, "GET");
  }, [id, dataFetcher]);

  if (loading) return <LoadingSpinner />;

  const invoice = data?.data;

  return (
    <>
      {error ? (
        <PageErrorAlert errorCondition={error} errorMessage={error} />
      ) : (
        <>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
          <Card
            className="text-black w-[100%] mt-4"
            title="Invoice Details"
            bordered={false}>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Invoice Reference">
                {invoice?.invoiceReference}
              </Descriptions.Item>
              <Descriptions.Item label="Client">
                {invoice?.client?.firstName} {invoice?.client?.secondName}
              </Descriptions.Item>
              <Descriptions.Item label="Work Title">
                {invoice?.workTitle}
              </Descriptions.Item>
              <Descriptions.Item label="Case">
                {invoice?.case?.firstParty?.name[0].name} Vs{" "}
                {invoice?.case?.secondParty?.name[0].name}
              </Descriptions.Item>
              <Descriptions.Item label="Services" span={1}>
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
              <Descriptions.Item label="Expenses" span={1}>
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
                ₦{invoice?.totalProfessionalFees?.toFixed(2).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Total Expenses">
                ₦{invoice?.totalExpenses?.toFixed(2).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Previous Balance">
                ₦{invoice?.previousBalance?.toFixed(2).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Tax Amount">
                ₦{invoice?.taxAmount?.toFixed(2).toLocaleString()}{" "}
                {invoice?.taxType}
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount With Tax">
                ₦{invoice?.totalAmountWithTax?.toFixed(2).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Total Invoice Amount">
                ₦{invoice?.totalInvoiceAmount?.toFixed(2).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount Due">
                ₦{invoice?.totalAmountDue?.toFixed(2).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Amount Paid">
                ₦{invoice?.amountPaid?.toFixed(2).toLocaleString()}
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
              <Descriptions.Item label="Reference">
                {invoice?.accountDetails?.reference}
              </Descriptions.Item>
              <Descriptions.Item
                label="Payment Instructions/Terms and Conditions"
                span={3}>
                {invoice?.paymentInstructionTAndC}
              </Descriptions.Item>
            </Descriptions>

            <Button
              onClick={(event) =>
                handleDownload(
                  event,
                  `${downloadURL}/invoices/pdf/${invoice?._id}`,
                  "invoice.pdf"
                )
              }>
              Download Invoice
            </Button>

            <Link to={`../billings/invoices/${invoice?._id}/update`}>
              <Button>Update Invoice</Button>
            </Link>
          </Card>
        </>
      )}
    </>
  );
};

export default InvoiceDetails;
