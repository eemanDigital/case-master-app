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
import { DeleteOutlined } from "@ant-design/icons";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { MdOutlineSettingsBackupRestore } from "react-icons/md";
import { useCallback, useEffect, useState } from "react";
import { useAdminHook } from "../hooks/useAdminHook";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import LoadingSpinner from "./LoadingSpinner";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { deleteData, RESET } from "../redux/features/delete/deleteSlice";
import PageErrorAlert from "./PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";
import axios from "axios";
// import debounce from "lodash/debounce";

const { Title } = Typography;

const SoftDeletedCasesArchive = () => {
  const baseURL =
    import.meta.env.VITE_BASE_URL || "http://localhost:3000/api/v1";

  const { deletedCases, loading, error, fetchData } = useDataGetterHook();
  const { isStaff } = useAdminHook();
  // const { user } = useSelector((state) => state.auth);
  const { isError, isSuccess, message } = useSelector((state) => state.delete);
  // const clientId = user?.data?._id;
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const dispatch = useDispatch();
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  useRedirectLogoutUser("/users/login"); // redirect to login if not logged in

  //  fetch cases
  const fetchCases = useCallback(() => {
    fetchData("cases/soft-deleted-cases", "deletedCases");
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // delete handler
  const deleteCase = async (id) => {
    await dispatch(deleteData(`cases/${id}`)); //hard delete
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

  //Restore Case Handler
  const restoreCase = async (id) => {
    try {
      const response = await axios.post(
        `${baseURL}/soft_delete/cases/${id}/restore`
      );
      toast.success(response.data.message);
      await fetchData("cases/soft-deleted-cases", "deletedCases"); // Await this!
      dispatch(RESET());
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to restore case");
    }
  };
  // Calculate pagination
  const columns = [
    {
      title: "Case",
      dataIndex: "case",
      key: "case",
      render: (_, record) => (
        <h1>{`${record.firstParty?.name[0]?.name || ""} vs ${
          record.secondParty?.name[0]?.name || ""
        }`}</h1>
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
            <Tooltip title="Restore Case">
              <Button
                onClick={() => restoreCase(record._id)}
                className="bg-purple-200 text-purple-500"
                icon={<MdOutlineSettingsBackupRestore size={20} />}></Button>
            </Tooltip>

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

  return (
    <>
      {error.deletedCases && deletedCases.length > 0 ? (
        <PageErrorAlert
          errorCondition={error.deletedCases}
          errorMessage={error.deletedCases}
        />
      ) : (
        <section className=" font-medium font-poppins">
          <Title level={1}>Deleted Cases</Title>

          <div className="overflow-x-auto">
            {deletedCases.length < 1 ? (
              <Empty />
            ) : (
              <Table
                columns={columns}
                dataSource={deletedCases?.data}
                pagination={false}
                rowKey="_id"
                loading={loading.deletedCases}
                scroll={{ x: 700 }} // Enables horizontal scrolling when table content overflows
              />
            )}
          </div>
          <Row justify="center" style={{ marginTop: 12 }}>
            <Pagination
              current={currentPage}
              total={deletedCases?.data?.length}
              pageSize={itemsPerPage}
              onChange={paginate}
            />
          </Row>
        </section>
      )}
    </>
  );
};

export default SoftDeletedCasesArchive;
