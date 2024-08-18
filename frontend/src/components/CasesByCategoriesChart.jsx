import { useState } from "react";
import PropTypes from "prop-types";
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
import { Modal } from "antd";

const CasesByCategoriesChart = ({ data, title }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Transform the data
  const transformedData = data.map((item) => ({
    name: item.groupName,
    Cases: item.count,
  }));

  const handleCardClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div
        // className="bg-white w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 shadow-md rounded-lg p-4 cursor-pointer"
        className="bg-white p-3 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow   flex flex-col justify-center items-center"
        onClick={handleCardClick}>
        <ResponsiveContainer width="100%" height={200} className="mt-6">
          <h1 className="text-center font-bold mt-2 text-gray-600">{title}</h1>
          <BarChart
            data={transformedData}
            margin={{
              top: 10,
              right: 30,
              left: 15,
              bottom: 30,
            }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Cases" fill="#ea6a47" barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Modal
        title={title}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width="80%">
        <ResponsiveContainer width="100%" height={300} className="mt-6">
          <BarChart
            data={transformedData}
            barSize={20}
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
            <Bar dataKey="Cases" fill="#ea6a47" barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </Modal>
    </>
  );
};

CasesByCategoriesChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      groupName: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired,
    })
  ).isRequired,
  title: PropTypes.string.isRequired,
};

export default CasesByCategoriesChart;
