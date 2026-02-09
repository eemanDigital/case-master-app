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
  message,
  Progress,
  Timeline,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import {
  addProjectStage,
  updateProjectStage,
  completeProjectStage,
} from "../../redux/features/general/generalSlice";

const ProjectStagesManager = ({ matterId }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  const [editingStage, setEditingStage] = useState(null);

  const selectedDetails = useSelector((state) => state.general.selectedDetails);
  const generalDetail = selectedDetails?.generalDetail || selectedDetails;
  const actionLoading = useSelector((state) => state.general.actionLoading);

  const stages = generalDetail?.projectStages || [];

  const handleAdd = useCallback(() => {
    setEditingStage(null);
    form.resetFields();
    setModalVisible(true);
  }, [form]);

  const handleEdit = useCallback(
    (stage) => {
      setEditingStage(stage);
      form.setFieldsValue({
        stageName: stage.stageName,
        expectedDate: stage.expectedDate ? dayjs(stage.expectedDate) : null,
        percentageOfFee: stage.percentageOfFee,
        amount: stage.amount,
      });
      setModalVisible(true);
    },
    [form],
  );

  const handleComplete = useCallback(
    (stage) => {
      setEditingStage(stage);
      form.setFieldsValue({
        actualDate: dayjs(),
      });
      setCompleteModalVisible(true);
    },
    [form],
  );

  const handleSubmit = useCallback(
    async (values) => {
      try {
        const data = {
          stageName: values.stageName,
          expectedDate: values.expectedDate?.toISOString(),
          percentageOfFee: values.percentageOfFee,
          amount: values.amount,
        };

        if (editingStage) {
          await dispatch(
            updateProjectStage({
              matterId,
              stageId: editingStage._id,
              data,
            }),
          ).unwrap();
          message.success("Stage updated successfully");
        } else {
          await dispatch(addProjectStage({ matterId, data })).unwrap();
          message.success("Stage added successfully");
        }
        setModalVisible(false);
        form.resetFields();
      } catch (error) {
        message.error(error || "Failed to save stage");
      }
    },
    [dispatch, matterId, editingStage, form],
  );

  const handleCompleteSubmit = useCallback(
    async (values) => {
      try {
        const data = {
          actualDate: values.actualDate?.toISOString(),
        };

        await dispatch(
          completeProjectStage({
            matterId,
            stageId: editingStage._id,
            data,
          }),
        ).unwrap();
        message.success("Stage marked as completed");
        setCompleteModalVisible(false);
        form.resetFields();
      } catch (error) {
        message.error(error || "Failed to complete stage");
      }
    },
    [dispatch, matterId, editingStage, form],
  );

  const columns = [
    {
      title: "Stage Name",
      dataIndex: "stageName",
      key: "stageName",
      width: "30%",
      render: (name, record) => (
        <Space>
          {record.isCompleted ? (
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
          ) : (
            <CalendarOutlined />
          )}
          <strong>{name}</strong>
        </Space>
      ),
    },
    {
      title: "Expected Date",
      dataIndex: "expectedDate",
      key: "expectedDate",
      width: "12%",
      render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "N/A"),
    },
    {
      title: "Actual Date",
      dataIndex: "actualDate",
      key: "actualDate",
      width: "12%",
      render: (date) => (date ? dayjs(date).format("DD MMM YYYY") : "N/A"),
    },
    {
      title: "% of Fee",
      dataIndex: "percentageOfFee",
      key: "percentageOfFee",
      width: "10%",
      render: (pct) => (pct ? `${pct}%` : "N/A"),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: "13%",
      render: (amount) => (amount ? `₦${amount.toLocaleString()}` : "N/A"),
    },
    {
      title: "Status",
      key: "status",
      width: "13%",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Tag
            color={
              record.isCompleted ? "green" : record.isPaid ? "blue" : "orange"
            }>
            {record.isCompleted
              ? "Completed"
              : record.isPaid
                ? "Paid"
                : "Pending"}
          </Tag>
          {record.isPaid && <small>Paid</small>}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: "10%",
      render: (_, record) => (
        <Space size="small">
          {!record.isCompleted && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleComplete(record)}>
              Complete
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
        </Space>
      ),
    },
  ];

  const summary = {
    total: stages.length,
    completed: stages.filter((s) => s.isCompleted).length,
    pending: stages.filter((s) => !s.isCompleted).length,
    totalAmount: stages.reduce((sum, s) => sum + (s.amount || 0), 0),
    amountPaid: stages
      .filter((s) => s.isPaid)
      .reduce((sum, s) => sum + (s.amount || 0), 0),
  };

  const completionRate =
    summary.total > 0
      ? ((summary.completed / summary.total) * 100).toFixed(0)
      : 0;

  return (
    <div>
      <Card
        title="Project Stages (Nigerian Billing Pattern)"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Stage
          </Button>
        }
        style={{ marginBottom: 16 }}>
        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%", marginBottom: 16 }}>
          <div>
            <div style={{ marginBottom: 8 }}>
              <span>Stage Completion Progress</span>
              <span style={{ float: "right", fontWeight: "bold" }}>
                {completionRate}%
              </span>
            </div>
            <Progress
              percent={completionRate}
              status={completionRate === 100 ? "success" : "active"}
            />
          </div>

          <Space size="large" wrap>
            <span>
              Total Stages: <strong>{summary.total}</strong>
            </span>
            <span>
              Completed: <Tag color="green">{summary.completed}</Tag>
            </span>
            <span>
              Pending: <Tag color="orange">{summary.pending}</Tag>
            </span>
            <span>
              Total Amount:{" "}
              <strong>₦{summary.totalAmount.toLocaleString()}</strong>
            </span>
            <span>
              Amount Paid:{" "}
              <Tag color="blue">₦{summary.amountPaid.toLocaleString()}</Tag>
            </span>
          </Space>
        </Space>

        <Table
          columns={columns}
          dataSource={stages}
          rowKey={(record) => record._id}
          loading={actionLoading}
          pagination={false}
          locale={{ emptyText: "No project stages added yet" }}
        />

        {stages.length > 0 && (
          <Card title="Timeline View" style={{ marginTop: 24 }}>
            <Timeline mode="left">
              {stages
                .sort(
                  (a, b) => new Date(a.expectedDate) - new Date(b.expectedDate),
                )
                .map((stage, index) => (
                  <Timeline.Item
                    key={stage._id}
                    color={stage.isCompleted ? "green" : "blue"}
                    dot={
                      stage.isCompleted ? (
                        <CheckCircleOutlined />
                      ) : (
                        <CalendarOutlined />
                      )
                    }>
                    <div>
                      <strong>{stage.stageName}</strong>
                      <div style={{ color: "#888", fontSize: 12 }}>
                        Expected:{" "}
                        {dayjs(stage.expectedDate).format("DD MMM YYYY")}
                        {stage.actualDate &&
                          ` • Completed: ${dayjs(stage.actualDate).format("DD MMM YYYY")}`}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        ₦{stage.amount?.toLocaleString()} (
                        {stage.percentageOfFee}% of fee)
                        {stage.isPaid && (
                          <Tag color="blue" style={{ marginLeft: 8 }}>
                            Paid
                          </Tag>
                        )}
                      </div>
                    </div>
                  </Timeline.Item>
                ))}
            </Timeline>
          </Card>
        )}
      </Card>

      {/* Add/Edit Stage Modal */}
      <Modal
        title={editingStage ? "Edit Stage" : "Add Stage"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={actionLoading}
        width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="stageName"
            label="Stage Name"
            rules={[{ required: true, message: "Please enter stage name" }]}>
            <Input placeholder="e.g., Initial Consultation, Document Preparation" />
          </Form.Item>

          <Form.Item
            name="expectedDate"
            label="Expected Date"
            rules={[
              { required: true, message: "Please select expected date" },
            ]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="percentageOfFee" label="Percentage of Total Fee (%)">
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount (₦)"
            rules={[{ required: true, message: "Please enter amount" }]}>
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(value) =>
                `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/₦\s?|(,*)/g, "")}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Complete Stage Modal */}
      <Modal
        title="Complete Stage"
        open={completeModalVisible}
        onCancel={() => {
          setCompleteModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={actionLoading}>
        <Form form={form} layout="vertical" onFinish={handleCompleteSubmit}>
          <p>
            Mark <strong>{editingStage?.stageName}</strong> as completed?
          </p>

          <Form.Item
            name="actualDate"
            label="Completion Date"
            rules={[
              { required: true, message: "Please select completion date" },
            ]}
            initialValue={dayjs()}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectStagesManager;
