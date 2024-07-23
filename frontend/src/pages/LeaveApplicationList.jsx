import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { Space, Table, Button, Spin, Alert, Modal } from "antd";
import { formatDate } from "../utils/formatDate";
import { useDataFetch } from "../hooks/useDataFetch";
import avatar from "../assets/avatar.png";

const LeaveApplicationList = () => {
  const { leaveApps, loadingLeaveApp, errorLeaveApp } = useDataGetterHook();
  const { Column, ColumnGroup } = Table;
  const { user } = useAuthContext();

  // const userId = user?.data?.user?.id

  const { data, loading, error, dataFetcher } = useDataFetch();

  if (loadingLeaveApp) {
    return (
      <Spin size="large" className="flex justify-center items-center h-full" />
    );
  }

  if (errorLeaveApp) {
    return (
      <Alert
        message="Error"
        description={errorLeaveApp}
        type="error"
        showIcon
      />
    );
  }
  const fileHeaders = {
    "Content-Type": "multipart/form-data",
  };
  // delete leave app
  const handleDeleteApp = async (id) => {
    await dataFetcher(`leaves/applications/${id}`, "delete", fileHeaders);
  };

  // Filter the leave applications based on the user's role
  const filteredLeaveApps =
    user?.data?.user?.role === "admin" || user?.data?.user?.role === "hr"
      ? leaveApps?.data
      : leaveApps?.data?.filter(
          (app) => app?.employee?.id === user?.data?.user?.id
        );

  // console.log(filteredLeaveApps);

  return (
    <Table dataSource={filteredLeaveApps}>
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
                  photo ? `http://localhost:3000/images/users/${photo}` : avatar
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
        title="Start Date"
        dataIndex="startDate"
        key="startDate"
        render={(date) => formatDate(date || null)}
      />
      <Column
        title="End Date"
        dataIndex="endDate"
        key="endDate"
        render={(date) => formatDate(date || null)}
      />
      <Column title="Type of Leave" dataIndex="typeOfLeave" key="typeOfLeave" />
      <Column
        title="status"
        dataIndex="status"
        key="status"
        render={(text, record) => (
          <div
            className={
              record?.status === "approved"
                ? "bg-green-500 p-1 text-center text-white rounded-md"
                : record?.status === "pending"
                ? "bg-yellow-500 p-1 text-center text-white rounded-md"
                : "bg-red-500 p-1 text-center text-white rounded-md"
            }>
            {text}
          </div>
        )}
      />

      <Column
        title="Action"
        key="action"
        render={(text, record) => (
          <Space size="middle">
            <Button type="link">
              <Link to={`/dashboard/leave-application/${record?.id}/details`}>
                Get Details
              </Link>
            </Button>
            <Button
              onClick={() => {
                Modal.confirm({
                  title: "Are you sure you want to delete this application?",
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
  );
};

export default LeaveApplicationList;
