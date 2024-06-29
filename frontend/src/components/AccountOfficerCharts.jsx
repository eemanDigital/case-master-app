import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "antd";

const AccountOfficerCharts = ({ data, title }) => {
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const transformedData = data.map((item) => ({
    name: item.accountOfficer,
    value: item.count,
    cases: item.parties.join(", "), // Include cases in the transformed data
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload; // Get the data for this segment
      return (
        <div
          style={{
            backgroundColor: "#fff",
            padding: "10px",
            border: "1px solid #ccc",
          }}>
          <h1 className="text-gray-700 font-bold">{data.name}</h1>
          <ul>
            {/* <li>No of Cases: {data.count}</li> */}
            <li>Cases: {data.cases}</li>
          </ul>
        </div>
      );
    }

    return null;
  };

  return (
    <Card title={title} style={{ width: "45%", marginBottom: 20 }}>
      <ResponsiveContainer width="100%" height={400}>
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
            {transformedData.map((entry, index) => (
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
    </Card>
  );
};

export default AccountOfficerCharts;
