import { Link } from "react-router-dom";
import {
  Button,
  Table,
  Pagination,
  Row,
  Modal,
  Tooltip,
  Empty,
  Card,
  Tag,
  Space,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useCallback, useEffect, useState } from "react";
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
import CaseSearchBar from "../components/CaseSearchBar";

const CaseList = () => {
  const { cases, loading, error, fetchData } = useDataGetterHook();
  const [searchResults, setSearchResults] = useState([]);
  const { isStaff } = useAdminHook();
  const { user } = useSelector((state) => state.auth);
  const { isError, isSuccess, message } = useSelector((state) => state.delete);
  const clientId = user?.data?._id;

  // NEW: Advanced search state
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const dispatch = useDispatch();
  useRedirectLogoutUser("/users/login");

  // NEW: Build query string for API calls
  const buildQueryString = (filters, pagination) => {
    const params = new URLSearchParams();

    // Add pagination
    params.append("page", pagination.current);
    params.append("limit", pagination.limit);

    // Add filters
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== "") {
        if (Array.isArray(value)) {
          value.forEach((item) => params.append(key, item));
        } else {
          params.append(key, value);
        }
      }
    });

    return params.toString();
  };

  // UPDATED: Fetch cases with filters
  const fetchCases = useCallback(
    async (newFilters = filters, page = currentPage) => {
      const queryString = buildQueryString(newFilters, {
        current: page,
        limit: itemsPerPage,
      });
      const url = queryString ? `cases?${queryString}` : "cases";

      await fetchData(url, "cases");
    },
    [filters, currentPage, itemsPerPage]
  );

  // UPDATED: Initial load and when filters change
  useEffect(() => {
    fetchCases();
  }, []);

  // UPDATED: Handle search results from API
  useEffect(() => {
    if (cases?.data) {
      setSearchResults(cases.data);

      // If API returns pagination info, use it
      if (cases.pagination) {
        setCurrentPage(cases.pagination.current || 1);
      }
    }
  }, [cases]);

  // NEW: Handle advanced filter changes
  const handleFiltersChange = async (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    await fetchCases(newFilters, 1);
  };

  // NEW: Reset all filters
  const resetFilters = async () => {
    setFilters({});
    setCurrentPage(1);
    await fetchCases({}, 1);
  };

  // UPDATED: Delete handler with refresh
  const deleteCase = async (id) => {
    await dispatch(deleteData(`cases/soft-delete/${id}`));
    await fetchCases(); // Refresh with current filters
  };

  // Toast notification (unchanged)
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

  // Filter cases for client (client-side as fallback)
  const filterCasesByClient = (cases, id) => {
    if (!cases || !Array.isArray(cases)) return [];
    return cases.filter((caseItem) => caseItem.client === id);
  };

  // UPDATED: Get current cases
  const currentCases = isStaff
    ? searchResults
    : filterCasesByClient(searchResults, clientId);

  // UPDATED: Handle pagination change
  const handlePageChange = async (page) => {
    setCurrentPage(page);
    await fetchCases(filters, page);
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
      width: 250,
    },
    {
      title: "Suit No.",
      dataIndex: "suitNo",
      key: "suitNo",
      width: 150,
    },
    {
      title: "Court",
      dataIndex: "courtName",
      key: "courtName",
      render: (text) => <p className="capitalize">{text}</p>,
      width: 150,
    },
    {
      title: "Status",
      dataIndex: "caseStatus",
      key: "caseStatus",
      render: (text) => (
        <Tag
          color={
            text === "active"
              ? "green"
              : text === "pending"
              ? "orange"
              : text === "closed"
              ? "red"
              : "blue"
          }
          className="capitalize">
          {text}
        </Tag>
      ),
      width: 120,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (text) => (
        <Tag color={text === "civil" ? "blue" : "red"} className="capitalize">
          {text}
        </Tag>
      ),
      width: 100,
    },
    {
      title: "Priority",
      dataIndex: "casePriority",
      key: "casePriority",
      render: (text) => (
        <Tag
          color={
            text === "high" ? "red" : text === "medium" ? "orange" : "green"
          }
          className="capitalize">
          {text}
        </Tag>
      ),
      width: 100,
    },
    {
      title: "Filing Date",
      dataIndex: "filingDate",
      key: "filingDate",
      render: (date) => new Date(date).toLocaleDateString(),
      width: 120,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) =>
        isStaff ? (
          <Space>
            <Link to={`${record._id}/update`}>
              <Tooltip title="Edit Case">
                <Button
                  className="bg-purple-200 text-purple-500"
                  icon={<EditOutlined />}
                />
              </Tooltip>
            </Link>
            <Tooltip title="Delete Case">
              <Button
                icon={<DeleteOutlined />}
                className="bg-red-200 text-red-500 hover:text-red-700"
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
                }
              />
            </Tooltip>
          </Space>
        ) : null,
      width: 150,
      fixed: "right",
    },
  ];

  if (loading.cases) return <LoadingSpinner />;

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

        {/* NEW: Advanced Search Bar */}
        <div className="w-full md:w-96">
          <CaseSearchBar
            onFiltersChange={handleFiltersChange}
            filters={filters}
            loading={loading.cases}
            searchPlaceholder="Search cases by party name, suit no, or details..."
            showCaseSearch={false} // Cases don't need case search
            showDateFilter={true}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {Object.keys(filters).length > 0 && (
        <Card size="small" className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {Object.keys(filters).map(
              (key) =>
                filters[key] && (
                  <Tag
                    key={key}
                    closable
                    onClose={() => {
                      const newFilters = { ...filters };
                      delete newFilters[key];
                      handleFiltersChange(newFilters);
                    }}
                    className="bg-blue-100 border-blue-300">
                    {key}: {filters[key]}
                  </Tag>
                )
            )}
            <Button
              type="link"
              size="small"
              onClick={resetFilters}
              icon={<ReloadOutlined />}
              className="p-0 h-auto">
              Clear all
            </Button>
          </div>
        </Card>
      )}

      {error.cases ? (
        <PageErrorAlert
          errorCondition={error.cases}
          errorMessage={error.cases}
        />
      ) : (
        <section className="font-medium font-poppins">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl">Cases</h1>
            <ArchiveIcon
              toolTipName="View Deleted Cases"
              link="soft-deleted-cases"
            />
          </div>

          <div className="overflow-x-auto">
            {currentCases?.length === 0 ? (
              <Empty
                description={
                  Object.keys(filters).length > 0
                    ? "No cases found matching your filters"
                    : "No cases found"
                }>
                {Object.keys(filters).length > 0 && (
                  <Button type="primary" onClick={resetFilters}>
                    Clear filters
                  </Button>
                )}
              </Empty>
            ) : (
              <Table
                columns={columns}
                dataSource={currentCases}
                pagination={false}
                rowKey="_id"
                loading={loading.cases}
                scroll={{ x: 1000 }}
              />
            )}
          </div>

          {/* UPDATED: Pagination with API data */}
          {cases?.pagination?.totalRecords > 0 && (
            <Row justify="center" style={{ marginTop: 16 }}>
              <Pagination
                current={currentPage}
                total={cases.pagination.totalRecords}
                pageSize={itemsPerPage}
                onChange={handlePageChange}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) =>
                  `Showing ${range[0]}-${range[1]} of ${total} cases`
                }
                pageSizeOptions={["10", "20", "50", "100"]}
              />
            </Row>
          )}
        </section>
      )}
    </>
  );
};

export default CaseList;
