import TodoHeader from "./TodoList";
import useModal from "../hooks/useModal";
import { Modal, Button } from "antd";
import TodoList from "./TodoList";

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
          <TodoList title="To Do List" />
        </div>
      </Modal>
    </div>
  );
};

export default Todo;
