// components/litigation/dashboard/CourtDistributionChart.jsx
import { Card } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#4f46e5", "#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b"];

const CourtDistributionChart = ({ data }) => {
  const chartData = data.map((item) => ({
    name: item._id?.replace(/_/g, " ") || "Unknown",
    value: item.count,
  }));

  return (
    <Card
      title="Court Distribution"
      className="h-full rounded-xl border-gray-200"
      bodyStyle={{ padding: "20px" }}
      extra={
        <span className="text-xs text-gray-400">
          {chartData.length} {chartData.length === 1 ? "court" : "courts"}
        </span>
      }>
      <div className="h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                }}
              />
              <Legend
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: "11px", marginTop: "10px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl mb-2">⚖️</div>
              <p className="text-sm text-gray-500">No court data available</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CourtDistributionChart;
