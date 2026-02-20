import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  Card,
  Timeline,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Space,
  Tag,
  Empty,
  Avatar,
  Tooltip,
  Badge,
  Divider,
  message,
  Alert,
} from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

import { formatDate, formatName } from "../../utils/formatters";
import {
  addHearing,
  updateHearing,
  deleteHearing,
  selectActionLoading,
  fetchMatterHearings,
  clearMatterHearings,
  selectMatterHearings,
} from "../../redux/features/litigation/litigationSlice";
import useUserSelectOptions from "../../hooks/useUserSelectOptions";
import HearingTimelineItem from "./HearingTimelineItems";
import HearingHeader from "./HearingHeader";

dayjs.extend(relativeTime);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { TextArea } = Input;
const { confirm } = Modal;

// ============================================
// CONSTANTS
// ============================================

const getDisplayStatus = (hearingDate, hasOutcome) => {
  const today = dayjs().startOf("day");
  const hearing = dayjs(hearingDate).startOf("day");

  if (hasOutcome) return "completed";
  if (hearing.isSame(today)) return "today";
  if (hearing.isAfter(today)) return "upcoming";
  return "past";
};

const OUTCOME_OPTIONS = [
  { value: "adjourned", label: "Adjourned", color: "orange" },
  { value: "part_heard", label: "Part Heard", color: "blue" },
  { value: "judgment_reserved", label: "Judgment Reserved", color: "purple" },
  { value: "struck_out", label: "Struck Out", color: "red" },
  { value: "settled", label: "Settled", color: "green" },
  { value: "dismissed", label: "Dismissed", color: "red" },
  { value: "decided", label: "Decided", color: "green" },
  { value: "mention_only", label: "Mention Only", color: "cyan" },
  { value: "hearing_of_witness", label: "Hearing of Witness", color: "blue" },
  { value: "cross_examination", label: "Cross Examination", color: "purple" },
  { value: "no_sitting", label: "No Sitting", color: "default" },
  { value: "other", label: "Other", color: "default" },
];

const PURPOSE_OPTIONS = [
  { value: "mention", label: "Mention" },
  { value: "hearing", label: "Hearing" },
  { value: "trial", label: "Trial" },
  { value: "ruling", label: "Ruling" },
  { value: "judgment", label: "Judgment" },
  { value: "cross_examination", label: "Cross Examination" },
  { value: "address", label: "Address" },
  { value: "settlement", label: "Settlement" },
];

const REQUIRES_ADJOURNED_DATE = "adjourned";

// ============================================
// MAIN COMPONENT
// ============================================

