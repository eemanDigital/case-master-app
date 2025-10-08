import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Row,
  Col,
  Typography,
  Alert,
  Tag,
  Statistic,
  Divider,
  Badge,
  Progress,
  Descriptions,
} from "antd";
import {
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
  BankOutlined,
  DollarOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  DocumentArrowDownIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingLibraryIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { useDataFetch } from "../hooks/useDataFetch";
import { formatDate } from "../utils/formatDate";
import LoadingSpinner from "../components/LoadingSpinner";
import PageErrorAlert from "../components/PageErrorAlert";
import GoBackButton from "../components/GoBackButton";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import { useDownloadPdfHandler } from "../hooks/useDownloadPdfHandler";

const { Title, Text } = Typography;
const downloadURL = import.meta.env.VITE_BASE_URL;

// Add this function to calculate payment progress
const getPaymentProgress = (invoice) => {
  const total = invoice?.totalAmountWithTax || 0;
  const paid = invoice?.amountPaid || 0;
  return total > 0 ? Math.round((paid / total) * 100) : 0;
};

// Add this function to get payment status
const getPaymentStatus = (invoice) => {
  const progress = getPaymentProgress(invoice);
  if (progress >= 100) return { status: "success", text: "Fully Paid" };
  if (progress > 0) return { status: "active", text: "Partially Paid" };
  if (invoice?.status === "overdue")
    return { status: "exception", text: "Overdue" };
  return { status: "normal", text: "Unpaid" };
};

const InvoiceDetails = () => {
  const { id } = useParams();
  const { dataFetcher, data, loading, error } = useDataFetch();
  const {
    handleDownloadPdf,
    loading: loadingPdf,
    error: pdfError,
  } = useDownloadPdfHandler();
  useRedirectLogoutUser("/users/login");

  useEffect(() => {
    dataFetcher(`invoices/${id}`, "GET");
  }, [id, dataFetcher]);

  if (loading) return <LoadingSpinner />;

  if (pdfError) {
    return (
      <Alert
        message="Download Failed"
        description={pdfError || "Failed to download document"}
        type="error"
        showIcon
      />
    );
  }

  const invoice = data?.data;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "overdue":
        return "error";
      case "draft":
        return "default";
      default:
        return "processing";
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount?.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="container mx-auto py-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-200">
          <GoBackButton />

          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileTextOutlined className="text-blue-600 text-lg" />
                </div>
                <div>
                  <Title level={2} className="m-0 text-gray-900">
                    Invoice Details
                  </Title>
                  <Text className="text-gray-500">
                    {invoice?.invoiceReference}
                  </Text>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tag
                  color={getStatusColor(invoice?.status)}
                  className="text-sm font-semibold">
                  {invoice?.status}
                </Tag>
                {invoice?.dueDate && (
                  <Tag
                    color={
                      invoice?.status?.toLowerCase() === "overdue"
                        ? "red"
                        : "blue"
                    }
                    className="text-sm">
                    Due: {formatDate(invoice?.dueDate)}
                  </Tag>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              type="primary"
              loading={loadingPdf}
              icon={<DownloadOutlined />}
              onClick={(event) =>
                handleDownloadPdf(
                  event,
                  `${downloadURL}/invoices/pdf/${invoice?._id}`,
                  `invoice-${invoice?.invoiceReference}.pdf`
                )
              }
              className="bg-blue-600 hover:bg-blue-700 border-0 shadow-sm flex items-center gap-2">
              <DocumentArrowDownIcon className="w-4 h-4" />
              Download PDF
            </Button>
            <Link to={`../billings/invoices/${invoice?._id}/update`}>
              <Button
                icon={<EditOutlined />}
                className="border-blue-300 text-blue-600 hover:text-blue-700 flex items-center gap-2">
                Update Invoice
              </Button>
            </Link>
          </div>
        </div>

        {error ? (
          <PageErrorAlert errorCondition={error} errorMessage={error} />
        ) : (
          <div className="space-y-6">
            {/* Invoice Overview */}
            <Card className="border-0 rounded-2xl shadow-sm bg-gradient-to-br from-white to-blue-50/50">
              <div className="flex items-center gap-3 mb-6">
                <FileTextOutlined className="text-blue-600" />
                <Title level={3} className="m-0 text-gray-900">
                  Invoice Overview
                </Title>
              </div>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <UserOutlined className="text-green-600" />
                    <div>
                      <Text className="text-sm font-medium text-gray-600 block">
                        Client
                      </Text>
                      <Text className="font-semibold text-gray-900">
                        {invoice?.client?.firstName}{" "}
                        {invoice?.client?.secondName}
                      </Text>
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <BuildingLibraryIcon className="w-4 h-4 text-purple-600" />
                    <div>
                      <Text className="text-sm font-medium text-gray-600 block">
                        Case
                      </Text>
                      <Text className="font-semibold text-gray-900">
                        {invoice?.case?.firstParty?.name[0]?.name} vs{" "}
                        {invoice?.case?.secondParty?.name[0]?.name}
                      </Text>
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <DocumentTextIcon className="w-4 h-4 text-orange-600" />
                    <div>
                      <Text className="text-sm font-medium text-gray-600 block">
                        Work Title
                      </Text>
                      <Text className="font-semibold text-gray-900">
                        {invoice?.workTitle}
                      </Text>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Financial Summary */}
            {/* Enhanced Financial Summary */}
            <Card className="border-0 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <CalculatorOutlined className="text-green-600" />
                <Title level={3} className="m-0 text-gray-900">
                  Financial Summary
                </Title>
              </div>

              <Row gutter={[16, 16]}>
                <Col xs={12} md={6}>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Professional Fees
                    </Text>
                    <Text strong className="text-blue-600 text-lg block">
                      {formatCurrency(invoice?.totalProfessionalFees)}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {invoice?.totalHours} hours
                    </Text>
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Expenses
                    </Text>
                    <Text strong className="text-orange-600 text-lg block">
                      {formatCurrency(invoice?.totalExpenses)}
                    </Text>
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Total With Tax
                    </Text>
                    <Text strong className="text-green-600 text-lg block">
                      {formatCurrency(invoice?.totalAmountWithTax)}
                    </Text>
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div
                    className={`text-center p-3 rounded-lg border ${
                      invoice?.totalAmountDue > 0
                        ? "bg-red-50 border-red-200"
                        : "bg-green-50 border-green-200"
                    }`}>
                    <Text className="text-sm font-medium text-gray-600 block">
                      Balance Due
                    </Text>
                    <Text
                      strong
                      className={
                        invoice?.totalAmountDue > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }>
                      {formatCurrency(invoice?.totalAmountDue)}
                    </Text>
                    {invoice?.amountPaid > 0 && (
                      <Text className="text-xs text-gray-500">
                        {getPaymentProgress(invoice)}% paid
                      </Text>
                    )}
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Services Section */}
            <Card className="border-0 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <ClockIcon className="w-5 h-5 text-blue-600" />
                <Title level={3} className="m-0 text-gray-900">
                  Services ({invoice?.services?.length || 0})
                </Title>
              </div>
              <div className="space-y-4">
                {invoice?.services?.map((service, index) => (
                  <Card
                    key={index}
                    className="border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    styles={{ body: { padding: "16px" } }}>
                    <div className="flex items-center gap-3 mb-3">
                      <Badge count={index + 1} color="blue" />
                      <Text strong className="text-gray-900">
                        {service?.serviceDescriptions}
                      </Text>
                    </div>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <div className="space-y-1">
                          <Text className="text-sm text-gray-600">Hours</Text>
                          <Text strong className="text-gray-900 block">
                            {service?.hours}
                          </Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <div className="space-y-1">
                          <Text className="text-sm text-gray-600">Date</Text>
                          <Text strong className="text-gray-900 block">
                            {formatDate(service?.date)}
                          </Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <div className="space-y-1">
                          <Text className="text-sm text-gray-600">
                            Rate/Hour
                          </Text>
                          <Text strong className="text-gray-900 block">
                            {formatCurrency(service?.feeRatePerHour)}
                          </Text>
                        </div>
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <div className="space-y-1">
                          <Text className="text-sm text-gray-600">Amount</Text>
                          <Text strong className="text-green-600 block">
                            {formatCurrency(service?.amount)}
                          </Text>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            </Card>

            {/* Expenses Section */}
            {invoice?.expenses?.length > 0 && (
              <Card className="border-0 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <CurrencyDollarIcon className="w-5 h-5 text-orange-600" />
                  <Title level={3} className="m-0 text-gray-900">
                    Expenses ({invoice?.expenses?.length})
                  </Title>
                </div>
                <div className="space-y-4">
                  {invoice?.expenses?.map((expense, index) => (
                    <Card
                      key={index}
                      className="border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                      styles={{ body: { padding: "16px" } }}>
                      <div className="flex items-center gap-3 mb-3">
                        <Badge count={index + 1} color="orange" />
                        <Text strong className="text-gray-900">
                          {expense?.description}
                        </Text>
                      </div>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={8}>
                          <div className="space-y-1">
                            <Text className="text-sm text-gray-600">
                              Amount
                            </Text>
                            <Text strong className="text-red-600 block">
                              {formatCurrency(expense?.amount)}
                            </Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={8}>
                          <div className="space-y-1">
                            <Text className="text-sm text-gray-600">Date</Text>
                            <Text strong className="text-gray-900 block">
                              {formatDate(expense?.date)}
                            </Text>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {/* Payment Progress Section */}
            <Card className="border-0 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <DollarOutlined className="text-green-600" />
                <Title level={3} className="m-0 text-gray-900">
                  Payment Status
                </Title>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <Progress
                    type="circle"
                    percent={getPaymentProgress(invoice)}
                    status={getPaymentStatus(invoice).status}
                    format={(percent) => `${percent}%`}
                    width={80}
                  />
                  <Text className="block mt-2 font-semibold text-gray-900">
                    {getPaymentStatus(invoice).text}
                  </Text>
                </div>

                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <Text className="text-sm text-gray-600 block">
                        Total Amount
                      </Text>
                      <Text strong className="text-lg text-gray-900 block">
                        {formatCurrency(invoice?.totalAmountWithTax)}
                      </Text>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Text className="text-sm text-gray-600 block">
                        Amount Paid
                      </Text>
                      <Text strong className="text-lg text-blue-600 block">
                        {formatCurrency(invoice?.amountPaid)}
                      </Text>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <Text className="text-sm text-gray-600 block">
                        Balance Due
                      </Text>
                      <Text strong className="text-lg text-red-600 block">
                        {formatCurrency(invoice?.totalAmountDue)}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>

            {/* Tax & Additional Details Section */}
            <Card className="border-0 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <CalculatorOutlined className="text-purple-600" />
                <Title level={3} className="m-0 text-gray-900">
                  Tax & Additional Details
                </Title>
              </div>

              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Tax Type
                    </Text>
                    <Text className="font-semibold text-gray-900">
                      {invoice?.taxType || "Not Specified"}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Tax Rate
                    </Text>
                    <Text className="font-semibold text-gray-900">
                      {invoice?.taxRate || 0}%
                    </Text>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Tax Amount
                    </Text>
                    <Text className="font-semibold text-gray-900">
                      {formatCurrency(invoice?.taxAmount)}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Previous Balance
                    </Text>
                    <Text className="font-semibold text-gray-900">
                      {formatCurrency(invoice?.previousBalance)}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Total Hours
                    </Text>
                    <Text className="font-semibold text-gray-900">
                      {invoice?.totalHours || 0} hours
                    </Text>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Invoice Date
                    </Text>
                    <Text className="font-semibold text-gray-900">
                      {formatDate(invoice?.createdAt)}
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Detailed Financial Breakdown */}
            <Card className="border-0 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <FileTextOutlined className="text-blue-600" />
                <Title level={3} className="m-0 text-gray-900">
                  Financial Breakdown
                </Title>
              </div>

              <Descriptions bordered column={1} className="custom-descriptions">
                <Descriptions.Item label="Total Professional Fees">
                  <Text strong>
                    {formatCurrency(invoice?.totalProfessionalFees)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Total Expenses">
                  <Text strong>{formatCurrency(invoice?.totalExpenses)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Previous Balance">
                  <Text strong>{formatCurrency(invoice?.previousBalance)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Subtotal">
                  <Text strong>
                    {formatCurrency(
                      (invoice?.totalProfessionalFees || 0) +
                        (invoice?.totalExpenses || 0) +
                        (invoice?.previousBalance || 0)
                    )}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label={`Tax (${invoice?.taxRate || 0}%)`}>
                  <Text strong>{formatCurrency(invoice?.taxAmount)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Total Amount With Tax">
                  <Text strong className="text-green-600">
                    {formatCurrency(invoice?.totalAmountWithTax)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Amount Paid">
                  <Text strong className="text-blue-600">
                    {formatCurrency(invoice?.amountPaid)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Total Amount Due">
                  <Text
                    strong
                    className={
                      invoice?.totalAmountDue > 0
                        ? "text-red-600"
                        : "text-green-600"
                    }>
                    {formatCurrency(invoice?.totalAmountDue)}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Payment Details */}
            <Card className="border-0 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <BankOutlined className="text-green-600" />
                <Title level={3} className="m-0 text-gray-900">
                  Payment Details
                </Title>
              </div>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Account Name
                    </Text>
                    <Text className="font-semibold text-gray-900">
                      {invoice?.accountDetails?.accountName}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Account Number
                    </Text>
                    <Text className="font-semibold text-gray-900">
                      {invoice?.accountDetails?.accountNumber}
                    </Text>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Bank
                    </Text>
                    <Text className="font-semibold text-gray-900">
                      {invoice?.accountDetails?.bank}
                    </Text>
                  </div>
                </Col>
                <Col xs={24}>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Payment Instructions
                    </Text>
                    <Text className="text-gray-900">
                      {invoice?.paymentInstructionTAndC}
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetails;
