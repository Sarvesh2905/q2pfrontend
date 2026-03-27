import React, { useEffect, useMemo, useState } from 'react';
import DashboardNavbar from '../../../components/DashboardNavbar/DashboardNavbar';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './SalesContact.css';

const PAGE_SIZE = 50;

const SalesContact = () => {
  const { user } = useAuth();
  const role = user?.role || 'View-only';
  const canModify = role === 'Manager' || role === 'Admin';

  const [rows,      setRows]      = useState([]);
  const [search,    setSearch]    = useState('');
  const [page,      setPage]      = useState(1);
  const [loading,   setLoading]   = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [showForm,  setShowForm]  = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [message,   setMessage]   = useState({ text: '', type: '' });

  const [form, setForm] = useState({
    sales_contact_name: '',
    email: '',
    mobile: '',
    landline: ''
  });

  // Auto-dismiss message after 5s
  const showMessage = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales-contacts');
      setRows(res.data.data || []);
    } catch {
      showMessage('Failed to load sales contacts', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, []);

  // Dynamic filter across all columns
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      String(r.sales_contact_name || '').toLowerCase().includes(q) ||
      String(r.email    || '').toLowerCase().includes(q) ||
      String(r.mobile   || '').toLowerCase().includes(q) ||
      String(r.landline || '').toLowerCase().includes(q) ||
      String(r.status   || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => { setPage(1); }, [search]);

  const resetForm = () => {
    setForm({ sales_contact_name: '', email: '', mobile: '', landline: '' });
    setSelected(null);
    setIsAddMode(false);
    setShowForm(false);
    setMessage({ text: '', type: '' });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setForm({ sales_contact_name: '', email: '', mobile: '', landline: '' });
    setSelected(null);
    setIsAddMode(true);
    setShowForm(true);
    setMessage({ text: '', type: '' });
  };

  const handleRowDoubleClick = (row) => {
    if (!canModify) return;
    if (row.status !== 'Active') {
      showMessage(
        `Sales Contact "${row.sales_contact_name}" is Inactive and cannot be edited.`,
        'warning'
      );
      return;
    }
    setSelected(row);
    setForm({
      sales_contact_name: row.sales_contact_name || '',
      email:    row.email    || '',
      mobile:   row.mobile   || '',
      landline: row.landline || ''
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
    const { sales_contact_name, email, mobile, landline } = form;

    if (isAddMode && (!sales_contact_name || !email)) {
      showMessage('Name and Email are mandatory.', 'danger');
      return;
    }

    try {
      if (isAddMode) {
        await api.post('/sales-contacts', {
          sales_contact_name,
          email,
          mobile:   mobile   || null,
          landline: landline || null
        });
        showMessage('Added successfully.', 'success');
        setForm({ sales_contact_name: '', email: '', mobile: '', landline: '' });
      } else if (selected) {
        await api.put(`/sales-contacts/${selected.Sno}`, {
          mobile:   mobile   || null,
          landline: landline || null
        });
        showMessage('Updated successfully.', 'success');
        setShowForm(false);
        setSelected(null);
      }
      await fetchRows();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Operation failed', 'danger');
    }
  };

  const handleToggleStatus = async (row) => {
    if (!canModify) return;
    try {
      const res = await api.patch(`/sales-contacts/${row.Sno}/status`);
      const newStatus = res.data.status;
      setRows(prev =>
        prev.map(r => r.Sno === row.Sno ? { ...r, status: newStatus } : r)
      );
      showMessage(
        `Status changed to ${newStatus} for "${row.sales_contact_name}".`,
        'success'
      );
      if (selected && selected.Sno === row.Sno && newStatus !== 'Active') {
        setShowForm(false);
        setSelected(null);
      }
    } catch (err) {
      showMessage(err.response?.data?.message || 'Failed to change status', 'danger');
    }
  };

  return (
    <div className="sc-page">
      <DashboardNavbar />

      <div className="sc-body">
        {/* Breadcrumb */}
        <div className="sc-breadcrumb">
          <span onClick={() => window.history.back()} className="sc-crumb-link">
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="sc-crumb-sep">/</span>
          <span className="sc-crumb-active">Sales Contact</span>
        </div>

        {/* Header */}
        <div className="sc-header">
          <div>
            <h3 className="sc-title">Sales Contact</h3>
            <p className="sc-subtitle">Manage sales contact details</p>
          </div>
          <span className="sc-role-pill">Role: {role}</span>
        </div>

        {/* Toolbar */}
        <div className="sc-toolbar">
          <div className="input-group sc-search">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Name, Email, Mobile, Landline, Status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setSearch('')}
                title="Clear"
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
          {canModify && (
            <button
              className="btn sc-btn-primary"
              type="button"
              onClick={handleOpenAdd}
            >
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 sc-alert`}>
            {message.type === 'success' && <i className="bi bi-check-circle me-2"></i>}
            {message.type === 'danger'  && <i className="bi bi-exclamation-triangle me-2"></i>}
            {message.type === 'warning' && <i className="bi bi-info-circle me-2"></i>}
            {message.text}
          </div>
        )}

        {/* Main layout */}
        <div className={`sc-main ${showForm ? 'sc-split' : ''}`}>

          {/* Table */}
          <div className="sc-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="sc-records">Records: {filtered.length}</span>
              <span className="sc-page-info">Page {page} of {totalPages}</span>
            </div>

            <div className="table-responsive sc-table-container">
              <table className="table table-sm table-hover align-middle sc-table">
                <thead>
                  <tr>
                    <th style={{ width: '6%'  }}>Sno</th>
                    <th style={{ width: '22%' }}>Name</th>
                    <th style={{ width: '26%' }}>Email</th>
                    <th style={{ width: '16%' }}>Mobile</th>
                    <th style={{ width: '16%' }}>Landline</th>
                    <th style={{ width: '14%' }} className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        <div className="spinner-border spinner-border-sm me-2" style={{ color: '#8B0000' }}></div>
                        Loading...
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-3 text-muted">No records found</td>
                    </tr>
                  ) : (
                    pageRows.map((r, index) => (
                      <tr
                        key={r.Sno}
                        onDoubleClick={() => handleRowDoubleClick(r)}
                        className={selected && selected.Sno === r.Sno ? 'sc-row-selected' : ''}
                      >
                        <td>{(page - 1) * PAGE_SIZE + index + 1}</td>
                        <td>{r.sales_contact_name}</td>
                        <td>{r.email}</td>
                        <td>{r.mobile   || '—'}</td>
                        <td>{r.landline || '—'}</td>
                        <td className="text-center">
                          {canModify ? (
                            <div
                              className={`sc-toggle ${r.status === 'Active' ? 'sc-toggle-on' : 'sc-toggle-off'}`}
                              onClick={() => handleToggleStatus(r)}
                              title={`Click to set ${r.status === 'Active' ? 'Inactive' : 'Active'}`}
                            >
                              <div className="sc-toggle-thumb"></div>
                              <span className="sc-toggle-label">{r.status}</span>
                            </div>
                          ) : (
                            <span className={`badge ${r.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
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
                –{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
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

          {/* Form Panel */}
          {showForm && (
            <div className="sc-form-panel">
              <h5 className="sc-form-title">
                <i className={`bi ${isAddMode ? 'bi-person-plus' : 'bi-pencil-square'} me-2`}></i>
                {isAddMode ? 'Add Sales Contact' : 'Edit Sales Contact'}
              </h5>
              <p className="sc-form-subtitle">
                Fields marked <span className="req">*</span> are mandatory
              </p>

              <form onSubmit={handleSubmit} noValidate>

                {/* Name */}
                <div className="mb-3">
                  <label className="form-label">
                    Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control sc-input"
                    name="sales_contact_name"
                    value={form.sales_contact_name}
                    onChange={handleFormChange}
                    placeholder="Enter Sales Contact Name"
                    disabled={!isAddMode}
                    required={isAddMode}
                  />
                  {!isAddMode && (
                    <small className="text-muted">
                      <i className="bi bi-lock-fill me-1"></i>Name cannot be changed.
                    </small>
                  )}
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className="form-label">
                    Email <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control sc-input"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="Enter Email"
                    disabled={!isAddMode}
                    required={isAddMode}
                  />
                  {!isAddMode && (
                    <small className="text-muted">
                      <i className="bi bi-lock-fill me-1"></i>Email cannot be changed.
                    </small>
                  )}
                </div>

                {/* Mobile */}
                <div className="mb-3">
                  <label className="form-label">Mobile</label>
                  <input
                    type="text"
                    className="form-control sc-input"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleFormChange}
                    placeholder="Enter Mobile (optional)"
                    maxLength={10}
                  />
                </div>

                {/* Landline */}
                <div className="mb-4">
                  <label className="form-label">Landline</label>
                  <input
                    type="text"
                    className="form-control sc-input"
                    name="landline"
                    value={form.landline}
                    onChange={handleFormChange}
                    placeholder="Enter Landline (optional)"
                    maxLength={15}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn sc-btn-primary flex-fill"
                    disabled={!canModify}
                  >
                    <i className="bi bi-save me-1"></i>
                    {isAddMode ? 'Save' : 'Update'}
                  </button>
                  <button
                    type="button"
                    className="btn sc-btn-outline flex-fill"
                    onClick={resetForm}
                  >
                    <i className="bi bi-x-lg me-1"></i>Close
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

export default SalesContact;