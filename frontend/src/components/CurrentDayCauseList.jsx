import { useState } from "react";
import { Modal } from "antd";
import SingleCauseList from "./SingleCauseList";
import { useDataGetterHook } from "../hooks/useDataGetterHook";

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
    <div>
      <div
        className={`${
          causeList.data?.todayResult === 0
            ? "h-[180px] w-full shadow-none bg-white"
            : ""
        }`}>
        {!causeList.data?.todayResult > 0 ? (
          <h3 className="bg-slate-800 text-white p-5 font-medium text-center">
            You have no matter today in Court
          </h3>
        ) : (
          <div
            className="bg-gray-300 hover:bg-gray-200  max-w-sm rounded overflow-hidden shadow-lg cursor-pointer my-4 p-4"
            onClick={showModal}>
            <div className="px-6 py-4">
              <div className="font-bold text-xl mb-2 text-center text-gray-800">
                Today's Cause List
              </div>
              <p className="text-gray-700 text-base text-center hover:text-gray-500">
                Click to view the full cause list for today.
              </p>
            </div>
          </div>
        )}
      </div>

      <Modal
        title="Today's Cause List"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        width="80%" // Set the width of the modal
        className="p-5"
        // bodyStyle={{ overflow: "hidden" }} // Hide the scroll
      >
        <div className="p-5 w-full overflow-hidden">
          <SingleCauseList
            causeListData={causeList.data?.reportsToday}
            loadingCauseList={getterLoading.causeList}
            errorCauseList={getterError.causeList}
            title="Today's Cause List"
            h1Style="text-center text-2xl text-gray-600 font-bold"
            hideButton={true}
          />
        </div>
      </Modal>
    </div>
  );
};

export default CurrentDayCaseList;
