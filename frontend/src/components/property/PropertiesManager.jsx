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
  Select,
  InputNumber,
  message,
  Tooltip,
  Popconfirm,
  Empty,
  Avatar,
  Row,
  Col,
  Statistic,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  AreaChartOutlined,
} from "@ant-design/icons";
import {
  addProperty,
  updateProperty,
  removeProperty,
} from "../../redux/features/property/propertySlice";
import {
  PROPERTY_TYPES,
  TITLE_DOCUMENTS,
  LAND_SIZE_UNITS,
  NIGERIAN_STATES,
  getPropertyTypeLabel,
  getTitleDocumentLabel,
  formatLandSize,
} from "../../utils/propertyConstants";

const { Option } = Select;

const PropertiesManager = ({ matterId, properties = [] }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [loading, setLoading] = useState(false);

  // Open modal for adding/editing
  const showModal = (property = null) => {
    setEditingProperty(property);
    if (property) {
      form.setFieldsValue({
        ...property,
        landSizeValue: property.landSize?.value,
        landSizeUnit: property.landSize?.unit,
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
        landSize: values.landSizeValue
          ? {
              value: values.landSizeValue,
              unit: values.landSizeUnit,
            }
          : undefined,
      };

      if (editingProperty) {
        await dispatch(
          updateProperty({
            matterId,
            propertyId: editingProperty._id || editingProperty.id,
            data: formattedValues,
          }),
        );
      } else {
        await dispatch(addProperty({ matterId, data: formattedValues }));
      }
      setModalVisible(false);
      form.resetFields();
      setEditingProperty(null);
      message.success(
        editingProperty
          ? "Property updated successfully"
          : "Property added successfully",
      );
    } catch (error) {
      message.error("Failed to save property");
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (propertyId) => {
    try {
      await dispatch(removeProperty({ matterId, propertyId }));
      message.success("Property removed successfully");
    } catch (error) {
      message.error("Failed to remove property");
    }
  };

  // Statistics
  const residentialCount = properties.filter(
    (p) => p.propertyType === "residential",
  ).length;
  const commercialCount = properties.filter(
    (p) => p.propertyType === "commercial",
  ).length;
  const landCount = properties.filter((p) => p.propertyType === "land").length;
  const totalLandSize = properties.reduce(
    (total, prop) => total + (prop.landSize?.value || 0),
    0,
  );

  // Columns
  const columns = [
    {
      title: "Property",
      dataIndex: "address",
      key: "address",
      render: (address, record) => (
        <div className="flex items-center">
          <Avatar
            icon={<HomeOutlined />}
            className="mr-3"
            style={{
              backgroundColor:
                record.propertyType === "residential"
                  ? "#1890ff"
                  : record.propertyType === "commercial"
                    ? "#52c41a"
                    : record.propertyType === "industrial"
                      ? "#fa8c16"
                      : record.propertyType === "land"
                        ? "#722ed1"
                        : "#d9d9d9",
            }}
          />
          <div>
            <div className="font-medium">{address || "No address"}</div>
            {record.propertyType && (
              <div className="text-xs text-gray-500">
                {getPropertyTypeLabel(record.propertyType)}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Location",
      key: "location",
      render: (_, record) => (
        <div>
          {record.state && (
            <div className="flex items-center">
              <EnvironmentOutlined className="mr-1 text-gray-400" />
              <span>{record.state}</span>
              {record.lga && <span className="ml-1">, {record.lga}</span>}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Title Document",
      dataIndex: "titleDocument",
      key: "titleDocument",
      render: (document) =>
        document ? (
          <Tag color="blue">{getTitleDocumentLabel(document)}</Tag>
        ) : (
          <span className="text-gray-400">Not specified</span>
        ),
    },
    {
      title: "Title Number",
      dataIndex: "titleNumber",
      key: "titleNumber",
      render: (number) => number || "-",
    },
    {
      title: "Land Size",
      key: "landSize",
      render: (_, record) => {
        if (!record.landSize?.value) return "-";
        return formatLandSize(record.landSize.value, record.landSize.unit);
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
            title="Remove this property?"
            description="Are you sure you want to remove this property?"
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
      {/* Statistics Row */}
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Properties"
              value={properties.length}
              prefix={<HomeOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Residential"
              value={residentialCount}
              prefix={<HomeOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Commercial"
              value={commercialCount}
              prefix={<HomeOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Land Area"
              value={totalLandSize}
              prefix={<AreaChartOutlined />}
              valueStyle={{ color: "#722ed1" }}
              suffix={properties[0]?.landSize?.unit || "units"}
            />
          </Card>
        </Col>
      </Row>

      {/* Property Details Card (if only one property) */}
      {properties.length === 1 && (
        <Card className="mb-6">
          <Descriptions title="Property Details" column={2} bordered>
            {properties[0].propertyType && (
              <Descriptions.Item label="Property Type">
                {getPropertyTypeLabel(properties[0].propertyType)}
              </Descriptions.Item>
            )}
            {properties[0].address && (
              <Descriptions.Item label="Address">
                {properties[0].address}
              </Descriptions.Item>
            )}
            {properties[0].state && (
              <Descriptions.Item label="State">
                {properties[0].state}
                {properties[0].lga && `, ${properties[0].lga}`}
              </Descriptions.Item>
            )}
            {properties[0].titleDocument && (
              <Descriptions.Item label="Title Document">
                {getTitleDocumentLabel(properties[0].titleDocument)}
              </Descriptions.Item>
            )}
            {properties[0].titleNumber && (
              <Descriptions.Item label="Title Number">
                {properties[0].titleNumber}
              </Descriptions.Item>
            )}
            {properties[0].landSize?.value && (
              <Descriptions.Item label="Land Size">
                {formatLandSize(
                  properties[0].landSize.value,
                  properties[0].landSize.unit,
                )}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Main Card */}
      <Card
        title={
          <div className="flex justify-between items-center">
            <span>
              <HomeOutlined className="mr-2" />
              Properties ({properties.length})
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}>
              Add Property
            </Button>
          </div>
        }>
        {properties.length === 0 ? (
          <Empty
            description={
              <div className="text-center">
                <div className="mb-2">No properties added yet</div>
                <div className="text-gray-500 text-sm mb-4">
                  Add properties to track details, locations, and title
                  information
                </div>
                <Button type="primary" onClick={() => showModal()}>
                  Add First Property
                </Button>
              </div>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={properties}
            rowKey={(record) => record._id || record.id}
            pagination={properties.length > 10 ? { pageSize: 10 } : false}
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingProperty ? "Edit Property" : "Add New Property"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        centered>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="propertyType"
            label="Property Type"
            rules={[
              { required: true, message: "Please select property type" },
            ]}>
            <Select placeholder="Select property type">
              {PROPERTY_TYPES.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[
              { required: true, message: "Please enter property address" },
            ]}>
            <Input placeholder="Enter full property address" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="state" label="State">
                <Select placeholder="Select state" showSearch>
                  {NIGERIAN_STATES.map((state) => (
                    <Option key={state.value} value={state.value}>
                      {state.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="lga" label="Local Government Area">
                <Input placeholder="Enter LGA" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="titleDocument" label="Title Document">
            <Select placeholder="Select title document">
              {TITLE_DOCUMENTS.map((doc) => (
                <Option key={doc.value} value={doc.value}>
                  {doc.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="titleNumber" label="Title Number">
            <Input placeholder="Enter title/document number" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="landSizeValue" label="Land Size">
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  placeholder="Enter land size"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="landSizeUnit" label="Unit">
                <Select placeholder="Select unit">
                  {LAND_SIZE_UNITS.map((unit) => (
                    <Option key={unit.value} value={unit.value}>
                      {unit.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingProperty ? "Update Property" : "Add Property"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default PropertiesManager;
