import React, { useEffect, useState } from "react";
import { nhost } from "../lib/nhost";

const getTodos = `
query {
  todos {
    id
    created_at
    name
    completed
  }
}
`;

const insertTodo = `
mutation InsertTodo($name: String!, $user_id: uuid!) {
  insert_todos(objects: { name: $name, user_id: $user_id }) {
    returning {
      id
      name
      created_at
      completed
    }
  }
}
`;

const updateTodo = `
mutation UpdateTodo($id: uuid!, $completed: Boolean!) {
  update_todos_by_pk(pk_columns: {id: $id}, _set: {completed: $completed}) {
    id
    completed
  }
}
`;

const deleteTodo = `
mutation DeleteTodo($id: uuid!) {
  delete_todos_by_pk(id: $id) {
    id
  }
}
`;

export default function Home({ session }) {
  const [loading, setLoading] = useState(true);
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    async function fetchTodos() {
      setLoading(true);
      try {
        const { data, error } = await nhost.graphql.request(getTodos);
        if (error) {
          console.error(error);
        } else {
          setTodos(data.todos || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchTodos();
  }, []);

  const handleNewTodoChange = (event) => {
    setNewTodo(event.target.value);
  };

  const handleAddTodo = async () => {
    const variables = { name: newTodo, user_id: session.user.id };
    const { data, error } = await nhost.graphql.request(insertTodo, variables);
    if (data) {
      setTodos([...todos, ...data.insert_todos.returning]);
      setNewTodo("");
    } else {
      console.log(error);
    }
  };

  const handleToggleTodo = async (id, completed) => {
    const variables = { id, completed: !completed };
    const { data, error } = await nhost.graphql.request(updateTodo, variables);
    if (data) {
      setTodos(
        todos.map((todo) =>
          todo.id === id ? { ...todo, completed: !completed } : todo
        )
      );
    } else {
      console.log(error);
    }
  };

  const handleDeleteTodo = async (id) => {
    const variables = { id };
    const { data, error } = await nhost.graphql.request(deleteTodo, variables);
    if (data) {
      setTodos(todos.filter((todo) => todo.id !== id));
    } else {
      console.log(error);
    }
  };

  return (
    <div className="bg-[#171717] h-screen select-none">
      <div className="absolute right-3 bottom-3">
        <button
          className="flex items-center"
          onClick={() => nhost.auth.signOut()}
        >
          {" "}
          <span className="text-white">Logout</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8 text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
            />
          </svg>
        </button>
      </div>
      <div className="flex items-start py-10 justify-center h-screen">
        <div>
          <h1 class="bg-gradient-to-r from-[#fc42b6] to-[#3e91f1] inline-block text-transparent bg-clip-text text-4xl md:text-5xl lg:text-6xl">
            Todo App
          </h1>
          {/* Input */}
          <div className="bg-[#2e2e2e] px-3 py-1 rounded-md my-10">
            <div className="flex items-center justify-between">
              <div>
                <input
                  className="h-12 w-44 md:w-72 lg:w-96 text-xl bg-[#2e2e2e] outline-none text-white"
                  type="text"
                  placeholder="Task name"
                  value={newTodo}
                  onChange={handleNewTodoChange}
                />
              </div>
              <div>
                <button
                  onClick={handleAddTodo}
                  className={`text-white bg-[#151515] px-6 py-3 rounded-md ${
                    newTodo.trim() === "" ? "cursor-not-allowed opacity-50" : ""
                  }`}
                  disabled={newTodo.trim() === ""}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
          {/* Fetched Results */}
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center justify-between w-full mt-4 px-3"
            >
              <div className="flex items-center space-x-7">
                <div>
                  {todo.completed ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6 cursor-pointer text-emerald-600"
                      onClick={() => handleToggleTodo(todo.id, todo.completed)}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  ) : (
                    // Render white circle SVG
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-6 h-6 cursor-pointer text-white"
                      onClick={() => handleToggleTodo(todo.id, todo.completed)}
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill=""
                        stroke="currentColor"
                      />
                    </svg>
                  )}
                </div>
                <div
                  className={`text-lg ${
                    todo.completed ? "line-through" : ""
                  } text-white capitalize cursor-pointer`}
                  onClick={() => handleToggleTodo(todo.id, todo.completed)}
                >
                  {todo.name}
                </div>
              </div>
              <div>
                {/* Delete button */}
                <button onClick={() => handleDeleteTodo(todo.id)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6 text-red-600 cursor-pointer"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}