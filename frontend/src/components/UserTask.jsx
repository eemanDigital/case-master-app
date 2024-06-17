// import { useAuthContext } from "../hooks/useAuthContext";
// import TaskDocView from "./TaskDocView";
// import { useDataFetch } from "../hooks/useDataFetch";
// import { formatDate } from "../utils/formatDate";
// import { useEffect } from "react";
// import { Card, Typography, Space, Divider } from "antd";

// const { Title, Text } = Typography;

// const UserTask = () => {
//   const { user } = useAuthContext();
//   const userId = user?.data?.user?._id;
//   const { data, loading, error, dataFetcher } = useDataFetch();

//   const userTask = data?.data?.task?.map((t) => {
//     return (
//       <Card key={t._id} className="my-3">
//         <Space direction="vertical" size="middle">
//           <Title level={2}>Task Title: {t.title}</Title>
//           {Array.isArray(t.caseToWorkOn) &&
//             t.caseToWorkOn.map((taskCase) => {
//               const { firstParty, secondParty } = taskCase;
//               const firstName = firstParty?.name[0]?.name;
//               const secondName = secondParty?.name[0]?.name;
//               return (
//                 <Text
//                   key={t._id}
//                   className="text-2xl font-semibold text-red-600">
//                   Case to work On: {firstName} vs {secondName}
//                 </Text>
//               );
//             })}
//           <Text>
//             <strong>Instruction:</strong> {t.instruction}
//           </Text>
//           <Text>
//             <strong>Task Priority: </strong>
//             {t.taskPriority}
//           </Text>
//           <Text className="text-green-600 font-bold">
//             Due Date: {formatDate(t.dueDate)}
//           </Text>
//         </Space>
//         <Divider />
//         <TaskDocView taskId={t._id} />
//       </Card>
//     );
//   });

//   useEffect(() => {
//     if (userId) {
//       dataFetcher(`users/${userId}`, "GET");
//     }
//   }, [userId]);

//   return (
//     <section className="flex flex-col gap-3">
//       <Title className="text-center">Task Details</Title>
//       <div>{userTask}</div>
//     </section>
//   );
// };

// export default UserTask;
