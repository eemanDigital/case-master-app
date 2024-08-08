import { useEffect, useState } from "react";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Space, Table, Button, Spin, Alert, Modal } from "antd";
import avatar from "../assets/avatar.png";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { deleteData } from "../redux/features/delete/deleteSlice";
import { useAdminHook } from "../hooks/useAdminHook";
import LoadingSpinner from "../components/LoadingSpinner";

const { Column, ColumnGroup } = Table;

const LeaveBalanceList = () => {
  const { leaveBalance, loading, error, fetchData } = useDataGetterHook();
  const { isAdminOrHr } = useAdminHook();
  const dispatch = useDispatch();

  // fetch data
  useEffect(() => {
    fetchData("leaves/balances", "leaveBalance");
  }, []);

  const { user } = useSelector((state) => state.auth); //user from context

  //  leading state
  if (loading.leaveBalance) {
    return <LoadingSpinner />;
  }
  // error toast
  if (error.leaveBalance) {
    return toast.error(error.leaveBalance);
  }

  // Filter the leave applications based on the user's role
  const filteredLeaveBalance = isAdminOrHr
    ? leaveBalance?.data
    : leaveBalance?.data?.filter(
        (balance) => balance?.employee?._id === user?.data?._id
      );

  // remove leave balance
  const removeBalance = async (id) => {
    try {
      await dispatch(deleteData(`leaves/balances/${id}`));
      await fetchData("leaves/balances", "leaveBalance");
    } catch (error) {
      toast.error("Failed to delete invoice");
    }
  };

  return (
    <>
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
                    title: "Are you sure you want to delete this application?",
                    onOk: () => removeBalance(record?.id),
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

export default LeaveBalanceList;
