import { useState, useEffect, useCallback, useRef } from "react"
import "./App.css"

const API = "http://localhost:8001"

function App() {
  const [page, setPage] = useState("login")
  const [token, setToken] = useState(localStorage.getItem("access_token"))
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({username: "", email: "", password: ""})
  const [msg, setMsg] = useState("")
  const hasCheckedAuth = useRef(false)

  // Auto-refresh token function
  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem("refresh_token")
    if (!refreshToken) {
      logout()
      return null
    }
    try {
      const res = await fetch(`${API}/auth/refresh`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ refresh_token: refreshToken })
      })
      if (res.ok) {
        const data = await res.json()
        // Store BOTH new tokens (rotation)
        localStorage.setItem("access_token", data.access_token)
        localStorage.setItem("refresh_token", data.refresh_token)
        setToken(data.access_token)
        return data.access_token
      } else {
        // Refresh token expired - must login again
        logout()
        return null
      }
    } catch {
      logout()
      return null
    }
  }, [])

  // Protected API call with auto-refresh
  const apiCall = useCallback(async (url, options = {}) => {
    let currentToken = localStorage.getItem("access_token")
    let res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${currentToken}`
      }
    })

    // If 401, try refresh
    if (res.status === 401) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        // Retry with new token
        res = await fetch(url, {
          ...options,
          headers: { ...options.headers, Authorization: `Bearer ${newToken}` }
        })
      }
    }
    return res
  }, [refreshAccessToken])

  // Check if logged in on mount only
  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true
      if (token && !user) getMe()
    }
  })

  async function getMe() {
    const res = await apiCall(`${API}/me`)
    if (res.ok) {
      const data = await res.json()
      setUser(data)
      setPage("dashboard")
    } else {
      logout()
    }
  }

  async function register() {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) {
      setMsg("Registered! Now login")
      setPage("login")
    } else {
      setMsg(data.detail)
    }
  }

  async function login() {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({username: form.username, password: form.password})
    })
    const data = await res.json()
    if (res.ok) {
      localStorage.setItem("access_token", data.access_token)
      localStorage.setItem("refresh_token", data.refresh_token)
      setToken(data.access_token)
      // Call getMe to load user and redirect
      const meRes = await apiCall(`${API}/me`)
      if (meRes.ok) {
        const userData = await meRes.json()
        setUser(userData)
        setPage("dashboard")
      }
    } else {
      setMsg(data.detail)
    }
  }

  function logout() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    setToken(null)
    setUser(null)
    setPage("login")
  }

  return (
    <div className="container">
      {page === "login" && (
        <div className="card">
          <h2>Login</h2>
          {msg && <p className="msg">{msg}</p>}
          <input placeholder="Username" onChange={e => setForm({...form, username: e.target.value})} />
          <input type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} />
          <button onClick={login}>Login</button>
          <p className="link" onClick={() => {setPage("register"); setMsg("")}}>No account? Register</p>
        </div>
      )}

      {page === "register" && (
        <div className="card">
          <h2>Register</h2>
          {msg && <p className="msg">{msg}</p>}
          <input placeholder="Username" onChange={e => setForm({...form, username: e.target.value})} />
          <input placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} />
          <input type="password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} />
          <button onClick={register}>Register</button>
          <p className="link" onClick={() => {setPage("login"); setMsg("")}}>Have account? Login</p>
        </div>
      )}

      {page === "dashboard" && (
        <div className="card">
          <h2>Dashboard</h2>
          <p>ID: {user?.id}</p>
          <p>Username: {user?.username}</p>
          <p>Email: {user?.email}</p>
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </div>
  )
}

export default App