const HearingTimeline = ({
  matterId,
  hearings: propsHearings = [],
  matterDetails = null,
}) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectActionLoading);
  const matterHearings = useSelector(selectMatterHearings);

  const hasFetched = useRef(false);
  const hearings =
    hasFetched.current || matterHearings.length > 0
      ? matterHearings
      : propsHearings;

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [editingHearing, setEditingHearing] = useState(null);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  const { data: lawyersOptions, loading: lawyersLoading } =
    useUserSelectOptions({
      type: "lawyers",
      lawyerOnly: true,
      autoFetch: true,
    });

  const stableMatterId = String(matterId || "");

  useEffect(() => {
    if (!stableMatterId) return;

    hasFetched.current = false;
    dispatch(fetchMatterHearings(stableMatterId)).finally(() => {
      hasFetched.current = true;
    });

    return () => {
      dispatch(clearMatterHearings());
      hasFetched.current = false;
    };
  }, [dispatch, stableMatterId]);

  const sortedHearings = useMemo(() => {
    return [...hearings].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [hearings]);

  const nextHearing = useMemo(() => {
    const now = new Date();
    return [...hearings]
      .sort((a, b) => new Date(a.nextHearingDate) - new Date(b.nextHearingDate))
      .find((h) => h.nextHearingDate && new Date(h.nextHearingDate) > now);
  }, [hearings]);

  const stats = useMemo(() => {
    const upcoming = hearings.filter((h) => {
      const status = getDisplayStatus(h.date, h.outcome);
      return status === "today" || status === "upcoming";
    });
    const completed = hearings.filter((h) => !!h.outcome);
    const past = hearings.filter((h) => {
      const status = getDisplayStatus(h.date, h.outcome);
      return status === "past";
    });

    return {
      total: hearings.length,
      upcoming: upcoming.length,
      past: past.length,
      completed: completed.length,
    };
  }, [hearings]);

  const handleAddHearing = useCallback(() => {
    setEditingHearing(null);
    setSelectedOutcome(null);
    form.resetFields();
    setIsModalVisible(true);
  }, [form]);

  const handleEditHearing = useCallback(
    (hearing) => {
      const formValues = {
        date: dayjs(hearing.date),
        purpose: hearing.purpose,
        outcome: hearing.outcome,
        notes: hearing.notes,
        nextHearingDate: hearing.nextHearingDate
          ? dayjs(hearing.nextHearingDate)
          : null,
        lawyerPresent: hearing.lawyerPresent?.map((l) => l._id || l) || [],
      };

      form.setFieldsValue(formValues);
      setSelectedOutcome(hearing.outcome);
      setEditingHearing(hearing);
      setIsModalVisible(true);
    },
    [form],
  );

  const handleAssignLawyers = useCallback(
    (hearing) => {
      setSelectedHearing(hearing);
      assignForm.setFieldsValue({
        nextHearingDate: hearing.nextHearingDate
          ? dayjs(hearing.nextHearingDate)
          : null,
        lawyerPresent: hearing.lawyerPresent?.map((l) => l._id || l) || [],
      });
      setIsAssignModalVisible(true);
    },
    [assignForm],
  );

  const handleDeleteHearing = useCallback(
    (hearingId) => {
      confirm({
        title: "Delete Hearing",
        icon: <WarningOutlined className="text-red-500" />,
        content:
          "Are you sure you want to delete this hearing? This will also remove the calendar event.",
        okText: "Delete",
        okType: "danger",
        onOk: async () => {
          try {
            await dispatch(
              deleteHearing({ matterId: stableMatterId, hearingId }),
            ).unwrap();
            message.success("Hearing deleted successfully");
          } catch (error) {
            message.error("Failed to delete hearing");
          }
        },
      });
    },
    [dispatch, stableMatterId],
  );

  const handleSubmit = useCallback(
    async (values) => {
      const hearingData = {
        ...values,
        date: values.date.toISOString(),
        nextHearingDate: values.nextHearingDate?.toISOString() || null,
      };

      try {
        if (editingHearing) {
          await dispatch(
            updateHearing({
              matterId: stableMatterId,
              hearingId: editingHearing._id,
              hearingData,
            }),
          ).unwrap();
          message.success("Hearing updated successfully");
        } else {
          await dispatch(
            addHearing({ matterId: stableMatterId, hearingData }),
          ).unwrap();
          message.success("Hearing added successfully");
        }

        setIsModalVisible(false);
        setEditingHearing(null);
        setSelectedOutcome(null);
        form.resetFields();
      } catch (error) {
        console.error("Hearing operation error:", error);
        message.error(error.message || "Operation failed");
      }
    },
    [dispatch, stableMatterId, editingHearing, form],
  );

  const handleAssignSubmit = useCallback(
    async (values) => {
      if (!selectedHearing) return;

      try {
        await dispatch(
          updateHearing({
            matterId: stableMatterId,
            hearingId: selectedHearing._id,
            hearingData: {
              nextHearingDate: values.nextHearingDate?.toISOString() || null,
              lawyerPresent: values.lawyerPresent,
            },
          }),
        ).unwrap();
        message.success("Assignment updated successfully");

        setIsAssignModalVisible(false);
        assignForm.resetFields();
        setSelectedHearing(null);
      } catch (error) {
        message.error("Failed to update assignment");
      }
    },
    [dispatch, stableMatterId, selectedHearing, assignForm],
  );

  const requiresAdjournedDate = selectedOutcome === REQUIRES_ADJOURNED_DATE;

  const handleModalClose = useCallback(() => {
    setIsModalVisible(false);
    setEditingHearing(null);
    setSelectedOutcome(null);
    form.resetFields();
  }, [form]);

  const handleAssignModalClose = useCallback(() => {
    setIsAssignModalVisible(false);
    setSelectedHearing(null);
    assignForm.resetFields();
  }, [assignForm]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: <HistoryOutlined />,
            color: "blue",
          },
          {
            label: "Upcoming",
            value: stats.upcoming,
            icon: <CalendarOutlined />,
            color: "green",
          },
          {
            label: "Completed",
            value: stats.completed,
            icon: <CheckCircleOutlined />,
            color: "purple",
          },
          {
            label: "Past",
            value: stats.past,
            icon: <ClockCircleOutlined />,
            color: "gray",
          },
        ].map((stat, idx) => (
          <Card key={idx} size="small" className="text-center" bordered={false}>
            <div className={`text-${stat.color}-600 text-lg mb-1`}>
              {stat.icon}
            </div>
            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </Card>
        ))}
      </div>

      <HearingHeader
        nextHearing={nextHearing}
        onAssignLawyers={handleAssignLawyers}
      />

      {/* Timeline */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <HistoryOutlined className="text-purple-600" />
              </div>
              <div>
                <h4 className="text-base font-semibold">Hearings Timeline</h4>
                <p className="text-xs text-gray-500">
                  {hearings.length} hearing{hearings.length !== 1 ? "s" : ""}{" "}
                  recorded
                </p>
              </div>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddHearing}
              className="bg-purple-600">
              Add Hearing
            </Button>
          </div>
        }
        bordered={false}>
        {sortedHearings.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div className="py-8">
                <div className="text-4xl mb-3">⚖️</div>
                <p className="text-gray-600 font-medium">
                  No hearings recorded
                </p>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddHearing}
                  className="mt-4"
                  size="small">
                  Add Hearing
                </Button>
              </div>
            }
          />
        ) : (
          <div>
            {sortedHearings.map((hearing) => (
              <HearingTimelineItem
                key={hearing._id}
                hearing={hearing}
                onEdit={handleEditHearing}
                onDelete={handleDeleteHearing}
                onAssignLawyers={handleAssignLawyers}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              {editingHearing ? (
                <EditOutlined className="text-purple-600" />
              ) : (
                <PlusOutlined className="text-purple-600" />
              )}
            </div>
            <span>{editingHearing ? "Edit Hearing" : "Add New Hearing"}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        destroyOnClose>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4">
          <Form.Item
            name="date"
            label="Hearing Date & Time"
            rules={[{ required: true, message: "Please select hearing date" }]}>
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
              disabled={!!editingHearing}
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item name="purpose" label="Purpose">
            <Select
              placeholder="Select purpose"
              options={PURPOSE_OPTIONS}
              allowClear
            />
          </Form.Item>

          <Form.Item name="outcome" label="Outcome">
            <Select
              placeholder="Select outcome"
              options={OUTCOME_OPTIONS}
              onChange={setSelectedOutcome}
              allowClear
            />
          </Form.Item>

          {requiresAdjournedDate && (
            <Form.Item
              name="nextHearingDate"
              label="Adjourned To"
              rules={[
                {
                  required: true,
                  message: "Date required for 'Adjourned' outcome",
                },
              ]}>
              <DatePicker
                showTime
                style={{ width: "100%" }}
                format="DD/MM/YYYY HH:mm"
                placeholder="Date case is adjourned to"
                className="rounded-lg"
              />
            </Form.Item>
          )}

          <Form.Item name="notes" label="Court Notes">
            <TextArea
              rows={3}
              placeholder="Summarise what transpired..."
              className="rounded-lg"
            />
          </Form.Item>

          <Divider />

          {!requiresAdjournedDate && (
            <Form.Item
              name="nextHearingDate"
              label="Next Hearing Date (if known)">
              <DatePicker
                showTime
                style={{ width: "100%" }}
                format="DD/MM/YYYY HH:mm"
                className="rounded-lg"
              />
            </Form.Item>
          )}

          <Form.Item name="lawyerPresent" label="Lawyers Appearing">
            <Select
              mode="multiple"
              placeholder="Select lawyers"
              options={lawyersOptions}
              loading={lawyersLoading}
              showSearch
            />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={handleModalClose}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="bg-purple-600">
                {editingHearing ? "Update" : "Add"} Hearing
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <TeamOutlined className="text-blue-600" />
            <span>Assign Lawyers</span>
          </div>
        }
        open={isAssignModalVisible}
        onCancel={handleAssignModalClose}
        footer={null}
        width={500}>
        <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit}>
          <Form.Item
            name="nextHearingDate"
            label="Next Hearing Date"
            rules={[{ required: true, message: "Please select a date" }]}>
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>

          <Form.Item
            name="lawyerPresent"
            label="Assign Lawyers"
            rules={[
              { required: true, message: "Please assign at least one lawyer" },
            ]}>
            <Select
              mode="multiple"
              options={lawyersOptions}
              loading={lawyersLoading}
              placeholder="Select lawyers"
              showSearch
            />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={handleAssignModalClose}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Assign
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default React.memo(HearingTimeline);
