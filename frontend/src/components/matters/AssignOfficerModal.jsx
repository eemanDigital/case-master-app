import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Alert, Avatar, Button, message, Modal, Radio, Space, Tag, Typography } from "antd";
import { TeamOutlined, UserOutlined } from "@ant-design/icons";
import UserSelect from "../UserSelect";

const { Text } = Typography;

const MODE_OPTIONS = [
  { value: "replace", label: "Replace", hint: "Set the team to exactly the people selected." },
  { value: "add", label: "Add", hint: "Keep the current team and add the selected officers." },
  { value: "remove", label: "Remove", hint: "Unassign the selected officers from the matter." },
];

const initialsOf = (officer) =>
  `${officer?.firstName?.[0] || ""}${officer?.lastName?.[0] || ""}`.toUpperCase();

const nameOf = (officer) =>
  officer?.companyName ||
  `${officer?.firstName || ""} ${officer?.lastName || ""}`.trim() ||
  "Account officer";

/**
 * Single source of truth for assigning account officers, used by both the
 * per-matter row/card action and the bulk actions bar.
 *
 * onSubmit receives (officerIds, mode) so the caller decides whether to hit the
 * single-matter endpoint or the bulk one.
 */
const AssignOfficerModal = ({
  open,
  onCancel,
  onSubmit,
  matterCount = 1,
  currentOfficers = [],
  loading = false,
}) => {
  const [officerIds, setOfficerIds] = useState([]);
  const [mode, setMode] = useState("replace");

  // Reset whenever the modal opens so a previous selection never leaks in.
  useEffect(() => {
    if (open) {
      setOfficerIds([]);
      setMode("replace");
    }
  }, [open]);

  const current = useMemo(
    () => (Array.isArray(currentOfficers) ? currentOfficers : []).filter(Boolean),
    [currentOfficers],
  );

  const isRemoval = mode === "remove";
  const canSubmit = officerIds.length > 0 && !loading;

  const handleSubmit = () => {
    if (!canSubmit) return;

    // In remove mode only officers already on this matter can be unassigned;
    // silently dropping the rest avoids a no-op that looks like a success.
    const ids =
      isRemoval && current.length > 0
        ? officerIds.filter((id) => current.some((officer) => officer._id === id))
        : officerIds;

    if (ids.length === 0) {
      message.warning(
        "Select an officer who is currently assigned to this matter",
      );
      return;
    }

    onSubmit?.(ids, mode);
  };

  return (
    <Modal
      title={
        <span className="inline-flex items-center gap-2">
          <TeamOutlined className="text-indigo-500" />
          {matterCount > 1
            ? `Assign Account Officers to ${matterCount} Matters`
            : "Assign Account Officer"}
        </span>
      }
      open={open}
      onCancel={onCancel}
      width={520}
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={!canSubmit}>
          {isRemoval ? "Unassign" : "Save assignment"}
        </Button>,
      ]}>
      <div className="space-y-4 pt-2">
        {current.length > 0 && (
          <div>
            <Text className="!text-xs !text-slate-500 font-medium uppercase tracking-wider block mb-2">
              Currently assigned
            </Text>
            <Space size={[6, 6]} wrap>
              {current.map((officer, index) => (
                <Tag
                  key={officer?._id || index}
                  className="!m-0 !rounded-full !py-0.5 !pl-0.5 !pr-2.5 flex items-center gap-1.5"
                  onClose={isRemoval ? () => setOfficerIds((prev) => [...prev, officer._id]) : undefined}
                  closable={isRemoval}>
                  <Avatar
                    size={18}
                    src={officer?.photo || undefined}
                    className="!bg-indigo-100 !text-indigo-700 !text-[9px] !font-bold">
                    {initialsOf(officer) || <UserOutlined />}
                  </Avatar>
                  {nameOf(officer)}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        <div>
          <Text className="!text-xs !text-slate-500 font-medium uppercase tracking-wider block mb-2">
            {isRemoval ? "Officers to remove" : "Account officers"}
          </Text>
          <UserSelect
            mode="multiple"
            placeholder={isRemoval ? "Select officers to unassign" : "Select account officers"}
            excludeUserTypes={["client"]}
            showUserType
            value={officerIds}
            onChange={setOfficerIds}
            style={{ width: "100%" }}
            disabled={loading}
          />
          <Text type="secondary" className="!text-xs block mt-1.5">
            Only lawyers and administrators in your firm can own matters.
          </Text>
        </div>

        <div>
          <Text className="!text-xs !text-slate-500 font-medium uppercase tracking-wider block mb-2">
            How should this apply?
          </Text>
          <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)} disabled={loading}>
            <Space direction="vertical" size={6}>
              {MODE_OPTIONS.map((option) => (
                <Radio key={option.value} value={option.value}>
                  <span className="font-medium">{option.label}</span>
                  <span className="block text-xs text-slate-500">{option.hint}</span>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>

        {mode === "replace" && current.length > 0 && (
          <Alert
            type="info"
            showIcon
            message={`The current ${
              current.length === 1 ? "officer" : `${current.length} officers`
            } will be replaced.`}
          />
        )}
      </div>
    </Modal>
  );
};

AssignOfficerModal.propTypes = {
  open: PropTypes.bool,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  matterCount: PropTypes.number,
  currentOfficers: PropTypes.array,
  loading: PropTypes.bool,
};

export default AssignOfficerModal;
