import { Link } from "react-router-dom";
import {
  Button,
  Table,
  Typography,
  Pagination,
  Row,
  Modal,
  Tooltip,
} from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useCallback, useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import { useAdminHook } from "../hooks/useAdminHook";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import LoadingSpinner from "../components/LoadingSpinner";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { deleteData, RESET } from "../redux/features/delete/deleteSlice";

const { Title } = Typography;

const CaseList = () => {
  const { cases, loading, error, fetchData } = useDataGetterHook();
  const [searchResults, setSearchResults] = useState([]);
  const { isStaff } = useAdminHook();
  const { user } = useSelector((state) => state.auth);
  const { isError, isSuccess, message } = useSelector((state) => state.delete);
  const caseIDs = user?.data?.case?.map((caseItem) => caseItem?._id);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const indexOfLastCase = currentPage * itemsPerPage;
  const indexOfFirstCase = indexOfLastCase - itemsPerPage;
  const currentCases = searchResults?.slice(indexOfFirstCase, indexOfLastCase);
  const dispatch = useDispatch();
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // fetch cases
  const fetchCases = useCallback(() => {
    fetchData("cases", "cases");
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  ///////////////////////

  useEffect(() => {
    if (cases?.data) {
      setSearchResults(cases.data);
    }
  }, [cases]);

  // search handler
  const handleSearchChange = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();
    if (!searchTerm) {
      setSearchResults(cases?.data);
      return;
    }
    const results = cases?.data.filter((d) => {
      const firstPartyMatch = d.firstParty.name.some((nameObj) =>
        nameObj.name.toLowerCase().includes(searchTerm)
      );
      const secondPartyMatch = d.secondParty.name.some((nameObj) =>
        nameObj.name.toLowerCase().includes(searchTerm)
      );
      const suit_no = d.suitNo.toLowerCase().includes(searchTerm);
      const status = d.caseStatus.toLowerCase().includes(searchTerm);
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

  // delete case
  const deleteCase = async (id) => {
    await dispatch(deleteData(`cases/${id}`));
    await fetchData("cases", "cases");
  };

  // delete success
  useEffect(() => {
    if (isSuccess) {
      toast.success(message);
      dispatch(RESET());
    }
    // delete error
    if (isError) {
      toast.error(message);
      dispatch(RESET());
    }
  }, [isSuccess, isError, message, dispatch]);

  // filter case for client - client only see it case(es)
  const filterCasesByClient = (caseIds) => {
    if (!cases?.data) return [];
    return cases?.data?.filter((caseItem) => caseIds?.includes(caseItem?._id));
  };

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
      render: (text) => <p className=" capitalize">{text}</p>,
    },
    {
      title: "Nature of Case",
      dataIndex: "natureOfCase",
      key: "natureOfCase",
      render: (text) => <p className="capitalize">{text}</p>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) =>
        isStaff ? (
          <>
            <Link to={`${record._id}/update`}>
              <Tooltip title="Edit Case">
                {" "}
                <Button
                  className="bg-purple-200 text-purple-500"
                  icon={<EditOutlined />}></Button>
              </Tooltip>
            </Link>
            <Tooltip title="Delete Case">
              <Button
                icon={<DeleteOutlined />}
                className="mx-6 bg-red-200 text-red-500 hover:text-red-700"
                onClick={() =>
                  Modal.confirm({
                    title: "Are you sure you want to delete this case?",
                    icon: <ExclamationCircleOutlined />,
                    content: "This action cannot be undone",
                    okText: "Yes",
                    okType: "danger",
                    cancelText: "No",
                    onOk: () => deleteCase(record._id),
                  })
                }></Button>
            </Tooltip>
          </>
        ) : null,
    },
  ];

  if (loading.cases) return <LoadingSpinner />;
  if (error.cases) return toast.error(error.cases);

  return (
    <section>
      <Title level={1}>Cases</Title>
      {loading.cases && <LoadingSpinner />}
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
    </section>
  );
};

export default CaseList;
