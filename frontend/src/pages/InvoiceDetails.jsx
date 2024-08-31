import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, Card, Row, Col, Typography, Alert } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";
import GoBackButton from "../components/GoBackButton";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import { useDownloadPdfHandler } from "../hooks/useDownloadPdfHandler";

const { Text } = Typography;
const downloadURL = import.meta.env.VITE_BASE_URL;

const InvoiceDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();
  const {
    handleDownloadPdf,
    loading: loadingPdf,
    error: pdfError,
  } = useDownloadPdfHandler();
  useRedirectLogoutUser("/users/login"); // redirect to login if user is not logged in

  // fetch data
  useEffect(() => {
    dataFetcher(`invoices/${id}`, "GET");
  }, [id, dataFetcher]);

  if (loading) return <LoadingSpinner />; // loader for page

  if (pdfError) {
    return (
      <div>
        <Alert message={pdfError || "Failed to download document"} />
      </div>
    ); //pdf error toast
  }

  const invoice = data?.data;

  return (
    <>
      <GoBackButton />
      {error ? (
        <PageErrorAlert errorCondition={error} errorMessage={error} />
      ) : (
        <div className="p-4 w-full overflow-x-scroll">
          <Card className="mb-4" title="Invoice Overview">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Invoice Reference:</Text>{" "}
                {invoice?.invoiceReference}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Client:</Text> {invoice?.client?.firstName}{" "}
                {invoice?.client?.secondName}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Work Title:</Text> {invoice?.workTitle}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Case:</Text>{" "}
                {invoice?.case?.firstParty?.name[0].name} Vs{" "}
                {invoice?.case?.secondParty?.name[0].name}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Due Date:</Text> {formatDate(invoice?.dueDate)}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Status:</Text> {invoice?.status}
              </Col>
            </Row>
          </Card>

          <Card className="mb-4" title="Services">
            {invoice?.services.map((service, index) => (
              <Card
                key={index}
                type="inner"
                title={`Service ${index + 1}`}
                className="mb-4">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong>Service Descriptions:</Text>{" "}
                    {service?.serviceDescriptions}
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong>Hours:</Text> {service?.hours}
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong>Date:</Text> {formatDate(service?.date)}
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong>Fee Rate per Hour:</Text> ₦
                    {service?.feeRatePerHour?.toFixed(2)}
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong>Amount:</Text> ₦{service?.amount.toFixed(2)}
                  </Col>
                </Row>
              </Card>
            ))}
          </Card>

          <Card className="mb-4" title="Expenses">
            {invoice?.expenses.map((expense, index) => (
              <Card
                key={index}
                type="inner"
                title={`Expense ${index + 1}`}
                className="mb-4">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong>Description:</Text> {expense?.description}
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong>Amount:</Text> ₦{expense?.amount.toFixed(2)}
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong>Date:</Text> {formatDate(expense?.date)}
                  </Col>
                </Row>
              </Card>
            ))}
          </Card>

          <Card className="mb-4" title="Financial Details">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Total Hours:</Text> {invoice?.totalHours}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Total Professional Fees:</Text> ₦
                {invoice?.totalProfessionalFees?.toFixed(2).toLocaleString()}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Total Expenses:</Text> ₦
                {invoice?.totalExpenses?.toFixed(2).toLocaleString()}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Previous Balance:</Text> ₦
                {invoice?.previousBalance?.toFixed(2).toLocaleString()}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Tax Amount:</Text> ₦
                {invoice?.taxAmount?.toFixed(2).toLocaleString()}{" "}
                {invoice?.taxType}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Total Amount With Tax:</Text> ₦
                {invoice?.totalAmountWithTax?.toFixed(2).toLocaleString()}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Total Invoice Amount:</Text> ₦
                {invoice?.totalInvoiceAmount?.toFixed(2).toLocaleString()}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Total Amount Due:</Text>
                <span className="text-rose-600 font-bold">
                  ₦{invoice?.totalAmountDue?.toFixed(2).toLocaleString()}
                </span>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Amount Paid:</Text> ₦
                {invoice?.amountPaid?.toFixed(2).toLocaleString()}
              </Col>
            </Row>
          </Card>

          <Card className="mb-4" title="Payment Details">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Account Name:</Text>{" "}
                {invoice?.accountDetails?.accountName}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Account Number:</Text>{" "}
                {invoice?.accountDetails?.accountNumber}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Bank:</Text> {invoice?.accountDetails?.bank}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Reference:</Text>{" "}
                {invoice?.accountDetails?.reference}
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Payment Instructions:</Text>{" "}
                {invoice?.paymentInstructionTAndC}
              </Col>
            </Row>
          </Card>

          <div className="flex flex-wrap gap-4">
            <Button
              loading={loadingPdf}
              onClick={(event) =>
                handleDownloadPdf(
                  event,
                  `${downloadURL}/invoices/pdf/${invoice?._id}`,
                  "invoice.pdf"
                )
              }
              className="bg-blue-500 text-white">
              Download Invoice
            </Button>

            <Link to={`../billings/invoices/${invoice?._id}/update`}>
              <Button className="bg-blue-500 text-white">Update Invoice</Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default InvoiceDetails;
