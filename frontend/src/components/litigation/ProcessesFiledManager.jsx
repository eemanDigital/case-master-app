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
} from "antd";
import PropTypes from "prop-types";
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
import {
  PROCESS_STATUS,
  MOTION_OUTCOMES,
  DATE_FORMAT,
} from "../../utils/litigationConstants";

const { Option } = Select;

const getMemberName = (member) =>
  (typeof member === "string" ? member : member?.name || "").trim();

const ProcessesFiledManager = ({ matterId, litigationDetails }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectActionLoading);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProcess, setEditingProcess] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [form] = Form.useForm();
  const watchedProcessName = Form.useWatch("name", form);
  const watchedMotionOutcome = Form.useWatch("motionOutcome", form);
  const isMotion = /motion/i.test(watchedProcessName || "");

  const getPartyTargets = () => {
    const targets = [];
    const addMembers = (party, partyData, label, otherPartyIndex) => {
      (partyData?.name || []).forEach((member, partyIndex) => {
        const name = getMemberName(member);
        if (!name) return;
        const role = partyData.description || label;
        targets.push({
          key: `${party}:${otherPartyIndex ?? ""}:${partyIndex}`,
          party,
          partyIndex,
          otherPartyIndex,
          partyName: name,
          partyDescription: role,
          label: `${role}: ${name}`,
        });
      });
    };

    addMembers(
      "firstParty",
      litigationDetails?.firstParty,
      "Plaintiff / Applicant / Claimant",
    );
    addMembers(
      "secondParty",
      litigationDetails?.secondParty,
      "Defendant / Respondent",
    );
    (litigationDetails?.otherParty || []).forEach((party, otherPartyIndex) =>
      addMembers(
        "otherParty",
        party,
        party.description || `Other Party ${otherPartyIndex + 1}`,
        otherPartyIndex,
      ),
    );
    return targets;
  };

  const getAllProcesses = () => {
    const processes = [];
    const addProcesses = (
      items,
      target,
      legacy = false,
      groupKey = target.key,
    ) => {
      (items || []).forEach((process, processIndex) => {
        processes.push({
          ...process,
          ...target,
          groupKey,
          processIndex,
          legacy,
        });
      });
    };
    const targets = getPartyTargets();
    targets.forEach((target) => {
      const members =
        target.party === "otherParty"
          ? litigationDetails.otherParty[target.otherPartyIndex]?.name
          : litigationDetails[target.party]?.name;
      const member = members?.[target.partyIndex];
      addProcesses(member?.processesFiled, target);
    });

    [
      {
        party: "firstParty",
        data: litigationDetails?.firstParty,
        label: "Plaintiff / Applicant / Claimant",
      },
      {
        party: "secondParty",
        data: litigationDetails?.secondParty,
        label: "Defendant / Respondent",
      },
      ...(litigationDetails?.otherParty || []).map((data, otherPartyIndex) => ({
        party: "otherParty",
        data,
        label: data.description || `Other Party ${otherPartyIndex + 1}`,
        otherPartyIndex,
      })),
    ].forEach(({ party, data, label, otherPartyIndex }) => {
      const membersForGroup = targets.filter(
        (target) =>
          target.party === party && target.otherPartyIndex === otherPartyIndex,
      );
      const inferredSingleMember =
        membersForGroup.length === 1 ? membersForGroup[0] : null;
      addProcesses(
        data?.processesFiled,
        {
          party,
          partyName: inferredSingleMember?.partyName || "Previously filed",
          partyDescription: inferredSingleMember
            ? `${label} — existing filing for the only named party`
            : `${label} — not linked to an individual party`,
          label:
            inferredSingleMember?.label ||
            `${label}: previously filed (unlinked)`,
          key: `${party}:${otherPartyIndex ?? ""}:legacy`,
          otherPartyIndex,
        },
        true,
        inferredSingleMember?.key || `${party}:${otherPartyIndex ?? ""}:legacy`,
      );
    });
    return processes;
  };

  const handleAddProcess = () => {
    setSelectedParty(null);
    setEditingProcess(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleAddProcessForParty = (party) => {
    handleAddProcess();
    form.setFieldValue("partyTarget", party.key);
  };

  const handleEditProcess = (process) => {
    setSelectedParty(process);
    setEditingProcess(process);
    form.setFieldsValue({
      name: process.name,
      filingDate: process.filingDate ? dayjs(process.filingDate) : null,
      status: process.status || "pending",
      motionOutcome: process.motionOutcome,
      decisionDate: process.decisionDate ? dayjs(process.decisionDate) : null,
      partyTarget: process.key,
    });
    setIsModalVisible(true);
  };

  const handleDeleteProcess = async (process) => {
    try {
      await dispatch(
        deleteProcessFiled({
          matterId,
          party: process.party,
          partyIndex: process.legacy ? undefined : process.partyIndex,
          otherPartyIndex: process.otherPartyIndex,
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
    const target =
      selectedParty ||
      getPartyTargets().find((party) => party.key === values.partyTarget);
    if (!target) {
      message.error("Select the party who filed this process");
      return;
    }

    const processData = {
      name: values.name,
      filingDate: values.filingDate ? values.filingDate.toISOString() : null,
      status: values.status || "pending",
      motionOutcome: isMotion ? values.motionOutcome || undefined : undefined,
      decisionDate:
        isMotion && values.motionOutcome && values.decisionDate
          ? values.decisionDate.toISOString()
          : null,
    };

    if (isMotion && values.motionOutcome && !values.decisionDate) {
      form.setFields([
        {
          name: "decisionDate",
          errors: ["Decision date is required"],
        },
      ]);
      return;
    }

    try {
      if (editingProcess) {
        await dispatch(
          updateProcessFiled({
            matterId,
            party: target.party,
            partyIndex: target.legacy ? undefined : target.partyIndex,
            otherPartyIndex: target.otherPartyIndex,
            processIndex: editingProcess.processIndex,
            processData,
          }),
        ).unwrap();
        message.success("Process updated successfully");
      } else {
        await dispatch(
          addProcessFiled({
            matterId,
            party: target.party,
            partyIndex: target.partyIndex,
            otherPartyIndex: target.otherPartyIndex,
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
      title: "Decision/Outcome",
      dataIndex: "motionOutcome",
      key: "motionOutcome",
      width: 130,
      render: (outcome) =>
        outcome ? (
          <Tag
            color={
              MOTION_OUTCOMES.find((item) => item.value === outcome)?.color
            }>
            {MOTION_OUTCOMES.find((item) => item.value === outcome)?.label ||
              outcome}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Decision Date",
      dataIndex: "decisionDate",
      key: "decisionDate",
      width: 130,
      render: (date) => (date ? formatDate(date) : "-"),
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
  const partyTargets = getPartyTargets();
  const partyGroups = partyTargets.map((party) => ({
    ...party,
    processes: allProcesses.filter((process) => process.groupKey === party.key),
  }));
  const groupedTargetKeys = new Set(partyTargets.map((party) => party.key));
  const unassignedLegacyGroups = allProcesses
    .filter(
      (process) => process.legacy && !groupedTargetKeys.has(process.groupKey),
    )
    .reduce((groups, process) => {
      let group = groups.find((item) => item.key === process.groupKey);
      if (!group) {
        group = {
          key: process.groupKey,
          label: process.label,
          partyDescription: process.partyDescription,
          processes: [],
        };
        groups.push(group);
      }
      group.processes.push(process);
      return groups;
    }, []);

  return (
    <>
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              Processes Filed ({allProcesses.length})
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddProcess}
              size="small"
              disabled={!partyTargets.length}>
              Add Process
            </Button>
          </div>
        }
        className="mb-6">
        {!partyGroups.length && !unassignedLegacyGroups.length ? (
          <Empty
            description="No processes filed yet"
            image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddProcess}
              disabled={!partyTargets.length}>
              Add Process
            </Button>
          </Empty>
        ) : (
          <div className="space-y-4">
            {[...partyGroups, ...unassignedLegacyGroups].map((group) => (
              <Card
                key={group.key}
                size="small"
                title={
                  <div>
                    <div className="font-semibold">
                      {group.partyName || "Previously filed"}
                    </div>
                    <div className="text-xs font-normal text-gray-500">
                      {group.partyDescription}
                    </div>
                  </div>
                }
                extra={
                  group.partyName && (
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => handleAddProcessForParty(group)}>
                      Add Process
                    </Button>
                  )
                }>
                {group.processes.length ? (
                  <Table
                    columns={columns}
                    dataSource={group.processes}
                    rowKey={(record) =>
                      `${record.groupKey}-${record.legacy ? "legacy" : "member"}-${record.processIndex}`
                    }
                    pagination={false}
                    size="small"
                  />
                ) : (
                  <Empty
                    description="No processes filed for this party"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Modal
        title={`${editingProcess ? "Edit" : "Add"} Process`}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {editingProcess ? (
            <Form.Item label="Party filing this process">
              <Input value={selectedParty?.label} readOnly />
            </Form.Item>
          ) : (
            <Form.Item
              name="partyTarget"
              label="Party filing this process"
              rules={[{ required: true, message: "Select the filing party" }]}>
              <Select
                placeholder="Select the specific plaintiff or defendant"
                options={partyTargets.map((party) => ({
                  value: party.key,
                  label: party.label,
                }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label="Process Name"
            rules={[{ required: true, message: "Process name is required" }]}>
            <Input placeholder="e.g., Motion for Adjournment" size="large" />
          </Form.Item>

          {isMotion && (
            <Space align="start" className="w-full" size={16}>
              <Form.Item
                name="motionOutcome"
                label="Motion outcome"
                className="flex-1"
                preserve={false}>
                <Select allowClear placeholder="Select outcome">
                  {MOTION_OUTCOMES.map((outcome) => (
                    <Option key={outcome.value} value={outcome.value}>
                      {outcome.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              {watchedMotionOutcome && (
                <Form.Item
                  name="decisionDate"
                  label={`Date ${watchedMotionOutcome}`}
                  rules={[
                    {
                      required: true,
                      message: "Decision date is required",
                    },
                  ]}
                  preserve={false}>
                  <DatePicker format={DATE_FORMAT} placeholder="DD/MM/YYYY" />
                </Form.Item>
              )}
            </Space>
          )}

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

ProcessesFiledManager.propTypes = {
  matterId: PropTypes.string.isRequired,
  litigationDetails: PropTypes.object.isRequired,
};

export default ProcessesFiledManager;
