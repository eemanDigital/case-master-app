// import { Card, List } from "antd";
// import { Alert } from "bootstrap";
// import { Link } from "react-router-dom";

// const AllCasesListForPayment = () => {
//   const { cases, loading, error } = useDataGetterHook();
//   const { user } = useAuthContext();
//   const { isClient } = useAdminHook();
//   const loggedInClientId = user?.data?.user.id;
//   console.log("ERR", error);
//   if (loading.cases) return <h1>Loading... </h1>;
//   if (error.cases)
//     return (
//       <Alert
//         message="Error"
//         description={error.cases || "An unknown error occurred"}
//         type="error"
//         showIcon
//       />
//     );

//   const casesData = Array.isArray(cases?.data)
//     ? cases.data
//         .filter(
//           (singleCase) => !isClient || singleCase.client === loggedInClientId
//         ) // Filter cases if user is a client
//         .map((singleCase) => {
//           // Check if client and _id are defined
//           const link =
//             singleCase?.client && singleCase._id
//               ? `payments/client/${singleCase.client}/case/${singleCase._id}`
//               : undefined; // Or handle differently if undefined
//           return {
//             title: `${singleCase.firstParty?.name?.[0]?.name || ""} vs ${
//               singleCase.secondParty?.name?.[0]?.name || ""
//             }`,
//             link,
//           };
//         })
//         .filter((item) => item.link) // Optionally filter out items without a link
//     : [];

//   return (
//     <>
//       <Card
//         title="Total Payment on Each Case"
//         className="text-black mt-4 w-[50%] "
//         bordered={false}>
//         <List
//           itemLayout="horizontal"
//           dataSource={casesData}
//           renderItem={(item) => (
//             <List.Item>
//               <List.Item.Meta
//                 title={
//                   item.link ? (
//                     <Link to={item.link}>{item.title}</Link>
//                   ) : (
//                     item.title
//                   )
//                 }
//               />
//             </List.Item>
//           )}
//           pagination={{
//             pageSize: 8,
//           }}
//         />
//       </Card>
//     </>
//   );
// };

// export default AllCasesListForPayment;

import { Card, Alert, List } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAuthContext } from "../hooks/useAuthContext";
import { Link } from "react-router-dom";
import { useAdminHook } from "../hooks/useAdminHook";

const AllCasesListForPayment = () => {
  const { cases, loading, error } = useDataGetterHook();
  const { user } = useAuthContext();
  const { isClient } = useAdminHook();
  const loggedInClientId = user?.data?.user.id;

  if (loading.cases) return <h1>Loading... </h1>;
  if (error.cases)
    return (
      <Alert
        message="Error"
        description={error.cases || "An unknown error occurred"} // Access the message property
        type="error"
        showIcon
      />
    );

  const casesData = Array.isArray(cases?.data)
    ? cases.data
        .filter(
          (singleCase) => !isClient || singleCase.client === loggedInClientId
        ) // Filter based on client ID if the user is a client
        .map((singleCase) => {
          // Check if client and _id are defined
          const link =
            singleCase?.client && singleCase._id
              ? `payments/client/${singleCase.client}/case/${singleCase._id}`
              : undefined; // Or handle differently if undefined
          return {
            title: `${singleCase.firstParty?.name?.[0]?.name || ""} vs ${
              singleCase.secondParty?.name?.[0]?.name || ""
            }`,
            link,
          };
        })
        .filter((item) => item.link) // Optionally filter out items without a link
    : [];

  return (
    <>
      <Card
        title="Total Payment on Each Case"
        className="text-black mt-4 w-[50%]"
        bordered={false}>
        <List
          itemLayout="horizontal"
          dataSource={casesData}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  item.link ? (
                    <Link to={item.link}>{item.title}</Link>
                  ) : (
                    item.title
                  )
                }
              />
            </List.Item>
          )}
          pagination={{
            pageSize: 8,
          }}
        />
      </Card>
    </>
  );
};

export default AllCasesListForPayment;
