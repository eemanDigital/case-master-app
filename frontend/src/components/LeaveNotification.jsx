import { useEffect, useMemo } from "react";
import { Badge, Popover, List, Button, Tooltip } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import LoadingSpinner from "./LoadingSpinner";
import PageErrorAlert from "./PageErrorAlert";

const LeaveNotification = () => {
  const {
    leaveApps,
    loading: loadingLeaveApp,
    error: errorLeaveApp,
    fetchData,
  } = useDataGetterHook();

  //   const isCurrentUser = loggedInClientId === id; //check if id is the same
  useEffect(() => {
    fetchData("leaves/applications", "leaveApps");
  }, []);

  const pendingLeaves = useMemo(() => {
    return leaveApps?.data?.filter((leave) => leave?.status === "pending");
  }, [leaveApps]);

  const content = (
    <List
      itemLayout="horizontal"
      dataSource={pendingLeaves}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Link
                className="font-medium text-blue-600"
                to={`staff/leave-application/${item?.id}/details`}>
                Applicant: {item?.employee?.firstName}
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
    <>
      {
        <Popover
          content={
            loadingLeaveApp.leaveApps ? (
              <div className="text-center p-4">
                <LoadingSpinner />
              </div>
            ) : errorLeaveApp.leaveApps ? (
              <PageErrorAlert
                errorCondition={errorLeaveApp.leaveApps}
                errorMessage={errorLeaveApp.leaveApps}
              />
            ) : pendingLeaves?.length ? (
              content
            ) : (
              <div className="text-center p-4">
                No pending leave applications
              </div>
            )
          }
          title={`Pending Leave Applications (${pendingLeaves?.length})`}
          trigger="click"
          placement="bottomRight">
          <Badge count={pendingLeaves?.length} overflowCount={99}>
            <Tooltip title="Leave Application Notification">
              <Button
                icon={<BellOutlined />}
                shape="circle"
                size="large"
                className="bg-white text-blue-500 shadow-md"
              />
            </Tooltip>
          </Badge>
        </Popover>
      }
    </>
  );
};

export default LeaveNotification;
