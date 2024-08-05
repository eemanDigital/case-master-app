import { useContext } from "react";
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
import PaymentFilterForm from "./PaymentFilterForm";
import { PaymentFiltersContext } from "./Dashboard";

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

const PaymentsEachMonthChart = ({ data }) => {
  const { setYearEachMonth } = useContext(PaymentFiltersContext);

  // Transform data to include month names
  const transformedData = data?.map((item) => ({
    ...item,
    monthName: months[item.month - 1],
  }));

  return (
    <div className="bg-white m-3 p-5 ">
      <div className="flex justify-between items-center p-2">
        <h1 className="text-gray-600">Monthly Payments</h1>
        <PaymentFilterForm setYear={setYearEachMonth} removeMonthInput={true} />
      </div>

      <div className="flex flex-col md:flex-row justify-evenly items-start">
        <ResponsiveContainer width="70%" height={250}>
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

        <div className="p-5 w-[400px]">
          {transformedData?.map((item, index) => (
            <div key={index}>
              <h4 className="font-bold text-gray-600">
                {months[item?.month - 1]}:
              </h4>
              <p className="text-[14px] text-green-600">
                Amount:{" "}
                <strong className="text-gray-600">
                  ₦{item?.totalAmount?.toLocaleString()}
                </strong>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentsEachMonthChart;
