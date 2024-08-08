import React, { useState } from "react";
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
        className="w-full max-w-xl mx-auto cursor-pointer hover:shadow-lg transition-shadow duration-300"
        onClick={showModal}
        hoverable>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={transformedData}
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
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Modal
        title="Case Counts by Client"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width="90%"
        className="rounded-lg"
        bodyStyle={{ padding: 0 }}>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={transformedData}
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
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Modal>
    </>
  );
};

export default CaseCountsByClient;
