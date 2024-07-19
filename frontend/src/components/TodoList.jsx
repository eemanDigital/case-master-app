import { useState } from "react";
import PropTypes from "prop-types";
// import { Button } from "antd";
import TodoTask from "./TodoTask";
import { useDataGetterHook } from "../hooks/useDataGetterHook";
import TodoForm from "../pages/TodoForm";

const TodoList = ({ title }) => {
  const { todos, error, loading } = useDataGetterHook();
  const [optimisticTodos, setOptimisticTodos] = useState([]); //handles optimistic update

  const addOptimisticTodo = (todo) => {
    setOptimisticTodos((prev) => [...prev, todo]);
  };

  const removeOptimisticTodo = (id) => {
    setOptimisticTodos((prev) => prev.filter((todo) => todo._id !== id));
  };

  const allTodos = [...todos.data.todos, ...optimisticTodos];

  if (loading.todos) return <p>Loading...</p>;
  if (error.todos) return <p>Error: {error.todos}</p>;

  return (
    <section className="flex flex-col  px-4 pt-2 p-2 rounded-md">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold">{title}</h3>
        <TodoForm
          addOptimisticTodo={addOptimisticTodo}
          removeOptimisticTodo={removeOptimisticTodo}
        />
      </div>

      <div className="mt-4">
        <TodoTask tasks={allTodos} />
      </div>
    </section>
  );
};

TodoList.propTypes = {
  title: PropTypes.string.isRequired,
};

export default TodoList;
