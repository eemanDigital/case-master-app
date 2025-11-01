// export default InvoiceDetails;
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Row,
  Col,
  Typography,
  Alert,
  Tag,
  Modal,
  Badge,
  Progress,
  Descriptions,
  Timeline,
} from "antd";
import {
  DownloadOutlined,
  EditOutlined,
  FileTextOutlined,
  UserOutlined,
  DollarOutlined,
  CalculatorOutlined,
  PlusOutlined,
  CheckCircleOutlined,
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
import CreatePaymentForm from "./CreatePaymentForm";

const { Title, Text } = Typography;
const downloadURL = import.meta.env.VITE_BASE_URL;

const getPaymentProgress = (invoice) => {
  const total = invoice?.total || 0;
  const paid = invoice?.amountPaid || 0;
  return total > 0 ? Math.round((paid / total) * 100) : 0;
};

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
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const {
    handleDownloadPdf,
    loading: loadingPdf,
    error: pdfError,
  } = useDownloadPdfHandler();
  useRedirectLogoutUser("/users/login");

  useEffect(() => {
    dataFetcher(`invoices/${id}`, "GET");
  }, [id, dataFetcher]);

  const refreshInvoiceData = () => {
    dataFetcher(`invoices/${id}`, "GET");
  };

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
      case "partially_paid":
        return "processing";
      case "sent":
        return "blue";
      case "overdue":
        return "error";
      case "draft":
        return "default";
      case "cancelled":
      case "void":
        return "red";
      default:
        return "processing";
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₦0.00";
    return `₦${amount?.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
  };

  const getPaymentMethodLabel = (method) => {
    const methods = {
      credit_card: "Credit Card",
      bank_transfer: "Bank Transfer",
      cash: "Cash",
      cheque: "Cheque",
      other: "Other",
    };
    return methods[method] || method;
  };

  const getBillingMethodLabel = (method) => {
    const methods = {
      hourly: "Hourly",
      fixed_fee: "Fixed Fee",
      contingency: "Contingency",
      retainer: "Retainer",
      item: "Item-based",
    };
    return methods[method] || method;
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
                    {invoice?.invoiceNumber}
                  </Text>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tag
                  color={getStatusColor(invoice?.status)}
                  className="text-sm font-semibold">
                  {invoice?.status?.replace("_", " ")?.toUpperCase()}
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
                {invoice?.issueDate && (
                  <Tag color="green" className="text-sm">
                    Issued: {formatDate(invoice?.issueDate)}
                  </Tag>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Record Payment Button */}
            {invoice?.status !== "paid" &&
              invoice?.status !== "draft" &&
              invoice?.status !== "cancelled" && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setPaymentModalVisible(true)}
                  className="bg-green-600 hover:bg-green-700 border-0">
                  Record Payment
                </Button>
              )}

            {/* Download PDF Button */}
            <Button
              type="primary"
              loading={loadingPdf}
              icon={<DownloadOutlined />}
              onClick={(event) =>
                handleDownloadPdf(
                  event,
                  `${downloadURL}/invoices/pdf/${invoice?._id}`,
                  `invoice-${invoice?.invoiceNumber}.pdf`
                )
              }
              className="bg-blue-600 hover:bg-blue-700 border-0">
              <DocumentArrowDownIcon className="w-4 h-4" />
              Download PDF
            </Button>

            {/* Update Invoice Button */}
            <Link to={`../billings/invoices/${invoice?._id}/update`}>
              <Button
                icon={<EditOutlined />}
                className="border-blue-300 text-blue-600 hover:text-blue-700">
                Update Invoice
              </Button>
            </Link>

            {/* Add Payment Modal (always rendered, controlled by state) */}
            <Modal
              open={paymentModalVisible}
              onCancel={() => setPaymentModalVisible(false)}
              footer={null}
              width={800}
              title="Record Payment">
              <CreatePaymentForm
                invoiceId={invoice?._id}
                clientId={invoice?.client?._id}
                caseId={invoice?.case?._id}
                invoiceNumber={invoice?.invoiceNumber}
                currentBalance={invoice?.balance}
                onSuccess={() => {
                  setPaymentModalVisible(false);
                  refreshInvoiceData();
                }}
                onCancel={() => setPaymentModalVisible(false)}
              />
            </Modal>
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
                        {invoice?.client?.firstName} {invoice?.client?.lastName}
                      </Text>
                      <Text className="text-xs text-gray-500 block">
                        {invoice?.client?.email}
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
                        {invoice?.case?.suitNo || "No Case"}
                      </Text>
                      <Text className="text-xs text-gray-500 block">
                        {invoice?.case?.firstParty?.name?.[0]?.name} vs{" "}
                        {invoice?.case?.secondParty?.name?.[0]?.name}
                      </Text>
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                    <DocumentTextIcon className="w-4 h-4 text-orange-600" />
                    <div>
                      <Text className="text-sm font-medium text-gray-600 block">
                        Title
                      </Text>
                      <Text className="font-semibold text-gray-900">
                        {invoice?.title}
                      </Text>
                    </div>
                  </div>
                </Col>
              </Row>
              {invoice?.description && (
                <Row gutter={[16, 16]} className="mt-4">
                  <Col xs={24}>
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <Text className="text-sm font-medium text-gray-600 block mb-2">
                        Description
                      </Text>
                      <Text className="text-gray-900">
                        {invoice?.description}
                      </Text>
                    </div>
                  </Col>
                </Row>
              )}
            </Card>

            {/* Financial Summary */}
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
                      Subtotal
                    </Text>
                    <Text strong className="text-blue-600 text-lg block">
                      {formatCurrency(invoice?.subtotal)}
                    </Text>
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Tax Amount
                    </Text>
                    <Text strong className="text-orange-600 text-lg block">
                      {formatCurrency(invoice?.taxAmount)}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {invoice?.taxRate}% rate
                    </Text>
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <Text className="text-sm font-medium text-gray-600 block">
                      Total Amount
                    </Text>
                    <Text strong className="text-green-600 text-lg block">
                      {formatCurrency(invoice?.total)}
                    </Text>
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div
                    className={`text-center p-3 rounded-lg border ${
                      invoice?.balance > 0
                        ? "bg-red-50 border-red-200"
                        : "bg-green-50 border-green-200"
                    }`}>
                    <Text className="text-sm font-medium text-gray-600 block">
                      Balance Due
                    </Text>
                    <Text
                      strong
                      className={`text-lg block ${
                        invoice?.balance > 0 ? "text-red-600" : "text-green-600"
                      }`}>
                      {formatCurrency(invoice?.balance)}
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

            {/* Payment History Section */}
            {invoice?.payments && invoice.payments.length > 0 && (
              <Card className="border-0 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <DollarOutlined className="text-green-600" />
                  <Title level={3} className="m-0 text-gray-900">
                    Payment History ({invoice.payments.length})
                  </Title>
                </div>

                <Timeline
                  mode="left"
                  items={invoice.payments.map((payment, index) => ({
                    color:
                      payment.status === "completed"
                        ? "green"
                        : payment.status === "pending"
                        ? "orange"
                        : "red",
                    dot:
                      payment.status === "completed" ? (
                        <CheckCircleOutlined style={{ fontSize: "16px" }} />
                      ) : (
                        <ClockIcon className="w-4 h-4" />
                      ),
                    children: (
                      <Card
                        className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                        size="small">
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12} md={6}>
                            <div className="space-y-1">
                              <Text className="text-sm text-gray-600">
                                Amount
                              </Text>
                              <Text
                                strong
                                className={`block text-lg ${
                                  payment.status === "completed"
                                    ? "text-green-600"
                                    : payment.status === "pending"
                                    ? "text-orange-600"
                                    : "text-red-600"
                                }`}>
                                {formatCurrency(payment.amount)}
                              </Text>
                            </div>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <div className="space-y-1">
                              <Text className="text-sm text-gray-600">
                                Date
                              </Text>
                              <Text strong className="text-gray-900 block">
                                {formatDate(payment.paymentDate)}
                              </Text>
                            </div>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <div className="space-y-1">
                              <Text className="text-sm text-gray-600">
                                Method
                              </Text>
                              <Tag color="blue">
                                {getPaymentMethodLabel(payment.method)}
                              </Tag>
                            </div>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <div className="space-y-1">
                              <Text className="text-sm text-gray-600">
                                Status
                              </Text>
                              <Tag
                                color={
                                  payment.status === "completed"
                                    ? "green"
                                    : payment.status === "pending"
                                    ? "orange"
                                    : "red"
                                }>
                                {payment.status?.toUpperCase()}
                              </Tag>
                            </div>
                          </Col>
                          {payment.reference && (
                            <Col xs={24} sm={12} md={6}>
                              <div className="space-y-1">
                                <Text className="text-sm text-gray-600">
                                  Reference
                                </Text>
                                <Text strong className="text-gray-900 block">
                                  {payment.reference}
                                </Text>
                              </div>
                            </Col>
                          )}
                          {payment.notes && (
                            <Col xs={24}>
                              <div className="space-y-1">
                                <Text className="text-sm text-gray-600">
                                  Notes
                                </Text>
                                <Text className="text-gray-900 block">
                                  {payment.notes}
                                </Text>
                              </div>
                            </Col>
                          )}
                        </Row>
                      </Card>
                    ),
                  }))}
                />
              </Card>
            )}

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
                      <div>
                        <Text strong className="text-gray-900 block">
                          {service?.description}
                        </Text>
                        <div className="flex gap-2 mt-1">
                          <Tag color="blue">
                            {getBillingMethodLabel(service?.billingMethod)}
                          </Tag>
                          <Tag color="green">{service?.category}</Tag>
                        </div>
                      </div>
                    </div>
                    <Row gutter={[16, 16]}>
                      {service?.billingMethod === "hourly" && (
                        <>
                          <Col xs={24} sm={12} md={6}>
                            <div className="space-y-1">
                              <Text className="text-sm text-gray-600">
                                Hours
                              </Text>
                              <Text strong className="text-gray-900 block">
                                {service?.hours}
                              </Text>
                            </div>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <div className="space-y-1">
                              <Text className="text-sm text-gray-600">
                                Rate/Hour
                              </Text>
                              <Text strong className="text-gray-900 block">
                                {formatCurrency(service?.rate)}
                              </Text>
                            </div>
                          </Col>
                        </>
                      )}
                      {service?.billingMethod === "fixed_fee" && (
                        <Col xs={24} sm={12} md={6}>
                          <div className="space-y-1">
                            <Text className="text-sm text-gray-600">
                              Fixed Amount
                            </Text>
                            <Text strong className="text-gray-900 block">
                              {formatCurrency(service?.fixedAmount)}
                            </Text>
                          </div>
                        </Col>
                      )}
                      {service?.billingMethod === "item" && (
                        <>
                          <Col xs={24} sm={12} md={6}>
                            <div className="space-y-1">
                              <Text className="text-sm text-gray-600">
                                Quantity
                              </Text>
                              <Text strong className="text-gray-900 block">
                                {service?.quantity}
                              </Text>
                            </div>
                          </Col>
                          <Col xs={24} sm={12} md={6}>
                            <div className="space-y-1">
                              <Text className="text-sm text-gray-600">
                                Unit Price
                              </Text>
                              <Text strong className="text-gray-900 block">
                                {formatCurrency(service?.unitPrice)}
                              </Text>
                            </div>
                          </Col>
                        </>
                      )}
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
                        <div>
                          <Text strong className="text-gray-900 block">
                            {expense?.description}
                          </Text>
                          <div className="flex gap-2 mt-1">
                            <Tag color="orange">{expense?.category}</Tag>
                            {expense?.isReimbursable && (
                              <Tag color="green">Reimbursable</Tag>
                            )}
                          </div>
                        </div>
                      </div>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} md={6}>
                          <div className="space-y-1">
                            <Text className="text-sm text-gray-600">
                              Amount
                            </Text>
                            <Text strong className="text-red-600 block">
                              {formatCurrency(expense?.amount)}
                            </Text>
                          </div>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                          <div className="space-y-1">
                            <Text className="text-sm text-gray-600">Date</Text>
                            <Text strong className="text-gray-900 block">
                              {formatDate(expense?.date)}
                            </Text>
                          </div>
                        </Col>
                        {expense?.receiptNumber && (
                          <Col xs={24} sm={12} md={6}>
                            <div className="space-y-1">
                              <Text className="text-sm text-gray-600">
                                Receipt No.
                              </Text>
                              <Text strong className="text-gray-900 block">
                                {expense?.receiptNumber}
                              </Text>
                            </div>
                          </Col>
                        )}
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
                        {formatCurrency(invoice?.total)}
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
                        {formatCurrency(invoice?.balance)}
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
                {invoice?.discount > 0 && (
                  <>
                    <Col xs={24} md={8}>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <Text className="text-sm font-medium text-gray-600 block">
                          Discount Type
                        </Text>
                        <Text className="font-semibold text-gray-900">
                          {invoice?.discountType}
                        </Text>
                      </div>
                    </Col>
                    <Col xs={24} md={8}>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <Text className="text-sm font-medium text-gray-600 block">
                          Discount Amount
                        </Text>
                        <Text className="font-semibold text-gray-900">
                          {formatCurrency(invoice?.discount)}
                        </Text>
                      </div>
                    </Col>
                    {invoice?.discountReason && (
                      <Col xs={24} md={8}>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <Text className="text-sm font-medium text-gray-600 block">
                            Discount Reason
                          </Text>
                          <Text className="font-semibold text-gray-900">
                            {invoice?.discountReason}
                          </Text>
                        </div>
                      </Col>
                    )}
                  </>
                )}
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
                <Descriptions.Item label="Subtotal">
                  <Text strong>{formatCurrency(invoice?.subtotal)}</Text>
                </Descriptions.Item>
                {invoice?.discount > 0 && (
                  <Descriptions.Item
                    label={`Discount (${invoice?.discountType})`}>
                    <Text strong className="text-orange-600">
                      -{formatCurrency(invoice?.discount)}
                    </Text>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label={`Tax (${invoice?.taxRate || 0}%)`}>
                  <Text strong>{formatCurrency(invoice?.taxAmount)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Total Amount">
                  <Text strong className="text-green-600">
                    {formatCurrency(invoice?.total)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Amount Paid">
                  <Text strong className="text-blue-600">
                    {formatCurrency(invoice?.amountPaid)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Balance Due">
                  <Text
                    strong
                    className={
                      invoice?.balance > 0 ? "text-red-600" : "text-green-600"
                    }>
                    {formatCurrency(invoice?.balance)}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Payment Terms */}
            {invoice?.paymentTerms && (
              <Card className="border-0 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <BuildingLibraryIcon className="w-5 h-5 text-green-600" />
                  <Title level={3} className="m-0 text-gray-900">
                    Payment Terms
                  </Title>
                </div>
                <Row gutter={[16, 16]}>
                  <Col xs={24}>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Text className="text-sm font-medium text-gray-600 block mb-2">
                        Payment Terms
                      </Text>
                      <Text className="text-gray-900">
                        {invoice?.paymentTerms}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {/* <AddPaymentModal
        visible={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        onSuccess={refreshInvoiceData}
        invoice={invoice}
        apiHandler={dataFetcher}
      /> */}
    </div>
  );
};
export default InvoiceDetails;
