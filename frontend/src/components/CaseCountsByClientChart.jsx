import React from "react";
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
import { Card, Table, Space, Typography } from "antd";
import CustomTooltip from "./CustomToolTip";

const { Title } = Typography;

const CaseCountsByClient = ({ data }) => {
  // Transform the data to fit the expected structure for recharts and antd Table
  const transformedData = data?.map((item, index) => ({
    key: index,
    client: item?.client || "Unknown Client",
    count: item?.count,
    parties: item.parties,
  }));

  //   const columns = [
  //     {
  //       title: "Client",
  //       dataIndex: "client",
  //       key: "client",
  //     },
  //     {
  //       title: "Number of Cases",
  //       dataIndex: "count",
  //       key: "count",
  //     },
  //     {
  //       title: "Parties",
  //       dataIndex: "parties",
  //       key: "parties",
  //       render: (parties) => (
  //         <ul>
  //           {parties.split(", ").map((party, idx) => (
  //             <li key={idx}>{party}</li>
  //           ))}
  //         </ul>
  //       ),
  //     },
  //   ];

  return (
    <Card
      title="Case Counts by Client"
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
          <XAxis dataKey="client" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />

          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>

      {/* <Title level={3} style={{ marginTop: 20 }}>
        Case Details
      </Title> */}
      {/* <Table
        columns={columns}
        dataSource={transformedData}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 600 }}
      /> */}
    </Card>
  );
};

export default CaseCountsByClient;
