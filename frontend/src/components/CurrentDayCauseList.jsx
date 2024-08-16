import { useState } from "react";
import { Modal, Typography, Button, Empty, Card } from "antd";
import { CalendarOutlined, FileTextOutlined } from "@ant-design/icons";
import SingleCauseList from "./SingleCauseList";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

const { Title, Text } = Typography;

const CurrentDayCaseList = () => {
  const {
    loading: getterLoading,
    error: getterError,
    causeList,
  } = useDataGetterHook();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <Card
      hoverable
      className="w-full my-4 sm:w-64 md:w-80 lg:w-96 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300">
      {!causeList.data?.todayResult > 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text className="text-sm text-gray-500">
              No court matters today
            </Text>
          }
        />
      ) : (
        <div className="space-y-2">
          <Title level={4} className="text-blue-500 flex items-center">
            <CalendarOutlined className="mr-2" />
            Today&rsquo;s Cases
          </Title>
          <Text className="text-sm text-gray-700 block">
            <span className="font-bold text-blue-600">
              {causeList.data?.todayResult}
            </span>{" "}
            matter(s) in court
          </Text>
          <Button
            onClick={showModal}
            size="small"
            icon={<FileTextOutlined />}
            className="hover:bg-blue-600 blue-btn transition-colors duration-300 mt-2">
            View List
          </Button>
        </div>
      )}

      <Modal
        title={
          <span className="text-lg text-blue-600 font-semibold">
            Today's Cause List
          </span>
        }
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width="90%"
        className="p-0">
        <div className="p-4 w-full max-h-[80vh] overflow-y-auto">
          <SingleCauseList
            causeListData={causeList.data?.reportsToday}
            loadingCauseList={getterLoading.causeList}
            errorCauseList={getterError.causeList}
            title="Today's Cause List"
            h1Style="text-center text-xl text-gray-600 font-bold mb-4"
            hideButton={true}
          />
        </div>
      </Modal>
    </Card>
  );
};

export default CurrentDayCaseList;
