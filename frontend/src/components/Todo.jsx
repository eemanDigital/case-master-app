import TodoHeader from "./TodoHeader";
import useModal from "../hooks/useModal";
import { Modal, Button } from "antd";

const Todo = () => {
  const { open, confirmLoading, modalText, showModal, handleOk, handleCancel } =
    useModal();

  return (
    <div>
      <Button onClick={showModal} className="bg-blue-500 text-white">
        Manage To Dos
      </Button>
      <Modal
        open={open}
        onOk={handleOk}
        footer={null}
        // confirmLoading={loading}
        onCancel={handleCancel}
        width={800}>
        <div>
          <TodoHeader title="To Do List" />
        </div>
      </Modal>
    </div>
  );
};

export default Todo;
