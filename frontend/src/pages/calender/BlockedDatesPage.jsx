import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Layout,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Card,
  Popconfirm,
  message,
  Input,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useBlockedDates } from "../../hooks/useCalendar";
import {
  createBlockedDate,
  updateBlockedDate,
  deleteBlockedDate,
} from "../../redux/features/calender/calenderSlice";
import { formatDate, formatTime } from "../../utils/calendarUtils";
import {
  BLOCK_TYPES,
  BLOCK_SCOPES,
  BLOCK_CATEGORIES,
} from "../../utils/calendarConstants";
import BlockedDateFormModal from "../../components/calender/BlockedDateFormModal";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Search } = Input;

const BlockedDatesPage = () => {
  const dispatch = useDispatch();
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { blockedDates, loading, refresh } = useBlockedDates();

  const handleCreate = () => {
    setFormMode("create");
    setSelectedBlock(null);
    setShowForm(true);
  };

  const handleEdit = (block) => {
    setFormMode("edit");
    setSelectedBlock(block);
    setShowForm(true);
  };

  const handleSubmit = async (data) => {
    setSubmitLoading(true);
    try {
      if (formMode === "create") {
        await dispatch(createBlockedDate(data)).unwrap();
        message.success("Blocked date created successfully");
      } else {
        await dispatch(updateBlockedDate({ blockId: selectedBlock._id, updateData: data })).unwrap();
        message.success("Blocked date updated successfully");
      }
      setShowForm(false);
      setSelectedBlock(null);
      refresh();
    } catch (error) {
      message.error(error?.message || "Failed to save blocked date");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (blockId) => {
    try {
      await dispatch(deleteBlockedDate(blockId)).unwrap();
      message.success("Blocked date deleted successfully");
      refresh();
    } catch (error) {
      message.error("Failed to delete blocked date");
    }
  };

  const handleToggleActive = async (block) => {
    try {
      await dispatch(updateBlockedDate({
        blockId: block._id,
        updateData: { isActive: !block.isActive }
      })).unwrap();
      message.success(
        block.isActive ? "Blocked date deactivated" : "Blocked date activated",
      );
      refresh();
    } catch (error) {
      message.error("Failed to update blocked date");
    }
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      filteredValue: [searchText],
      onFilter: (value, record) =>
        record.title.toLowerCase().includes(value.toLowerCase()) ||
        record.reason.toLowerCase().includes(value.toLowerCase()),
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <Text className="text-xs text-gray-500">{record.reason}</Text>
        </div>
      ),
    },
    {
      title: "Date Range",
      key: "dateRange",
      render: (_, record) => (
        <div>
          <div className="text-sm">
            {formatDate(record.startDate, "MMM DD, YYYY")}
          </div>
          <div className="text-sm">
            to {formatDate(record.endDate, "MMM DD, YYYY")}
          </div>
          {record.blockType === BLOCK_TYPES.TIME_SLOT && (
            <Tag color="blue" className="!text-xs mt-1">
              {record.startTime} - {record.endTime}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "blockType",
      key: "blockType",
      render: (type) => (
        <Tag color="purple">{type.replace("_", " ").toUpperCase()}</Tag>
      ),
    },
    {
      title: "Scope",
      dataIndex: "blockScope",
      key: "blockScope",
      render: (scope, record) => (
        <div>
          <Tag color="cyan">{scope.replace("_", " ").toUpperCase()}</Tag>
          {scope === BLOCK_SCOPES.SPECIFIC_USERS &&
            record.blockedUsers?.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {record.blockedUsers.length} user(s)
              </div>
            )}
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "blockCategory",
      key: "blockCategory",
      render: (category) => (
        <Tag>{category?.replace("_", " ").toUpperCase() || "-"}</Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Tag
            color={record.isActive ? "success" : "default"}
            icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}>
            {record.isActive ? "Active" : "Inactive"}
          </Tag>
          {record.enforceStrict ? (
            <Tag color="error" className="!text-xs">
              Strict
            </Tag>
          ) : (
            <Tag color="warning" className="!text-xs">
              Soft
            </Tag>
          )}
        </Space>
      ),
      filteredValue: filterStatus === "all" ? null : [filterStatus],
      onFilter: (value, record) => {
        if (value === "active") return record.isActive;
        if (value === "inactive") return !record.isActive;
        return true;
      },
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small">
            Edit
          </Button>

          <Button
            type="link"
            icon={record.isActive ? <UnlockOutlined /> : <LockOutlined />}
            onClick={() => handleToggleActive(record)}
            size="small">
            {record.isActive ? "Deactivate" : "Activate"}
          </Button>

          <Popconfirm
            title="Delete this blocked date?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record._id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}>
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const mobileColumns = [
    {
      title: "Details",
      key: "details",
      render: (_, record) => (
        <div className="space-y-2">
          <div>
            <Text strong className="text-sm">{record.title}</Text>
            <Text type="secondary" className="block text-xs">{record.reason}</Text>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag color="purple" className="!text-xs">{record.blockType?.replace("_", " ").toUpperCase()}</Tag>
            <Tag color="cyan" className="!text-xs">{record.blockScope?.replace("_", " ").toUpperCase()}</Tag>
          </div>
          <Text type="secondary" className="text-xs block">
            {formatDate(record.startDate, "MMM DD")} - {formatDate(record.endDate, "MMM DD, YYYY")}
          </Text>
          <div className="flex items-center gap-2">
            <Tag
              color={record.isActive ? "success" : "default"}
              className="!text-xs">
              {record.isActive ? "Active" : "Inactive"}
            </Tag>
            <Tag color={record.enforceStrict ? "error" : "warning"} className="!text-xs">
              {record.enforceStrict ? "Strict" : "Soft"}
            </Tag>
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}>
              Edit
            </Button>
            <Button
              type="text"
              size="small"
              icon={record.isActive ? <UnlockOutlined /> : <LockOutlined />}
              onClick={() => handleToggleActive(record)}>
              {record.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Popconfirm
              title="Delete this blocked date?"
              onConfirm={() => handleDelete(record._id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-4 md:p-6">
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-3 md:mb-4">
            <Title level={3} className="!mb-0 !text-base md:!text-lg">
              <LockOutlined className="mr-1 md:mr-2" />
              <span className="hidden sm:inline">Blocked Dates</span>
              <span className="sm:hidden">Blocked</span>
            </Title>
            <Space size={isMobile ? "small" : "middle"}>
              <Button
                icon={<ReloadOutlined />}
                onClick={refresh}
                loading={loading}
                size={isMobile ? "small" : "middle"}>
                {isMobile ? "" : "Refresh"}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                size={isMobile ? "small" : "middle"}
                className="bg-blue-600 hover:bg-blue-700">
                {isMobile ? "Add" : "Block New Date"}
              </Button>
            </Space>
          </div>

          <Text type="secondary" className="text-sm">
            Manage blocked dates and time slots
          </Text>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Search
              placeholder="Search..."
              allowClear
              enterButton={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full sm:w-auto"
              size={isMobile ? "small" : "middle"}
            />

            <Select
              placeholder="Status"
              style={{ width: isMobile ? "100%" : 160 }}
              value={filterStatus}
              onChange={setFilterStatus}
              size={isMobile ? "small" : "middle"}
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
            <Table
              columns={isMobile ? mobileColumns : columns}
              dataSource={blockedDates}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: !isMobile,
                showTotal: (total) => `${total} blocked dates`,
                size: isMobile ? "small" : "default",
              }}
              scroll={{ x: isMobile ? 400 : 1200 }}
            />
          </div>
        </Card>
      </Content>

      {/* Form Modal */}
      <BlockedDateFormModal
        visible={showForm}
        mode={formMode}
        initialValues={selectedBlock}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowForm(false);
          setSelectedBlock(null);
        }}
        loading={submitLoading}
      />
    </Layout>
  );
};

export default BlockedDatesPage;
