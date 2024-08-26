import { Card, Alert, List } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Link } from "react-router-dom";
import { useAdminHook } from "../hooks/useAdminHook";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const AllCasesListForPayment = () => {
  const { cases, loading, error, fetchData } = useDataGetterHook();
  const { user } = useSelector((state) => state.auth);
  const { isClient } = useAdminHook();
  const loggedInClientId = user?.data?.id;
  useRedirectLogoutUser("/users/login"); // redirect to login if user is not logged in

  useEffect(() => {
    fetchData("cases", "cases");
  }, []);

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
        className="text-black mt-4 xl:w-[50%] md:[100%]"
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
