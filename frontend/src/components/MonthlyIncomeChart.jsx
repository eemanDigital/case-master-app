import PropTypes from "prop-types";
import { useContext, useState } from "react";
import {
  LineChart,
  Line,
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
import LoadingSpinner from "./LoadingSpinner";
import PageErrorAlert from "./PageErrorAlert";

const { Title } = Typography;

const months = [
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

const MonthlyIncomeChart = ({ data, loading, error }) => {
  const { setYearEachMonth } = useContext(PaymentFiltersContext);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Transform data to include month names
  const transformedData = data?.map((item) => ({
    ...item,
    monthName: months[item.month - 1],
  }));

  const handleCardClick = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  if (loading) return <LoadingSpinner />; //loading state
  if (error)
    return <PageErrorAlert errorCondition={error} errorMessage={error} />; //error state

  return (
    <>
      {/* Small Card for Dashboard */}
      <Card
        className="bg-white p-3 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow  h-[180px] flex flex-col justify-center items-center"
        onClick={handleCardClick}>
        <Title level={5} className="mb-2">
          Monthly Income
        </Title>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart
            data={transformedData}
            margin={{
              top: 10,
              right: 20,
              left: 10,
              bottom: 5,
            }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="monthName" />
            <YAxis hide />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="totalAmount"
              stroke="#8884d8"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Modal for Larger Chart */}
      <Modal
        title="Monthly Income"
        open={isModalVisible}
        footer={null}
        onCancel={handleCloseModal}
        width={800}>
        <div className="flex flex-col">
          <div className="flex justify-between items-center p-2">
            <Title level={4} className="text-gray-600">
              Monthly Income
            </Title>
            <PaymentFilterForm
              setYear={setYearEachMonth}
              removeMonthInput={true}
            />
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={transformedData}
              margin={{
                top: 20,
                right: 30,
                left: 55,
                bottom: 5,
              }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthName" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalAmount"
                stroke="#8884d8"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Modal>
    </>
  );
};

// prop validation
MonthlyIncomeChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.number.isRequired,
      totalAmount: PropTypes.number.isRequired,
    })
  ),
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
};
export default MonthlyIncomeChart;
