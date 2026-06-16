import { useState, useEffect, useCallback, useRef } from "react"
import "./App.css"

const API = "https://authsystem-practice-back.onrender.com"

function App() {
  const [page, setPage] = useState("login")
  const [token, setToken] = useState(localStorage.getItem("access_token"))
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({username: "", email: "", password: ""})
  const [otp, setOtp] = useState("")
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

  function navigateTo(newPage) {
    setPage(newPage)
    setMsg("")
    setOtp("")
  }

  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true
      if (token) getMe()
    }
  }, [])

  async function getMe() {
    const res = await apiCall(`${API}/me`)
    if (res.ok) {
      const data = await res.json()
      setUser(data)
      navigateTo("dashboard")
    } else {
      logout()
    }
  }

  async function register() {
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) {
      setMsg("Username must be 3-20 chars, letters/numbers/underscores only")
      return
    }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email)) {
      setMsg("Invalid email format")
      return
    }
    if (form.password.length < 6) {
      setMsg("Password must be at least 6 characters")
      return
    }
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) {
      setMsg("OTP sent to your email. Enter it to verify.")
      navigateTo("verify-register")
    } else {
      setMsg(data.detail)
    }
  }

  async function verifyRegister() {
    const res = await fetch(`${API}/auth/register/verify`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: form.email, otp: otp})
    })
    const data = await res.json()
    if (res.ok) {
      setMsg("Account verified! Now login")
      navigateTo("login")
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
      setUser(data.user)
      navigateTo("dashboard")
    } else {
      setMsg(data.detail)
    }
  }

  function logout() {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    setToken(null)
    setUser(null)
    navigateTo("login")
  }

  async function forgotPassword() {
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: form.email})
    })
    const data = await res.json()
    if (res.ok) {
      setMsg("OTP sent to your email")
      navigateTo("verify-forgot")
    } else {
      setMsg(data.detail)
    }
  }

  async function verifyForgotOtp() {
    const res = await fetch(`${API}/auth/forgot-password/verify`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: form.email, otp: otp, new_password: form.password})
    })
    const data = await res.json()
    if (res.ok) {
      setMsg("Password reset successful!")
      navigateTo("login")
    } else {
      setMsg(data.detail)
    }
  }

  return (
    <div className="container">
      {page === "login" && (
        <div className="card">
          <h2>Login</h2>
          {msg && <p className="msg">{msg}</p>}
          <input name="username" id="username" autoComplete="username" placeholder="Username or Email" onChange={e => setForm({...form, username: e.target.value})} />
          <input name="password" id="password" type="password" autoComplete="current-password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} />
          <button onClick={login}>Login</button>
          <p className="link" onClick={() => navigateTo("register")}>No account? Register</p>
          <p className="link" onClick={() => navigateTo("forgot-password")}>Forgot password?</p>
        </div>
      )}

      {page === "register" && (
        <div className="card">
          <h2>Register</h2>
          {msg && <p className="msg">{msg}</p>}
          <input name="username" id="reg-username" autoComplete="username" placeholder="Username" onChange={e => setForm({...form, username: e.target.value})} />
          <input name="email" id="reg-email" type="email" autoComplete="email" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} />
          <input name="password" id="reg-password" type="password" autoComplete="new-password" placeholder="Password" onChange={e => setForm({...form, password: e.target.value})} />
          <button onClick={register}>Register</button>
          <p className="link" onClick={() => navigateTo("login")}>Have account? Login</p>
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

      {page === "verify-register" && (
        <div className="card">
          <h2>Verify Account</h2>
          {msg && <p className="msg">{msg}</p>}
          <p>OTP sent to: {form.email}</p>
          <input name="otp" id="verify-register-otp" autoComplete="one-time-code" placeholder="Enter OTP Code" onChange={e => setOtp(e.target.value)} />
          <button onClick={verifyRegister}>Verify Account</button>
        </div>
      )}

      {page === "forgot-password" && (
        <div className="card">
          <h2>Forgot Password</h2>
          {msg && <p className="msg">{msg}</p>}
          <input name="email" id="forgot-email" type="email" autoComplete="email" placeholder="Email" onChange={e => setForm({...form, email: e.target.value})} />
          <button onClick={forgotPassword}>Send OTP</button>
          <p className="link" onClick={() => navigateTo("login")}>Back to Login</p>
        </div>
      )}

      {page === "verify-forgot" && (
        <div className="card">
          <h2>Reset Password</h2>
          {msg && <p className="msg">{msg}</p>}
          <p>OTP sent to: {form.email}</p>
          <input name="otp" id="verify-forgot-otp" autoComplete="one-time-code" placeholder="Enter OTP Code" onChange={e => setOtp(e.target.value)} />
          <input name="password" id="new-password" type="password" autoComplete="new-password" placeholder="New Password" onChange={e => setForm({...form, password: e.target.value})} />
          <button onClick={verifyForgotOtp}>Reset Password</button>
          <p className="link" onClick={() => navigateTo("forgot-password")}>Back</p>
        </div>
      )}

    </div>
  )
}

export default App