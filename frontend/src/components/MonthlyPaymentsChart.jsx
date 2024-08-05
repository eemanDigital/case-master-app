import { useContext } from "react";
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
import { Typography } from "antd";
import PaymentFilterForm from "./PaymentFilterForm";
import { PaymentFiltersContext } from "./Dashboard";
const { Title } = Typography;

const MonthlyPaymentsChart = ({ data }) => {
  const { setYearMonth, setMonth } = useContext(PaymentFiltersContext);
  const transformedData = [
    { month: data?.month, totalAmount: data?.totalAmount, year: data?.year },
  ];

  return (
    <div className="bg-white p-6 m-4 flex flex-col justify-between  rounded-md">
      <PaymentFilterForm setYear={setYearMonth} setMonth={setMonth} />

      <div className=" flex  justify-between  items-center  mb-5   ">
        <ResponsiveContainer width="60%" height={300}>
          <BarChart
            data={transformedData}
            margin={{ top: 20, right: 40, left: 50, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={(tick) => `Month ${tick}`} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalAmount" fill="#82ca9d" barSize={50} />
          </BarChart>
        </ResponsiveContainer>

        <div className="w-[200px]">
          <Title level={4}>Year: {data?.year}</Title>
          <Title level={4}>Month: {data?.month}</Title>
          <Title level={4}>₦{data?.totalAmount?.toLocaleString()}</Title>
        </div>
      </div>
    </div>
  );
};

export default MonthlyPaymentsChart;
