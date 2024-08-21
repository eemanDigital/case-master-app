import PropTypes from "prop-types";
import { useState } from "react";
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
import { Card, Modal } from "antd";
import CustomTooltip from "./CustomToolTip";

// Mapping from month numbers to month names
const monthNames = [
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

const CaseCountsByPeriodChart = ({ data }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  // Transform the data to fit the expected structure for recharts
  const transformedData = data.map((item) => ({
    month: monthNames[item.month - 1],
    count: item.count,
    parties: item.parties,
  }));

  return (
    <>
      <Card
        onClick={showModal}
        title="New Briefs by Month"
        className="bg-white pt-4 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow  h-[180px] flex flex-col justify-center items-center">
        <BarChart
          width={300}
          height={100}
          data={transformedData}
          barSize={20}
          margin={{
            top: 0,
            right: 50,
            left: 0,
            bottom: 0,
          }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip content={CustomTooltip} />
          <Legend />
          <Bar dataKey="count" fill="#1c4e80" />
        </BarChart>
      </Card>

      <Modal
        title="New Briefs by Month"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width="80%"
        style={{ body: { overflow: "hidden" } }}>
        <div className="p-5 w-full overflow-hidden">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={transformedData}
              barSize={20}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={CustomTooltip} />
              <Legend />
              <Bar dataKey="count" fill="#1c4e80" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Modal>
    </>
  );
};

CaseCountsByPeriodChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      month: PropTypes.number.isRequired,
      count: PropTypes.number.isRequired,
      parties: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ).isRequired,
};

export default CaseCountsByPeriodChart;
