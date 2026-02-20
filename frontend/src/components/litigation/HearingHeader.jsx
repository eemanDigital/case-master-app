import React from "react";
import { Card, Button, Avatar, Tooltip, Badge } from "antd";
import {
  ThunderboltOutlined,
  CalendarOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { formatDate, formatName } from "../../utils/formatters";

const HearingHeader = ({ nextHearing, onAssignLawyers }) => {
  if (!nextHearing) return null;

  return (
    <Card
      className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 overflow-hidden"
      bodyStyle={{ padding: 0 }}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <ThunderboltOutlined className="text-white text-sm" />
            </div>
            <div>
              <h4 className="text-sm font-black text-blue-900">Next Hearing</h4>
              <p className="text-xs text-blue-600">
                {dayjs(nextHearing.nextHearingDate).fromNow()}
              </p>
            </div>
          </div>
          <Button
            type="primary"
            icon={<TeamOutlined />}
            onClick={() => onAssignLawyers(nextHearing)}
            size="small"
            className="bg-blue-600">
            Assign Lawyers
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
              <CalendarOutlined className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Next Hearing Date</p>
              <p className="text-base font-bold text-gray-900">
                {formatDate(nextHearing.nextHearingDate, "DD MMM YYYY")}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  at {dayjs(nextHearing.nextHearingDate).format("HH:mm")}
                </span>
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-2">
              Assigned Lawyers ({nextHearing.lawyerPresent?.length || 0})
            </p>
            {nextHearing.lawyerPresent?.length > 0 ? (
              <Avatar.Group
                maxCount={4}
                size="small"
                maxStyle={{ backgroundColor: "#bfdbfe", color: "#1e40af" }}>
                {nextHearing.lawyerPresent.map((lawyer, index) => (
                  <Tooltip
                    key={index}
                    title={formatName(lawyer.firstName, lawyer.lastName)}>
                    <Avatar
                      src={lawyer.photo}
                      style={{ backgroundColor: "#3b82f6", color: "white" }}>
                      {lawyer.firstName?.[0]}
                      {lawyer.lastName?.[0]}
                    </Avatar>
                  </Tooltip>
                ))}
              </Avatar.Group>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                <WarningOutlined className="text-sm" />
                <span className="text-xs font-medium">No lawyers assigned</span>
              </div>
            )}
          </div>
        </div>

        {nextHearing.purpose && (
          <div className="mt-4 p-3 bg-white/60 rounded-lg border border-blue-100">
            <p className="text-xs text-gray-500 mb-1">Purpose</p>
            <p className="text-sm font-medium text-gray-900">
              {nextHearing.purpose}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default HearingHeader;
