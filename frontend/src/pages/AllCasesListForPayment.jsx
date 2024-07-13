import { Card, Alert, Table, List } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useAuthContext } from "../hooks/useAuthContext";
import { useAdminHook } from "../hooks/useAdminHook";
import { Link } from "react-router-dom";

const AllCasesListForPayment = () => {
  const { cases, loading, error } = useDataGetterHook();
  const { user } = useAuthContext();
  const { isClient } = useAdminHook();
  const loggedInClientId = user?.data?.user.id;
  // const { clientId, caseId } = useParams();

  if (loading.cases) return <h1>Loading... </h1>;
  if (error.cases)
    return (
      <Alert message="Error" description={error.cases} type="error" showIcon />
    );

  // filter payment base on clientId
  //   const filteredPaymentForClient = paymentData.filter(
  //     (items) => items.client?._id === loggedInClientId
  //   );

  const casesData = Array.isArray(cases?.data)
    ? cases.data.map((singleCase) => ({
        title: `${singleCase.firstParty?.name?.[0]?.name || ""} vs ${
          singleCase.secondParty?.name?.[0]?.name || ""
        }`,
        link: `payments/client/${singleCase?.client}/case/${singleCase._id}`,
      }))
    : [];

  return (
    <>
      <Card
        title="Total Payment on Case"
        className="text-black mt-4"
        bordered={false}>
        <List
          itemLayout="horizontal"
          dataSource={casesData}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={<Link to={item.link}>{item.title}</Link>}
              />
            </List.Item>
          )}
        />
      </Card>
    </>
  );
};

export default AllCasesListForPayment;
