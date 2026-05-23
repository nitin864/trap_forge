import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://43.205.138.66:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      // Success - redirect to login
      alert("Registration successful! Please login.");
      navigate("/login");

    } catch (err) {
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#0a0a0a",
      color: "#fff"
    }}>
      <form onSubmit={handleSubmit} style={{ width: 350 }}>
        <h2>TrapForge Register</h2>
        
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
        
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{ width: "100%", margin: "10px 0", padding: "10px" }}
        />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button 
          type="submit" 
          disabled={loading}
          style={{ width: "100%", padding: "10px", marginTop: "10px" }}
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p style={{ marginTop: 15 }}>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
}