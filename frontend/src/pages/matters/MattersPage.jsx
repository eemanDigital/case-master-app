import React, { useState } from "react";
import { Tabs, Card, Space, Button, Modal } from "antd";
import {
  AppstoreOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  DashboardOutlined,
  UserOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useMatters } from "../../hooks/useMatters";
import MatterListView from "../../components/matters/MatterListView";
import MatterGridView from "../../components/matters/MatterGridView";
import MatterForm from "../../components/matters/MatterForm";
import MatterStats from "../../components/matters/MatterStats";

const { TabPane } = Tabs;

const MattersPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("list");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMatter, setSelectedMatter] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const {
    matters,
    loading,
    pagination,
    filters,
    selectedMatter: detailedMatter,
    fetchMatters,
    fetchMatterById,
    createMatter,
    updateMatter,
    deleteMatter,
    updateFilters,
    clearFilters,
    getStats,
    getMyMatters,
    setPagination,
  } = useMatters();

  const handleTabChange = (key) => {
    setActiveTab(key);

    switch (key) {
      case "all":
        clearFilters();
        break;
      case "my":
        getMyMatters();
        break;
      case "active":
        updateFilters({ status: "active" });
        break;
      case "pending":
        updateFilters({ status: "pending" });
        break;
      case "archived":
        updateFilters({ status: "archived" });
        break;
      default:
        break;
    }
  };

  const handleCreateMatter = async (data) => {
    try {
      const newMatter = await createMatter(data);
      setShowCreateModal(false);
      navigate(`/matters/${newMatter._id}`);
    } catch (error) {
      console.error("Failed to create matter:", error);
    }
  };

  const handleViewMatter = async (matter) => {
    await fetchMatterById(matter._id);
    setSelectedMatter(matter);
    setShowDetailModal(true);
  };

  const handleEditMatter = (matter) => {
    navigate(`/matters/${matter._id}/edit`);
  };

  const handleDeleteMatter = async (matter) => {
    await deleteMatter(matter._id);
  };

  const handlePageChange = (page, pageSize) => {
    setPagination((prev) => ({ ...prev, page, limit: pageSize }));
    fetchMatters({ page, limit: pageSize });
  };

  const tabItems = [
    {
      key: "all",
      label: (
        <Space>
          <AppstoreOutlined />
          All Matters
        </Space>
      ),
    },
    {
      key: "my",
      label: (
        <Space>
          <UserOutlined />
          My Matters
        </Space>
      ),
    },
    {
      key: "active",
      label: (
        <Space>
          <DashboardOutlined />
          Active
        </Space>
      ),
    },
    {
      key: "pending",
      label: (
        <Space>
          <InboxOutlined />
          Pending
        </Space>
      ),
    },
    {
      key: "archived",
      label: (
        <Space>
          <InboxOutlined />
          Archived
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Matters</h1>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateModal(true)}
              size="large">
              New Matter
            </Button>
          </Space>
        </div>

        <MatterStats />
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          tabBarExtraContent={
            <Space>
              <Button
                type={viewMode === "grid" ? "primary" : "default"}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode("grid")}
              />
              <Button
                type={viewMode === "list" ? "primary" : "default"}
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode("list")}
              />
            </Space>
          }>
          {tabItems.map((tab) => (
            <TabPane tab={tab.label} key={tab.key} />
          ))}
        </Tabs>

        {viewMode === "list" ? (
          <MatterListView
            matters={matters}
            loading={loading}
            pagination={pagination}
            filters={filters}
            onFilter={updateFilters}
            onClearFilters={clearFilters}
            onPageChange={handlePageChange}
            onPageSizeChange={(current, size) => handlePageChange(1, size)}
            onView={handleViewMatter}
            onEdit={handleEditMatter}
            onDelete={handleDeleteMatter}
            onRefresh={() => fetchMatters()}
            onCreate={() => setShowCreateModal(true)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        ) : (
          <MatterGridView
            matters={matters}
            loading={loading}
            onView={handleViewMatter}
            onEdit={handleEditMatter}
            onDelete={handleDeleteMatter}
          />
        )}
      </Card>

      {/* Create Matter Modal */}
      <Modal
        title="Create New Matter"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
        width="90%"
        style={{ maxWidth: 1200 }}
        destroyOnClose>
        <MatterForm
          onSubmit={handleCreateMatter}
          loading={loading}
          mode="create"
        />
      </Modal>

      {/* Matter Detail Modal */}
      <Modal
        title={selectedMatter?.title}
        open={showDetailModal}
        onCancel={() => setShowDetailModal(false)}
        width="90%"
        style={{ maxWidth: 1000 }}
        footer={[
          <Button key="close" onClick={() => setShowDetailModal(false)}>
            Close
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setShowDetailModal(false);
              handleEditMatter(selectedMatter);
            }}>
            Edit
          </Button>,
        ]}>
        {detailedMatter && (
          <div className="space-y-6">{/* Detail view content */}</div>
        )}
      </Modal>
    </div>
  );
};

export default MattersPage;
