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
  ReloadOutlined,
} from "@ant-design/icons";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { useCallback, useEffect, useState, useMemo } from "react";
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

  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  console.log("User info:", cases);

  const dispatch = useDispatch();
  useRedirectLogoutUser("/users/login");

  // Build query string for API calls
  const buildQueryString = useCallback((filters, pagination) => {
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
  }, []);

  // Fetch cases with filters
  const fetchCases = useCallback(
    async (
      newFilters = filters,
      page = currentPage,
      pageSize = itemsPerPage
    ) => {
      try {
        const queryString = buildQueryString(newFilters, {
          current: page,
          limit: pageSize,
        });
        const url = queryString ? `cases?${queryString}` : "cases";

        await fetchData(url, "cases");
      } catch (err) {
        console.error("Error fetching cases:", err);
      }
    },
    [buildQueryString, fetchData, filters, currentPage, itemsPerPage]
  );

  // Initial load
  useEffect(() => {
    fetchCases();
  }, []);

  // Handle API response
  useEffect(() => {
    if (cases?.data) {
      console.log("Cases received:", cases.data);

      // Debug: Check the structure of the first case
      if (cases.data.length > 0) {
        console.log("Sample case structure:", cases.data[0]);
        console.log("Available fields:", Object.keys(cases.data[0]));
      }

      setSearchResults(cases.data);

      // Update pagination if provided by API
      if (cases.pagination) {
        setCurrentPage(cases.pagination.current || 1);
      }
    }
  }, [cases]);

  // Handle filter changes
  const handleFiltersChange = useCallback(
    async (newFilters) => {
      setFilters(newFilters);
      setCurrentPage(1);
      await fetchCases(newFilters, 1, itemsPerPage);
    },
    [fetchCases, itemsPerPage]
  );

  // Reset filters
  const resetFilters = useCallback(async () => {
    setFilters({});
    setCurrentPage(1);
    await fetchCases({}, 1, itemsPerPage);
  }, [fetchCases, itemsPerPage]);

  // Delete case
  const deleteCase = useCallback(
    async (id) => {
      await dispatch(deleteData(`cases/soft-delete/${id}`));
      await fetchCases(filters, currentPage, itemsPerPage);
    },
    [dispatch, fetchCases, filters, currentPage, itemsPerPage]
  );

  // Handle delete notifications
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

  // FIXED: Filter cases for client
  // Check multiple possible field names where client ID might be stored
  const filterCasesByClient = useCallback((cases, clientId) => {
    if (!cases || !Array.isArray(cases) || !clientId) {
      console.log("Filter check - cases:", cases, "clientId:", clientId);
      return [];
    }

    return cases.filter((caseItem) => {
      // Check all possible client field locations
      const possibleClientIds = [
        caseItem.client,
        caseItem.clientId,
        caseItem.client?._id,
        caseItem.createdBy,
        caseItem.createdBy?._id,
        // If client is nested in firstParty or secondParty
        caseItem.firstParty?.client,
        caseItem.secondParty?.client,
      ];

      const isClientCase = possibleClientIds.some(
        (id) => id && (id === clientId || id._id === clientId)
      );

      // Debug log for first few cases
      if (caseItem === cases[0]) {
        console.log("Checking case:", caseItem._id);
        console.log("Client ID to match:", clientId);
        console.log(
          "Possible client IDs found:",
          possibleClientIds.filter(Boolean)
        );
        console.log("Match found:", isClientCase);
      }

      return isClientCase;
    });
  }, []);

  // Get current cases with memoization
  const currentCases = useMemo(() => {
    if (isStaff) {
      return searchResults;
    }

    const filtered = filterCasesByClient(searchResults, clientId);
    console.log(
      "Filtered cases for client:",
      filtered.length,
      "of",
      searchResults.length
    );
    return filtered;
  }, [isStaff, searchResults, clientId, filterCasesByClient]);

  // Handle pagination change
  const handlePageChange = useCallback(
    async (page, pageSize) => {
      setCurrentPage(page);
      if (pageSize !== itemsPerPage) {
        setItemsPerPage(pageSize);
        await fetchCases(filters, 1, pageSize);
      } else {
        await fetchCases(filters, page, pageSize);
      }
    },
    [fetchCases, filters, itemsPerPage]
  );

  // Table columns
  const columns = useMemo(
    () => [
      {
        title: "Case",
        dataIndex: "case",
        key: "case",
        render: (_, record) => {
          const getAllNames = (party) => {
            if (!party?.name || !Array.isArray(party.name)) return [];
            return party.name.map((n) => n?.name).filter(Boolean);
          };

          const formatForDisplay = (names) => {
            if (names.length === 0) return "";
            if (names.length === 1) return names[0];
            if (names.length === 2) return `${names[0]} and ${names[1]}`;
            return `${names[0]}, ${names[1]}, and ${names.length - 2} other${
              names.length - 2 > 1 ? "s" : ""
            }`;
          };

          const firstNames = getAllNames(record.firstParty);
          const secondNames = getAllNames(record.secondParty);

          const firstPartyDisplay = formatForDisplay(firstNames);
          const secondPartyDisplay = formatForDisplay(secondNames);

          const displayText =
            firstPartyDisplay || secondPartyDisplay
              ? `${firstPartyDisplay || "Unknown"} vs ${
                  secondPartyDisplay || "Unknown"
                }`
              : "No parties";

          return (
            <Tooltip
              title={
                <div className="max-w-xs">
                  <div className="font-semibold mb-1">All Parties:</div>
                  <div className="text-xs">
                    <div>
                      <span className="font-medium">First Party:</span>{" "}
                      {firstNames.length > 0 ? firstNames.join(", ") : "None"}
                    </div>
                    <div>
                      <span className="font-medium">Second Party:</span>{" "}
                      {secondNames.length > 0 ? secondNames.join(", ") : "None"}
                    </div>
                  </div>
                </div>
              }>
              <Link to={`${record._id}/casedetails`}>
                <h1 className="font-bold text-blue-600 hover:text-blue-800 truncate">
                  {displayText}
                </h1>
              </Link>
            </Tooltip>
          );
        },
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
        title: "Action",
        key: "action",
        render: (_, record) =>
          isStaff ? (
            <Space size="small" className="flex-wrap">
              <Link to={`${record._id}/update`}>
                <Tooltip title="Edit Case">
                  <Button
                    size="small"
                    className="bg-purple-200 text-purple-500 border-0"
                    icon={<EditOutlined />}
                  />
                </Tooltip>
              </Link>
              <Tooltip title="Delete Case">
                <Button
                  size="small"
                  icon={<DeleteOutlined />}
                  className="bg-red-200 text-red-500 hover:text-red-700 border-0"
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
        width: 100,
        fixed: "right",
      },
    ],
    [isStaff, deleteCase]
  );

  if (loading.cases) return <LoadingSpinner />;

  return (
    <>
      <div className="flex md:flex-row flex-col justify-between items-center mb-4 gap-4">
        {isStaff && (
          <div className="w-full md:w-auto">
            <Link to="add-case">
              <ButtonWithIcon
                onClick={() => {}}
                icon={null}
                text="+ Add Case"
              />
            </Link>
          </div>
        )}

        <div className="w-full md:w-96">
          <CaseSearchBar
            onFiltersChange={handleFiltersChange}
            filters={filters}
            loading={loading.cases}
            searchPlaceholder="Search cases by party name, suit no, or details..."
            showCaseSearch={false}
            showDateFilter={true}
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {Object.keys(filters).length > 0 && (
        <Card size="small" className="mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">
              Active filters:
            </span>
            {Object.entries(filters).map(
              ([key, value]) =>
                value && (
                  <Tag
                    key={key}
                    closable
                    onClose={() => {
                      const newFilters = { ...filters };
                      delete newFilters[key];
                      handleFiltersChange(newFilters);
                    }}
                    className="bg-blue-100 border-blue-300">
                    {key}: {value}
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
            {isStaff && (
              <ArchiveIcon
                toolTipName="View Deleted Cases"
                link="soft-deleted-cases"
              />
            )}
          </div>

          <div className="overflow-x-auto">
            {currentCases?.length === 0 ? (
              <Empty
                description={
                  Object.keys(filters).length > 0
                    ? "No cases found matching your filters"
                    : isStaff
                    ? "No cases found"
                    : "You don't have any assigned cases"
                }>
                {Object.keys(filters).length > 0 ? (
                  <Button type="primary" onClick={resetFilters}>
                    Clear filters
                  </Button>
                ) : (
                  !isStaff && (
                    <p className="text-gray-500 mt-2">
                      Contact your administrator to get cases assigned to you.
                    </p>
                  )
                )}
              </Empty>
            ) : (
              <>
                <Table
                  columns={columns}
                  dataSource={currentCases}
                  pagination={false}
                  rowKey="_id"
                  loading={loading.cases}
                  scroll={{ x: 900 }}
                />

                {/* Display count */}
                <div className="mt-2 text-sm text-gray-600">
                  Showing {currentCases.length} case
                  {currentCases.length !== 1 ? "s" : ""}
                  {!isStaff &&
                    searchResults.length > currentCases.length &&
                    ` (filtered from ${searchResults.length} total)`}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
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
                  `${range[0]}-${range[1]} of ${total} cases`
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
