import React, { useState } from "react";
import { Button, Tooltip } from "antd";
import { MailOutlined, SendOutlined } from "@ant-design/icons";
import CustomEmailModal from "./CustomEmailModal";

const SendEmailButton = ({
  children,
  type = "default",
  size = "middle",
  icon = "mail",
  preselectedRecipients = [],
  preselectedSubject = "",
  onSuccess,
  onError,
  ...buttonProps
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleOpen = () => setModalVisible(true);

  const handleClose = () => setModalVisible(false);

  const getIcon = () => {
    if (icon === "send") return <SendOutlined />;
    return <MailOutlined />;
  };

  return (
    <>
      <Tooltip title="Send Custom Email">
        {children ? (
          <Button
            onClick={handleOpen}
            icon={getIcon()}
            type={type}
            size={size}
            {...buttonProps}>
            {children}
          </Button>
        ) : (
          <Button
            onClick={handleOpen}
            icon={getIcon()}
            type={type}
            size={size}
            {...buttonProps}
          />
        )}
      </Tooltip>

      <CustomEmailModal
        visible={modalVisible}
        onClose={handleClose}
        preselectedRecipients={preselectedRecipients}
        preselectedSubject={preselectedSubject}
      />
    </>
  );
};

export default SendEmailButton;
