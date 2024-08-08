import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { Typography } from "antd";

const { Title } = Typography;

const TotalPaymentCharts = ({ paymentData, balanceData }) => {
  const value = paymentData?.totalAmount;
  const year = paymentData?.year;
  const totalBalance = balanceData?.data?.[0]?.totalBalance;

  const gaugeData = [
    { name: "value", value },
    { name: "remainder", value: 100000000 - value }, // Assuming 100M as max value for the gauge
  ];

  const balanceChartData = [{ name: "Total Balance", value: totalBalance }];

  const COLORS = ["#0088FE", "#f0f0f0"];

  return (
    <div className="bg-white p-3">
      <h1 className="text-[20px] font-bold mb-2">{`Total Payments: ${year}`}</h1>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={gaugeData}
            startAngle={180}
            endAngle={0}
            innerRadius="70%"
            outerRadius="90%"
            dataKey="value"
            paddingAngle={5}
            fill="#8884d8">
            {gaugeData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ textAlign: "center", marginTop: "-100px" }}>
        <Title level={2}>₦{value?.toLocaleString()}</Title>
      </div>
      <div>
        <ResponsiveContainer width="100%" height={200}>
          {/* <Divider /> */}
          {/* <h1 className="text-[20px] font-bold ">{`Total Balance`}</h1> */}
          <BarChart
            data={balanceChartData}
            margin={{ top: 20, right: 40, left: 50, bottom: 5 }}>
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="value" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ textAlign: "center" }}>
          <Title level={2}>₦{totalBalance?.toLocaleString()}</Title>
        </div>
      </div>
    </div>
  );
};

export default TotalPaymentCharts;

// import React, { useState } from "react";
// import {
//   PieChart,
//   Pie,
//   Cell,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   ResponsiveContainer,
//   Tooltip,
//   Legend,
// } from "recharts";
// import { Typography, Card, Modal, Divider } from "antd";

// const { Title } = Typography;

// const TotalPaymentCharts = ({ paymentData, balanceData }) => {
//   const [showFullChart, setShowFullChart] = useState(false);

//   const value = paymentData?.totalAmount;
//   const year = paymentData?.year;
//   const totalBalance = balanceData?.data?.[0]?.totalBalance;

//   const gaugeData = [
//     { name: "value", value },
//     { name: "remainder", value: 100000000 - value }, // Assuming 100M as max value for the gauge
//   ];

//   const balanceChartData = [{ name: "Total Balance", value: totalBalance }];

//   const COLORS = ["#4CAF50", "#F0F0F0"];
//   const BALANCE_CHART_COLOR = "#4CAF50";

//   return (
//     <div>
//       <Card
//         className="bg-white m-3 p-5 cursor-pointer"
//         onClick={() => setShowFullChart(true)}
//         hoverable>
//         <div className="flex justify-between items-center">
//           <Title level={3}>Total Payments: {year}</Title>
//         </div>
//         <ResponsiveContainer width="100%" height={200}>
//           <PieChart>
//             <Pie
//               data={gaugeData}
//               startAngle={180}
//               endAngle={0}
//               innerRadius="70%"
//               outerRadius="90%"
//               dataKey="value"
//               paddingAngle={5}
//               fill="#8884d8">
//               {gaugeData.map((entry, index) => (
//                 <Cell
//                   key={`cell-${index}`}
//                   fill={COLORS[index % COLORS.length]}
//                 />
//               ))}
//             </Pie>
//           </PieChart>
//         </ResponsiveContainer>
//         <div style={{ textAlign: "center", marginTop: "-100px" }}>
//           <Title level={2}>₦{value?.toLocaleString()}</Title>
//         </div>
//       </Card>

//       <Modal
//         open={showFullChart}
//         onCancel={() => setShowFullChart(false)}
//         footer={null}
//         width={800}>
//         <div className=" bg-white p-5">
//           <Title level={3}>Total Payments: {year}</Title>
//           <ResponsiveContainer width="100%" height={400}>
//             <PieChart>
//               <Pie
//                 data={gaugeData}
//                 startAngle={180}
//                 endAngle={0}
//                 innerRadius="60%"
//                 outerRadius="80%"
//                 dataKey="value"
//                 paddingAngle={5}
//                 fill="#8884d8">
//                 {gaugeData.map((entry, index) => (
//                   <Cell
//                     key={`cell-${index}`}
//                     fill={COLORS[index % COLORS.length]}
//                   />
//                 ))}
//               </Pie>
//             </PieChart>
//           </ResponsiveContainer>
//           <div style={{ textAlign: "center", marginTop: "-100px" }}>
//             <Title level={2}>₦{value?.toLocaleString()}</Title>
//           </div>
//           <Divider />
//           <h1 className="text-[22px] p-3 font-medium">
//             Total Outstanding Balance from Client
//           </h1>
//           <ResponsiveContainer width="40%" height={400}>
//             <BarChart data={balanceChartData}>
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Bar dataKey="value" fill={BALANCE_CHART_COLOR} />
//             </BarChart>
//           </ResponsiveContainer>
//           <div style={{ textAlign: "center" }}>
//             <Title level={2}>₦{totalBalance?.toLocaleString()}</Title>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// };

// export default TotalPaymentCharts;
