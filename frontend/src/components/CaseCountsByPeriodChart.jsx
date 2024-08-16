import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, Modal } from "antd";
import CustomTooltip from "./CustomToolTip";

// Mapping from month numbers to month names
const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CaseCountsByPeriodChart = ({ data }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // Transform the data to fit the expected structure for recharts
  const transformedData = data.map((item) => ({
    month: monthNames[item.month - 1], // Adjust for 0-indexed array
    count: item.count,
    parties: item.parties,
  }));

  return (
    <>
      <Card
        onClick={showModal}
        title="New Briefs by Month"
        style={{ width: "50%", marginBottom: 10 }}>
        <ResponsiveContainer width={600} height={140}>
          <BarChart
            data={transformedData}
            margin={{
              top: 20,
              right: 200,
              left: 0,
              bottom: 5,
            }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={CustomTooltip} />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Modal
        title="New Briefs by Month"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width="80%" // Set the width of the modal
        // bodyStyle={{ overflow: "hidden" }} // Hide the scroll
      >
        <div className="p-5 w-full overflow-hidden">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={transformedData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={CustomTooltip} />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Modal>
    </>
  );
};

export default CaseCountsByPeriodChart;
