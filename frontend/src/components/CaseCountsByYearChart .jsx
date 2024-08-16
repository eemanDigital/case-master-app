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
import CustomTooltip from "./CustomToolTip";
import { Modal, Card } from "antd"; // Assuming you are using Ant Design for UI components

const CaseCountsByYearChart = ({ data }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const transformedData = data?.map((item) => ({
    year: item.year,
    count: item.count,
    parties: item.parties,
  }));

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Card onClick={showModal} style={{ width: 300, cursor: "pointer" }}>
        <h3>New Briefs by Year</h3>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={transformedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            {/* <Tooltip content={<CustomTooltip />} /> */}
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Modal
        title="New Briefs by Year"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width={800}>
        <ResponsiveContainer width="80%" height={300}>
          <BarChart
            data={transformedData}
            margin={{
              top: 20,
              right: 30,
              left: 90,
              bottom: 5,
            }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </Modal>
    </>
  );
};

export default CaseCountsByYearChart;
