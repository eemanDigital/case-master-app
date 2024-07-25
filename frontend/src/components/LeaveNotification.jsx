import { useMemo } from "react";
import { Badge, Popover, List, Button, Spin, Alert } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAdminHook } from "../hooks/useAdminHook";
import { useAuthContext } from "../hooks/useAuthContext";

const LeaveNotification = () => {
  const {
    leaveApps,
    loading: loadingLeaveApp,
    error: errorLeaveApp,
  } = useDataGetterHook();

  const { isAdminOrHr } = useAdminHook();
  //   const { user } = useAuthContext();
  //   const loggedInClientId = user?.data?.user.id;

  //   const isCurrentUser = loggedInClientId === id; //check if id is the same

  const pendingLeaves = useMemo(() => {
    return leaveApps?.data?.filter((leave) => leave?.status === "pending");
  }, [leaveApps]);

  //   const approvedLeaves = useMemo(() => {
  //     return leaveApps?.data?.filter((leave) => leave?.status === "approved");
  //   }, [leaveApps]);

  //   const filteredLeaveApps = isAdminOrHr
  //     ? approvedLeaves?.data
  //     : approvedLeaves?.data?.filter(
  //         (app) => app?.employee?.id === user?.data?.user?.id
  //       );

  const content = (
    <List
      itemLayout="horizontal"
      dataSource={pendingLeaves}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Link to={`staff/leave-application/${item?.id}/details`}>
                {item?.employee?.fullName}
              </Link>
            }
            description={`${item?.typeOfLeave} - ${new Date(
              item?.startDate
            ).toLocaleDateString()} to ${new Date(
              item?.endDate
            ).toLocaleDateString()}`}
          />
        </List.Item>
      )}
    />
  );

  return (
    <Popover
      content={
        loadingLeaveApp.leaveApps ? (
          <div className="text-center p-4">
            <Spin tip="Loading leave applications..." />
          </div>
        ) : errorLeaveApp.leaveApps ? (
          <Alert
            message="Error"
            description={
              errorLeaveApp.leaveApps.message || "Something went wrong"
            }
            type="error"
            showIcon
          />
        ) : pendingLeaves?.length ? (
          content
        ) : (
          <div className="text-center p-4">No pending leave applications</div>
        )
      }
      title={`Pending Leave Applications (${pendingLeaves?.length})`}
      trigger="click"
      placement="bottomRight">
      <Badge count={pendingLeaves?.length} overflowCount={99}>
        <Button icon={<BellOutlined />} shape="circle" size="large" />
      </Badge>
    </Popover>
  );
};

export default LeaveNotification;
