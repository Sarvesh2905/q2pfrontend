import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthNavbar from "../../components/AuthNavbar/AuthNavbar";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    site: "",
  });
  const [sites, setSites] = useState([]);
  const [showPassword, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user, login } = useAuth();

  // Already logged in → push to dashboard (can't come back to login)
  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    api
      .get("/auth/sites")
      .then((res) => setSites(res.data))
      .catch(() => setSites([{ site_name: "Coimbatore" }]));
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.site) {
      setError("All fields are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", formData);
      login(res.data.token, {
        username: res.data.username,
        role: res.data.role,
        First_name: res.data.First_name,
        Last_name: res.data.Last_name,
        site: res.data.site,
      });
      // replace:true → browser back button won't return to login
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <AuthNavbar />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header-icon">
            <i className="bi bi-person-circle"></i>
          </div>
          <h2 className="login-title">Login</h2>
          <p className="login-subtitle">Q2P System — Production</p>

          {error && (
            <div className="alert alert-danger py-2 text-center" role="alert">
              <i className="bi bi-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Username */}
            <div className="mb-3">
              <label className="q2p-label">Username</label>
              <input
                type="text"
                className="form-control q2p-input"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="q2p-label">Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control q2p-input"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="btn eye-btn"
                  onClick={() => setShowPwd((p) => !p)}
                  tabIndex={-1}
                >
                  <i
                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                  ></i>
                </button>
              </div>
            </div>

            {/* Site */}
            <div className="mb-4">
              <label className="q2p-label">Site</label>
              <select
                className="form-select q2p-input"
                name="site"
                value={formData.site}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Site --</option>
                {sites.map((s, i) => (
                  <option key={i} value={s.site_name}>
                    {s.site_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn q2p-btn-primary flex-fill"
                disabled={loading}
              >
                {loading ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                ) : (
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                )}
                Login
              </button>
              <Link
                to="/create-account"
                className="btn q2p-btn-outline flex-fill"
              >
                <i className="bi bi-person-plus me-1"></i> Create Account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
