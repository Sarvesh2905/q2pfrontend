import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../../../components/DashboardNavbar/DashboardNavbar";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./AddEnquiry.css";

/* ── helpers ── */
const today = () => new Date().toISOString().split("T")[0];

// ✅ FIX 4: Pure client-side working-days calculation — always dynamically fresh
const addWorkingDays = (startDate, days) => {
  const result = new Date(startDate);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result.toISOString().split("T")[0];
};

const getProposedDueDate = () => addWorkingDays(new Date(), 2);

const EMPTY = {
  customer_name: "",
  customer_type: "",
  customer_country: "",
  buyer_name: "",
  group_name: "",
  currency: "",
  end_user_name: "",
  end_country: "",
  end_industry: "",
  end_industry_desc: "",
  receipt_date: "",
  ae_name: "",
  sales_contact: "",
  opportunity_type: "",
  rfq_category: "",
  rfq_reference: "",
  comments: "",
  facing_factory: "",
  products: [],
  project_name: "",
  customer_due_date: "",
  proposed_due_date: getProposedDueDate(), // ✅ FIX 4: Always today+2 working days
  lines_in_rfq: "",
  win_probability: "",
  opportunity_stage: "",
  expected_order_date: "",
  eff_enq_date: "",
  priority: "",
};

/* ─────────────────────────────────────────────────────
   ProductImageCard
───────────────────────────────────────────────────── */
const BASE_URL = (() => {
  const base = api.defaults.baseURL || "http://localhost:5001/api";
  return base.replace(/\/api\/?$/, "");
})();

