import { useState } from "react";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAuthContext } from "../hooks/useAuthContext";
import { Space, Table, Button, Spin, Alert, Modal } from "antd";
import { useDataFetch } from "../hooks/useDataFetch";
import avatar from "../assets/avatar.png";

const { Column, ColumnGroup } = Table;

const LeaveBalanceList = () => {
  const { leaveBalance, loadingLeaveBalance, errorLeaveBalance } =
    useDataGetterHook();

  // console.log("LB", leaveBalance);

  const { user } = useAuthContext(); //user from context

  // Modal
  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [modalText, setModalText] = useState("Content of the modal");
  const showModal = () => {
    setOpen(true);
  };
  const handleOk = () => {
    setModalText("The modal will be closed after two seconds");
    setConfirmLoading(true);
    setTimeout(() => {
      setOpen(false);
      setConfirmLoading(false);
    }, 2000);
  };
  const handleCancel = () => {
    console.log("Clicked cancel button");
    setOpen(false);
  };

  const { data, loading, error, dataFetcher } = useDataFetch();

  // console.log(data);

  if (loadingLeaveBalance) {
    return (
      <Spin size="large" className="flex justify-center items-center h-full" />
    );
  }

  if (errorLeaveBalance) {
    return (
      <Alert
        message="Error"
        description={errorLeaveBalance}
        type="error"
        showIcon
      />
    );
  }
  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };
  // delete leave app
  const handleDeleteBalance = async (id) => {
    await dataFetcher(`leaves/balances/${id}`, "delete", fileHeaders);
  };

  // Filter the leave applications based on the user's role
  const filteredLeaveBalance =
    user?.data?.user?.role === "admin" || user?.data?.user?.role === "hr"
      ? leaveBalance?.data
      : leaveBalance?.data?.filter(
          (balance) => balance.employee.id === user?.data?.user?.id
        );

  // console.log("BA", filteredLeaveBalance);

  return (
    <>
      <Button onClick={showModal} className="bg-green-700 text-white">
        See All Leave Balance
      </Button>
      <Modal
        width={1000}
        title="Leave Balance List"
        open={open}
        onOk={handleOk}
        confirmLoading={loadingLeaveBalance}
        onCancel={handleCancel}>
        <Table dataSource={filteredLeaveBalance}>
          <ColumnGroup title="Employee's Name">
            <Column
              title="Photo"
              dataIndex={["employee", "photo"]}
              key="photo"
              render={(photo, record) => (
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

            <Column
              title="First Name"
              dataIndex={["employee", "firstName"]}
              key="employee.firstName"
            />
            <Column
              title="Last Name"
              dataIndex={["employee", "lastName"]}
              key="employee.lastName"
            />
          </ColumnGroup>

          <Column
            title="Annual Leave Balance"
            dataIndex="annualLeaveBalance"
            key="annualLeaveBalance"
          />
          <Column
            title="Sick Leave Balance"
            dataIndex="sickLeaveBalance"
            key="sickLeaveBalance"
          />

          <Column
            title="Action"
            key="action"
            render={(text, record) => (
              <Space size="middle">
                {/* <Button type="link">
              <Link to={`/dashboard/leave-application/${record?.id}/details`}>
                Get Details
              </Link>
            </Button> */}
                <Button
                  onClick={() => {
                    Modal.confirm({
                      title:
                        "Are you sure you want to delete this application?",
                      onOk: () => handleDeleteBalance(record?.id),
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
      </Modal>
    </>
  );
};

export default LeaveBalanceList;
