import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, Typography } from "antd";

const { Title } = Typography;

const TotalPaymentCharts = ({ data }) => {
  const value = data?.totalAmount;
  const year = data?.year;

  const gaugeData = [
    { name: "value", value },
    { name: "remainder", value: 100000000 - value }, // use Total Balance// Assuming 100M as max value for the gauge
  ];

  const COLORS = ["#0088FE", "#f0f0f0"];

  return (
    <div className="w-[65%] mb-5 p-5 bg-white shadow-md">
      <h1 className="text-[20px] font-bold  mb-12">{`Total Payments for the year ${year}`}</h1>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={gaugeData}
            startAngle={180}
            endAngle={0}
            innerRadius="70%"
            outerRadius="90%"
            dataKey="value"
            paddingAngle={5}
            fill="#8884d8">
            {gaugeData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ textAlign: "center", marginTop: "-100px" }}>
        <Title level={2}>₦{value?.toLocaleString()}</Title>
      </div>
    </div>
  );
};

export default TotalPaymentCharts;
