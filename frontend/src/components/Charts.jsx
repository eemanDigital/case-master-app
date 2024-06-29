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

const CasesCharts = ({ data, title }) => {
  // Transform the data
  const transformedData = data.map((item) => ({
    name: item.groupName,
    Cases: item.count,
  }));

  return (
    <ResponsiveContainer width="48%" height={200} className="mt-6">
      <h1 className="text-center font-bold mt-2 text-gray-600">{title}</h1>
      <BarChart
        data={transformedData}
        margin={{
          top: 20,
          right: 10,
          left: 15,
          bottom: 5,
        }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Cases" fill="rgb(59 130 246)" barSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default CasesCharts;
