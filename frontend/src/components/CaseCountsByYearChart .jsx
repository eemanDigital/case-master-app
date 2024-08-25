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
import CustomTooltip from "./CustomToolTip";
import { Modal, Card } from "antd"; // Assuming you are using Ant Design for UI components

const CaseCountsByYearChart = ({ data }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const transformedData = data?.map((item) => ({
    year: item.year,
    count: item.count,
    parties: item.parties,
  }));

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <Card
        title="New Briefs by Year"
        onClick={showModal}
        className="bg-white p-3 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow h-[180px]  flex flex-col justify-center items-center">
        <BarChart
          width={260}
          height={90}
          data={transformedData}
          margin={{
            top: 0,
            right: 30,
            left: 10,
            bottom: 0,
          }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Legend />
          <Bar dataKey="count" fill="#1c4e80" barSize={20} />
        </BarChart>
      </Card>

      <Modal
        title="New Briefs by Year"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width={800}>
        <ResponsiveContainer width="80%" height={300}>
          <BarChart
            data={transformedData}
            barSize={20}
            margin={{
              top: 20,
              right: 30,
              left: 90,
              bottom: 5,
            }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="count" fill="#1c4e80" />
          </BarChart>
        </ResponsiveContainer>
      </Modal>
    </>
  );
};

CaseCountsByYearChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      year: PropTypes.number.isRequired,
      count: PropTypes.number.isRequired,
      parties: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ).isRequired,
};

export default CaseCountsByYearChart;
