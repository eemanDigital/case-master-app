import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Table, Modal, Space, Button, Tag, Progress, Tooltip } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import moment from "moment";
import ButtonWithIcon from "../components/ButtonWithIcon";
import { formatDate } from "../utils/formatDate";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchBar from "../components/SearchBar";
import { deleteData } from "../redux/features/delete/deleteSlice";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const downloadURL = import.meta.env.VITE_BASE_URL;

const InvoiceList = () => {
  const {
    invoices,
    loading: loadingInvoices,
    error: errorInvoices,
    fetchData,
  } = useDataGetterHook();

  const [searchResults, setSearchResults] = useState([]);
  const { isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.delete,
  );

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isSuperOrAdmin = user?.data?.additionalRoles?.includes(
    "super-admin",
  ) || user?.data?.role === "admin";

  useRedirectLogoutUser("/users/login");

  useEffect(() => {
    fetchData("invoices", "invoices");
  }, [fetchData]);

  useEffect(() => {
    if (invoices?.data) {
      setSearchResults(invoices.data);
    }
  }, [invoices]);

  const handleSearchChange = useCallback(
    (e) => {
      const searchTerm = e.target.value.trim().toLowerCase();

      if (!searchTerm) {
        setSearchResults(invoices?.data);
        return;
      }

      const results = invoices?.data.filter((d) => {
        const clientNameMatch = `${d.client?.firstName} ${d.client?.lastName}`
          .toLowerCase()
          .includes(searchTerm);
        const invoiceNumberMatch = d.invoiceNumber
          ?.toLowerCase()
          .includes(searchTerm);
        const titleMatch = d.title?.toLowerCase().includes(searchTerm);
        const otherActivityMatch = d.otherActivity?.toLowerCase().includes(searchTerm);
        const matterMatch = d.matter?.matterNumber?.toLowerCase().includes(searchTerm);
        const statusMatch = d.status
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());

        return (
          clientNameMatch ||
          invoiceNumberMatch ||
          titleMatch ||
          otherActivityMatch ||
          matterMatch ||
          statusMatch
        );
      });

      setSearchResults(results);
    },
    [invoices?.data],
  );

  const deleteInvoice = async (id) => {
    try {
      await dispatch(deleteData(`invoices/${id}`));
    } catch (error) {
      toast.error("Failed to delete invoice");
    }
  };

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }
    if (isSuccess) {
      toast.success(message);
      fetchData();
    }
  }, [isError, isSuccess, message, fetchData]);

  const getStatusConfig = (status, dueDate, balance) => {
    const today = moment();
    const isOverdue = moment(dueDate).isBefore(today) && balance > 0;

    switch (status?.toLowerCase()) {
      case "paid":
        return { color: "green", text: "Paid" };
      case "partially_paid":
        return { color: "blue", text: "Partially Paid" };
      case "sent":
        return {
          color: isOverdue ? "red" : "orange",
          text: isOverdue ? "Overdue" : "Sent",
        };
      case "overdue":
        return { color: "red", text: "Overdue" };
      case "draft":
        return { color: "default", text: "Draft" };
      case "cancelled":
      case "void":
        return { color: "red", text: "Cancelled" };
      default:
        return { color: "default", text: status };
    }
  };

  const handleDownloadBillOfCharges = (invoiceNumber, id) => {
    window.open(
      `${downloadURL}/invoices/bill-of-charges/${id}`,
      "_blank"
    );
  };

  const columns = [
    {
      title: "Invoice Number",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      render: (invoiceNumber) => (
        <span className="font-semibold text-blue-600">{invoiceNumber}</span>
      ),
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      render: (client) =>
        client ? `${client.firstName} ${client.lastName || ""}` : "N/A",
      responsive: ["md"],
    },
    {
      title: "Matter/Other",
      key: "matterOther",
      render: (_, record) => (
        <div>
          {record.matter && (
            <div className="text-xs">
              <span className="text-purple-600 font-medium">
                {record.matter.matterNumber}
              </span>
              <div className="text-gray-500 truncate max-w-[120px]">
                {record.matter.title}
              </div>
            </div>
          )}
          {record.otherActivity && !record.matter && (
            <div className="text-xs">
              <span className="text-blue-600 font-medium">
                {record.otherActivity}
              </span>
            </div>
          )}
          {!record.matter && !record.otherActivity && (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
      responsive: ["lg"],
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (title) => (
        <span className="max-w-xs truncate block" title={title}>
          {title}
        </span>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (dueDate, record) => {
        const isPastDue =
          moment(dueDate).isBefore(moment()) && record.balance > 0;
        return (
          <div className={isPastDue ? "text-red-600 font-medium" : ""}>
            {formatDate(dueDate)}
          </div>
        );
      },
      sorter: (a, b) => moment(a.dueDate) - moment(b.dueDate),
    },
    {
      title: "Total",
      dataIndex: "total",
      key: "total",
      render: (total) => `₦${total?.toLocaleString()}`,
      sorter: (a, b) => a.total - b.total,
      responsive: ["lg"],
    },
    {
      title: "Balance",
      dataIndex: "balance",
      key: "balance",
      render: (balance) => (
        <span
          className={
            balance > 0
              ? "text-red-600 font-semibold"
              : "text-green-600 font-semibold"
          }>
          ₦{balance?.toLocaleString()}
        </span>
      ),
      responsive: ["lg"],
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      title: "Progress",
      dataIndex: "paymentProgress",
      key: "paymentProgress",
      render: (_, record) => {
        const progress =
          record.total > 0
            ? ((record.amountPaid || 0) / record.total) * 100
            : 0;
        return (
          <div className="w-20">
            <Progress
              percent={Math.round(progress)}
              size="small"
              showInfo={false}
              strokeColor={
                progress >= 100
                  ? "#52c41a"
                  : progress > 0
                  ? "#1890ff"
                  : "#d9d9d9"
              }
            />
            <div className="text-xs text-gray-500 text-center">
              {Math.round(progress)}%
            </div>
          </div>
        );
      },
      responsive: ["lg"],
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        const config = getStatusConfig(status, record.dueDate, record.balance);
        return (
          <Tag color={config.color} className="font-medium">
            {config.text.toUpperCase()}
          </Tag>
        );
      },
      filters: [
        { text: "Draft", value: "draft" },
        { text: "Sent", value: "sent" },
        { text: "Partially Paid", value: "partially_paid" },
        { text: "Paid", value: "paid" },
        { text: "Overdue", value: "overdue" },
        { text: "Cancelled", value: "cancelled" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Actions",
      key: "action",
      render: (text, record) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} className="text-blue-600 p-0">
            <Link to={`invoices/${record?._id}/details`}>View</Link>
          </Button>

          {isSuperOrAdmin && (
            <>
              <Tooltip title="Download Bill of Charges">
                <Button
                  type="link"
                  icon={<FilePdfOutlined />}
                  className="text-purple-600 p-0"
                  onClick={() => handleDownloadBillOfCharges(record.invoiceNumber, record._id)}
                />
              </Tooltip>
            </>
          )}

          {isSuperOrAdmin && record.status === "draft" && (
            <Button
              type="link"
              icon={<EditOutlined />}
              className="text-green-600 p-0">
              <Link to={`invoices/${record?._id}/update`}>Edit</Link>
            </Button>
          )}

          {isSuperOrAdmin && (
            <Button
              onClick={() => {
                Modal.confirm({
                  title: "Delete Invoice",
                  content:
                    "Are you sure you want to delete this invoice? This action cannot be undone.",
                  okText: "Delete",
                  okType: "danger",
                  cancelText: "Cancel",
                  onOk: () => deleteInvoice(record?._id),
                });
              }}
              type="link"
              danger
              icon={<DeleteOutlined />}
              loading={isLoading}
              className="p-0"
            />
          )}
        </Space>
      ),
      width: 120,
      fixed: "right",
    },
  ];

  if (loadingInvoices.invoices) return <LoadingSpinner />;

  return (
    <>
      {errorInvoices.invoices ? (
        <PageErrorAlert
          errorCondition={errorInvoices.invoices}
          errorMessage={errorInvoices.invoices}
        />
      ) : (
        <div className="p-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Invoices</h1>
              <p className="text-gray-600 mt-1">
                Manage and track all invoices
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <SearchBar onSearch={handleSearchChange} />

              {isSuperOrAdmin && (
                <Link to="invoices/add-invoices" className="sm:self-end">
                  <ButtonWithIcon
                    onClick={() => {}}
                    icon={<PlusOutlined className="mr-2" />}
                    text="Create Invoice"
                  />
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600">Total Invoices</div>
              <div className="text-2xl font-bold text-gray-800">
                {searchResults.length}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600">Overdue</div>
              <div className="text-2xl font-bold text-red-600">
                {
                  searchResults.filter(
                    (inv) =>
                      moment(inv.dueDate).isBefore(moment()) && inv.balance > 0,
                  ).length
                }
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600">Paid</div>
              <div className="text-2xl font-bold text-green-600">
                {
                  searchResults.filter((inv) => inv.status === "paid").length
                }
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-600">Outstanding</div>
              <div className="text-2xl font-bold text-orange-600">
                ₦
                {searchResults
                  .reduce((sum, inv) => sum + (inv.balance || 0), 0)
                  .toLocaleString()}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border">
            <Table
              className="font-medium font-poppins"
              columns={columns}
              dataSource={searchResults}
              rowKey="_id"
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, ranges) =>
                  `${ranges[0]}-${ranges[1]} of ${total} invoices`,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default InvoiceList;
