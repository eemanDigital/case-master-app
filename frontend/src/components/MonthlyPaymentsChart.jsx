import React from "react";
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

const { Title } = Typography;

const MonthlyPaymentsChart = ({ data, title, setYear, setMonth }) => {
  const transformedData = [
    { month: data?.month, totalAmount: data?.totalAmount, year: data?.year },
  ];

  return (
    <div>
      <PaymentFilterForm setYear={setYear} setMonth={setMonth} />

      <div
        title={title}
        className=" flex justify-between  items-center  mb-5  bg-white p-4 shadow-md ">
        <ResponsiveContainer width="60%" height={400}>
          <BarChart
            data={transformedData}
            margin={{ top: 20, right: 40, left: 50, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={(tick) => `Month ${tick}`} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalAmount" fill="#8884d8" barSize={50} />
          </BarChart>
        </ResponsiveContainer>

        <div className="w-[200px]">
          <Title level={4}>Year: {data?.year}</Title>
          <Title level={4}>Month: {data?.month}</Title>
          <Title level={4}>₦{data?.totalAmount.toLocaleString()}</Title>
        </div>
      </div>
    </div>
  );
};

export default MonthlyPaymentsChart;
