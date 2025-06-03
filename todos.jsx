import React, { useState, useEffect } from 'react'
import { useNhostClient, useUser, useFileUpload } from '@nhost/react'

const GET_TODOS = `
  query {
    todos(order_by: {created_at: desc}) {
      id
      title
      file_id
      completed
    }
  }
`

const CREATE_TODO = `
  mutation($title: String!, $file_id: uuid) {
    insert_todos_one(object: {title: $title, file_id: $file_id}) {
      id
    }
  }
`

const DELETE_TODO = `
  mutation($id: uuid!) {
    delete_todos_by_pk(id: $id) {
      id
    }
  }
`

const UPDATE_TODO_COMPLETE = `
  mutation($id: uuid!) {
    update_todos_by_pk(pk_columns: {id: $id}, _set: {completed: true}) {
      id
    }
  }
`

const styles = {
  container: {
    maxWidth: 600,
    margin: 'auto',
    padding: 20,
    textAlign: 'center',
    marginTop: '5vh',
    border: '1px solid #ccc',
    borderRadius: 8,
  },
  form: {
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  input: {
    padding: 10,
    fontSize: 16,
  },
  inputFile: {
    marginTop: 10,
  },
  button: {
    padding: 10,
    fontSize: 16,
    cursor: 'pointer',
  },
  linkButton: {
    marginLeft: 10,
    padding: '4px 8px',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    color: '#007bff',
    textDecoration: 'underline',
  },
  todoList: {
    listStyle: 'none',
    padding: 0,
  },
  todoItem: {
    marginBottom: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    marginLeft: 10,
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '4px 8px',
    cursor: 'pointer',
  },
  signOutButton: {
    marginTop: 20,
    padding: 10,
    cursor: 'pointer',
  },
}

export default function Todos() {
  const [loading, setLoading] = useState(true)
  const [todos, setTodos] = useState([])
  const [todoTitle, setTodoTitle] = useState('')
  const [todoAttachment, setTodoAttachment] = useState(null)
  const [refreshFlag, setRefreshFlag] = useState(false)

  const nhostClient = useNhostClient()
  const { upload } = useFileUpload()
  const user = useUser()

  useEffect(() => {
    async function fetchTodos() {
      setLoading(true)
      const { data, error } = await nhostClient.graphql.request(GET_TODOS)
      if (error) {
        console.error(error)
      } else {
        setTodos(data.todos)
      }
      setLoading(false)
    }
    fetchTodos()
  }, [refreshFlag, nhostClient])

  const handleCreateTodo = async (e) => {
    e.preventDefault()
    if (!todoTitle.trim()) return

    let file_id = null
    if (todoAttachment) {
      const { id, error } = await upload({ file: todoAttachment, name: todoAttachment.name })
      if (error) {
        alert('File upload failed')
        console.error(error)
        return
      }
      file_id = id
    }

    const { error } = await nhostClient.graphql.request(CREATE_TODO, { title: todoTitle, file_id })
    if (error) {
      alert('Failed to create todo')
      console.error(error)
      return
    }

    setTodoTitle('')
    setTodoAttachment(null)
    setRefreshFlag(prev => !prev)
  }

  const handleDeleteTodo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this todo?')) return

    const todo = todos.find(t => t.id === id)
    if (todo?.file_id) {
      await nhostClient.storage.delete({ fileId: todo.file_id })
    }

    const { error } = await nhostClient.graphql.request(DELETE_TODO, { id })
    if (error) {
      alert('Failed to delete todo')
      console.error(error)
      return
    }
    setRefreshFlag(prev => !prev)
  }

  const completeTodo = async (id) => {
    const { error } = await nhostClient.graphql.request(UPDATE_TODO_COMPLETE, { id })
    if (error) {
      alert('Failed to update todo')
      console.error(error)
      return
    }
    setRefreshFlag(prev => !prev)
  }

  const openAttachment = async (todo) => {
    const { presignedUrl, error } = await nhostClient.storage.getPresignedUrl({ fileId: todo.file_id })
    if (error) {
      alert('Failed to open attachment')
      console.error(error)
      return
    }
    window.open(presignedUrl.url, '_blank')
  }

  return (
    <div style={styles.container}>
      <h1>Your Todos</h1>
      <p>Logged in as: <strong>{user?.email}</strong></p>
      <form onSubmit={handleCreateTodo} style={styles.form}>
        <input
          type="text"
          placeholder="Enter todo title"
          value={todoTitle}
          onChange={e => setTodoTitle(e.target.value)}
          style={styles.input}
        />
        <input
          type="file"
          onChange={e => setTodoAttachment(e.target.files[0])}
          style={styles.inputFile}
        />
        <button
          type="submit"
          disabled={!todoTitle.trim()}
          style={styles.button}
        >
          Add Todo
        </button>
      </form>

      {loading ? (
        <p>Loading todos...</p>
      ) : todos.length === 0 ? (
        <p>No todos yet!</p>
      ) : (
        <ul style={styles.todoList}>
          {todos.map(todo => (
            <li key={todo.id} style={styles.todoItem}>
              <input
                type="checkbox"
                checked={todo.completed}
                disabled={todo.completed}
                onChange={() => completeTodo(todo.id)}
              />
              <span style={{ textDecoration: todo.completed ? 'line-through' : 'none', marginLeft: 8 }}>
                {todo.title}
              </span>
              {todo.file_id && (
                <button
                  onClick={() => openAttachment(todo)}
                  style={styles.linkButton}
                >
                  Open Attachment
                </button>
              )}
              <button
                onClick={() => handleDeleteTodo(todo.id)}
                style={styles.deleteButton}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => nhostClient.auth.signOut()}
        style={styles.signOutButton}
      >
        Sign Out
      </button>
    </div>
  )
}
