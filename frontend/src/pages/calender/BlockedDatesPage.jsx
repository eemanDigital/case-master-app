import React, { useState } from "react";
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

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Title level={3} className="!mb-0">
              <LockOutlined className="mr-2" />
              Blocked Dates Management
            </Title>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={refresh}
                loading={loading}>
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                className="bg-blue-600 hover:bg-blue-700">
                Block New Date
              </Button>
            </Space>
          </div>

          <Text className="text-gray-600">
            Manage blocked dates and time slots to prevent scheduling conflicts
          </Text>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <Space className="w-full" direction="vertical" size="middle">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Search
                placeholder="Search by title or reason"
                allowClear
                enterButton={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />

              <Select
                placeholder="Filter by status"
                style={{ width: "100%" }}
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "active", label: "Active Only" },
                  { value: "inactive", label: "Inactive Only" },
                ]}
              />
            </div>
          </Space>
        </Card>

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={blockedDates}
            rowKey="_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} blocked dates`,
            }}
            scroll={{ x: 1200 }}
          />
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
