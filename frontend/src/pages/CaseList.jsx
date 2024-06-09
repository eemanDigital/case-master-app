import { Link } from "react-router-dom";
import { Card, Typography, Space, Pagination } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { ToastContainer } from "react-toastify";
import Spinner from "../components/Spinner";
import Button from "../components/Button";
import { useState } from "react";

const { Title, Text } = Typography;

const CaseList = () => {
  const { cases, loadingCases, errorCases } = useDataGetterHook();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Change this to your desired items per page

  const indexOfLastCase = currentPage * itemsPerPage;
  const indexOfFirstCase = indexOfLastCase - itemsPerPage;
  const currentCases = cases?.data?.slice(indexOfFirstCase, indexOfLastCase);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const casesData = Array.isArray(currentCases) //check if is array before mapping
    ? currentCases.map((singleCase) => {
        const { firstParty, secondParty } = singleCase;
        const firstName = firstParty?.name[0]?.name;
        const secondName = secondParty?.name[0]?.name;

        return (
          <Card
            key={singleCase._id}
            title={
              <Link to={`${singleCase._id}/casedetails`}>
                <Title level={2}>{`${firstName || ""} vs ${
                  secondName || ""
                }`}</Title>
              </Link>
            }>
            <Space direction="vertical" size="small">
              <Text type="danger">Mode: {singleCase.modeOfCommencement}</Text>
              <Text>Suit No.: {singleCase.suitNo}</Text>
              <Text>Nature of Case: {singleCase.natureOfCase}</Text>
              <Text>Status: {singleCase.caseStatus}</Text>
              <Link to={`${singleCase._id}/update`}>
                <Button>Update Case</Button>
              </Link>
            </Space>
          </Card>
        );
      })
    : [];

  return (
    <section>
      {loadingCases && <Spinner />}

      <Title level={1} className="text-center">
        Cases
      </Title>

      <Space direction="vertical" size="large">
        {!errorCases && casesData}
      </Space>

      <Pagination
        current={currentPage}
        total={cases?.data?.length}
        pageSize={itemsPerPage}
        onChange={paginate}
      />

      <Link to="add-case">
        <Button>+ Add Case</Button>
      </Link>

      <ToastContainer />
    </section>
  );
};

export default CaseList;
