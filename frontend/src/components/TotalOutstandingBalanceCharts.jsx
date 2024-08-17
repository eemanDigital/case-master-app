import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { Typography, Modal } from "antd";

const { Title } = Typography;

const TotalOutstandingBalanceCharts = ({ paymentData, balanceData }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const value = paymentData?.totalAmount;
  const year = paymentData?.year;
  const totalBalance = balanceData?.data?.[0]?.totalBalance;

  const gaugeData = [
    { name: "value", value },
    { name: "remainder", value: 100000000 - value }, // Assuming 100M as max value for the gauge
  ];

  const balanceChartData = [
    { name: "Total Outstanding Balance", value: totalBalance },
  ];

  const COLORS = ["#1c4e80", "#f0f0f0"];

  const handleCardClick = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      {/* Small Card for Dashboard */}
      <div
        className="bg-white p-3 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow  h-[180px] flex flex-col justify-center items-center"
        onClick={handleCardClick}>
        <Title level={5} className="text-center mb-1 text-sm">
          {`Total Income and Balance: ${year}`}
        </Title>
        <ResponsiveContainer width="100%" height={80}>
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
        <div className="text-center mt-[-30px]">
          <Title level={5} className="text-xs">
            ₦{value?.toLocaleString()}
          </Title>
        </div>
      </div>

      {/* Modal for Larger Chart */}
      <Modal
        title={`Total Income and Balance for ${year}`}
        open={isModalVisible}
        footer={null}
        onCancel={handleCloseModal}
        width={800}>
        <div className="flex flex-col">
          <div>
            {/* <Title level={4}>{`Total Income for the Year: ${year}`}</Title> */}
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gaugeData}
                  startAngle={180}
                  endAngle={0}
                  innerRadius="60%"
                  outerRadius="80%"
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
              <Title level={3}>₦{value?.toLocaleString()}</Title>
            </div>
          </div>

          <div className="mt-8">
            <Title level={4}>Total Outstanding Balance</Title>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={balanceChartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" />
                <YAxis />
                <Bar dataKey="value" fill="#ea6a47" barSize={50} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "center" }}>
              <Title level={3}>₦{totalBalance?.toLocaleString()}</Title>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TotalOutstandingBalanceCharts;
