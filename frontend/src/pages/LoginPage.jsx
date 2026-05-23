import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) navigate("/dashboard", { replace: true });
}, [navigate]);  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://43.205.138.66:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      navigate(from);

    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#0a0a0a", color: "#fff" }}>
      <form onSubmit={handleSubmit} style={{ width: 350 }}>
        <h2>TrapForge Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", margin: "10px 0", padding: "10px" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", margin: "10px 0", padding: "10px" }}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" style={{ width: "100%", padding: "10px" }}>
          Login
        </button>

        <p style={{ marginTop: 10 }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}