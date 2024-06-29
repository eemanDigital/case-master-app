import { Link } from "react-router-dom";
import { Button, Card, Typography, Space, Pagination, Row, Col } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { ToastContainer } from "react-toastify";
import Spinner from "../components/Spinner";

// import Button from "../components/Button";
import { useState } from "react";

const { Title, Text } = Typography;

const CaseList = () => {
  const { cases, loading, error } = useDataGetterHook();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Change this to your desired items per page

  const indexOfLastCase = currentPage * itemsPerPage;
  const indexOfFirstCase = indexOfLastCase - itemsPerPage;
  const currentCases = cases?.data?.slice(indexOfFirstCase, indexOfLastCase);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const casesData = Array.isArray(currentCases) // Check if it is array before mapping
    ? currentCases.map((singleCase) => {
        const { firstParty, secondParty } = singleCase;
        const firstName = firstParty?.name[0]?.name;
        const secondName = secondParty?.name[0]?.name;

        return (
          <Col key={singleCase._id} xs={24} sm={24} md={12} lg={8} xl={8}>
            <Card
              title={
                <Link to={`${singleCase._id}/casedetails`}>
                  <Title level={3}>{`${firstName || ""} vs ${
                    secondName || ""
                  }`}</Title>
                </Link>
              }
              bordered={false}
              style={{ marginBottom: 16 }}>
              <Space direction="vertical" size="small">
                <Text type="info">Mode: {singleCase.modeOfCommencement}</Text>
                <Text>Suit No.: {singleCase.suitNo}</Text>
                <Text>Nature of Case: {singleCase.natureOfCase}</Text>
                <Text>Status: {singleCase.caseStatus}</Text>
                <Link to={`${singleCase._id}/update`}>
                  <Button>Update Case</Button>
                </Link>
              </Space>
            </Card>
          </Col>
        );
      })
    : [];

  return (
    <section>
      {loading.cases && <Spinner />}

      <Title level={1} className="text-center" style={{ marginBottom: 24 }}>
        Cases
      </Title>

      <Row gutter={[16, 16]}>{!error.cases && casesData}</Row>

      <Row justify="center" style={{ marginTop: 24 }}>
        <Pagination
          current={currentPage}
          total={cases?.data?.length}
          pageSize={itemsPerPage}
          onChange={paginate}
        />
      </Row>

      <Row justify="center" style={{ marginTop: 16 }}>
        <Link to="add-case">
          <Button className="bg-blue-500 ">+ Add Case</Button>
        </Link>
      </Row>

      <ToastContainer />
    </section>
  );
};

export default CaseList;
