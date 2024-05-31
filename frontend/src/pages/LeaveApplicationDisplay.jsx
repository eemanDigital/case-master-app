import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link } from "react-router-dom";
import { Space, Table, Button } from "antd";
import { formatDate } from "../utils/formatDate";

const LeaveApplicationDisplay = () => {
  const { leaveApps, loadingLeaveApp, errorLeaveApp } = useDataGetterHook();
  const { Column, ColumnGroup } = Table;

  return (
    <Table dataSource={leaveApps?.data}>
      <ColumnGroup title="Employee's Name">
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
        render={(date) => formatDate(date)}
      />
      <Column
        title="End Date"
        dataIndex="endDate"
        key="endDate"
        render={(date) => formatDate(date)}
      />
      <Column title="Type of Leave" dataIndex="typeOfLeave" key="typeOfLeave" />
      <Column
        title="status"
        dataIndex="status"
        key="status"
        render={(text, record) => (
          <div
            className={
              record.status === "approved"
                ? "bg-green-500 p-1 text-center text-white rounded-md"
                : record.status === "pending"
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
              <Link
                to={`/dashboard/leave-application/${record.employee.id}/details`}>
                Get Details
              </Link>
            </Button>
            <Button type="primary" danger>
              Delete
            </Button>
          </Space>
        )}
      />
    </Table>
  );
};

export default LeaveApplicationDisplay;