function ProductImageCard({ pName, imageFile }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [imageFile]);

  const imgSrc = imageFile ? `${BASE_URL}/static/images/${imageFile}` : null;

  return (
    <div className="aeq-img-card">
      {imgSrc && !failed ? (
        <img
          src={imgSrc}
          alt={pName}
          width={80}
          height={80}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="aeq-img-fallback" title={pName}>
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
      )}
      <span className="aeq-img-label">{pName}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────── */
export default function AddEnquiry() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);

  const [sec1Done, setSec1Done] = useState(false);
  const [sec2Done, setSec2Done] = useState(false);
  const [sec3Done, setSec3Done] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [endCountries, setEndCountries] = useState([]);
  const [endIndustries, setEndIndustries] = useState([]);
  const [aeList, setAeList] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [oppTypes, setOppTypes] = useState([]);
  const [rfqCats, setRfqCats] = useState([]);
  const [factories, setFactories] = useState([]);
  const [productList, setProductList] = useState([]);
  const [oppStages, setOppStages] = useState([]);

  const [showNewOppType, setShowNewOppType] = useState(false);
  const [newOppType, setNewOppType] = useState("");
  const [showNewFactory, setShowNewFactory] = useState(false);
  const [newFactory, setNewFactory] = useState("");

  const [productImages, setProductImages] = useState({});
  const [commentsEnabled, setCommentsEnabled] = useState(false);
  const [effEnqEnabled, setEffEnqEnabled] = useState(false);

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: "", type: "" }), 6000);
  };

  /* ── Initial Fetches ── */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [c, ec, ei, ae, sc, ot, rc, ff, os] = await Promise.all([
          api.get("/enquiry/customers"),
          api.get("/enquiry/end-countries"),
          api.get("/enquiry/end-industries"),
          api.get("/enquiry/app-engineers"),
          api.get("/enquiry/sales-contacts"),
          api.get("/enquiry/opportunity-types"),
          api.get("/enquiry/rfq-categories"),
          api.get("/enquiry/facing-factories"),
          api.get("/enquiry/opportunity-stages"),
        ]);
        setCustomers(c.data.data || []);
        setEndCountries(ec.data.data || []);
        setEndIndustries(ei.data.data || []);
        setAeList(ae.data.data || []);
        setSalesList(sc.data.data || []);
        setOppTypes(ot.data.data || []);
        setRfqCats(rc.data.data || []);
        setFactories(ff.data.data || []);
        setOppStages(os.data.data || []);
      } catch {
        showMsg("Failed to load form data", "danger");
      }
    };
    fetchAll();
  }, []);

  // ✅ FIX 5: Auto-default opportunity_stage to "Yet To Quote" once stages load
  useEffect(() => {
    if (oppStages.length && !form.opportunity_stage) {
      const yetToQuote = oppStages.find(
        (s) => s.toLowerCase() === "yet to quote",
      );
      if (yetToQuote) {
        setForm((prev) => ({ ...prev, opportunity_stage: yetToQuote }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oppStages]);

  /* ── Field Change ── */
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  /* ── Customer selected → auto-fill ── */
  const handleCustomerChange = async (name) => {
    handleChange("customer_name", name);
    handleChange("customer_type", "");
    handleChange("customer_country", "");
    handleChange("currency", "");
    handleChange("buyer_name", "");
    setBuyers([]);
    if (!name) return;
    try {
      const [info, bRes] = await Promise.all([
        api.get("/enquiry/customer-info", { params: { customer_name: name } }),
        api.get("/enquiry/buyers", { params: { customer: name } }),
      ]);
      const d = info.data.data;
      setForm((prev) => ({
        ...prev,
        customer_name: name,
        customer_type: d.customer_type || "",
        customer_country: d.customer_country || "",
        currency: d.Currency || "",
      }));
      setBuyers(bRes.data.data || []);
    } catch {
      showMsg("Failed to fetch customer info", "danger");
    }
  };

  /* ── End Industry → auto-fill desc ── */
  const handleEndIndustryChange = (industry) => {
    handleChange("end_industry", industry);
    const found = endIndustries.find(
      (e) => e.Industry.toLowerCase() === industry.toLowerCase(),
    );
    handleChange("end_industry_desc", found?.Description || "");
  };

  /* ── Receipt Date → check working days ── */
  const handleReceiptDateChange = async (date) => {
    handleChange("receipt_date", date);
    if (!date) {
      setCommentsEnabled(false);
      return;
    }
    try {
      const res = await api.get("/enquiry/check-receipt-date", {
        params: { receipt_date: date },
      });
      setCommentsEnabled(res.data.needsComment);
      if (!res.data.needsComment) handleChange("comments", "");
    } catch {
      setCommentsEnabled(false);
    }
  };

  /* ── Facing Factory → load products ── */
  const handleFactoryChange = async (factory) => {
    handleChange("facing_factory", factory);
    handleChange("products", []);
    setProductImages({});
    if (!factory) {
      setProductList([]);
      return;
    }
    try {
      const res = await api.get("/enquiry/products", {
        params: { facing_factory: factory },
      });
      setProductList(res.data.data || []);
    } catch {
      setProductList([]);
    }
  };

  /* ── Product toggle ── */
  const handleProductToggle = (productName, imageFile, checked) => {
    setForm((prev) => {
      const updated = checked
        ? [...prev.products, productName]
        : prev.products.filter((p) => p !== productName);
      return { ...prev, products: updated };
    });
    if (checked && imageFile) {
      setProductImages((prev) => ({ ...prev, [productName]: imageFile }));
    } else {
      setProductImages((prev) => {
        const copy = { ...prev };
        delete copy[productName];
        return copy;
      });
    }
  };

  /* ── Add Opportunity Type ── */
  const handleAddOppType = async () => {
    if (!newOppType.trim()) return;
    try {
      const res = await api.post("/enquiry/opportunity-types", {
        value: newOppType,
      });
      setOppTypes((prev) => [...prev, res.data.data]);
      handleChange("opportunity_type", res.data.data);
      setNewOppType("");
      setShowNewOppType(false);
    } catch (err) {
      showMsg(err.response?.data?.message || "Failed to add", "danger");
    }
  };

  /* ── Add Facing Factory ── */
  const handleAddFactory = async () => {
    if (!newFactory.trim()) return;
    try {
      const res = await api.post("/enquiry/facing-factories", {
        value: newFactory,
      });
      setFactories((prev) => [...prev, res.data.data]);
      handleFactoryChange(res.data.data);
      setNewFactory("");
      setShowNewFactory(false);
    } catch (err) {
      showMsg(err.response?.data?.message || "Failed to add", "danger");
    }
  };

  /* ── Validators ── */
  const validateSection1 = () => {
    const e = {};
    if (!form.customer_name) e.customer_name = "Required";
    if (!form.end_user_name) e.end_user_name = "Required";
    if (!form.end_country) e.end_country = "Required";
    if (!form.end_industry) e.end_industry = "Required";
    setErrors((prev) => ({ ...prev, ...e }));
    return Object.keys(e).length === 0;
  };

  const validateSection2 = () => {
    const e = {};
    if (!form.receipt_date) e.receipt_date = "Required";
    if (!form.ae_name) e.ae_name = "Required";
    if (!form.sales_contact) e.sales_contact = "Required";
    if (!form.opportunity_type) e.opportunity_type = "Required";
    if (!form.rfq_category) e.rfq_category = "Required";
    if (!form.rfq_reference) e.rfq_reference = "Required";
    if (commentsEnabled && !form.comments)
      e.comments = "Required — Receipt date is beyond 4 working days";
    setErrors((prev) => ({ ...prev, ...e }));
    return Object.keys(e).length === 0;
  };

  const validateSection3 = () => {
    const e = {};
    if (!form.facing_factory) e.facing_factory = "Required";
    if (!form.products.length) e.products = "Select at least one product";
    if (!form.project_name) e.project_name = "Required";
    if (!form.customer_due_date) e.customer_due_date = "Required";
    if (!form.proposed_due_date) e.proposed_due_date = "Required";
    if (!form.lines_in_rfq) e.lines_in_rfq = "Required";
    if (
      form.lines_in_rfq &&
      parseInt(form.lines_in_rfq) < form.products.length
    ) {
      e.lines_in_rfq = `Must be ≥ products selected (${form.products.length})`;
    }
    if (!form.win_probability) e.win_probability = "Required";
    setErrors((prev) => ({ ...prev, ...e }));
    return Object.keys(e).length === 0;
  };

  const validateSection4 = () => {
    const e = {};
    if (!form.opportunity_stage) e.opportunity_stage = "Required";
    if (!form.expected_order_date) e.expected_order_date = "Required";
    if (!form.priority) e.priority = "Required";
    setErrors((prev) => ({ ...prev, ...e }));
    return Object.keys(e).length === 0;
  };

  /* ── Section Confirms ── */
  const confirmSection1 = () => {
    if (!validateSection1()) return;
    setSec1Done(true);
    showMsg("Customer section confirmed. Fill RFQ details.", "success");
  };

  const confirmSection2 = () => {
    if (!validateSection2()) return;
    setSec2Done(true);
    showMsg("RFQ section confirmed. Fill Product details.", "success");
  };

  const confirmSection3 = () => {
    if (!validateSection3()) return;
    setSec3Done(true);
    showMsg("Product section confirmed. Fill Quote details.", "success");
  };

  /* ── Legacy check ── */
  const isLegacy = useCallback(() => {
    if (!form.products.length) return false;
    return form.products.some((pName) => {
      const found = productList.find((p) => p.Products === pName);
      return found?.Prd_group?.toLowerCase() === "legacy";
    });
  }, [form.products, productList]);

  /* ── Save ── */
  const handleSave = async () => {
    if (!validateSection4()) return;
    setSaving(true);
    try {
      const qnRes = await api.get("/enquiry/generate-quote-no", {
        params: { ae_name: form.ae_name, is_legacy: isLegacy() },
      });
      const quote_number = qnRes.data.data;
      await api.post("/enquiry/create", {
        ...form,
        quote_number,
        register_date: today(),
      });
      showMsg(`Enquiry created! Quote No: ${quote_number}`, "success");
      setTimeout(() => navigate("/enquiry"), 2500);
    } catch (err) {
      showMsg(
        err.response?.data?.message || "Failed to save enquiry",
        "danger",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── Reset ── */
  const handleReset = () => {
    // ✅ FIX 4: Recalculate proposed_due_date fresh on reset
    setForm({ ...EMPTY, proposed_due_date: getProposedDueDate() });
    setErrors({});
    setSec1Done(false);
    setSec2Done(false);
    setSec3Done(false);
    setBuyers([]);
    setProductList([]);
    setProductImages({});
    setCommentsEnabled(false);
    setEffEnqEnabled(false);
    setShowNewOppType(false);
    setShowNewFactory(false);
    setMessage({ text: "", type: "" });
  };

  const effEnqMin = form.receipt_date || today();
  const effEnqMax = today();

  // ✅ FIX 3: Quote number preview helpers
  const legacy = isLegacy();
  const qnPrefix = legacy ? "L" : "R";
  const qnDate = (() => {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}${mm}${dd}`;
  })();
  // ✅ FIX 3: slice(0,2) matches backend (first 2 chars of AE name)
  const qnAe = (form.ae_name || "XX").slice(0, 2).toUpperCase();

  /* ══════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════ */
  return (
    <div className="aeq-page">
      <DashboardNavbar />
      <div className="aeq-body">
        {/* Breadcrumb */}
        <div className="aeq-breadcrumb">
          <span
            className="aeq-crumb-link"
            onClick={() => navigate("/dashboard")}
          >
            <i className="bi bi-house-fill me-1"></i>Dashboard
          </span>
          <span className="aeq-crumb-sep">/</span>
          <span className="aeq-crumb-link" onClick={() => navigate("/enquiry")}>
            Enquiry
          </span>
          <span className="aeq-crumb-sep">/</span>
          <span className="aeq-crumb-active">Add Enquiry</span>
        </div>

        {/* Header */}
        <div className="aeq-header">
          <div>
            <h3 className="aeq-title">
              <i className="bi bi-plus-circle-fill me-2"></i>Create Enquiry
            </h3>
            <p className="aeq-subtitle">
              Complete all 4 sections sequentially to register a new RFQ enquiry
            </p>
          </div>
          <button className="btn aeq-btn-outline" onClick={handleReset}>
            <i className="bi bi-arrow-counterclockwise me-1"></i>Reset
          </button>
        </div>

        {/* Progress Bar */}
        <div className="aeq-progress-bar">
          {["Customer", "RFQ", "Product", "Quote"].map((label, i) => {
            const done = [sec1Done, sec2Done, sec3Done, true][i];
            const active = [true, sec1Done, sec2Done, sec3Done][i];
            return (
              <React.Fragment key={label}>
                <div
                  className={`aeq-step ${
                    done ? "step-done" : active ? "step-active" : "step-locked"
                  }`}
                >
                  <div className="aeq-step-circle">
                    {done ? <i className="bi bi-check-lg"></i> : i + 1}
                  </div>
                  <span className="aeq-step-label">{label}</span>
                </div>
                {i < 3 && (
                  <div
                    className={`aeq-step-line ${
                      [sec1Done, sec2Done, sec3Done][i] ? "line-done" : ""
                    }`}
                  ></div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Alert */}
        {message.text && (
          <div className={`alert alert-${message.type} aeq-alert`}>
            <i
              className={`bi ${
                message.type === "success"
                  ? "bi-check-circle"
                  : "bi-exclamation-triangle"
              } me-2`}
            ></i>
            {message.text}
          </div>
        )}

        {/* ✅ FIX 1: 2×2 grid — Customer | RFQ on top, Product | Quote on bottom */}
        <div className="aeq-sections-grid">
          {/* ═══════════════════════════════
              SECTION 1 — CUSTOMER
          ═══════════════════════════════ */}
          <div
            className={`aeq-section ${
              sec1Done ? "section-done" : "section-active"
            }`}
          >
            <div className="aeq-section-header">
              <div className="aeq-section-num">1</div>
              <h5 className="aeq-section-title">Customer</h5>
              {sec1Done && (
                <span className="aeq-done-badge">
                  <i className="bi bi-check-circle-fill me-1"></i>Confirmed
                </span>
              )}
              {sec1Done && (
                <button
                  className="btn btn-sm aeq-btn-edit ms-auto"
                  onClick={() => setSec1Done(false)}
                >
                  <i className="bi bi-pencil me-1"></i>Edit
                </button>
              )}
            </div>

            <div className="aeq-fields-grid">
              {/* Customer Name */}
              <div className="aeq-field">
                <label>
                  Customer Name <span className="req">*</span>
                </label>
                <select
                  className={`form-select aeq-input ${errors.customer_name ? "is-invalid" : ""}`}
                  value={form.customer_name}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  disabled={sec1Done}
                >
                  <option value="">-- Select Customer --</option>
                  {customers.map((c) => (
                    <option key={c.customer_name} value={c.customer_name}>
                      {c.customer_name} {c.Location ? `(${c.Location})` : ""}
                    </option>
                  ))}
                </select>
                {errors.customer_name && (
                  <div className="aeq-error">{errors.customer_name}</div>
                )}
              </div>

              {/* Category */}
              <div className="aeq-field">
                <label>Category</label>
                <input
                  type="text"
                  className="form-control aeq-input aeq-readonly"
                  value={form.customer_type}
                  readOnly
                  placeholder="Auto-filled from customer"
                />
              </div>

              {/* Country */}
              <div className="aeq-field">
                <label>Country</label>
                <input
                  type="text"
                  className="form-control aeq-input aeq-readonly"
                  value={form.customer_country}
                  readOnly
                  placeholder="Auto-filled from customer"
                />
              </div>

              {/* Buyer Name */}
              <div className="aeq-field">
                <label>Buyer Name</label>
                <select
                  className="form-select aeq-input"
                  value={form.buyer_name}
                  onChange={(e) => handleChange("buyer_name", e.target.value)}
                  disabled={sec1Done || !form.customer_name}
                >
                  <option value="">-- Select Buyer --</option>
                  {buyers.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ FIX 2: Group — dropdown with DOMESTIC / EXPORT */}
              <div className="aeq-field">
                <label>Group</label>
                <select
                  className="form-select aeq-input"
                  value={form.group_name}
                  onChange={(e) => handleChange("group_name", e.target.value)}
                  disabled={sec1Done}
                >
                  <option value="">-- Select Group --</option>
                  <option value="DOMESTIC">DOMESTIC (India)</option>
                  <option value="EXPORT">EXPORT</option>
                </select>
              </div>

              {/* Currency */}
              <div className="aeq-field">
                <label>Currency</label>
                <input
                  type="text"
                  className="form-control aeq-input aeq-readonly"
                  value={form.currency}
                  readOnly
                  placeholder="Auto-filled from customer"
                />
              </div>

              {/* End User Name */}
              <div className="aeq-field">
                <label>
                  End User Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control aeq-input ${errors.end_user_name ? "is-invalid" : ""}`}
                  value={form.end_user_name}
                  onChange={(e) =>
                    handleChange("end_user_name", e.target.value)
                  }
                  placeholder="Enter end user name"
                  disabled={sec1Done}
                />
                {errors.end_user_name && (
                  <div className="aeq-error">{errors.end_user_name}</div>
                )}
              </div>

              {/* End Country */}
              <div className="aeq-field">
                <label>
                  End User Country <span className="req">*</span>
                </label>
                <select
                  className={`form-select aeq-input ${errors.end_country ? "is-invalid" : ""}`}
                  value={form.end_country}
                  onChange={(e) => handleChange("end_country", e.target.value)}
                  disabled={sec1Done}
                >
                  <option value="">-- Select Country --</option>
                  {endCountries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {errors.end_country && (
                  <div className="aeq-error">{errors.end_country}</div>
                )}
              </div>

              {/* End Industry */}
              <div className="aeq-field">
                <label>
                  End Industry <span className="req">*</span>
                </label>
                <select
                  className={`form-select aeq-input ${errors.end_industry ? "is-invalid" : ""}`}
                  value={form.end_industry}
                  onChange={(e) => handleEndIndustryChange(e.target.value)}
                  disabled={sec1Done}
                >
                  <option value="">-- Select Industry --</option>
                  {endIndustries.map((e) => (
                    <option key={e.Industry} value={e.Industry}>
                      {e.Industry}
                    </option>
                  ))}
                </select>
                {errors.end_industry && (
                  <div className="aeq-error">{errors.end_industry}</div>
                )}
              </div>

              {/* Industry Description */}
              <div className="aeq-field aeq-field-full">
                <label>Industry Description</label>
                <input
                  type="text"
                  className="form-control aeq-input aeq-readonly"
                  value={form.end_industry_desc}
                  readOnly
                  placeholder="Auto-filled from End Industry"
                />
              </div>
            </div>

            {!sec1Done && (
              <div className="aeq-section-footer">
                <button
                  className="btn aeq-btn-confirm"
                  onClick={confirmSection1}
                >
                  <i className="bi bi-check-lg me-1"></i>Confirm Customer &amp;
                  Proceed to RFQ
                </button>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════
              SECTION 2 — RFQ
          ═══════════════════════════════ */}
          <div
            className={`aeq-section ${
              !sec1Done
                ? "section-locked"
                : sec2Done
                  ? "section-done"
                  : "section-active"
            }`}
          >
            <div className="aeq-section-header">
              <div
                className={`aeq-section-num ${!sec1Done ? "num-locked" : ""}`}
              >
                2
              </div>
              <h5 className="aeq-section-title">
                RFQ{" "}
                {!sec1Done && (
                  <span className="aeq-lock-hint">
                    <i className="bi bi-lock-fill"></i> Complete Customer first
                  </span>
                )}
              </h5>
              {sec2Done && (
                <span className="aeq-done-badge">
                  <i className="bi bi-check-circle-fill me-1"></i>Confirmed
                </span>
              )}
              {sec2Done && (
                <button
                  className="btn btn-sm aeq-btn-edit ms-auto"
                  onClick={() => {
                    setSec2Done(false);
                    setSec3Done(false);
                  }}
                >
                  <i className="bi bi-pencil me-1"></i>Edit
                </button>
              )}
            </div>

            {sec1Done && (
              <>
                <div className="aeq-fields-grid">
                  {/* Receipt Date */}
                  <div className="aeq-field">
                    <label>
                      Receipt Date <span className="req">*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control aeq-input ${errors.receipt_date ? "is-invalid" : ""}`}
                      value={form.receipt_date}
                      max={today()}
                      onChange={(e) => handleReceiptDateChange(e.target.value)}
                      disabled={sec2Done}
                    />
                    {errors.receipt_date && (
                      <div className="aeq-error">{errors.receipt_date}</div>
                    )}
                  </div>

                  {/* App Engineer */}
                  <div className="aeq-field">
                    <label>
                      Application Engineer <span className="req">*</span>
                    </label>
                    <select
                      className={`form-select aeq-input ${errors.ae_name ? "is-invalid" : ""}`}
                      value={form.ae_name}
                      onChange={(e) => handleChange("ae_name", e.target.value)}
                      disabled={sec2Done}
                    >
                      <option value="">-- Select AE --</option>
                      {aeList.map((ae) => (
                        <option key={ae} value={ae}>
                          {ae}
                        </option>
                      ))}
                    </select>
                    {errors.ae_name && (
                      <div className="aeq-error">{errors.ae_name}</div>
                    )}
                  </div>

                  {/* Sales Contact */}
                  <div className="aeq-field">
                    <label>
                      Sales Contact <span className="req">*</span>
                    </label>
                    <select
                      className={`form-select aeq-input ${errors.sales_contact ? "is-invalid" : ""}`}
                      value={form.sales_contact}
                      onChange={(e) =>
                        handleChange("sales_contact", e.target.value)
                      }
                      disabled={sec2Done}
                    >
                      <option value="">-- Select Sales Contact --</option>
                      {salesList.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {errors.sales_contact && (
                      <div className="aeq-error">{errors.sales_contact}</div>
                    )}
                  </div>

                  {/* Opportunity Type */}
                  <div className="aeq-field">
                    <label>
                      Opportunity Type <span className="req">*</span>
                    </label>
                    <div className="aeq-inline-add">
                      <select
                        className={`form-select aeq-input ${errors.opportunity_type ? "is-invalid" : ""}`}
                        value={form.opportunity_type}
                        onChange={(e) =>
                          handleChange("opportunity_type", e.target.value)
                        }
                        disabled={sec2Done}
                      >
                        <option value="">-- Select Type --</option>
                        {oppTypes.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                      {!sec2Done && (
                        <button
                          type="button"
                          className="btn aeq-btn-add-inline"
                          title="Add new opportunity type"
                          onClick={() => setShowNewOppType((p) => !p)}
                        >
                          <i className="bi bi-plus-lg"></i>
                        </button>
                      )}
                    </div>
                    {errors.opportunity_type && (
                      <div className="aeq-error">{errors.opportunity_type}</div>
                    )}
                    {showNewOppType && !sec2Done && (
                      <div className="aeq-dynamic-add mt-2">
                        <input
                          type="text"
                          className="form-control aeq-input"
                          placeholder="New opportunity type..."
                          value={newOppType}
                          onChange={(e) => setNewOppType(e.target.value)}
                        />
                        <button
                          className="btn aeq-btn-confirm-sm"
                          onClick={handleAddOppType}
                        >
                          Add
                        </button>
                        <button
                          className="btn aeq-btn-cancel-sm"
                          onClick={() => {
                            setShowNewOppType(false);
                            setNewOppType("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* RFQ Category */}
                  <div className="aeq-field">
                    <label>
                      Category <span className="req">*</span>
                    </label>
                    <select
                      className={`form-select aeq-input ${errors.rfq_category ? "is-invalid" : ""}`}
                      value={form.rfq_category}
                      onChange={(e) =>
                        handleChange("rfq_category", e.target.value)
                      }
                      disabled={sec2Done}
                    >
                      <option value="">-- Select Category --</option>
                      {rfqCats.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    {errors.rfq_category && (
                      <div className="aeq-error">{errors.rfq_category}</div>
                    )}
                  </div>

                  {/* RFQ Reference */}
                  <div className="aeq-field">
                    <label>
                      RFQ Reference <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className={`form-control aeq-input ${errors.rfq_reference ? "is-invalid" : ""}`}
                      value={form.rfq_reference}
                      onChange={(e) =>
                        handleChange("rfq_reference", e.target.value)
                      }
                      placeholder="Enter RFQ reference"
                      disabled={sec2Done}
                      maxLength={250}
                    />
                    {errors.rfq_reference && (
                      <div className="aeq-error">{errors.rfq_reference}</div>
                    )}
                  </div>

                  {/* Comments */}
                  <div className="aeq-field aeq-field-full">
                    <label>
                      Register Date Comments
                      {commentsEnabled && <span className="req"> *</span>}
                      {commentsEnabled ? (
                        <span className="aeq-warn-hint ms-2">
                          <i className="bi bi-exclamation-triangle-fill me-1"></i>
                          Receipt date is beyond 4 working days — comment
                          required
                        </span>
                      ) : (
                        <span className="aeq-muted-hint ms-2">
                          Enabled only if receipt date &gt; 4 working days past
                        </span>
                      )}
                    </label>
                    <textarea
                      className={`form-control aeq-input ${errors.comments ? "is-invalid" : ""}`}
                      rows={2}
                      value={form.comments}
                      onChange={(e) => handleChange("comments", e.target.value)}
                      placeholder={
                        commentsEnabled
                          ? "Enter reason for late registration..."
                          : "Your comments here (disabled)"
                      }
                      disabled={!commentsEnabled || sec2Done}
                      maxLength={250}
                    />
                    {errors.comments && (
                      <div className="aeq-error">{errors.comments}</div>
                    )}
                  </div>
                </div>

                {!sec2Done && (
                  <div className="aeq-section-footer">
                    <button
                      className="btn aeq-btn-confirm"
                      onClick={confirmSection2}
                    >
                      <i className="bi bi-check-lg me-1"></i>Confirm RFQ &amp;
                      Proceed to Product
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ═══════════════════════════════
              SECTION 3 — PRODUCT
          ═══════════════════════════════ */}
          <div
            className={`aeq-section ${
              !sec2Done
                ? "section-locked"
                : sec3Done
                  ? "section-done"
                  : "section-active"
            }`}
          >
            <div className="aeq-section-header">
              <div
                className={`aeq-section-num ${!sec2Done ? "num-locked" : ""}`}
              >
                3
              </div>
              <h5 className="aeq-section-title">
                Product{" "}
                {!sec2Done && (
                  <span className="aeq-lock-hint">
                    <i className="bi bi-lock-fill"></i> Complete RFQ first
                  </span>
                )}
              </h5>
              {sec3Done && (
                <span className="aeq-done-badge">
                  <i className="bi bi-check-circle-fill me-1"></i>Confirmed
                </span>
              )}
              {sec3Done && (
                <button
                  className="btn btn-sm aeq-btn-edit ms-auto"
                  onClick={() => setSec3Done(false)}
                >
                  <i className="bi bi-pencil me-1"></i>Edit
                </button>
              )}
            </div>

            {sec2Done && (
              <>
                <div className="aeq-product-layout">
                  {/* Left — Fields */}
                  <div className="aeq-product-fields">
                    <div className="aeq-fields-grid">
                      {/* Facing Factory */}
                      <div className="aeq-field aeq-field-full">
                        <label>
                          Facing Factory <span className="req">*</span>
                        </label>
                        <div className="aeq-inline-add">
                          <select
                            className={`form-select aeq-input ${errors.facing_factory ? "is-invalid" : ""}`}
                            value={form.facing_factory}
                            onChange={(e) =>
                              handleFactoryChange(e.target.value)
                            }
                            disabled={sec3Done}
                          >
                            <option value="">-- Select Factory --</option>
                            {factories.map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                          </select>
                          {!sec3Done && (
                            <button
                              type="button"
                              className="btn aeq-btn-add-inline"
                              title="Add new facing factory"
                              onClick={() => setShowNewFactory((p) => !p)}
                            >
                              <i className="bi bi-plus-lg"></i>
                            </button>
                          )}
                        </div>
                        {errors.facing_factory && (
                          <div className="aeq-error">
                            {errors.facing_factory}
                          </div>
                        )}
                        {showNewFactory && !sec3Done && (
                          <div className="aeq-dynamic-add mt-2">
                            <input
                              type="text"
                              className="form-control aeq-input"
                              placeholder="New facing factory..."
                              value={newFactory}
                              onChange={(e) => setNewFactory(e.target.value)}
                            />
                            <button
                              className="btn aeq-btn-confirm-sm"
                              onClick={handleAddFactory}
                            >
                              Add
                            </button>
                            <button
                              className="btn aeq-btn-cancel-sm"
                              onClick={() => {
                                setShowNewFactory(false);
                                setNewFactory("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Products */}
                      <div className="aeq-field aeq-field-full">
                        <label>
                          Product <span className="req">*</span>
                        </label>
                        {!form.facing_factory ? (
                          <p className="aeq-muted-hint">
                            Select a Facing Factory first
                          </p>
                        ) : productList.length === 0 ? (
                          <p className="aeq-muted-hint">
                            No products found for this factory
                          </p>
                        ) : (
                          <div className="aeq-product-checklist">
                            {productList.map((p) => (
                              <label
                                key={p.Products}
                                className={`aeq-product-check-item ${
                                  form.products.includes(p.Products)
                                    ? "checked"
                                    : ""
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={form.products.includes(p.Products)}
                                  onChange={(e) =>
                                    handleProductToggle(
                                      p.Products,
                                      p.Image,
                                      e.target.checked,
                                    )
                                  }
                                  disabled={sec3Done}
                                />
                                <span className="aeq-product-name">
                                  {p.Products}
                                </span>
                                {p.Prd_group?.toLowerCase() === "legacy" && (
                                  <span className="aeq-legacy-tag">Legacy</span>
                                )}
                              </label>
                            ))}
                          </div>
                        )}
                        {errors.products && (
                          <div className="aeq-error">{errors.products}</div>
                        )}
                      </div>

                      {/* Project Name */}
                      <div className="aeq-field aeq-field-full">
                        <label>
                          Project Name <span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control aeq-input ${errors.project_name ? "is-invalid" : ""}`}
                          value={form.project_name}
                          onChange={(e) =>
                            handleChange("project_name", e.target.value)
                          }
                          placeholder="Enter project name"
                          disabled={sec3Done}
                          maxLength={75}
                        />
                        {errors.project_name && (
                          <div className="aeq-error">{errors.project_name}</div>
                        )}
                      </div>

                      {/* Customer Due Date */}
                      <div className="aeq-field">
                        <label>
                          Customer Due Date <span className="req">*</span>
                        </label>
                        <input
                          type="date"
                          className={`form-control aeq-input ${errors.customer_due_date ? "is-invalid" : ""}`}
                          value={form.customer_due_date}
                          min={today()}
                          onChange={(e) =>
                            handleChange("customer_due_date", e.target.value)
                          }
                          disabled={sec3Done}
                        />
                        {errors.customer_due_date && (
                          <div className="aeq-error">
                            {errors.customer_due_date}
                          </div>
                        )}
                      </div>

                      {/* ✅ FIX 4: Proposed Due Date — always dynamically computed */}
                      <div className="aeq-field">
                        <label>
                          Proposed Due Date <span className="req">*</span>
                        </label>
                        <input
                          type="date"
                          className={`form-control aeq-input ${errors.proposed_due_date ? "is-invalid" : ""}`}
                          value={form.proposed_due_date}
                          min={today()}
                          onChange={(e) =>
                            handleChange("proposed_due_date", e.target.value)
                          }
                          disabled={sec3Done}
                        />
                        <small className="text-muted">
                          Auto-set to today + 2 working days (editable)
                        </small>
                        {errors.proposed_due_date && (
                          <div className="aeq-error">
                            {errors.proposed_due_date}
                          </div>
                        )}
                      </div>

                      {/* Lines in RFQ */}
                      <div className="aeq-field">
                        <label>
                          Lines in RFQ <span className="req">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          className={`form-control aeq-input ${errors.lines_in_rfq ? "is-invalid" : ""}`}
                          value={form.lines_in_rfq}
                          onChange={(e) =>
                            handleChange(
                              "lines_in_rfq",
                              e.target.value.replace(/\D/g, ""),
                            )
                          }
                          placeholder="Number of line items"
                          disabled={sec3Done}
                        />
                        {errors.lines_in_rfq && (
                          <div className="aeq-error">{errors.lines_in_rfq}</div>
                        )}
                      </div>

                      {/* Winning Probability */}
                      <div className="aeq-field">
                        <label>
                          Winning Probability <span className="req">*</span>
                        </label>
                        <select
                          className={`form-select aeq-input ${errors.win_probability ? "is-invalid" : ""}`}
                          value={form.win_probability}
                          onChange={(e) =>
                            handleChange("win_probability", e.target.value)
                          }
                          disabled={sec3Done}
                        >
                          <option value="">-- Select --</option>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                        {errors.win_probability && (
                          <div className="aeq-error">
                            {errors.win_probability}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right — Product Images */}
                  <div className="aeq-product-images">
                    <p className="aeq-img-panel-title">
                      <i className="bi bi-images me-1"></i>Selected Products
                    </p>
                    {form.products.length === 0 ? (
                      <div className="aeq-img-placeholder">
                        <i className="bi bi-box-seam"></i>
                        <p>No products selected</p>
                      </div>
                    ) : (
                      <div className="aeq-img-grid">
                        {form.products.map((pName) => (
                          <ProductImageCard
                            key={pName}
                            pName={pName}
                            imageFile={productImages[pName]}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {!sec3Done && (
                  <div className="aeq-section-footer">
                    <button
                      className="btn aeq-btn-confirm"
                      onClick={confirmSection3}
                    >
                      <i className="bi bi-check-lg me-1"></i>Confirm Product
                      &amp; Proceed to Quote
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ═══════════════════════════════
              SECTION 4 — QUOTE
          ═══════════════════════════════ */}
          <div
            className={`aeq-section ${
              !sec3Done ? "section-locked" : "section-active"
            }`}
          >
            <div className="aeq-section-header">
              <div
                className={`aeq-section-num ${!sec3Done ? "num-locked" : ""}`}
              >
                4
              </div>
              <h5 className="aeq-section-title">
                Quote{" "}
                {!sec3Done && (
                  <span className="aeq-lock-hint">
                    <i className="bi bi-lock-fill"></i> Complete Product first
                  </span>
                )}
              </h5>
            </div>

            {sec3Done && (
              <>
                {/* ✅ FIX 3: Clear Legacy / Regular label in info box */}
                <div
                  className={`aeq-qn-info-box ${legacy ? "aeq-qn-legacy" : "aeq-qn-regular"}`}
                >
                  <i className="bi bi-info-circle-fill me-2"></i>
                  {legacy ? (
                    <>
                      <strong>Legacy</strong> product selected — Quote number
                      will be auto-generated as&nbsp;
                      <strong>
                        {qnPrefix}
                        {qnDate}-XXXX-{qnAe}
                      </strong>
                      &nbsp;upon saving.
                    </>
                  ) : (
                    <>
                      <strong>Regular</strong> product — Quote number will be
                      auto-generated as&nbsp;
                      <strong>
                        {qnPrefix}
                        {qnDate}-XXXX-{qnAe}
                      </strong>
                      &nbsp;upon saving.
                    </>
                  )}
                </div>

                <div className="aeq-fields-grid">
                  {/* Quote No */}
                  <div className="aeq-field">
                    <label>Quote Number</label>
                    <input
                      type="text"
                      className="form-control aeq-input aeq-readonly"
                      value="Auto-generated on Save"
                      readOnly
                    />
                  </div>

                  {/* Register Date */}
                  <div className="aeq-field">
                    <label>Register Date</label>
                    <input
                      type="text"
                      className="form-control aeq-input aeq-readonly"
                      value={today()}
                      readOnly
                    />
                  </div>

                  {/* Stage */}
                  <div className="aeq-field">
                    <label>Stage</label>
                    <input
                      type="text"
                      className="form-control aeq-input aeq-readonly"
                      value="Enquiry"
                      readOnly
                    />
                  </div>

                  {/* Quote Submitted Date */}
                  <div className="aeq-field">
                    <label>Quote Submitted Date</label>
                    <input
                      type="text"
                      className="form-control aeq-input aeq-readonly"
                      value="— (Not applicable at creation)"
                      readOnly
                    />
                  </div>

                  {/* ✅ FIX 5: Opportunity Stage — auto-defaulted to "Yet to Quote" */}
                  <div className="aeq-field">
                    <label>
                      Opportunity Stage <span className="req">*</span>
                    </label>
                    <select
                      className={`form-select aeq-input ${errors.opportunity_stage ? "is-invalid" : ""}`}
                      value={form.opportunity_stage}
                      onChange={(e) =>
                        handleChange("opportunity_stage", e.target.value)
                      }
                    >
                      <option value="">-- Select Stage --</option>
                      {oppStages.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {errors.opportunity_stage && (
                      <div className="aeq-error">
                        {errors.opportunity_stage}
                      </div>
                    )}
                  </div>

                  {/* Revision */}
                  <div className="aeq-field">
                    <label>Revision</label>
                    <input
                      type="text"
                      className="form-control aeq-input aeq-readonly"
                      value="0"
                      readOnly
                    />
                  </div>

                  {/* Expected Order Date */}
                  <div className="aeq-field">
                    <label>
                      Expected Order Date <span className="req">*</span>
                    </label>
                    <input
                      type="date"
                      className={`form-control aeq-input ${errors.expected_order_date ? "is-invalid" : ""}`}
                      value={form.expected_order_date}
                      min={today()}
                      onChange={(e) =>
                        handleChange("expected_order_date", e.target.value)
                      }
                    />
                    {errors.expected_order_date && (
                      <div className="aeq-error">
                        {errors.expected_order_date}
                      </div>
                    )}
                  </div>

                  {/* Effective Enquiry Date */}
                  <div className="aeq-field">
                    <label>
                      Effective Enquiry Date &nbsp;
                      <input
                        type="checkbox"
                        checked={effEnqEnabled}
                        onChange={(e) => {
                          setEffEnqEnabled(e.target.checked);
                          if (!e.target.checked)
                            handleChange("eff_enq_date", "");
                        }}
                        className="aeq-checkbox"
                        title="Check to enable"
                      />
                      <span className="aeq-muted-hint ms-2">
                        Check to enable
                      </span>
                    </label>
                    <input
                      type="date"
                      className="form-control aeq-input"
                      value={form.eff_enq_date}
                      min={effEnqMin}
                      max={effEnqMax}
                      onChange={(e) =>
                        handleChange("eff_enq_date", e.target.value)
                      }
                      disabled={!effEnqEnabled}
                    />
                    {effEnqEnabled && (
                      <small className="text-muted">
                        Range: {effEnqMin} to {effEnqMax}
                      </small>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="aeq-field">
                    <label>
                      Priority <span className="req">*</span>
                    </label>
                    <select
                      className={`form-select aeq-input ${errors.priority ? "is-invalid" : ""}`}
                      value={form.priority}
                      onChange={(e) => handleChange("priority", e.target.value)}
                    >
                      <option value="">-- Select Priority --</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                    {errors.priority && (
                      <div className="aeq-error">{errors.priority}</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        {/* end aeq-sections-grid */}

        {/* Save Bar */}
        <div className="aeq-save-bar">
          <button
            className="btn aeq-btn-outline"
            onClick={() => navigate("/enquiry")}
          >
            <i className="bi bi-x-lg me-1"></i>Cancel
          </button>
          <button
            className="btn aeq-btn-save"
            onClick={handleSave}
            disabled={!sec3Done || saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-save-fill me-2"></i>Save Enquiry
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
