import { useEffect, useState } from "react";
import PropTypes from "prop-types";
// import { Button } from "antd";
import TodoTask from "./TodoTask";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import TodoForm from "../pages/TodoForm";
import LoadingSpinner from "./LoadingSpinner";
import { toast } from "react-toastify";

const TodoList = ({ title }) => {
  // Destructure the necessary properties from the custom hook
  const { todos, error, loading, fetchData } = useDataGetterHook();

  // State to handle optimistic updates
  const [optimisticTodos, setOptimisticTodos] = useState([]);

  // Fetch data when the component mounts
  useEffect(() => {
    fetchData("todos", "todos");
  }, []);

  // Function to add a new todo optimistically
  const addOptimisticTodo = (todo) => {
    setOptimisticTodos((prev) => [...prev, todo]);
  };

  // Function to remove a todo optimistically by its id
  const removeOptimisticTodo = (id) => {
    setOptimisticTodos((prev) => prev.filter((todo) => todo?._id !== id));
  };

  // Combine fetched todos and optimistic todos
  const allTodos = [...(todos?.data?.todos || []), ...optimisticTodos];

  // Display loading message if data is being fetched
  if (loading.todos) return <LoadingSpinner />;

  // Display error message if there was an error fetching data
  if (error.todos) return toast.error(error.todos);

  return (
    <section className="flex flex-col bg-white pt-2 p-2 rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">{title}</h3>
      </div>
      <div className="mt-4">
        <TodoTask tasks={allTodos || []} />
        <TodoForm
          addOptimisticTodo={addOptimisticTodo}
          removeOptimisticTodo={removeOptimisticTodo}
        />
      </div>
    </section>
  );
};

TodoList.propTypes = {
  title: PropTypes.string.isRequired,
};

export default TodoList;
