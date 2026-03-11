import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Space,
  Tag,
  Empty,
  message,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { formatDate } from "../../utils/formatters";
import StatusTag from "../common/StatusTag";
import {
  addProcessFiled,
  updateProcessFiled,
  deleteProcessFiled,
  selectActionLoading,
} from "../../redux/features/litigation/litigationSlice";
import { PROCESS_STATUS, DATE_FORMAT } from "../../utils/litigationConstants";

const { Option } = Select;

const ProcessesFiledManager = ({
  matterId,
  litigationDetails,
  mode = "view",
}) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectActionLoading);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [form] = Form.useForm();

  const getAllProcesses = () => {
    const processes = [];
    if (litigationDetails?.firstParty?.processesFiled?.length > 0) {
      litigationDetails.firstParty.processesFiled.forEach((process, index) => {
        processes.push({
          ...process,
          party: "firstParty",
          partyName: "First Party",
          partyDescription:
            litigationDetails.firstParty.description || "Plaintiff/Claimant",
          processIndex: index,
        });
      });
    }
    if (litigationDetails?.secondParty?.processesFiled?.length > 0) {
      litigationDetails.secondParty.processesFiled.forEach((process, index) => {
        processes.push({
          ...process,
          party: "secondParty",
          partyName: "Second Party",
          partyDescription:
            litigationDetails.secondParty.description || "Defendant/Respondent",
          processIndex: index,
        });
      });
    }
    return processes;
  };

  const handleAddProcess = (party) => {
    setSelectedParty(party);
    setEditingProcess(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditProcess = (process) => {
    setSelectedParty(process.party);
    setEditingProcess(process);
    form.setFieldsValue({
      name: process.name,
      filingDate: process.filingDate ? dayjs(process.filingDate) : null,
      status: process.status || "pending",
    });
    setIsModalVisible(true);
  };

  const handleDeleteProcess = async (process) => {
    try {
      await dispatch(
        deleteProcessFiled({
          matterId,
          party: process.party,
          processIndex: process.processIndex,
        }),
      ).unwrap();
      message.success("Process deleted successfully");
    } catch (error) {
      console.error("Process delete error:", error);
      message.error(error?.message || "Failed to delete process");
    }
  };

  const handleSubmit = async (values) => {
    const processData = {
      name: values.name,
      filingDate: values.filingDate ? values.filingDate.toISOString() : null,
      status: values.status || "pending",
    };

    try {
      if (editingProcess) {
        await dispatch(
          updateProcessFiled({
            matterId,
            party: selectedParty,
            processIndex: editingProcess.processIndex,
            processData,
          }),
        ).unwrap();
        message.success("Process updated successfully");
      } else {
        await dispatch(
          addProcessFiled({
            matterId,
            party: selectedParty,
            processData,
          }),
        ).unwrap();
        message.success("Process added successfully");
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Process operation error:", error);
      message.error(error?.message || "Operation failed");
    }
  };

  const columns = [
    {
      title: "Party",
      dataIndex: "partyName",
      key: "partyName",
      width: 150,
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.partyDescription}</div>
        </div>
      ),
    },
    {
      title: "Process Name",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-blue-500" />
          <span className="font-medium">{name}</span>
        </div>
      ),
    },
    {
      title: "Filing Date",
      dataIndex: "filingDate",
      key: "filingDate",
      width: 120,
      render: (date) => (date ? formatDate(date) : "-"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <StatusTag status={status} configArray={PROCESS_STATUS} />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditProcess(record)}
            size="small"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProcess(record)}
            size="small"
          />
        </Space>
      ),
    },
  ];

  const allProcesses = getAllProcesses();

  if (mode === "form") {
    return (
      <Card title="Processes to be Filed" className="mb-6">
        <div className="space-y-4">
          <Divider orientation="left" plain>
            First Party Processes
          </Divider>
          <Form.List name={["firstParty", "processesFiled"]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    style={{ display: "flex", marginBottom: 8 }}
                    align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      rules={[
                        { required: true, message: "Process name required" },
                      ]}>
                      <Input
                        placeholder="Process name (e.g., Motion for Adjournment)"
                        style={{ width: 300 }}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "status"]}
                      initialValue="pending">
                      <Select placeholder="Status" style={{ width: 120 }}>
                        {PROCESS_STATUS.map((s) => (
                          <Option key={s.value} value={s.value}>
                            {s.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <DeleteOutlined
                      onClick={() => remove(name)}
                      className="text-red-500"
                    />
                  </Space>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block>
                  Add First Party Process
                </Button>
              </>
            )}
          </Form.List>

          <Divider orientation="left" plain>
            Second Party Processes
          </Divider>
          <Form.List name={["secondParty", "processesFiled"]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    style={{ display: "flex", marginBottom: 8 }}
                    align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      rules={[
                        { required: true, message: "Process name required" },
                      ]}>
                      <Input
                        placeholder="Process name"
                        style={{ width: 300 }}
                      />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "status"]}
                      initialValue="pending">
                      <Select placeholder="Status" style={{ width: 120 }}>
                        {PROCESS_STATUS.map((s) => (
                          <Option key={s.value} value={s.value}>
                            {s.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <DeleteOutlined
                      onClick={() => remove(name)}
                      className="text-red-500"
                    />
                  </Space>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<PlusOutlined />}
                  block>
                  Add Second Party Process
                </Button>
              </>
            )}
          </Form.List>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              Processes Filed ({allProcesses.length})
            </span>
            <Space>
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={() => handleAddProcess("firstParty")}
                size="small">
                Add for First Party
              </Button>
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={() => handleAddProcess("secondParty")}
                size="small">
                Add for Second Party
              </Button>
            </Space>
          </div>
        }
        className="mb-6">
        {allProcesses.length === 0 ? (
          <Empty
            description="No processes filed yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleAddProcess("firstParty")}>
                Add Process for First Party
              </Button>
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={() => handleAddProcess("secondParty")}>
                Add Process for Second Party
              </Button>
            </Space>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={allProcesses}
            rowKey={(record) => `${record.party}-${record.processIndex}`}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        )}
      </Card>

      <Modal
        title={`${editingProcess ? "Edit" : "Add"} Process`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Process Name"
            rules={[{ required: true, message: "Process name is required" }]}>
            <Input placeholder="e.g., Motion for Adjournment" size="large" />
          </Form.Item>

          <Form.Item name="filingDate" label="Filing Date">
            <DatePicker
              style={{ width: "100%" }}
              format={DATE_FORMAT}
              size="large"
            />
          </Form.Item>

          <Form.Item name="status" label="Status" initialValue="pending">
            <Select size="large">
              {PROCESS_STATUS.map((status) => (
                <Option key={status.value} value={status.value}>
                  <Tag color={status.color}>{status.label}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingProcess ? "Update" : "Add"} Process
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ProcessesFiledManager;
