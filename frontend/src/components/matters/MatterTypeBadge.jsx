import React from "react";
import { Tag } from "antd";
import {
  FileTextOutlined,
  BankOutlined,
  BulbOutlined,
  HomeOutlined,
  SafetyCertificateOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { MATTER_CONFIG } from "../../config/matterConfig";

const MatterTypeBadge = ({
  type,
  showIcon = true,
  showLabel = true,
  size = "default",
}) => {
  const getTypeConfig = () => {
    const typeMap = {
      litigation: {
        color: "red",
        label: "Litigation",
        icon: <FileTextOutlined />,
      },
      corporate: {
        color: "blue",
        label: "Corporate",
        icon: <BankOutlined />,
      },
      advisory: {
        color: "green",
        label: "Advisory",
        icon: <BulbOutlined />,
      },
      property: {
        color: "orange",
        label: "Property",
        icon: <HomeOutlined />,
      },
      retainer: {
        color: "purple",
        label: "Retainer",
        icon: <SafetyCertificateOutlined />,
      },
      general: {
        color: "gray",
        label: "General",
        icon: <AppstoreOutlined />,
      },
    };

    return typeMap[type] || { color: "default", label: type, icon: null };
  };

  const config = getTypeConfig();

  return (
    <Tag
      color={config.color}
      icon={showIcon ? config.icon : null}
      className={`inline-flex items-center gap-1 ${size === "small" ? "text-xs px-2 py-0.5" : ""}`}>
      {showLabel && config.label}
    </Tag>
  );
};

export default MatterTypeBadge;
