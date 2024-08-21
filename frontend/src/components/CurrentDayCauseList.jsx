import { useState } from "react";
import { Modal, Typography, Button, Empty, Card } from "antd";
import { CalendarOutlined, FileTextOutlined } from "@ant-design/icons";
import SingleCauseList from "./SingleCauseList";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

const { Title, Text } = Typography;

const CurrentDayCauseList = () => {
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

  //transform causeList data to array of objects
  const transformedCauseListData = causeList.data?.reportsToday.map((item) => ({
    ...item,
    caseReported: {
      ...item.caseReported,
      firstParty: {
        ...item.caseReported.firstParty,
        name: Array.isArray(item.caseReported.firstParty?.name)
          ? item.caseReported.firstParty.name
          : [{ name: item.caseReported.firstParty?.name }],
      },
      secondParty: {
        ...item.caseReported.secondParty,
        name: Array.isArray(item.caseReported.secondParty?.name)
          ? item.caseReported.secondParty.name
          : [{ name: item.caseReported.secondParty?.name }],
      },
      thirdParty: {
        ...item.caseReported.thirdParty,
        name: Array.isArray(item.caseReported.thirdParty?.name)
          ? item.caseReported.thirdParty.name
          : [{ name: item.caseReported.thirdParty?.name }],
      },
    },
  }));

  <div className="p-4 w-full max-h-[80vh] overflow-y-auto">
    <SingleCauseList
      causeListData={transformedCauseListData}
      loadingCauseList={getterLoading.causeList}
      errorCauseList={getterError.causeList}
      title="Today's Cause List"
      h1Style="text-center text-xl text-gray-600 font-bold mb-4"
      hideButton={true}
      onDownloadCauseList={() => {}}
      showDownloadBtn={false}
    />
  </div>;

  return (
    <Card
      hoverable
      className="bg-white p-3 rounded-lg cursor-pointer shadow-sm hover:shadow-md transition-shadow h-[180px]  flex flex-col justify-center items-center">
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
            Today&rsquo;s Cause List
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
            causeListData={transformedCauseListData}
            loadingCauseList={getterLoading.causeList}
            errorCauseList={getterError.causeList}
            title="Today's Cause List"
            h1Style="text-center text-xl text-gray-600 font-bold mb-4"
            hideButton={true}
            onDownloadCauseList={() => {}}
            showDownloadBtn={false}
          />
        </div>
      </Modal>
    </Card>
  );
};

export default CurrentDayCauseList;
