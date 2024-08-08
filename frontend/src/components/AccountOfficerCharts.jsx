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
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

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
        className="  w-full md:w-1/2 lg:w-1/3 mx-auto cursor-pointer hover:shadow-lg transition-shadow duration-300"
        onClick={showModal}
        hoverable>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={transformedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
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
