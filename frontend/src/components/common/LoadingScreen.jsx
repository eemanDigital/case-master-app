import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const LoadingScreen = ({ tip = "Loading...", fullScreen = false }) => {
  const antIcon = <LoadingOutlined style={{ fontSize: 48 }} spin />;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
        <Spin indicator={antIcon} tip={tip} size="large" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <Spin indicator={antIcon} tip={tip} size="large" />
    </div>
  );
};

export default LoadingScreen;
