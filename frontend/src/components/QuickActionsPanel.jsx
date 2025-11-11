import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Collapse } from "antd";
import {
  PlusOutlined,
  MenuOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import EventList from "../pages/EventList";
import EventForm from "./EventForm";
import CreateLeaveBalanceForm from "./CreateLeaveBalanceForm";
import LeaveAppForm from "../pages/LeaveAppForm";

const { Panel } = Collapse;

const QuickActionsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6">
      {/* Using Antd Collapse for smooth animation */}
      <Collapse
        bordered={false}
        activeKey={isOpen ? "1" : ""}
        onChange={(keys) => setIsOpen(keys.length > 0)}
        className="bg-white">
        <Panel
          key="1"
          header={
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <MenuOutlined />
              <span>Quick Actions</span>
            </div>
          }
          extra={<CaretRightOutlined rotate={isOpen ? 90 : 0} />}
          className="quick-actions-panel">
          {/* Mobile-optimized grid layout */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:flex lg:flex-wrap gap-3">
            {/* Column 1: Events */}
            <div className="space-y-2 xs:space-y-0 xs:flex xs:flex-col xs:gap-2">
              <div className="flex gap-2 flex-wrap">
                <EventList />
                <EventForm />
              </div>
            </div>

            {/* Column 2: Leave Management */}
            <div className="space-y-2 xs:space-y-0 xs:flex xs:flex-col xs:gap-2">
              <div className="flex gap-2 flex-wrap">
                <CreateLeaveBalanceForm />
                <LeaveAppForm />
              </div>
            </div>

            {/* Column 3: Navigation - Full width on mobile */}
            <div className="col-span-1 xs:col-span-2 flex flex-col xs:flex-row gap-2">
              <Link to="note-list" className="flex-1">
                <Button
                  className="w-full bg-green-500 hover:bg-green-600 text-white border-0 h-9"
                  icon={<PlusOutlined />}>
                  <span className="hidden xs:inline">Show Notes</span>
                  <span className="xs:hidden">Notes</span>
                </Button>
              </Link>
              <Link to="record-document-list" className="flex-1">
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white border-0 h-9"
                  icon={<PlusOutlined />}>
                  <span className="hidden xs:inline">Show Records</span>
                  <span className="xs:hidden">Records</span>
                </Button>
              </Link>
            </div>
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

export default QuickActionsPanel;
