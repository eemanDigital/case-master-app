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
import { Card } from "antd";

const CaseCountsByPeriodChart = ({ data }) => {
  // Transform the data to fit the expected structure for recharts
  const transformedData = data.map((item) => ({
    month: `Month ${item.month}`,
    count: item.count,
    parties: item.parties,
  }));

  return (
    <Card
      title="Case Counts by Month"
      style={{ width: "100%", marginBottom: 20 }}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          width={600}
          height={400}
          data={transformedData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
      <div className="case-list">
        {transformedData.map((item, index) => (
          <div key={index}>
            <h3>{`Cases in Month ${item.month}`}</h3>
            <ul>
              {item.parties.map((party, idx) => (
                <li key={idx}>{party}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CaseCountsByPeriodChart;
