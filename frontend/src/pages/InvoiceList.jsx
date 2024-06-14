import { Link } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { formatDate } from "../utils/formatDate";
import { Table, Modal, Space, Button } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";

const InvoiceList = () => {
  const { data, loading, error, dataFetcher } = useDataFetch();
  const { invoices, laodingInvoices, errorInvoices } = useDataGetterHook();

  //   console.log(invoices?.data[0]._id);

  //   handle delete
  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };

  const handleDeleteInvoice = async (id) => {
    await dataFetcher(`invoices/${id}`, "delete", fileHeaders);
  };

  const columns = [
    {
      title: "Invoice Reference",
      dataIndex: "invoiceReference",
      key: "invoiceReference",
    },
    {
      title: "Client",
      dataIndex: "client",
      key: "client",
      render: (client) => (client ? client.firstName : "N/A"),
    },
    {
      title: "Work Title",
      dataIndex: "workTitle",
      key: "workTitle",
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (dueDate) => formatDate(dueDate),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Action",
      key: "action",
      render: (text, record) => (
        <Space size="middle">
          <Button type="link">
            <Link to={`invoices/${record?._id}/details`}>Get Details</Link>
          </Button>
          <Button
            onClick={() => {
              Modal.confirm({
                title: "Are you sure you want to delete this invoice?",
                onOk: () => handleDeleteInvoice(record?._id),
              });
            }}
            type="primary"
            danger>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-700 mb-7">Invoices</h1>
      <Table columns={columns} dataSource={invoices?.data} rowKey="_id" />
    </div>
  );
};

export default InvoiceList;
