import { useEffect } from "react";
import { notification } from "antd";
import { bindNotification } from "../utils/notify";

const NotificationHost = () => {
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    bindNotification(api);
  }, [api]);

  return contextHolder;
};

export default NotificationHost;