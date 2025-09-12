import { Link } from "react-router-dom";
import {
  Button,
  Table,
  Typography,
  Pagination,
  Row,
  Modal,
  Tooltip,
  Empty,
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
import ButtonWithIcon from "../components/ButtonWithIcon";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import ArchiveIcon from "../components/ArchiveIcon";
// import debounce from "lodash/debounce";

const { Title } = Typography;

const CaseList = () => {
  const { cases, loading, error, fetchData } = useDataGetterHook();
  const [searchResults, setSearchResults] = useState([]);
  const { isStaff } = useAdminHook();
  const { user } = useSelector((state) => state.auth);
  const { isError, isSuccess, message } = useSelector((state) => state.delete);
  const clientId = user?.data?._id;
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const indexOfLastCase = currentPage * itemsPerPage;
  const indexOfFirstCase = indexOfLastCase - itemsPerPage;
  const currentCases = searchResults?.slice(indexOfFirstCase, indexOfLastCase);
  const dispatch = useDispatch();
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useRedirectLogoutUser("/users/login"); // redirect to login if not logged in

  //  fetch cases
  const fetchCases = useCallback(() => {
    fetchData("cases", "cases");
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // search handler
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

  // delete handler
  const deleteCase = async (id) => {
    // await dispatch(deleteData(`cases/${id}`)); //hard delete
    await dispatch(deleteData(`cases/soft-delete/${id}`)); //soft delete
    await fetchData("cases", "cases");
  };

  // toast notification
  useEffect(() => {
    if (isSuccess) {
      toast.success(message);
      dispatch(RESET());
    }

    if (isError) {
      toast.error(message);
      dispatch(RESET());
    }
  }, [isSuccess, isError, message, dispatch]);

  // filter cases for client
  const filterCasesByClient = (id) => {
    return cases?.data?.filter((caseItem) => caseItem.client === id);
  };

  const columns = [
    {
      title: "Case",
      dataIndex: "case",
      key: "case",
      render: (_, record) => (
        <Tooltip title="Click for Details">
          <Link to={`${record._id}/casedetails`}>
            <h1 className="font-bold text-blue-600 hover:text-blue-800">{`${
              record.firstParty?.name[0]?.name || ""
            } vs ${record.secondParty?.name[0]?.name || ""}`}</h1>
          </Link>
        </Tooltip>
      ),
      width: 250, // Set a fixed width
    },
    {
      title: "Suit No.",
      dataIndex: "suitNo",
      key: "suitNo",
      width: 150,
    },
    {
      title: "Status",
      dataIndex: "caseStatus",
      key: "caseStatus",
      render: (text) => <p className=" capitalize">{text}</p>,
      width: 150,
    },
    {
      title: "Nature of Case",
      dataIndex: "natureOfCase",
      key: "natureOfCase",
      render: (text) => <p className="capitalize">{text}</p>,
      width: 200,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) =>
        isStaff ? (
          <>
            <Link to={`${record._id}/update`}>
              <Tooltip title="Edit Case">
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
      width: 200,
    },
  ];

  if (loading.cases) return <LoadingSpinner />;

  // if (cases.length < 0) return <h1>You have No Case</h1>;

  return (
    <>
      <div className="flex md:flex-row flex-col justify-between items-center mb-4">
        {isStaff && (
          <div className="w-full md:w-auto mb-2 md:mb-0">
            <Link to="add-case">
              <ButtonWithIcon
                onClick={() => {}}
                icon={null}
                text="+ Add Case"
              />
            </Link>
          </div>
        )}

        <ArchiveIcon
          toolTipName="View Deleted Cases"
          link="soft-deleted-cases"
        />

        <SearchBar data={cases?.data} onSearch={handleSearchChange} />
      </div>
      {error.cases && cases.length > 0 ? (
        <PageErrorAlert
          errorCondition={error.cases}
          errorMessage={error.cases}
        />
      ) : (
        <section className=" font-medium font-poppins">
          <Title level={1}>Cases</Title>

          <div className="overflow-x-auto">
            {cases.length < 1 ? (
              <Empty />
            ) : (
              <Table
                columns={columns}
                dataSource={
                  isStaff ? currentCases : filterCasesByClient(clientId)
                }
                pagination={false}
                rowKey="_id"
                loading={loading.cases}
                scroll={{ x: 700 }} // Enables horizontal scrolling when table content overflows
              />
            )}
          </div>
          <Row justify="center" style={{ marginTop: 12 }}>
            <Pagination
              current={currentPage}
              total={cases?.data?.length}
              pageSize={itemsPerPage}
              onChange={paginate}
            />
          </Row>
        </section>
      )}
    </>
  );
};

export default CaseList;
