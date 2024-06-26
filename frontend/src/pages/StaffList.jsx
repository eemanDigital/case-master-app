import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link } from "react-router-dom";
import { useDataFetch } from "../hooks/useDataFetch";
import { Space, Table, Button, Spin, Alert, Modal } from "antd";
import avatar from "../assets/avatar.png";
import LeaveBalanceList from "./leaveBalanceList";
import { useAuthContext } from "../hooks/useAuthContext";
import CreateLeaveBalanceForm from "../components/CreateLeaveBalanceForm";

const StaffList = () => {
  const { users, loadingUsers, errorUsers } = useDataGetterHook();
  const { Column, ColumnGroup } = Table;
  //   const { user } = useAuthContext();
  const { dataFetcher } = useDataFetch();
  const { user } = useAuthContext();

  const isAdminOrHr =
    user?.data?.user?.role === "admin" || user?.data?.user?.role === "hr";
  const isAdmin = user?.data?.user?.role === "admin";

  if (loadingUsers) {
    return (
      <div>
        <Spin
          size="large"
          className="flex justify-center items-center h-full"
        />
      </div>
    );
  }

  if (errorUsers) {
    return (
      <Alert message="Error" description={errorUsers} type="error" showIcon />
    );
  }

  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };
  const handleDeleteUser = async (id) => {
    await dataFetcher(`users/${id}`, "delete", fileHeaders);
  };

  return (
    <>
      <div className="flex justify-start items-center gap-3 my-4">
        {isAdminOrHr && <LeaveBalanceList />}

        <Link to="leave-application-list">
          <Button className="bg-blue-500 text-white">
            {isAdminOrHr
              ? "Manage Leave Applications"
              : "Your Leave Applications"}
          </Button>
        </Link>
        {isAdmin && <CreateLeaveBalanceForm />}
      </div>
      <Table dataSource={users?.data}>
        <ColumnGroup title="Employee's Name">
          <Column
            title="Photo"
            dataIndex="photo"
            key="photo"
            render={(photo) => (
              <div className="flex items-center justify-center">
                <img
                  className="w-12 h-12 object-cover rounded-full"
                  src={
                    photo
                      ? `http://localhost:3000/images/users/${photo}`
                      : avatar
                  }
                />
              </div>
            )}
          />

          <Column title="First Name" dataIndex="firstName" key="firstName" />
          <Column title="Last Name" dataIndex="lastName" key="lastName" />
        </ColumnGroup>

        <Column title="Email" dataIndex="email" key="email" />
        <Column title="Role" dataIndex="role" key="role" />
        <Column title="Position" dataIndex="position" key="position" />
        {/* <Column title="Phone" dataIndex="phone" key="phone" /> */}

        <Column
          title="Action"
          key="action"
          render={(text, record) => (
            <Space size="middle">
              <Button type="link">
                <Link to={`/dashboard/staff/${record.id}/details`}>
                  Get Details
                </Link>
              </Button>
              <Button
                onClick={() => {
                  Modal.confirm({
                    title: "Are you sure you want to delete this user?",
                    onOk: () => handleDeleteUser(record.id),
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

export default StaffList;
