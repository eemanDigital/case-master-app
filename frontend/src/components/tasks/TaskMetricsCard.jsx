import React from "react";
import { Card, Row, Col, Typography } from "antd";
import {
  FieldTimeOutlined,
  ScheduleOutlined,
  DatabaseOutlined,
  NumberOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const TaskMetricsCard = ({ taskMetrics, screens }) => {
  return (
    <Row gutter={[8, 8]} className="mb-4">
      {taskMetrics.map((metric, index) => (
        <Col xs={12} sm={6} key={index}>
          <Card size="small" className="text-center h-full">
            <div
              className="text-xl font-semibold mb-1"
              style={{ color: metric.color }}>
              {metric.value}
            </div>
            <div className="text-xs text-gray-500">{metric.label}</div>
            {metric.subValue && (
              <div className="text-xs text-gray-400 mt-1">
                {metric.subValue}
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default TaskMetricsCard;
