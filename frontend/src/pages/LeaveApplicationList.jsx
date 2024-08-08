import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link } from "react-router-dom";
import { useAdminHook } from "../hooks/useAdminHook";
import { Space, Table, Button, Spin, Alert, Modal } from "antd";
import { formatDate } from "../utils/formatDate";
import { useDataFetch } from "../hooks/useDataFetch";
import avatar from "../assets/avatar.png";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "../components/LoadingSpinner";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { deleteData } from "../redux/features/delete/deleteSlice";

const LeaveApplicationList = () => {
  const {
    leaveApps,
    loading: loadingLeaveApp,
    error: errorLeaveApp,
    fetchData,
  } = useDataGetterHook();
  const { Column, ColumnGroup } = Table;
  const { isError, isSuccess, isLoading, message, isLoggedIn, user } =
    useSelector((state) => state.auth);
  const { isAdminOrHr } = useAdminHook();
  const dispatch = useDispatch();

  useEffect(() => {
    fetchData("leaves/applications", "leaveApps");
  }, []);

  if (loadingLeaveApp?.leaveApps) {
    return <LoadingSpinner />;
  }

  if (errorLeaveApp?.leaveApps) {
    return toast.error(errorLeaveApp?.leaveApps);
  }

  // delete leave app
  const removeApplication = async (id) => {
    try {
      await dispatch(deleteData(`leaves/applications/${id}`));
      await fetchData("leaves/applications", "leaveApps");
    } catch (error) {
      toast.error("Failed to delete invoice");
    }
  };

  // Filter the leave applications based on the user's role
  const filteredLeaveApps = isAdminOrHr
    ? leaveApps?.data
    : leaveApps?.data?.filter((app) => app?.employee?._id === user?.data?._id);

  return (
    <Table dataSource={filteredLeaveApps}>
      <ColumnGroup title="Leave Applications">
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
                  onOk: () => removeApplication(record?._id),
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
