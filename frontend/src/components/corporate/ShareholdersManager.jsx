import React, { useState, useMemo } from "react";
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
  InputNumber,
  message,
  Tooltip,
  Popconfirm,
  Row,
  Col,
  Select,
  Statistic,
  Progress,
} from "antd";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import {
  addShareholder,
  updateShareholder,
  removeShareholder,
} from "../../redux/features/corporate/corporateSlice";

const { Option } = Select;

const ShareholdersManager = ({ matterId, shareholders = [] }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingShareholder, setEditingShareholder] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalShares = shareholders.reduce(
      (sum, s) => sum + (s.numberOfShares || 0),
      0,
    );
    const totalOwnership = shareholders.reduce(
      (sum, s) => sum + (s.percentageOwnership || 0),
      0,
    );
    const shareholderCount = shareholders.length;

    return { totalShares, totalOwnership, shareholderCount };
  }, [shareholders]);

  // Prepare data for pie chart
  const pieChartData = useMemo(() => {
    return shareholders.map((sh, index) => ({
      name: sh.name,
      value: sh.percentageOwnership || 0,
      shares: sh.numberOfShares || 0,
      color: `#${((index * 1234567) % 0xffffff).toString(16).padStart(6, "0")}`,
    }));
  }, [shareholders]);

  // Open modal for adding/editing
  const showModal = (shareholder = null) => {
    setEditingShareholder(shareholder);
    if (shareholder) {
      form.setFieldsValue(shareholder);
    } else {
      form.resetFields();
    }
    setModalVisible(true);
  };
  console.log("Editing shareholder:", editingShareholder);
  console.log(
    "Shareholder ID:",
    editingShareholder?._id || editingShareholder?.id,
  );
  console.log("Matter ID:", matterId);
  // Handle form submission
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingShareholder) {
        await dispatch(
          updateShareholder({
            matterId,
            shareholderId: editingShareholder._id || editingShareholder.id,
            data: values,
          }),
        );
      } else {
        await dispatch(addShareholder({ matterId, data: values }));
      }
      setModalVisible(false);
      form.resetFields();
      setEditingShareholder(null);
    } catch (error) {
      message.error("Failed to save shareholder");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (shareholderId) => {
    try {
      await dispatch(removeShareholder({ matterId, shareholderId }));
      message.success("Shareholder removed successfully");
    } catch (error) {
      message.error("Failed to remove shareholder");
    }
  };

  // Columns
  const columns = [
    {
      title: "Shareholder Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <div className="font-medium">{text}</div>,
    },
    {
      title: "Number of Shares",
      dataIndex: "numberOfShares",
      key: "numberOfShares",
      align: "right",
      render: (shares) => (
        <Tag color="blue">{shares ? shares.toLocaleString() : "0"}</Tag>
      ),
    },
    {
      title: "Share Class",
      dataIndex: "shareClass",
      key: "shareClass",
      render: (shareClass) =>
        shareClass || <span className="text-gray-400">Common</span>,
    },
    {
      title: "Ownership %",
      dataIndex: "percentageOwnership",
      key: "percentageOwnership",
      align: "right",
      render: (percentage) => (
        <div className="flex items-center justify-end">
          <Progress
            percent={percentage}
            size="small"
            showInfo={false}
            strokeColor="#52c41a"
            className="w-16 mr-2"
          />
          <span className="font-semibold">{percentage?.toFixed(2)}%</span>
        </div>
      ),
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
            title="Remove this shareholder?"
            description="Are you sure you want to remove this shareholder?"
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

  return (
    <>
      <Row gutter={16} className="mb-6">
        {/* Statistics */}
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Shareholders"
              value={stats.shareholderCount}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Shares"
              value={stats.totalShares}
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: "#52c41a" }}
              formatter={(value) => value.toLocaleString()}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Ownership"
              value={stats.totalOwnership}
              prefix={<PercentageOutlined />}
              valueStyle={{ color: "#722ed1" }}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* Pie Chart */}
        <Col xs={24} lg={12}>
          <Card title="Ownership Distribution">
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value">
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value, name, props) => [
                      `${value}% (${props.payload.shares} shares)`,
                      name,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Table */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="flex justify-between items-center">
                <span>Shareholder Details</span>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => showModal()}>
                  Add Shareholder
                </Button>
              </div>
            }>
            <Table
              columns={columns}
              dataSource={shareholders}
              rowKey={(record) => record._id || record.id}
              pagination={shareholders.length > 10 ? { pageSize: 10 } : false}
              locale={{ emptyText: "No shareholders added yet" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Modal */}
      <Modal
        title={editingShareholder ? "Edit Shareholder" : "Add New Shareholder"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Shareholder Name"
            rules={[
              { required: true, message: "Please enter shareholder name" },
            ]}>
            <Input placeholder="Enter shareholder name" />
          </Form.Item>

          <Form.Item
            name="numberOfShares"
            label="Number of Shares"
            rules={[
              { required: true, message: "Please enter number of shares" },
            ]}>
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Enter number of shares"
            />
          </Form.Item>

          <Form.Item name="shareClass" label="Share Class">
            <Select placeholder="Select share class">
              <Option value="Ordinary">Ordinary Shares</Option>
              <Option value="Preference">Preference Shares</Option>
              <Option value="Redeemable">Redeemable Shares</Option>
              <Option value="Non-voting">Non-voting Shares</Option>
              <Option value="Founders">Founders Shares</Option>
              <Option value="Employee">Employee Shares</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="percentageOwnership"
            label="Ownership Percentage"
            rules={[
              { required: true, message: "Please enter ownership percentage" },
              {
                type: "number",
                min: 0,
                max: 100,
                message: "Percentage must be between 0 and 100",
              },
            ]}>
            <InputNumber
              min={0}
              max={100}
              style={{ width: "100%" }}
              placeholder="0 - 100"
              suffix="%"
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingShareholder ? "Update Shareholder" : "Add Shareholder"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ShareholdersManager;
