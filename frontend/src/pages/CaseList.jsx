import { Link } from "react-router-dom";
import {
  Button,
  Table,
  Typography,
  Pagination,
  Row,
  Col,
  Modal,
  message,
} from "antd";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { ToastContainer } from "react-toastify";
import Spinner from "../components/Spinner";
import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import { useAdminHook } from "../hooks/useAdminHook";
import { useAuthContext } from "../hooks/useAuthContext";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import useDelete from "../hooks/useDelete"; // Import the useDelete hook
import { FaTrash } from "react-icons/fa6";

const { Title, Text } = Typography;

const CaseList = () => {
  const { cases, loading, error } = useDataGetterHook();
  const [searchResults, setSearchResults] = useState([]);
  const { user } = useAuthContext();
  const { isStaff, isClient } = useAdminHook();

  const caseIDs = user?.data?.user?.case?.map((caseItem) => caseItem?._id);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const indexOfLastCase = currentPage * itemsPerPage;
  const indexOfFirstCase = indexOfLastCase - itemsPerPage;
  const currentCases = searchResults?.slice(indexOfFirstCase, indexOfLastCase);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Render all cases initially before filter
  useEffect(() => {
    if (cases?.data) {
      setSearchResults(cases?.data);
    }
  }, [cases]);

  // Handle search filter for cases
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();

    if (!searchTerm) {
      setSearchResults(cases?.data);
      return;
    }
    const results = cases?.data.filter((d) => {
      // Check in firstParty names
      const firstPartyMatch = d.firstParty.name.some((nameObj) =>
        nameObj.name.toLowerCase().includes(searchTerm)
      );
      // Check in secondParty names
      const secondPartyMatch = d.secondParty.name.some((nameObj) =>
        nameObj.name.toLowerCase().includes(searchTerm)
      );
      // Check by suit no
      const suit_no = d.suitNo.toLowerCase().includes(searchTerm);
      // Check by case status
      const status = d.caseStatus.toLowerCase().includes(searchTerm);
      // Check in natureOfCase
      const natureOfCaseMatch = d.natureOfCase
        .toLowerCase()
        .includes(searchTerm);
      const modeMatch = d.modeOfCommencement.toLowerCase().includes(searchTerm);
      return (
        firstPartyMatch ||
        secondPartyMatch ||
        suit_no ||
        status ||
        natureOfCaseMatch ||
        modeMatch
      );
    });

    setSearchResults(results || cases?.data);
  };

  // Filter case by client
  const filterCasesByClient = (caseIds) => {
    if (!cases?.data) return [];
    return cases?.data?.filter((caseItem) => caseIds?.includes(caseItem?._id));
  };

  // useDelete hook for handling deletions
  const { handleDeleteDocument, documents, setDocuments } = useDelete(
    cases?.data,
    "cases"
  );

  // Display data in table
  const columns = [
    {
      title: "Case",
      dataIndex: "case",
      key: "case",
      render: (_, record) => (
        <Link to={`${record._id}/casedetails`}>
          <h1 className="font-bold hover:text-gray-600 w-52 ml-6">{`${
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
      title: "Status",
      dataIndex: "caseStatus",
      key: "caseStatus",
    },
    // {
    //   title: "Mode of Commencement",
    //   dataIndex: "modeOfCommencement",
    //   key: "modeOfCommencement",
    // },
    {
      title: "Nature of Case",
      dataIndex: "natureOfCase",
      key: "natureOfCase",
    },

    {
      title: "Action",
      key: "action",
      render: (_, record) =>
        isStaff ? (
          <>
            <Link to={`${record._id}/update`}>
              <Button>Update Case</Button>
            </Link>

            <button
              className=" mx-6 text-red-500 hover:text-red-700"
              onClick={(event) =>
                Modal.confirm({
                  title: "Are you sure you want to delete this task?",
                  icon: <ExclamationCircleOutlined />,
                  content: "This action cannot be undone",
                  okText: "Yes",
                  okType: "danger",
                  cancelText: "No",
                  onOk: () =>
                    handleDeleteDocument(
                      event, // Pass event to handleDeleteDocument
                      `cases/${record._id}`, // Adjust the URL to match your backend endpoint
                      record._id
                    ),
                })
              }>
              delete
            </button>
          </>
        ) : null,
    },
  ];

  return (
    <section>
      <Title level={1}>Cases</Title>
      {/* Search bar */}
      {loading.cases && <Spinner />}
      <div className="flex md:flex-row flex-col justify-between items-center mb-4">
        {isStaff && (
          <Link to="add-case">
            <Button className="bg-blue-500 text-white">+ Add Case</Button>
          </Link>
        )}
        <SearchBar data={cases?.data} onSearch={handleSearchChange} />
      </div>

      <Table
        columns={columns}
        dataSource={isStaff ? currentCases : filterCasesByClient(caseIDs)}
        pagination={false}
        rowKey="_id"
        loading={loading.cases}
      />

      <Row justify="center" style={{ marginTop: 12 }}>
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
