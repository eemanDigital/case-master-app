import React, { memo } from "react";
import { Alert } from "antd";
import { FileTextOutlined, BankOutlined, HomeOutlined, BulbOutlined, FileProtectOutlined, FolderOutlined } from "@ant-design/icons";

const getAlertConfig = (matterType) => {
  const configs = {
    litigation: {
      icon: <FileTextOutlined />,
      message: "Litigation Details",
      description: "All litigation information (court, parties, processes, judges, hearings, etc.) will be captured in the Litigation Details form after creating this matter.",
    },
    corporate: {
      icon: <BankOutlined />,
      message: "Corporate Details",
      description: "All corporate information (transaction details, company info, financials, parties, milestones, etc.) will be captured in the Corporate Details form after creating this matter.",
    },
    property: {
      icon: <HomeOutlined />,
      message: "Property Details",
      description: "All property information (property address, title documents, transaction details, parties, etc.) will be captured in the Property Details form after creating this matter.",
    },
    advisory: {
      icon: <BulbOutlined />,
      message: "Advisory Details",
      description: "All advisory information (advisory type, client details, legal issues, opinions, etc.) will be captured in the Advisory Details form after creating this matter.",
    },
    retainer: {
      icon: <FileProtectOutlined />,
      message: "Retainer Details",
      description: "All retainer information (retainer type, scope of work, billing, schedule, etc.) will be captured in the Retainer Details form after creating this matter.",
    },
    general: {
      icon: <FolderOutlined />,
      message: "General Matter Details",
      description: "All general matter information will be captured in the General Details form after creating this matter.",
    },
  };
  return configs[matterType] || null;
};

const MatterTypeSpecificForm = memo(({ matterType }) => {
  const config = getAlertConfig(matterType);

  if (!config) {
    return (
      <div className="text-center py-6">
        <span className="text-gray-500">Select a matter type to see specific fields</span>
      </div>
    );
  }

  return (
    <Alert
      type="info"
      icon={config.icon}
      message={config.message}
      description={config.description}
    />
  );
});

MatterTypeSpecificForm.displayName = "MatterTypeSpecificForm";

export default MatterTypeSpecificForm;
