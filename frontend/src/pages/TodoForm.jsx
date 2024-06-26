import { useState, useCallback } from "react";
import { todoPriority } from "./../data/options";
import { Button, Input, Form, Modal, Spin, Select, DatePicker } from "antd";
import useModal from "../hooks/useModal";
import { v4 as uuidv4 } from "uuid"; // For generating unique IDs for new todos
import { useDataFetch } from "../hooks/useDataFetch";

const TodoForm = ({ addOptimisticTodo, removeOptimisticTodo }) => {
  const { TextArea } = Input;
  const { open, showModal, handleOk, handleCancel } = useModal();
  const [form] = Form.useForm();
  const { dataFetcher, loading } = useDataFetch();

  const onSubmit = useCallback(async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch (errorInfo) {
      return;
    }

    const tempId = uuidv4(); // Generate a temporary unique ID
    const optimisticTodo = {
      _id: tempId,
      ...values,
      createdAt: new Date().toISOString(),
      isCompleted: false,
    };

    addOptimisticTodo(optimisticTodo); // Add the temporary todo to the state

    try {
      const result = await dataFetcher("todos", "POST", values);

      if (result.error) {
        throw new Error(result.error);
      }

      form.resetFields();
    } catch (error) {
      removeOptimisticTodo(tempId); // Remove the temporary todo if the request fails
      console.error("Failed to add todo:", error.message);
    }
  }, [form, dataFetcher, addOptimisticTodo, removeOptimisticTodo]);

  return (
    <>
      <Button className="bg-blue-500 text-white" onClick={showModal}>
        Create Todo
      </Button>
      <Modal
        title="Add Todos"
        open={open}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Return
          </Button>,
          <Button
            key="submit"
            className="bg-blue-500 text-white"
            onClick={onSubmit}>
            Save
          </Button>,
        ]}>
        <Form layout="vertical" form={form}>
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please input the description!" },
            ]}>
            <TextArea rows={4} placeholder="Enter todo description..." />
          </Form.Item>
          <Form.Item
            name="priority"
            label="Priority"
            rules={[
              { required: true, message: "Please select the priority!" },
            ]}>
            <Select
              placeholder="Select a priority"
              notFoundContent={loading ? <Spin size="small" /> : null}
              options={todoPriority}
              allowClear
            />
          </Form.Item>
          <Form.Item
            name="dueDate"
            label="Due Date"
            rules={[
              { required: true, message: "Please select the due date!" },
            ]}>
            <DatePicker style={{ width: "100%" }} showTime />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TodoForm;
