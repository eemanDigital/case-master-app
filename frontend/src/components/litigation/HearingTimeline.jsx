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
  Divider,
  Avatar,
  Tooltip,
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
import useUserSelectOptions from "../../hooks/useUserSelectOptions";

const { TextArea } = Input;

const HearingTimeline = ({ matterId, hearings = [], matterDetails = null }) => {
  const dispatch = useDispatch();
  const loading = useSelector(selectActionLoading);

  // Fetch lawyers for assignment
  const { data: lawyersOptions, loading: lawyersLoading } =
    useUserSelectOptions({
      type: "lawyers",
      lawyerOnly: true,
      autoFetch: true,
    });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [editingHearing, setEditingHearing] = useState(null);
  const [selectedHearing, setSelectedHearing] = useState(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  const sortedHearings = [...hearings].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  // Get the next scheduled hearing (with nextHearingDate)
  const nextHearing = sortedHearings.find(
    (h) => h.nextHearingDate && new Date(h.nextHearingDate) > new Date(),
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
      lawyerPresent: hearing.lawyerPresent?.map((l) => l._id || l),
    });
    setIsModalVisible(true);
  };

  const handleAssignLawyers = (hearing) => {
    setSelectedHearing(hearing);
    assignForm.setFieldsValue({
      nextHearingDate: hearing.nextHearingDate
        ? dayjs(hearing.nextHearingDate)
        : null,
      lawyerPresent: hearing.lawyerPresent?.map((l) => l._id || l) || [],
    });
    setIsAssignModalVisible(true);
  };

  const handleDeleteHearing = (hearingId) => {
    Modal.confirm({
      title: "Delete Hearing",
      content:
        "Are you sure you want to delete this hearing? This will also remove the calendar event.",
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

  const handleAssignSubmit = async (values) => {
    if (!selectedHearing) return;

    const hearingData = {
      nextHearingDate: values.nextHearingDate
        ? values.nextHearingDate.toISOString()
        : null,
      lawyerPresent: values.lawyerPresent,
    };

    try {
      await dispatch(
        updateHearing({
          matterId,
          hearingId: selectedHearing._id,
          hearingData,
        }),
      ).unwrap();
      setIsAssignModalVisible(false);
      assignForm.resetFields();
      setSelectedHearing(null);
    } catch (error) {
      console.error("Lawyer assignment error:", error);
    }
  };

  const getTimelineColor = (date) => {
    const hearingDate = new Date(date);
    const now = new Date();

    if (hearingDate > now) return "blue"; // Future
    if (hearingDate < now) return "gray"; // Past
    return "green"; // Today
  };

  const renderLawyerAvatars = (lawyers) => {
    if (!lawyers || lawyers.length === 0) return null;

    return (
      <Avatar.Group maxCount={3} size="small" className="mt-2">
        {lawyers.map((lawyer, index) => (
          <Tooltip
            key={index}
            title={
              lawyer.firstName
                ? formatName(lawyer.firstName, lawyer.lastName)
                : lawyer.name || "Lawyer"
            }>
            <Avatar size="small" icon={<UserOutlined />}>
              {lawyer.firstName?.charAt(0) || lawyer.name?.charAt(0) || "L"}
            </Avatar>
          </Tooltip>
        ))}
      </Avatar.Group>
    );
  };

  return (
    <>
      {/* Case Assignment Card - Shows next hearing */}
      {nextHearing && (
        <Card
          className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200"
          title={
            <div className="flex items-center gap-2">
              <ThunderboltOutlined className="text-blue-600" />
              <span className="text-lg font-semibold text-blue-900">
                Next Hearing - Case Assignment
              </span>
            </div>
          }
          extra={
            <Button
              type="primary"
              icon={<TeamOutlined />}
              onClick={() => handleAssignLawyers(nextHearing)}
              size="small">
              Assign Lawyers
            </Button>
          }>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">
                Next Hearing Date
              </div>
              <div className="text-lg font-semibold text-blue-600">
                <CalendarOutlined className="mr-2" />
                {formatDate(nextHearing.nextHearingDate)}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">
                Assigned Lawyers ({nextHearing.lawyerPresent?.length || 0})
              </div>
              {nextHearing.lawyerPresent &&
              nextHearing.lawyerPresent.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {nextHearing.lawyerPresent.map((lawyer, index) => (
                    <Tag key={index} color="blue" className="!m-0">
                      <UserOutlined className="mr-1" />
                      {lawyer.firstName
                        ? formatName(lawyer.firstName, lawyer.lastName)
                        : lawyer.name}
                    </Tag>
                  ))}
                </div>
              ) : (
                <div className="text-orange-600 font-medium">
                  ⚠️ No lawyers assigned yet
                </div>
              )}
            </div>
          </div>

          {nextHearing.purpose && (
            <div className="mt-3 p-2 bg-white rounded">
              <div className="text-sm text-gray-600">Purpose</div>
              <div className="font-medium">{nextHearing.purpose}</div>
            </div>
          )}
        </Card>
      )}

      {/* Hearings Timeline */}
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
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                            <ClockCircleOutlined />
                            <span>
                              Next Hearing:{" "}
                              {formatDate(hearing.nextHearingDate)}
                            </span>
                          </div>

                          {hearing.lawyerPresent &&
                            hearing.lawyerPresent.length > 0 && (
                              <div>
                                <div className="text-xs text-gray-600 mb-1">
                                  Assigned Lawyers:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {hearing.lawyerPresent.map(
                                    (lawyer, index) => (
                                      <Tag
                                        key={index}
                                        color="blue"
                                        className="!text-xs !m-0">
                                        {lawyer.firstName
                                          ? formatName(
                                              lawyer.firstName,
                                              lawyer.lastName,
                                            )
                                          : lawyer.name}
                                      </Tag>
                                    ),
                                  )}
                                </div>
                              </div>
                            )}

                          <Button
                            type="link"
                            size="small"
                            icon={<TeamOutlined />}
                            onClick={() => handleAssignLawyers(hearing)}
                            className="!p-0 mt-2">
                            {hearing.lawyerPresent &&
                            hearing.lawyerPresent.length > 0
                              ? "Update Assignment"
                              : "Assign Lawyers"}
                          </Button>
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

      {/* Add/Edit Hearing Modal */}
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
            <Input placeholder="e.g., Preliminary hearing, Trial, Mention" />
          </Form.Item>

          <Form.Item name="outcome" label="Outcome">
            <TextArea rows={3} placeholder="Enter the outcome of the hearing" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea
              rows={4}
              placeholder="Additional notes about the hearing"
              maxLength={10000}
            />
          </Form.Item>

          <Divider />

          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <div className="font-semibold text-blue-900 mb-2">
              Next Hearing Details
            </div>
            <div className="text-sm text-blue-700">
              Set the next hearing date and assign lawyers who will appear in
              court.
            </div>
          </div>

          <Form.Item name="nextHearingDate" label="Next Hearing Date">
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
            />
          </Form.Item>

          <Form.Item name="lawyerPresent" label="Lawyers to Appear in Court">
            <Select
              mode="multiple"
              placeholder="Select lawyers for next hearing"
              options={lawyersOptions}
              loading={lawyersLoading}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              showSearch
            />
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

      {/* Lawyer Assignment Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <TeamOutlined className="text-blue-600" />
            <span>Assign Lawyers to Next Hearing</span>
          </div>
        }
        open={isAssignModalVisible}
        onCancel={() => {
          setIsAssignModalVisible(false);
          setSelectedHearing(null);
          assignForm.resetFields();
        }}
        footer={null}
        width={600}>
        {selectedHearing && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">Current Hearing</div>
            <div className="font-semibold">
              {formatDate(selectedHearing.date)}
            </div>
            {selectedHearing.purpose && (
              <div className="text-sm mt-1">{selectedHearing.purpose}</div>
            )}
          </div>
        )}

        <Form form={assignForm} layout="vertical" onFinish={handleAssignSubmit}>
          <Form.Item
            name="nextHearingDate"
            label="Next Hearing Date"
            rules={[
              { required: true, message: "Next hearing date is required" },
            ]}>
            <DatePicker
              showTime
              style={{ width: "100%" }}
              format="DD/MM/YYYY HH:mm"
              placeholder="Select date and time"
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
              placeholder="Select lawyers who will appear in court"
              options={lawyersOptions}
              loading={lawyersLoading}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              showSearch
              notFoundContent={
                lawyersLoading ? "Loading lawyers..." : "No lawyers found"
              }
            />
          </Form.Item>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="text-sm text-yellow-800">
              <strong>Note:</strong> This will automatically update the calendar
              event and notify assigned lawyers.
            </div>
          </div>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button
                onClick={() => {
                  setIsAssignModalVisible(false);
                  setSelectedHearing(null);
                  assignForm.resetFields();
                }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Assign Lawyers
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default HearingTimeline;
