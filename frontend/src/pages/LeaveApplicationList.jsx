import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { useAdminHook } from "../hooks/useAdminHook";
import { Space, Table, Button, Spin, Alert, Modal } from "antd";
import { formatDate } from "../utils/formatDate";
import { useDataFetch } from "../hooks/useDataFetch";
import avatar from "../assets/avatar.png";
import { useSelector } from "react-redux";

const LeaveApplicationList = () => {
  const {
    leaveApps,
    loading: loadingLeaveApp,
    error: errorLeaveApp,
  } = useDataGetterHook();
  const { Column, ColumnGroup } = Table;
  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);
  const { isAdminOrHr } = useAdminHook();

  const userId = user?.data?.user?.id;

  const { data, loading, error, dataFetcher } = useDataFetch();

  if (loadingLeaveApp?.leaveApps) {
    return (
      <Spin size="large" className="flex justify-center items-center h-full" />
    );
  }

  console.log(errorLeaveApp, "LEAVEERR");
  if (errorLeaveApp?.leaveApps) {
    return (
      <Alert
        message="Error"
        description={errorLeaveApp?.leaveApps}
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
  const filteredLeaveApps = isAdminOrHr
    ? leaveApps?.data
    : leaveApps?.data?.filter(
        (app) => app?.employee?.id === user?.data?.user?.id
      );

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
                src={photo ? photo : avatar}
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
              <Link to={`${record?.id}/details`}>Get Details</Link>
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
