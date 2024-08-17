import { useContext, useState } from "react";
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
import { Typography, Modal, Card } from "antd";
import PaymentFilterForm from "./PaymentFilterForm";
import { PaymentFiltersContext } from "./Dashboard";

const { Title } = Typography;

const CurrentMonthIncomeCharts = ({ data }) => {
  const { setYearMonth, setMonth } = useContext(PaymentFiltersContext);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const transformedData = [
    { month: data?.month, totalAmount: data?.totalAmount, year: data?.year },
  ];

  const handleCardClick = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      {/* Small Card for Dashboard */}
      <Card
        className="bg-white p-3 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow  h-[180px] flex flex-col justify-center items-center"
        onClick={handleCardClick}>
        <Title level={5} className="mb-2">
          Current Month Income
        </Title>
        <ResponsiveContainer width="100%" height={95}>
          <BarChart
            data={transformedData}
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={(tick) => `Month ${tick}`} />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="totalAmount" fill="#1c4e80" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
        <Title level={5}>₦{data?.totalAmount?.toLocaleString()}</Title>
      </Card>

      {/* Modal for Larger Chart */}
      <Modal
        title="Monthly Payments"
        visible={isModalVisible}
        footer={null}
        onCancel={handleCloseModal}
        width={800}>
        <div className="flex flex-col">
          <PaymentFilterForm setYear={setYearMonth} setMonth={setMonth} />
          <div className="mt-4">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={transformedData}
                margin={{ top: 20, right: 40, left: 50, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(tick) => `Month ${tick}`}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalAmount" fill="#1c4e80" barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CurrentMonthIncomeCharts;
