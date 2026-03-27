import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import { useAuth } from "../../context/AuthContext";
import "./EnquiryHome.css";

const enquiryCards = [
  {
    id: 1,
    title: "Add Enquiry",
    description:
      "Register a new RFQ enquiry with customer, product and quote details",
    icon: "bi-plus-circle-fill",
    path: "/enquiry/add",
    color: "card-red",
    available: true,
  },
  {
    id: 2,
    title: "Enquiry Register",
    description: "View, filter and manage all registered enquiries",
    icon: "bi-table",
    path: "/enquiry/register",
    color: "card-maroon",
    available: false, // next sprint
  },
  {
    id: 3,
    title: "Edit Enquiry",
    description: "Modify existing enquiry details and update quote stages",
    icon: "bi-pencil-square",
    path: "/enquiry/edit",
    color: "card-dark",
    available: false, // next sprint
  },
];

const EnquiryHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCard = (card) => {
    if (!card.available) return;
    navigate(card.path);
  };

  return (
    <div className="enq-home-page">
      <DashboardNavbar />

      <div className="enq-home-body">
        {/* ── Breadcrumb ── */}
        <div className="enq-breadcrumb">
          <span
            className="enq-crumb-link"
            onClick={() => navigate("/dashboard")}
          >
            <i className="bi bi-house-fill me-1"></i>Dashboard
          </span>
          <span className="enq-crumb-sep">/</span>
          <span className="enq-crumb-active">Enquiry</span>
        </div>

        {/* ── Header ── */}
        <div className="enq-home-header">
          <div>
            <h2 className="enq-home-title">
              <i className="bi bi-file-earmark-text-fill me-2"></i>
              Enquiry Module
            </h2>
            <p className="enq-home-subtitle">
              Manage RFQ enquiries — from registration to quote generation
            </p>
          </div>
          <div className="enq-role-pill">
            <i className="bi bi-person-fill me-1"></i>
            {user?.role || "View-only"}
          </div>
        </div>

        {/* ── Sprint Badge ── */}
        <div className="enq-sprint-badge">
          <i className="bi bi-info-circle me-1"></i>
          Sprint 1 — Add Enquiry is active. Edit &amp; Register coming in next
          sprint.
        </div>

        {/* ── Cards ── */}
        <div className="enq-cards-grid">
          {enquiryCards.map((card) => (
            <div
              key={card.id}
              className={`enq-card ${card.color} ${!card.available ? "enq-card-locked" : ""}`}
              onClick={() => handleCard(card)}
              title={!card.available ? "Coming in next sprint" : card.title}
            >
              {/* Lock badge */}
              {!card.available && (
                <span className="enq-lock-badge">
                  <i className="bi bi-lock-fill me-1"></i>Next Sprint
                </span>
              )}

              {/* Icon */}
              <div className="enq-card-icon-wrap">
                <i className={`bi ${card.icon} enq-card-icon`}></i>
              </div>

              {/* Text */}
              <div className="enq-card-body">
                <h5 className="enq-card-title">{card.title}</h5>
                <p className="enq-card-desc">{card.description}</p>
              </div>

              {/* Arrow */}
              {card.available && (
                <div className="enq-card-arrow">
                  <i className="bi bi-arrow-right-circle-fill"></i>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Stats Row ── */}
        <div className="enq-stats-row">
          <div className="enq-stat-box">
            <i className="bi bi-check-circle-fill enq-stat-icon green"></i>
            <div>
              <div className="enq-stat-label">Available Now</div>
              <div className="enq-stat-value">1 Feature</div>
            </div>
          </div>
          <div className="enq-stat-box">
            <i className="bi bi-hourglass-split enq-stat-icon orange"></i>
            <div>
              <div className="enq-stat-label">Coming Soon</div>
              <div className="enq-stat-value">2 Features</div>
            </div>
          </div>
          <div className="enq-stat-box">
            <i className="bi bi-diagram-3-fill enq-stat-icon red"></i>
            <div>
              <div className="enq-stat-label">Total Features</div>
              <div className="enq-stat-value">3 Features</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnquiryHome;
