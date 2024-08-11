// import React, { useState } from "react";
// import PropTypes from "prop-types";
// import { List, Tag, Typography } from "antd";
// import {
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   CloseCircleOutlined,
// } from "@ant-design/icons";

// const { Text } = Typography;

// const TodoTracker = ({ todos }) => {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(2);

//   const calculateDaysLeft = (dueDate) => {
//     if (!dueDate) return null;
//     const now = new Date();
//     const due = new Date(dueDate);
//     const diffTime = due - now;
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return diffDays;
//   };

//   const getStatusTag = (todo) => {
//     if (todo.isCompleted) {
//       return (
//         <Tag color="success" icon={<CheckCircleOutlined />}>
//           Completed
//         </Tag>
//       );
//     }
//     const daysLeft = calculateDaysLeft(todo.dueDate);
//     if (daysLeft === null) {
//       return (
//         <Tag color="default" icon={<ClockCircleOutlined />}>
//           No due date
//         </Tag>
//       );
//     }
//     if (daysLeft < 0) {
//       return (
//         <Tag color="error" icon={<CloseCircleOutlined />}>
//           Overdue
//         </Tag>
//       );
//     }
//     return (
//       <Tag color="processing" icon={<ClockCircleOutlined />}>
//         {daysLeft} days left
//       </Tag>
//     );
//   };

//   return (
//     <List
//       className="w-full mb-6 shadow-md"
//       header={<div className="text-xl font-bold">Todo List</div>}
//       bordered
//       dataSource={todos}
//       renderItem={(todo) => (
//         <List.Item key={todo._id} actions={[getStatusTag(todo)]}>
//           <List.Item.Meta
//             title={todo.description}
//             description={
//               <Text type="secondary">
//                 Due:{" "}
//                 {todo.dueDate
//                   ? new Date(todo.dueDate).toLocaleDateString()
//                   : "No due date"}
//               </Text>
//             }
//           />
//         </List.Item>
//       )}
//       pagination={{
//         onChange: (page) => setCurrentPage(page),
//         pageSize: pageSize,
//         total: todos.length,
//         showSizeChanger: true,
//         showQuickJumper: true,
//         onShowSizeChange: (current, size) => setPageSize(size),
//         showTotal: (total, range) =>
//           `${range[0]}-${range[1]} of ${total} items`,
//       }}
//     />
//   );
// };

// TodoTracker.propTypes = {
//   todos: PropTypes.arrayOf(
//     PropTypes.shape({
//       _id: PropTypes.string.isRequired,
//       description: PropTypes.string.isRequired,
//       isCompleted: PropTypes.bool.isRequired,
//       dueDate: PropTypes.string,
//     })
//   ).isRequired,
// };

// export default TodoTracker;
