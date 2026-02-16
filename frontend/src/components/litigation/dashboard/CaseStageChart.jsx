// components/litigation/dashboard/CaseStageChart.jsx
import { Card } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

const CaseStageChart = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item._id?.replace(/_/g, " ") || "Unknown",
    count: item.count,
  }));

  // Stage colors mapping
  const getBarColor = (stage) => {
    const colors = {
      "pre-trial": "#4f46e5",
      trial: "#0ea5e9",
      "post-trial": "#8b5cf6",
      settled: "#10b981",
      appealed: "#f59e0b",
      dismissed: "#ef4444",
    };
    return colors[stage] || "#6b7280";
  };

  return (
    <Card
      title="Case Stages"
      className="h-full rounded-xl border-gray-200"
      bodyStyle={{ padding: "20px" }}
      extra={
        <span className="text-xs text-gray-400">
          {chartData.reduce((sum, item) => sum + item.count, 0)} active cases
        </span>
      }>
      <div className="h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                barSize={20}
                label={{
                  position: "right",
                  fontSize: 11,
                  formatter: (value) => value,
                }}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.name.toLowerCase())}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-sm text-gray-500">No stage data available</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CaseStageChart;
