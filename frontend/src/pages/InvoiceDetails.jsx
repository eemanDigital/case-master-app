import { useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Descriptions, Button, Card, Spin, Alert, Row, Col } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";

const downloadURL = import.meta.env.VITE_BASE_URL;

const InvoiceDetails = () => {
  const { id } = useParams();

  const { dataFetcher, data, loading, error } = useDataFetch();
  const navigate = useNavigate();

  useEffect(() => {
    dataFetcher(`invoices/${id}`, "GET");
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

  const invoice = data?.data;

  //   download invoice handler
  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  // Retrieve token from browser cookies
  const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("jwt="))
    ?.split("=")[1];

  const handleDownloadInvoice = async (event, invoiceId) => {
    event.preventDefault();
    const response = await fetch(`${downloadURL}/invoices/pdf/${invoiceId}`, {
      method: "GET",
      headers: {
        ...fileHeaders,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoice.pdf"; // or any other filename you want
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <>
      <Button onClick={() => navigate(-1)}>Go Back</Button>

      <Card title="Invoice Details" bordered={false} style={{ width: "100%" }}>
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
                      <Descriptions.Item label="Amount">
                        {service?.amount}
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
            {invoice?.totalProfessionalFees}
          </Descriptions.Item>
          <Descriptions.Item label="Previous Balance">
            {invoice?.previousBalance}
          </Descriptions.Item>
          <Descriptions.Item label="Total Amount Due">
            {invoice?.totalAmountDue}
          </Descriptions.Item>
          <Descriptions.Item label="Total Invoice Amount">
            {invoice?.totalInvoiceAmount}
          </Descriptions.Item>
          <Descriptions.Item label="Amount Paid">
            {invoice?.amountPaid}
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
        </Descriptions>

        <Button onClick={(event) => handleDownloadInvoice(event, invoice._id)}>
          Download Invoice
        </Button>

        <Link to={`../invoices/${invoice._id}/update`}>
          <Button>Update Invoice</Button>
        </Link>
      </Card>
    </>
  );
};

export default InvoiceDetails;
