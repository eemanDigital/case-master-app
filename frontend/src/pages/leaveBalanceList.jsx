import { useEffect, useState, useMemo } from "react";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import { Space, Table, Button, Modal, Tooltip } from "antd";
import avatar from "../assets/avatar.png";
import { useDispatch, useSelector } from "react-redux";
import { deleteData } from "../redux/features/delete/deleteSlice";
import { useAdminHook } from "../hooks/useAdminHook";
import LoadingSpinner from "../components/LoadingSpinner";
import { DeleteOutlined } from "@ant-design/icons";
import SearchBar from "../components/SearchBar";
import debounce from "lodash/debounce";
import PageErrorAlert from "../components/PageErrorAlert";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const { Column, ColumnGroup } = Table;

const LeaveBalanceList = () => {
  const { leaveBalance, loading, error, fetchData } = useDataGetterHook();
  const [searchResults, setSearchResults] = useState([]);
  const { user } = useSelector((state) => state.auth); // user from context
  const { isAdminOrHr, isSuperAdmin } = useAdminHook();
  const dispatch = useDispatch();
  const deleteState = useSelector((state) => state.delete); // select delete state
  useRedirectLogoutUser("/users/login"); // redirect to login if user is not logged in

  // fetch data
  const fetchLeaveBalance = async () => {
    await fetchData("leaves/balances", "leaveBalance");
  };

  useEffect(() => {
    fetchLeaveBalance();
  }, []);

  // render all data initially before filter
  useEffect(() => {
    if (leaveBalance?.data) {
      setSearchResults(leaveBalance?.data);
    }
  }, [leaveBalance?.data]); // Only depend on users.data to avoid unnecessary re-renders

  // debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((searchTerm) => {
        if (!searchTerm) {
          setSearchResults(leaveBalance?.data);
          return;
        }
        const results = leaveBalance?.data.filter((d) => {
          const fullName =
            `${d.employee?.firstName}${d?.employee?.lastName}`.toLowerCase();
          return fullName.includes(searchTerm);
        });
        setSearchResults(results);
      }, 300),
    [leaveBalance?.data]
  );
  const handleSearchChange = (e) => {
    debouncedSearch(e.target.value.trim().toLowerCase());
  };

  // remove leave balance
  const removeBalance = async (id) => {
    await dispatch(deleteData(`leaves/balances/${id}`)).unwrap();
    await fetchData("leaves/balances", "leaveBalance");
  };

  // Loading state for fetching data
  if (loading.leaveBalance) {
    return <LoadingSpinner />;
  }

  // Filter the leave applications based on the user's role
  const filteredLeaveBalance = isAdminOrHr
    ? searchResults
    : searchResults?.filter(
        (balance) => balance?.employee?._id === user?.data?._id
      );

  return (
    <>
      {error.leaveBalance ? (
        <PageErrorAlert
          errorCondition={error.leaveBalance}
          errorMessage={error.leaveBalance}
        />
      ) : (
        <div className="overflow-x-auto mt-3">
          <div className="flex flex-col md:flex-row justify-between items-center  mb-3">
            <h1 className="text-2xl font-bold text-gray-800 mb-3">
              Staff Leave Balance/Award
            </h1>

            <SearchBar onSearch={handleSearchChange} />
          </div>
          <Table dataSource={filteredLeaveBalance} scroll={{ x: 100 }}>
            <ColumnGroup title="Employee's Name">
              <Column
                title="Photo"
                dataIndex={["employee", "photo"]}
                key="photo"
                render={(photo, record) => (
                  <div className="flex items-center justify-center">
                    <img
                      className="w-12 h-12 rounded-full object-cover object-center"
                      src={photo ? photo : avatar}
                      alt="Employee Avatar"
                    />
                  </div>
                )}
              />

              <Column
                title="First Name"
                dataIndex={["employee", "firstName"]}
                key="employee.firstName"
              />
              <Column
                title="Last Name"
                dataIndex={["employee", "lastName"]}
                key="employee.lastName"
              />
            </ColumnGroup>

            <Column
              title="Annual Leave Balance"
              dataIndex="annualLeaveBalance"
              key="annualLeaveBalance"
            />
            <Column
              title="Sick Leave Balance"
              dataIndex="sickLeaveBalance"
              key="sickLeaveBalance"
            />

            {(isAdminOrHr || isSuperAdmin) && (
              <Column
                title="Action"
                key="action"
                render={(text, record) => (
                  <Space size="middle">
                    <Tooltip title="Delete Balance">
                      <Button
                        icon={<DeleteOutlined />}
                        className="mx-6 bg-red-200 text-red-500 hover:text-red-700"
                        onClick={() => {
                          Modal.confirm({
                            title:
                              "Are you sure you want to delete this application?",
                            onOk: () => removeBalance(record?.id),
                          });
                        }}
                        type="primary"
                        loading={deleteState.isLoading}></Button>
                    </Tooltip>
                  </Space>
                )}
              />
            )}
          </Table>
        </div>
      )}
    </>
  );
};

export default LeaveBalanceList;
