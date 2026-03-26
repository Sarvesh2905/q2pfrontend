import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthNavbar from "../../components/AuthNavbar/AuthNavbar";
import api from "../../services/api";
import "./CreateAccount.css";

const CreateAccount = () => {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);

  // Step flags
  const [otpSent, setOtpSent] = useState(false);
  const [verifyLocked, setVerifyLocked] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  // Field values
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [site, setSite] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("");

  // Eye toggles
  const [showPwd, setShowPwd] = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);

  // Messages
  const [emailMsg, setEmailMsg] = useState({ text: "", type: "" });
  const [otpMsg, setOtpMsg] = useState({ text: "", type: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const locked = !otpVerified;

  useEffect(() => {
    api
      .get("/auth/sites")
      .then((res) => setSites(res.data))
      .catch(() => setSites([{ site_name: "Coimbatore" }]));
  }, []);

  // Step 1 — Verify email exists + send OTP
  const handleVerifyEmail = async () => {
    if (!username) {
      setEmailMsg({ text: "Please enter your email", type: "danger" });
      return;
    }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(username)) {
      setEmailMsg({ text: "Enter a valid email address", type: "danger" });
      return;
    }
    setVerifyLocked(true);
    setEmailMsg({ text: "", type: "" });
    try {
      const check = await api.post("/auth/check-email", { email: username });
      if (check.data.exists) {
        setEmailMsg({
          text: "User already exists. Please login.",
          type: "danger",
        });
        setVerifyLocked(false);
        return;
      }
      const send = await api.post("/auth/send-otp", { email: username });
      if (send.data.success) {
        setOtpSent(true);
        setEmailMsg({ text: `OTP sent to ${username}`, type: "success" });
      } else {
        setEmailMsg({ text: "Failed to send OTP. Try again.", type: "danger" });
        setVerifyLocked(false);
      }
    } catch {
      setEmailMsg({ text: "Server error. Try again.", type: "danger" });
      setVerifyLocked(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setOtpMsg({ text: "Enter the 6-digit OTP", type: "danger" });
      return;
    }
    try {
      const res = await api.post("/auth/verify-otp", { email: username, otp });
      if (res.data.success) {
        setOtpVerified(true);
        setOtpMsg({ text: "Email verified successfully!", type: "success" });
      } else {
        setOtpMsg({ text: res.data.message || "Invalid OTP", type: "danger" });
      }
    } catch {
      setOtpMsg({ text: "Server error. Try again.", type: "danger" });
    }
  };

  // Step 3 — Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpVerified) {
      setFormError("Please verify your email first.");
      return;
    }
    if (password !== confirmPwd) {
      setFormError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }
    if (!site || !firstName || !lastName || !employeeId || !role) {
      setFormError("All fields are required.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await api.post("/auth/create-account", {
        username,
        password,
        site,
        First_name: firstName,
        Last_name: lastName,
        Employee_ID: employeeId,
        Role: role,
      });
      if (res.data.success) {
        alert("✅ Account created successfully! Please login.");
        navigate("/login");
      }
    } catch (err) {
      setFormError(
        err.response?.data?.message || "Account creation failed. Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ca-wrapper">
      <AuthNavbar />
      <div className="ca-container">
        <div className="ca-card">
          <h2 className="ca-title">Create Account</h2>
          <p className="ca-subtitle">Register to access Q2P System</p>

          {/* Step Tracker */}
          <div className="step-track mb-2">
            <div className={`step-bubble ${username ? "done" : ""}`}>1</div>
            <div className={`step-bar   ${otpSent ? "done" : ""}`}></div>
            <div className={`step-bubble ${otpSent ? "done" : ""}`}>2</div>
            <div className={`step-bar   ${otpVerified ? "done" : ""}`}></div>
            <div className={`step-bubble ${otpVerified ? "done" : ""}`}>
              {otpVerified ? <i className="bi bi-check-lg"></i> : "3"}
            </div>
          </div>
          <div className="step-labels mb-4">
            <span>Enter Email</span>
            <span>Verify OTP</span>
            <span>Fill Details</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* USERNAME */}
            <div className="mb-3">
              <label className="q2p-label">
                Username (Email) <span className="req">*</span>
              </label>
              <div className="input-group">
                <input
                  type="email"
                  className="form-control q2p-input"
                  placeholder="Enter your Email"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setEmailMsg({ text: "", type: "" });
                    if (!otpVerified) {
                      setVerifyLocked(false);
                      setOtpSent(false);
                    }
                  }}
                  disabled={otpVerified}
                  required
                />
                <button
                  type="button"
                  className={`btn ${otpVerified ? "btn-success" : "q2p-btn-primary"}`}
                  onClick={handleVerifyEmail}
                  disabled={verifyLocked || otpVerified}
                >
                  {otpVerified ? (
                    <>
                      <i className="bi bi-check-circle-fill me-1"></i>Verified
                    </>
                  ) : verifyLocked ? (
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                    ></span>
                  ) : (
                    "Verify"
                  )}
                </button>
              </div>
              {emailMsg.text && (
                <small className={`text-${emailMsg.type} d-block mt-1`}>
                  <i
                    className={`bi me-1 ${emailMsg.type === "success" ? "bi-check-circle" : "bi-exclamation-circle"}`}
                  ></i>
                  {emailMsg.text}
                </small>
              )}
            </div>

            {/* OTP FIELD */}
            {otpSent && !otpVerified && (
              <div className="mb-3 otp-box">
                <label className="q2p-label">
                  Enter OTP <span className="req">*</span>
                </label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control q2p-input text-center fw-bold otp-input"
                    placeholder="● ● ● ● ● ●"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setOtpMsg({ text: "", type: "" });
                    }}
                    maxLength={6}
                  />
                  <button
                    type="button"
                    className="btn q2p-btn-primary"
                    onClick={handleVerifyOTP}
                  >
                    Verify OTP
                  </button>
                </div>
                {otpMsg.text && (
                  <small className={`text-${otpMsg.type} d-block mt-1`}>
                    <i
                      className={`bi me-1 ${otpMsg.type === "success" ? "bi-check-circle" : "bi-x-circle"}`}
                    ></i>
                    {otpMsg.text}
                  </small>
                )}
              </div>
            )}

            {otpVerified && (
              <div className="alert alert-success py-2 mb-3 small">
                <i className="bi bi-shield-check me-2"></i>
                Email verified! Fill in your details below.
              </div>
            )}

            {/* PASSWORD */}
            <div className="mb-3">
              <label className="q2p-label">
                Password <span className="req">*</span>
              </label>
              <div className="input-group">
                <input
                  type={showPwd ? "text" : "password"}
                  className="form-control q2p-input"
                  placeholder="Enter your Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={locked}
                  required
                />
                <button
                  type="button"
                  className="btn eye-btn"
                  onClick={() => setShowPwd((p) => !p)}
                  disabled={locked}
                  tabIndex={-1}
                >
                  <i
                    className={`bi ${showPwd ? "bi-eye-slash" : "bi-eye"}`}
                  ></i>
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="mb-3">
              <label className="q2p-label">
                Confirm Password <span className="req">*</span>
              </label>
              <div className="input-group">
                <input
                  type={showCPwd ? "text" : "password"}
                  className="form-control q2p-input"
                  placeholder="Confirm your Password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  disabled={locked}
                  required
                />
                <button
                  type="button"
                  className="btn eye-btn"
                  onClick={() => setShowCPwd((p) => !p)}
                  disabled={locked}
                  tabIndex={-1}
                >
                  <i
                    className={`bi ${showCPwd ? "bi-eye-slash" : "bi-eye"}`}
                  ></i>
                </button>
              </div>
              {password && confirmPwd && password !== confirmPwd && (
                <small className="text-danger d-block mt-1">
                  <i className="bi bi-x-circle me-1"></i>Passwords do not match
                </small>
              )}
            </div>

            {/* SITE */}
            <div className="mb-3">
              <label className="q2p-label">
                Site <span className="req">*</span>
              </label>
              <select
                className="form-select q2p-input"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                disabled={locked}
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

            {/* FIRST NAME */}
            <div className="mb-3">
              <label className="q2p-label">
                First Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-control q2p-input"
                placeholder="Enter your Firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={locked}
                required
              />
            </div>

            {/* LAST NAME */}
            <div className="mb-3">
              <label className="q2p-label">
                Last Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-control q2p-input"
                placeholder="Enter your Lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={locked}
                required
              />
            </div>

            {/* EMPLOYEE ID */}
            <div className="mb-3">
              <label className="q2p-label">
                Employee ID <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-control q2p-input"
                placeholder="Enter your Employee ID (must be unique)"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={locked}
                required
              />
            </div>

            {/* EMAIL — auto filled, read-only */}
            <div className="mb-3">
              <label className="q2p-label">Email</label>
              <input
                type="email"
                className="form-control auto-email"
                value={username}
                readOnly
                tabIndex={-1}
              />
              <small className="text-muted">Auto-filled from Username</small>
            </div>

            {/* ROLE */}
            <div className="mb-4">
              <label className="q2p-label">
                Role <span className="req">*</span>
              </label>
              <select
                className="form-select q2p-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={locked}
                required
              >
                <option value="">-- Select Role --</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="Employee">Employee</option>
                <option value="View-only">View-only</option>
              </select>
            </div>

            {formError && (
              <div className="alert alert-danger py-2 mb-3 small">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {formError}
              </div>
            )}

            {/* SUBMIT BUTTONS */}
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn q2p-btn-primary flex-fill"
                disabled={!otpVerified || submitting}
              >
                {submitting ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                ) : (
                  <i className="bi bi-person-check me-1"></i>
                )}
                Create Account
              </button>
              <button
                type="button"
                className="btn q2p-btn-outline flex-fill"
                onClick={() => navigate("/login")}
              >
                <i className="bi bi-arrow-left me-1"></i> Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
