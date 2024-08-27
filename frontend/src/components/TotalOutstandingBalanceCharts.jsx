import PropTypes from "prop-types";
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Typography, Modal } from "antd";

import PageErrorAlert from "./PageErrorAlert";

const { Title } = Typography;

const TotalOutstandingBalanceCharts = ({ paymentData, balanceData, error }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  console.log(balanceData);
  const value = paymentData?.totalAmount;
  const year = paymentData?.year;
  const totalBalance = balanceData?.data?.[0]?.totalBalance;

  const gaugeData = [
    { name: "Total Income", value },
    { name: "Outstanding Balance", value: totalBalance }, // Using totalBalance as the remainder
  ];

  const COLORS = ["#1c4e80", "#a5d8dd"];

  const handleCardClick = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip bg-white p-4 shadow-md">
          <p className="label font-medium font-poppins text-2xl">{`${
            payload[0].name
          }: ₦${payload[0].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        value: PropTypes.number,
      })
    ),
  };

  if (error)
    return <PageErrorAlert errorCondition={error} errorMessage={error} />; //error state

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
            <Tooltip content={<CustomTooltip />} />
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
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ textAlign: "center", marginTop: "-100px" }}>
              <Title level={3}>₦{value?.toLocaleString()}</Title>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

// prop type validation
TotalOutstandingBalanceCharts.propTypes = {
  paymentData: PropTypes.shape({
    totalAmount: PropTypes.number,
    year: PropTypes.number,
  }),
  balanceData: PropTypes.shape({
    message: PropTypes.string,
    data: PropTypes.arrayOf(
      PropTypes.shape({
        totalBalance: PropTypes.number,
        _id: PropTypes.any,
      })
    ),
  }),
  error: PropTypes.string,
  loading: PropTypes.bool.isRequired,
};

export default TotalOutstandingBalanceCharts;
