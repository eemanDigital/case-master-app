import TodoHeader from "./TodoHeader";
import useModal from "../hooks/useModal";
import { Modal, Button } from "antd";

const Todo = () => {
  const { open, confirmLoading, modalText, showModal, handleOk, handleCancel } =
    useModal();

  return (
    <>
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Manage To Dos
      </Button>
      <Modal
        title="Leave Application Response"
        open={open}
        onOk={handleOk}
        // confirmLoading={loading}
        onCancel={handleCancel}>
        <div>
          <TodoHeader title="To Do List" />
        </div>
      </Modal>
    </>
  );
};

export default Todo;
