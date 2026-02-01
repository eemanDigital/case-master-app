import { useState } from "react";
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
} from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { formatDate, formatDateTime, formatName } from "../../utils/formatters";
import {
  addHearing,
  updateHearing,
  deleteHearing,
  selectActionLoading,
} from "../../redux/features/litigation/litigationSlice";
import { DATE_FORMAT } from "../../utils/litigationConstants";

const { TextArea } = Input;

const HearingTimeline = ({ matterId, hearings = [] }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectActionLoading);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingHearing, setEditingHearing] = useState(null);
  const [form] = Form.useForm();

  const sortedHearings = [...hearings].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  const handleAddHearing = () => {
    setEditingHearing(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditHearing = (hearing) => {
    setEditingHearing(hearing);
    form.setFieldsValue({
      ...hearing,
      date: dayjs(hearing.date),
      nextHearingDate: hearing.nextHearingDate
        ? dayjs(hearing.nextHearingDate)
        : null,
    });
    setIsModalVisible(true);
  };

  const handleDeleteHearing = (hearingId) => {
    Modal.confirm({
      title: "Delete Hearing",
      content: "Are you sure you want to delete this hearing?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        await dispatch(deleteHearing({ matterId, hearingId }));
      },
    });
  };

  const handleSubmit = async (values) => {
    const hearingData = {
      ...values,
      date: values.date.toISOString(),
      nextHearingDate: values.nextHearingDate
        ? values.nextHearingDate.toISOString()
        : null,
    };

    try {
      if (editingHearing) {
        await dispatch(
          updateHearing({
            matterId,
            hearingId: editingHearing._id,
            hearingData,
          }),
        ).unwrap();
      } else {
        await dispatch(addHearing({ matterId, hearingData })).unwrap();
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Hearing operation error:", error);
    }
  };

  const getTimelineColor = (date) => {
    const hearingDate = new Date(date);
    const now = new Date();

    if (hearingDate > now) return "blue"; // Future
    if (hearingDate < now) return "gray"; // Past
    return "green"; // Today
  };

  return (
    <>
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              Hearings Timeline ({hearings.length})
            </span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddHearing}
              size="small">
              Add Hearing
            </Button>
          </div>
        }
        className="mb-6">
        {sortedHearings.length === 0 ? (
          <Empty
            description="No hearings recorded"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Timeline mode="left">
            {sortedHearings.map((hearing) => (
              <Timeline.Item
                key={hearing._id}
                color={getTimelineColor(hearing.date)}
                dot={<CalendarOutlined style={{ fontSize: "16px" }} />}
                label={
                  <div className="text-sm text-gray-600">
                    {formatDate(hearing.date)}
                  </div>
                }>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      {hearing.purpose && (
                        <h4 className="font-semibold text-base mb-2">
                          {hearing.purpose}
                        </h4>
                      )}

                      {hearing.outcome && (
                        <div className="mb-2">
                          <Tag color="green">Outcome</Tag>
                          <span className="text-sm">{hearing.outcome}</span>
                        </div>
                      )}

                      {hearing.notes && (
                        <div className="text-sm text-gray-700 mb-2">
                          <strong>Notes:</strong> {hearing.notes}
                        </div>
                      )}

                      {hearing.nextHearingDate && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <ClockCircleOutlined />
                          <span>
                            Next Hearing: {formatDate(hearing.nextHearingDate)}
                          </span>
                        </div>
                      )}

                      {hearing.preparedBy && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                          <UserOutlined />
                          <span>
                            Prepared by:{" "}
                            {formatName(
                              hearing.preparedBy.firstName,
                              hearing.preparedBy.lastName,
                            )}
                          </span>
                        </div>
                      )}

                      {hearing.lawyerPresent &&
                        hearing.lawyerPresent.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Lawyers present:{" "}
                            {hearing.lawyerPresent
                              .map((lawyer) =>
                                formatName(lawyer.firstName, lawyer.lastName),
                              )
                              .join(", ")}
                          </div>
                        )}
                    </div>

                    <Space>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEditHearing(hearing)}
                        size="small"
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteHearing(hearing._id)}
                        size="small"
                      />
                    </Space>
                  </div>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Card>

      <Modal
        title={editingHearing ? "Edit Hearing" : "Add Hearing"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="date"
            label="Hearing Date"
            rules={[{ required: true, message: "Hearing date is required" }]}>
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>

          <Form.Item name="purpose" label="Purpose">
            <Input placeholder="e.g., Preliminary hearing, Trial" />
          </Form.Item>

          <Form.Item name="outcome" label="Outcome">
            <TextArea rows={3} placeholder="Enter the outcome of the hearing" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea
              rows={4}
              placeholder="Additional notes about the hearing"
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item name="nextHearingDate" label="Next Hearing Date">
            <DatePicker style={{ width: "100%" }} format={DATE_FORMAT} />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingHearing ? "Update" : "Add"} Hearing
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default HearingTimeline;
