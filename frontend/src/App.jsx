import { useEffect, useState } from 'react'
import './App.css'

const API = '/api/tasks'

function App() {
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')

  async function loadTasks() {
    try {
      const res = await fetch(API)
      if (!res.ok) throw new Error()
      setTasks(await res.json())
      setError('')
    } catch {
      setError('Could not reach the API. Is the backend running?')
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  async function addTask(e) {
    e.preventDefault()
    if (!title.trim()) return
    await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    setTitle('')
    loadTasks()
  }

  async function toggleTask(task) {
    await fetch(`${API}/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    })
    loadTasks()
  }

  async function deleteTask(id) {
    await fetch(`${API}/${id}`, { method: 'DELETE' })
    loadTasks()
  }

  return (
    <main className="app">
      <h1>Task Manager</h1>

      <form onSubmit={addTask} className="add-form">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
        />
        <button type="submit">Add</button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className={task.completed ? 'done' : ''}>
            <label>
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task)}
              />
              {task.title}
            </label>
            <button onClick={() => deleteTask(task.id)}>Delete</button>
          </li>
        ))}
      </ul>

      {tasks.length === 0 && !error && <p className="empty">No tasks yet.</p>}
    </main>
  )
}

export default App