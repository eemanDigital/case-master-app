import React, { useState } from "react";
import { useDispatch } from "react-redux";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Tooltip,
  Popconfirm,
  Empty,
  Select,
  Avatar,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CrownOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import {
  addDirector,
  updateDirector,
  removeDirector,
} from "../../redux/features/corporate/corporateSlice";
import { DATE_FORMAT } from "../../utils/corporateConstants";
import dayjs from "dayjs";

const { Option } = Select;

const DirectorsManager = ({ matterId, directors = [] }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDirector, setEditingDirector] = useState(null);
  const [loading, setLoading] = useState(false);

  // Open modal for adding/editing
  const showModal = (director = null) => {
    setEditingDirector(director);
    if (director) {
      form.setFieldsValue({
        ...director,
        appointmentDate: director.appointmentDate
          ? dayjs(director.appointmentDate)
          : null,
      });
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formattedValues = {
        ...values,
        appointmentDate: values.appointmentDate
          ? values.appointmentDate.toISOString()
          : null,
      };

      if (editingDirector) {
        await dispatch(
          updateDirector({
            matterId,
            directorId: editingDirector._id || editingDirector.id,
            data: formattedValues,
          }),
        );
      } else {
        await dispatch(addDirector({ matterId, data: formattedValues }));
      }
      setModalVisible(false);
      form.resetFields();
      setEditingDirector(null);
      message.success(
        editingDirector
          ? "Director updated successfully"
          : "Director added successfully",
      );
    } catch (error) {
      message.error("Failed to save director");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (directorId) => {
    try {
      await dispatch(removeDirector({ matterId, directorId }));
      message.success("Director removed successfully");
    } catch (error) {
      message.error("Failed to remove director");
    }
  };

  // Common director positions
  const DIRECTOR_POSITIONS = [
    "Chairman",
    "Managing Director",
    "CEO",
    "Executive Director",
    "Non-Executive Director",
    "Independent Director",
    "Finance Director",
    "Operations Director",
    "Technical Director",
    "Legal Director",
    "Company Secretary",
    "Other",
  ];

  // Columns
  const columns = [
    {
      title: "Director",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div className="flex items-center">
          <Avatar
            icon={<UserOutlined />}
            className="mr-3"
            style={{ backgroundColor: "#1890ff" }}
          />
          <div>
            <div className="font-medium">{text}</div>
            {record.position && (
              <div className="text-xs text-gray-500">{record.position}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Position",
      dataIndex: "position",
      key: "position",
      render: (position) =>
        position ? (
          <Tag color="blue">{position}</Tag>
        ) : (
          <span className="text-gray-400">Not specified</span>
        ),
    },
    {
      title: "Appointment Date",
      dataIndex: "appointmentDate",
      key: "appointmentDate",
      render: (date) =>
        date ? (
          <div className="flex items-center">
            <CalendarOutlined className="mr-2 text-gray-400" />
            <span>{dayjs(date).format(DATE_FORMAT)}</span>
          </div>
        ) : (
          <span className="text-gray-400">Not set</span>
        ),
    },
    {
      title: "Tenure",
      key: "tenure",
      render: (_, record) => {
        if (!record.appointmentDate) return "-";

        const appointmentDate = dayjs(record.appointmentDate);
        const today = dayjs();
        const years = today.diff(appointmentDate, "year");
        const months = today.diff(appointmentDate, "month") % 12;

        if (years === 0 && months === 0) {
          return "Recently appointed";
        }

        const tenure = [];
        if (years > 0) tenure.push(`${years} year${years > 1 ? "s" : ""}`);
        if (months > 0) tenure.push(`${months} month${months > 1 ? "s" : ""}`);

        return tenure.join(", ");
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Remove this director?"
            description="Are you sure you want to remove this director?"
            onConfirm={() => handleDelete(record._id || record.id)}
            okText="Yes"
            cancelText="No">
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Statistics
  const boardSize = directors.length;
  const executiveDirectors = directors.filter(
    (d) =>
      d.position?.toLowerCase().includes("executive") ||
      d.position?.toLowerCase().includes("managing") ||
      d.position?.toLowerCase().includes("ceo"),
  ).length;
  const nonExecutiveDirectors = directors.filter(
    (d) =>
      d.position?.toLowerCase().includes("non-executive") ||
      d.position?.toLowerCase().includes("independent"),
  ).length;

  return (
    <>
      {/* Statistics Row */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Directors"
              value={boardSize}
              prefix={<CrownOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Executive Directors"
              value={executiveDirectors}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Non-Executive Directors"
              value={nonExecutiveDirectors}
              prefix={<UserOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Card */}
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>
              <CrownOutlined className="mr-2" />
              Board of Directors ({directors.length})
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}>
              Add Director
            </Button>
          </div>
        }>
        {directors.length === 0 ? (
          <Empty
            description={
              <div className="text-center">
                <div className="mb-2">No directors added yet</div>
                <div className="text-gray-500 text-sm mb-4">
                  Add directors to track the board structure and appointments
                </div>
                <Button type="primary" onClick={() => showModal()}>
                  Add First Director
                </Button>
              </div>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={directors}
            rowKey={(record) => record._id || record.id}
            pagination={directors.length > 10 ? { pageSize: 10 } : false}
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingDirector ? "Edit Director" : "Add New Director"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
        centered>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Director Name"
            rules={[{ required: true, message: "Please enter director name" }]}>
            <Input placeholder="Enter director's full name" />
          </Form.Item>

          <Form.Item
            name="position"
            label="Position"
            rules={[{ required: true, message: "Please select position" }]}>
            <Select placeholder="Select position">
              {DIRECTOR_POSITIONS.map((position) => (
                <Option key={position} value={position}>
                  {position}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="appointmentDate" label="Appointment Date">
            <DatePicker
              style={{ width: "100%" }}
              format={DATE_FORMAT}
              placeholder="Select appointment date"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingDirector ? "Update Director" : "Add Director"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default DirectorsManager;
