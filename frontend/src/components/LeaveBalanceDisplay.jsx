import { useEffect, useState } from "react";
import { useDataFetch } from "../hooks/useDataFetch";
import { Modal, Spin, Alert, Descriptions, Button } from "antd";

const LeaveBalanceDisplay = ({ userId, visible, onClose }) => {
  const { data, loading, error, dataFetcher } = useDataFetch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModal = () => {
    setIsModalOpen(true);
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (userId) {
      dataFetcher(`leaves/balances/${userId}`, "get");
    }
  }, [userId]);

  if (loading) {
    return (
      <Modal open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        <div className="flex justify-center items-center h-full">
          <Spin size="large" />
        </div>
      </Modal>
    );
  }

  // if (error) {
  //   return (
  //     <Modal open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
  //       <Alert message="Error" description={error} type="error" showIcon />
  //     </Modal>
  //   );
  // }

  // console.log("ERRO", data);

  return (
    <>
      <Button className="bg-blue-500 text-white" onClick={showModal}>
        Your Leave Balance
      </Button>
      <Modal
        width={700}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}>
        <Descriptions title="Leave Balance" bordered>
          <Descriptions.Item label="Annual Leave Balance">
            {data?.data?.annualLeaveBalance}
          </Descriptions.Item>
          <Descriptions.Item label="Sick Leave Balance">
            {data?.data?.sickLeaveBalance}
          </Descriptions.Item>
        </Descriptions>
      </Modal>
    </>
  );
};

export default LeaveBalanceDisplay;
