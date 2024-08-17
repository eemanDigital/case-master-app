import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Modal, Card, Typography } from "antd";

const { Title, Text } = Typography;

const AccountOfficerCharts = ({ data, title }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const COLORS = ["#7E909A", "#1C4E80", "#EA6A47", "#0091D5", "#A5D8DD"];

  const transformedData = data?.map((item) => ({
    name: item.accountOfficer,
    value: item.count,
    cases: item.parties.join(", "), // Include cases in the transformed data
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Get the data for this segment
      return (
        <Card
          hoverable
          className="bg-white p-4 border border-gray-300 shadow-md">
          <Title level={4}>{data.name}</Title>
          <Text>Cases: {data.cases}</Text>
        </Card>
      );
    }

    return null;
  };

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
      <Card
        title={title}
        className="bg-white p-3 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow h-[180px]  flex flex-col justify-center items-center"
        onClick={showModal}
        hoverable>
        <ResponsiveContainer width={300} height={98}>
          <PieChart>
            <Pie
              data={transformedData}
              cx="50%"
              cy="42%"
              labelLine={false}
              // label={({ name, percent }) =>
              //   `${name}: ${(percent * 100).toFixed(0)}%`
              // }
              outerRadius={42}
              fill="#8884d8"
              dataKey="value">
              {transformedData?.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            {/* <Tooltip content={<CustomTooltip />} /> */}
            {/* <Legend /> */}
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Modal
        title={title}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
        className="rounded-lg"
        bodyStyle={{ padding: 0 }}>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie
                data={transformedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={150}
                fill="#8884d8"
                dataKey="value">
                {transformedData?.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Modal>
    </>
  );
};

export default AccountOfficerCharts;
