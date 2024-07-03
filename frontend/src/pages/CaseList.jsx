import { Link } from "react-router-dom";
import { Button, Table, Typography, Pagination, Row, Col } from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { ToastContainer } from "react-toastify";
import Spinner from "../components/Spinner";
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

  const columns = [
    {
      title: "Case",
      dataIndex: "case",
      key: "case",
      render: (_, record) => (
        <Link to={`${record._id}/casedetails`}>
          <h1 className="font-bold hover:text-gray-600">{`${
            record.firstParty?.name[0]?.name || ""
          } vs ${record.secondParty?.name[0]?.name || ""}`}</h1>
        </Link>
      ),
    },
    {
      title: "Suit No.",
      dataIndex: "suitNo",
      key: "suitNo",
    },
    {
      title: "Mode of Commencement",
      dataIndex: "modeOfCommencement",
      key: "modeOfCommencement",
    },

    {
      title: "Nature of Case",
      dataIndex: "natureOfCase",
      key: "natureOfCase",
    },
    {
      title: "Status",
      dataIndex: "caseStatus",
      key: "caseStatus",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Link to={`${record._id}/update`}>
          <Button>Update Case</Button>
        </Link>
      ),
    },
  ];

  return (
    <section>
      {loading.cases && <Spinner />}
      <Row style={{ marginTop: 16, marginBottom: 24 }} justify="space-between">
        <Title level={1}>Cases</Title>
        <Link to="add-case">
          <Button className="bg-blue-500 text-white">+ Add Case</Button>
        </Link>
      </Row>

      <Table
        columns={columns}
        dataSource={currentCases}
        pagination={false}
        rowKey="_id"
        loading={loading.cases}
      />

      <Row justify="center" style={{ marginTop: 24 }}>
        <Pagination
          current={currentPage}
          total={cases?.data?.length}
          pageSize={itemsPerPage}
          onChange={paginate}
        />
      </Row>

      <ToastContainer />
    </section>
  );
};

export default CaseList;
