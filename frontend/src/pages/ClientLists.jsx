import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link } from "react-router-dom";
import { Space, Table, Button, Spin, Alert, Modal, Divider } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import AddClientForm from "../components/AddClientForm";

const ClientLists = () => {
  const { clients, loadingClients, errorClients } = useDataGetterHook();
  const { Column, ColumnGroup } = Table;

  // console.log(clients.data);

  const { data, loading, error, dataFetcher } = useDataFetch();

  if (loadingClients) {
    return (
      <Spin size="large" className="flex justify-center items-center h-full" />
    );
  }

  if (errorClients) {
    return (
      <Alert message="Error" description={errorClients} type="error" showIcon />
    );
  }
  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };
  // delete leave app
  const handleDeleteApp = async (id) => {
    await dataFetcher(`clients/${id}`, "delete", fileHeaders);
  };

  return (
    <>
      <AddClientForm />
      <Divider />
      <Table dataSource={clients?.data}>
        <ColumnGroup title="Client Lists">
          <Column title="Client's Name" dataIndex="firstName" key="firstName" />
          <Column title="Second Name" dataIndex="secondName" key="secondName" />
        </ColumnGroup>

        <Column title="Client Email" dataIndex="email" key="email" />
        <Column title="Phone" dataIndex="phone" key="phone" />
        {/* <Column title="Type of Leave" dataIndex="typeOfLeave" key="typeOfLeave" /> */}

        <Column
          title="Action"
          key="action"
          render={(text, record) => (
            <Space size="middle">
              <Button type="link">
                <Link to={`${record?.id}/details`}>Get Details</Link>
              </Button>
              <Button
                onClick={() => {
                  Modal.confirm({
                    title:
                      "Are you sure you want to delete this client information?",
                    onOk: () => handleDeleteApp(record?.id),
                  });
                }}
                type="primary"
                danger>
                Delete
              </Button>
            </Space>
          )}
        />
      </Table>
    </>
  );
};

export default ClientLists;
