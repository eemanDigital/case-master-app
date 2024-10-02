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

const CaseCountsByClient = ({ data }) => {
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

  // Transform the data to fit the expected structure for recharts and antd Table
  const transformedData = data?.map((item, index) => ({
    key: index,
    client: item?.client || "Unknown Client",
    count: item?.count,
    parties: item.parties,
  }));

  return (
    <>
      <Card
        title="Case Counts by Client"
        className="bg-white p-3 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow h-[180px]  flex flex-col justify-center items-center"
        onClick={showModal}
        hoverable>
        <BarChart
          width={300}
          height={100}
          barSize={5}
          data={transformedData}
          margin={{
            top: 10,
            right: 60,
            left: 15,
            bottom: 0,
          }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="client" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="count" fill="#1c4e80" />
        </BarChart>
      </Card>

      <Modal
        title="Case Counts by Client"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width="90%"
        className="rounded-lg"
        style={{ body: { padding: 0 } }}>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={transformedData}
              barSize={20}
              margin={{
                top: 20,
                right: 20,
                left: 0,
                bottom: 0,
              }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="client" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="count" fill="#1c4e80" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Modal>
    </>
  );
};

// Define the prop types
CaseCountsByClient.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      count: PropTypes.number.isRequired,
      parties: PropTypes.arrayOf(PropTypes.string).isRequired,
      client: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default CaseCountsByClient;
