import { Link } from "react-router-dom";
import { Pagination, Row } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useUserList } from "../hooks/useUserList";
import ButtonWithIcon from "../components/ButtonWithIcon";
import PageErrorAlert from "../components/PageErrorAlert";
import StaffSearchBar from "../components/StaffSearchBar";
import UserListTable from "../components/UserListTable";
import ActiveFilters from "../components/ActiveFilters";
import useRedirectLogoutUser from "../hooks/useRedirectLogoutUser";

const ClientList = () => {
  useRedirectLogoutUser("/users/login");

  const {
    filteredList: clientList,
    filters,
    currentPage,
    itemsPerPage,
    isError,
    loading,
    handleFiltersChange,
    resetFilters,
    removeUser,
    handlePageChange,
  } = useUserList("client");

  const handleFilterRemove = (key) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    handleFiltersChange(newFilters);
  };

  return (
    <>
      <div className="flex md:flex-row flex-col justify-between items-center gap-3 my-4">
        <div className="flex gap-2">
          <Link to="add-client">
            <ButtonWithIcon
              onClick={() => {}}
              icon={<PlusOutlined className="mr-2" />}
              text="Add Client"
            />
          </Link>
        </div>

        <div className="w-full md:w-96">
          <StaffSearchBar
            onFiltersChange={handleFiltersChange}
            filters={filters}
            loading={loading}
            searchPlaceholder="Search clients by name, email..."
            showUserFilters={true}
            hideFields={true}
          />
        </div>
      </div>

      <ActiveFilters
        filters={filters}
        onFilterRemove={handleFilterRemove}
        onClearAll={resetFilters}
      />

      {isError ? (
        <PageErrorAlert errorCondition={true} errorMessage={isError} />
      ) : (
        <>
          <UserListTable
            dataSource={clientList}
            loading={loading}
            onDelete={removeUser}
            showActions={true}
            userType="client"
            basePath="/dashboard/clients"
          />

          {clientList?.length > 0 && (
            <Row justify="center" style={{ marginTop: 16 }}>
              <Pagination
                current={currentPage}
                total={clientList.length * 5}
                pageSize={itemsPerPage}
                onChange={handlePageChange}
                onShowSizeChange={handlePageChange}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) =>
                  `Showing ${range[0]}-${range[1]} of ${total} clients`
                }
                pageSizeOptions={["10", "20", "50", "100"]}
              />
            </Row>
          )}
        </>
      )}
    </>
  );
};

export default ClientList;
