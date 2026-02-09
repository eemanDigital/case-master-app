import React, { useState, useCallback } from "react";
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
  InputNumber,
  Select,
  Switch,
  message,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  addDisbursement,
  updateDisbursement,
  deleteDisbursement,
} from "../../redux/features/general/generalSlice";
import { DISBURSEMENT_CATEGORIES } from "../../utils/generalConstants";

const { Option } = Select;
const { TextArea } = Input;

const DisbursementsManager = ({ matterId }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDisbursement, setEditingDisbursement] = useState(null);

  const selectedDetails = useSelector((state) => state.general.selectedDetails);
  const generalDetail = selectedDetails?.generalDetail || selectedDetails;
  const actionLoading = useSelector((state) => state.general.actionLoading);

  const disbursements = generalDetail?.disbursements || [];

  const handleAdd = useCallback(() => {
    setEditingDisbursement(null);
    form.resetFields();
    setModalVisible(true);
  }, [form]);

  const handleEdit = useCallback(
    (disbursement) => {
      setEditingDisbursement(disbursement);
      form.setFieldsValue({
        item: disbursement.item,
        category: disbursement.category,
        estimatedAmount: disbursement.estimatedAmount,
        actualAmount: disbursement.actualAmount,
        incurredDate: disbursement.incurredDate
          ? dayjs(disbursement.incurredDate)
          : null,
        receiptNumber: disbursement.receiptNumber,
        isBillableToClient: disbursement.isBillableToClient,
        receiptRequired: disbursement.receiptRequired,
      });
      setModalVisible(true);
    },
    [form],
  );

  const handleDelete = useCallback(
    async (disbursementId) => {
      Modal.confirm({
        title: "Delete Disbursement",
        content: "Are you sure you want to delete this disbursement?",
        okText: "Delete",
        okType: "danger",
        onOk: async () => {
          try {
            await dispatch(
              deleteDisbursement({ matterId, disbursementId }),
            ).unwrap();
            message.success("Disbursement deleted successfully");
          } catch (error) {
            message.error(error || "Failed to delete disbursement");
          }
        },
      });
    },
    [dispatch, matterId],
  );

  const handleSubmit = useCallback(
    async (values) => {
      try {
        const data = {
          item: values.item,
          category: values.category,
          estimatedAmount: values.estimatedAmount,
          actualAmount: values.actualAmount,
          incurredDate: values.incurredDate?.toISOString(),
          receiptNumber: values.receiptNumber,
          isBillableToClient: values.isBillableToClient,
          receiptRequired: values.receiptRequired,
        };

        if (editingDisbursement) {
          await dispatch(
            updateDisbursement({
              matterId,
              disbursementId: editingDisbursement._id,
              data,
            }),
          ).unwrap();
          message.success("Disbursement updated successfully");
        } else {
          await dispatch(addDisbursement({ matterId, data })).unwrap();
          message.success("Disbursement added successfully");
        }
        setModalVisible(false);
        form.resetFields();
      } catch (error) {
        message.error(error || "Failed to save disbursement");
      }
    },
    [dispatch, matterId, editingDisbursement, form],
  );

  const columns = [
    {
      title: "Item",
      dataIndex: "item",
      key: "item",
      width: "25%",
      render: (item) => (
        <Space>
          <FileTextOutlined />
          <strong>{item}</strong>
        </Space>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: "15%",
      render: (category) => {
        const cat = DISBURSEMENT_CATEGORIES.find((c) => c.value === category);
        return <Tag color="blue">{cat?.label || category}</Tag>;
      },
    },
    {
      title: "Estimated",
      dataIndex: "estimatedAmount",
      key: "estimatedAmount",
      width: "12%",
      render: (amount) => (amount ? `₦${amount.toLocaleString()}` : "N/A"),
    },
    {
      title: "Actual",
      dataIndex: "actualAmount",
      key: "actualAmount",
      width: "12%",
      render: (amount) =>
        amount ? <strong>₦{amount.toLocaleString()}</strong> : "N/A",
    },
    {
      title: "Date",
      dataIndex: "incurredDate",
      key: "incurredDate",
      width: "12%",
      render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "N/A"),
    },
    {
      title: "Receipt #",
      dataIndex: "receiptNumber",
      key: "receiptNumber",
      width: "10%",
    },
    {
      title: "Billable",
      dataIndex: "isBillableToClient",
      key: "isBillableToClient",
      width: "8%",
      render: (billable) =>
        billable ? <CheckCircleOutlined style={{ color: "#52c41a" }} /> : "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: "6%",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  const summary = {
    total: disbursements.length,
    totalEstimated: disbursements.reduce(
      (sum, d) => sum + (d.estimatedAmount || 0),
      0,
    ),
    totalActual: disbursements.reduce(
      (sum, d) => sum + (d.actualAmount || 0),
      0,
    ),
    billable: disbursements
      .filter((d) => d.isBillableToClient)
      .reduce((sum, d) => sum + (d.actualAmount || d.estimatedAmount || 0), 0),
    nonBillable: disbursements
      .filter((d) => !d.isBillableToClient)
      .reduce((sum, d) => sum + (d.actualAmount || d.estimatedAmount || 0), 0),
  };

  return (
    <div>
      <Card
        title="Disbursements (Out-of-Pockets)"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Disbursement
          </Button>
        }
        style={{ marginBottom: 16 }}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Items"
                value={summary.total}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Estimated Total"
                value={summary.totalEstimated}
                prefix="₦"
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Actual Total"
                value={summary.totalActual}
                prefix="₦"
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Billable to Client"
                value={summary.billable}
                prefix="₦"
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={disbursements}
          rowKey={(record) => record._id}
          loading={actionLoading}
          pagination={false}
          locale={{ emptyText: "No disbursements added yet" }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row
                style={{ fontWeight: "bold", backgroundColor: "#fafafa" }}>
                <Table.Summary.Cell index={0} colSpan={2}>
                  TOTALS
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  ₦{summary.totalEstimated.toLocaleString()}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  ₦{summary.totalActual.toLocaleString()}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} colSpan={4}></Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>

      <Modal
        title={editingDisbursement ? "Edit Disbursement" : "Add Disbursement"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={actionLoading}
        width={700}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="item"
            label="Item/Description"
            rules={[
              { required: true, message: "Please enter item description" },
            ]}>
            <Input placeholder="e.g., NBA Stamp, Court Filing Fee" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Please select category" }]}>
            <Select placeholder="Select category">
              {DISBURSEMENT_CATEGORIES.map((c) => (
                <Option key={c.value} value={c.value}>
                  {c.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="estimatedAmount" label="Estimated Amount (₦)">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actualAmount" label="Actual Amount (₦)">
                <InputNumber
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) =>
                    `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="incurredDate"
                label="Date Incurred"
                initialValue={dayjs()}>
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="receiptNumber" label="Receipt Number">
                <Input placeholder="Receipt/invoice number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isBillableToClient"
                label="Billable to Client"
                valuePropName="checked"
                initialValue={true}>
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="receiptRequired"
                label="Receipt Required"
                valuePropName="checked"
                initialValue={true}>
                <Switch checkedChildren="Yes" unCheckedChildren="No" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default DisbursementsManager;
