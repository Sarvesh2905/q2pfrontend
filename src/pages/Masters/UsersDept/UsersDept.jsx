import React, { useEffect, useMemo, useState } from 'react';
import DashboardNavbar from '../../../components/DashboardNavbar/DashboardNavbar';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './UsersDept.css';

const PAGE_SIZE = 50;

const UsersDept = () => {
  const { user } = useAuth();
  const role = user?.role || 'View-only';
  const canModify = role === 'Manager' || role === 'Admin';

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);

  const [form, setForm] = useState({
    dept_user_id: '',
    Username: '',
    Email: ''
  });

  const [message, setMessage] = useState({ text: '', type: '' });

  // Show message and auto-clear after 5 seconds
  const showMessage = (text, type) => {
    setMessage({ text, type });
    if (text) {
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
    }
  };

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get('/dept-users', {
        params: { page: 1, pageSize: 10000 }
      });
      setRows(res.data.data || []);
    } catch (err) {
      showMessage('Failed to load department users', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  // Filter across all fields
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      String(r.dept_user_id || '').toLowerCase().includes(q) ||
      String(r.Username || '').toLowerCase().includes(q) ||
      String(r.Email || '').toLowerCase().includes(q) ||
      String(r.status || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const resetForm = () => {
    setForm({ dept_user_id: '', Username: '', Email: '' });
    setSelected(null);
    setIsAddMode(false);
    setShowForm(false);
    setMessage({ text: '', type: '' });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setForm({ dept_user_id: '', Username: '', Email: '' });
    setSelected(null);
    setIsAddMode(true);
    setShowForm(true);
    setMessage({ text: '', type: '' });
  };

  const handleRowDoubleClick = (row) => {
    if (!canModify) return;
    if (row.status !== 'Active') {
      showMessage(
        `The user ${row.dept_user_id} is Inactive and cannot be edited.`,
        'warning'
      );
      return;
    }
    setSelected(row);
    setForm({
      dept_user_id: row.dept_user_id,
      Username: row.Username || '',
      Email: row.Email || ''
    });
    setIsAddMode(false);
    setShowForm(true);
    setMessage({ text: '', type: '' });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { dept_user_id, Username, Email } = form;

    if (!dept_user_id || !Username || !Email) {
      showMessage(
        'Application Engineer ID, Name and Email are mandatory.',
        'danger'
      );
      return;
    }

    try {
      if (isAddMode) {
        await api.post('/dept-users', {
          dept_user_id,
          Username,
          Email
        });
        showMessage('Added successfully.', 'success');
        setForm({ dept_user_id: '', Username: '', Email: '' });
      } else if (selected) {
        // Only Email will actually be changed in edit mode (Username locked in UI)
        await api.put(`/dept-users/${selected.Sno}`, {
          Username,
          Email
        });
        showMessage('Updated successfully.', 'success');
        setShowForm(false);
        setSelected(null);
      }
      await fetchRows();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      showMessage(msg, 'danger');
    }
  };

  const handleToggleStatus = async (row) => {
    if (!canModify) return;
    try {
      const res = await api.patch(`/dept-users/${row.Sno}/status`);
      const newStatus = res.data.status;
      setRows(prev =>
        prev.map(r => (r.Sno === row.Sno ? { ...r, status: newStatus } : r))
      );
      showMessage(
        `Status changed to ${newStatus} for ${row.dept_user_id}.`,
        'success'
      );
      if (selected && selected.Sno === row.Sno && newStatus !== 'Active') {
        setShowForm(false);
        setSelected(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change status';
      showMessage(msg, 'danger');
    }
  };

  return (
    <div className="usersdept-page">
      <DashboardNavbar />

      <div className="usersdept-body">
        {/* Breadcrumb */}
        <div className="ud-breadcrumb">
          <span onClick={() => window.history.back()} className="ud-crumb-link">
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="ud-crumb-sep">/</span>
          <span className="ud-crumb-active">Users Dept</span>
        </div>

        {/* Header */}
        <div className="ud-header">
          <div className="ud-header-left">
            <h3 className="ud-title">Department Users</h3>
            <p className="ud-subtitle">
              Manage Application Engineers for departments
            </p>
          </div>
          <div className="ud-header-right">
            <span className="ud-role-pill">Role: {role}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="ud-toolbar">
          <div className="input-group ud-search">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by ID, Name, Email, Status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setSearch('')}
                title="Clear filter"
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>

          {canModify && (
            <button
              className="btn q2p-btn-primary"
              type="button"
              onClick={handleOpenAdd}
            >
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 ud-alert`}>
            {message.type === 'success' && (
              <i className="bi bi-check-circle me-2"></i>
            )}
            {message.type === 'danger' && (
              <i className="bi bi-exclamation-triangle me-2"></i>
            )}
            {message.type === 'warning' && (
              <i className="bi bi-info-circle me-2"></i>
            )}
            {message.text}
          </div>
        )}

        {/* Main layout */}
        <div className={`ud-main ${showForm ? 'ud-split' : ''}`}>
          {/* Table side */}
          <div className="ud-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="ud-records">Records: {filtered.length}</span>
              <span className="ud-page-info">Page {page} of {totalPages}</span>
            </div>

            <div className="table-responsive ud-table-container">
              <table className="table table-sm table-hover align-middle ud-table">
                <thead>
                  <tr>
                    <th style={{ width: '8%' }}>Sno</th>
                    <th style={{ width: '20%' }}>Application Engineer ID</th>
                    <th style={{ width: '30%' }}>Application Engineer Name</th>
                    <th style={{ width: '27%' }}>Email</th>
                    <th style={{ width: '15%' }} className="text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4">
                        <div
                          className="spinner-border spinner-border-sm me-2"
                          style={{ color: '#8B0000' }}
                        ></div>
                        Loading...
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-3 text-muted">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((r, index) => (
                      <tr
                        key={r.Sno}
                        onDoubleClick={() => handleRowDoubleClick(r)}
                        className={
                          selected && selected.Sno === r.Sno
                            ? 'ud-row-selected'
                            : ''
                        }
                      >
                        {/* Display serial based on position */}
                        <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                        <td>{r.dept_user_id}</td>
                        <td>{r.Username}</td>
                        <td>{r.Email}</td>
                        <td className="text-center">
                          {canModify ? (
                            <div
                              className={`ud-toggle ${
                                r.status === 'Active'
                                  ? 'ud-toggle-on'
                                  : 'ud-toggle-off'
                              }`}
                              onClick={() => handleToggleStatus(r)}
                              title={`Click to set ${
                                r.status === 'Active' ? 'Inactive' : 'Active'
                              }`}
                            >
                              <div className="ud-toggle-thumb"></div>
                              <span className="ud-toggle-label">
                                {r.status}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`badge ${
                                r.status === 'Active'
                                  ? 'bg-success'
                                  : 'bg-secondary'
                              }`}
                            >
                              {r.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <i className="bi bi-chevron-left"></i> Prev
              </button>
              <div className="small text-muted">
                Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                –
                {Math.min(page * PAGE_SIZE, filtered.length)} of{' '}
                {filtered.length}
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>

          {/* Form side */}
          {showForm && (
            <div className="ud-form-panel">
              <h5 className="ud-form-title">
                <i
                  className={`bi ${
                    isAddMode ? 'bi-person-plus' : 'bi-pencil-square'
                  } me-2`}
                ></i>
                {isAddMode
                  ? 'Add Application Engineer'
                  : 'Edit Application Engineer'}
              </h5>
              <p className="ud-form-subtitle">
                Fields marked <span className="req">*</span> are mandatory
              </p>

              <form onSubmit={handleSubmit} noValidate>
                {/* Application Engineer ID */}
                <div className="mb-3">
                  <label className="form-label">
                    Application Engineer ID <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control q2p-input"
                    name="dept_user_id"
                    value={form.dept_user_id}
                    onChange={handleFormChange}
                    placeholder="Enter Application Engineer ID"
                    disabled={!isAddMode}
                    required
                  />
                  {!isAddMode && (
                    <small className="text-muted">
                      <i className="bi bi-lock-fill me-1"></i>
                      Application Engineer ID cannot be changed.
                    </small>
                  )}
                </div>

                {/* Application Engineer Name */}
                <div className="mb-3">
                  <label className="form-label">
                    Application Engineer Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control q2p-input"
                    name="Username"
                    value={form.Username}
                    onChange={handleFormChange}
                    placeholder="Enter Application Engineer Name"
                    required
                    disabled={!isAddMode}  // ← only editable in Add mode
                  />
                  {!isAddMode && (
                    <small className="text-muted">
                      <i className="bi bi-lock-fill me-1"></i>
                      Application Engineer Name cannot be changed in edit.
                    </small>
                  )}
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="form-label">
                    Email <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control q2p-input"
                    name="Email"
                    value={form.Email}
                    onChange={handleFormChange}
                    placeholder="Enter Email"
                    required
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn q2p-btn-primary flex-fill"
                    disabled={!canModify}
                  >
                    <i className="bi bi-save me-1"></i>
                    {isAddMode ? 'Save' : 'Update'}
                  </button>
                  <button
                    type="button"
                    className="btn q2p-btn-outline flex-fill"
                    onClick={resetForm}
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    Close
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersDept;