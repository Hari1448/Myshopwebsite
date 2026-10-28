import React, { useState } from "react";

export default function WatercanManager({
  watercanCustomers,
  onAddWatercanPerson,
  onMarkAsPaid,
  onDeliverCan,
  onBack,
}) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'pending' | 'paid'

  // Modals state
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [whatsappPerson, setWhatsappPerson] = useState(null);
  const [reminderType, setReminderType] = useState("due"); // 'due' | 'paid'
  const [customPhone, setCustomPhone] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [copyNotice, setCopyNotice] = useState(false);

  // New Person Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [advanceAmount, setAdvanceAmount] = useState("300");
  const [cansHeld, setCansHeld] = useState("2");
  const [address, setAddress] = useState("");
  const [initialStatus, setInitialStatus] = useState("Paid");
  const [initialDue, setInitialDue] = useState("0");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  // Metrics
  const totalPersons = watercanCustomers.length;
  const totalAdvanceCollected = watercanCustomers.reduce(
    (sum, c) => sum + (c.advanceAmount || 0),
    0
  );
  const totalCansInCirculation = watercanCustomers.reduce(
    (sum, c) => sum + (c.cansHeld || 0),
    0
  );
  const totalDuesPending = watercanCustomers.reduce(
    (sum, c) => sum + (c.dueAmount || 0),
    0
  );

  // Filtered persons
  const filteredPersons = watercanCustomers.filter((p) => {
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "pending" && p.paymentStatus === "Pending") ||
      (filterStatus === "paid" && p.paymentStatus === "Paid");

    const matchesSearch =
      search.trim() === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.toLowerCase().includes(search.toLowerCase()) ||
      (p.address && p.address.toLowerCase().includes(search.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  // Open WhatsApp Reminder Modal
  const openWhatsAppModal = (person, type = "due") => {
    setWhatsappPerson(person);
    setReminderType(type);
    const cleanPhone = person.phone ? person.phone.replace(/\D/g, "") : "";
    setCustomPhone(cleanPhone);
    setCopyNotice(false);

    generateMessage(person, type);
  };

  const generateMessage = (person, type) => {
    if (type === "paid") {
      const msg = `Vanakkam *${person.name}* ji 🙏,

Payment confirmation from *SUNMADHI WATER CAN SUPPLY*.

✅ *PAYMENT RECEIVED & PAID:*
• Customer: *${person.name}*
• Payment Status: *PAID (All Dues Cleared)*
• Current Pending Due: *₹0.00*
• Security Advance with Store: *₹${person.advanceAmount}*
• Active 20L Cans with you: *${person.cansHeld} Cans*

Thank you for your timely payment! We appreciate your support.
— *SUNMADHI WATER CAN SUPPLY*
Main Road, Near Bus Stand · Phone: +91 98401 98401`;
      setCustomMessage(msg);
    } else {
      const msg = `Vanakkam *${person.name}* ji 🙏,

This is a gentle payment reminder from *SUNMADHI WATER CAN SUPPLY*.

💧 *Water Can Account Summary:*
• Customer: *${person.name}*
• Security Advance Deposit: ₹${person.advanceAmount}
• Active 20L Cans with you: ${person.cansHeld} Cans
• Total Cans Delivered: ${person.deliveriesCount}
• *Pending Due Amount: ₹${person.dueAmount.toFixed(2)}*

Kindly clear the pending water can bill of *₹${person.dueAmount.toFixed(2)}* at our store counter or pay via GPay/PhonePe to our shop number: *98401 98401* (SUNMADHI WATER SUPPLY).

Thank you for choosing SUNMADHI WATER!
— *SUNMADHI WATER CAN SUPPLY*
Phone: +91 98401 98401`;
      setCustomMessage(msg);
    }
  };

  const handleTypeChange = (newType) => {
    setReminderType(newType);
    if (whatsappPerson) {
      generateMessage(whatsappPerson, newType);
    }
  };

  // WhatsApp Actions
  const handleSendToCustomer = () => {
    const clean = customPhone.replace(/\D/g, "");
    if (!clean || clean.length < 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }
    const url = `https://wa.me/91${clean}?text=${encodeURIComponent(customMessage)}`;
    window.open(url, "_blank");
  };

  const handleSendToStore = () => {
    const storeNumber = "9840198401";
    const url = `https://wa.me/91${storeNumber}?text=${encodeURIComponent(
      `[WATER CAN SUPPLY RECORD - ${reminderType.toUpperCase()}]\nCustomer: ${whatsappPerson?.name} (+91 ${customPhone})\n\n${customMessage}`
    )}`;
    window.open(url, "_blank");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customMessage);
    setCopyNotice(true);
    setTimeout(() => setCopyNotice(false), 2500);
  };

  // Add Person submit
  const handleAddPersonSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Please enter customer name.");
      return;
    }

    const cleanPh = phone.trim();
    if (!cleanPh || cleanPh.length < 10) {
      setFormError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const numAdvance = parseFloat(advanceAmount) || 0;
    const numCans = parseInt(cansHeld, 10) || 1;
    const numDue = parseFloat(initialDue) || 0;

    const newPerson = {
      id: `WC-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      phone: cleanPh,
      advanceAmount: numAdvance,
      cansHeld: numCans,
      deliveriesCount: 1,
      dueAmount: numDue,
      paymentStatus: numDue > 0 ? "Pending" : initialStatus,
      lastDelivery: "Today (New)",
      address: address.trim() || "Local resident",
      notes: notes.trim(),
    };

    onAddWatercanPerson(newPerson);
    setIsAddPersonOpen(false);

    // Reset
    setName("");
    setPhone("");
    setAdvanceAmount("300");
    setCansHeld("2");
    setAddress("");
    setInitialStatus("Paid");
    setInitialDue("0");
    setNotes("");
  };

  return (
    <div className="watercan-manager-view">
      {/* Navigation & Back */}
      <div className="category-view-nav">
        <button type="button" className="back-to-categories-btn" onClick={onBack}>
          ← Back to All Categories
        </button>
        <span className="crumb-sep">/</span>
        <span className="current-crumb">💧 Watercan Supply Customer Manager</span>
      </div>

      {/* Header Banner */}
      <div className="watercan-header-banner">
        <div className="watercan-header-left">
          <div className="watercan-icon-box">💧</div>
          <div>
            <h2>Watercan Supply & Customer Register</h2>
            <p>
              Manage water can subscribers with advance deposits, active can tracking, delivery counts, and WhatsApp payment reminders.
            </p>
          </div>
        </div>

        <div className="watercan-header-actions">
          <button
            type="button"
            className="primary-button add-person-btn"
            onClick={() => setIsAddPersonOpen(true)}
          >
            + Add Person (Customer)
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total Registered Persons</span>
            <span className="stat-icon cyan">👥</span>
          </div>
          <h2>{totalPersons}</h2>
          <p>Active water can customers</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Total Advance Collected</span>
            <span className="stat-icon green">₹</span>
          </div>
          <h2>₹{totalAdvanceCollected.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
          <p>Security can deposit held</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>20L Cans with Customers</span>
            <span className="stat-icon blue">💧</span>
          </div>
          <h2>{totalCansInCirculation} Cans</h2>
          <p>In active circulation</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Pending Payment Dues</span>
            <span className="stat-icon orange">⚠️</span>
          </div>
          <h2 className={totalDuesPending > 0 ? "orange-text" : ""}>
            ₹{totalDuesPending.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h2>
          <p>{totalDuesPending > 0 ? "Can bills to collect" : "All payments clear"}</p>
        </div>
      </div>

      {/* Customer Table Section */}
      <div className="section">
        <div className="table-controls">
          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${filterStatus === "all" ? "active" : ""}`}
              onClick={() => setFilterStatus("all")}
            >
              All Persons ({watercanCustomers.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterStatus === "pending" ? "active" : ""}`}
              onClick={() => setFilterStatus("pending")}
            >
              ⏳ Pending Payment ({watercanCustomers.filter((p) => p.paymentStatus === "Pending").length})
            </button>
            <button
              type="button"
              className={`filter-pill ${filterStatus === "paid" ? "active" : ""}`}
              onClick={() => setFilterStatus("paid")}
            >
              ✓ Paid & Up-to-date ({watercanCustomers.filter((p) => p.paymentStatus === "Paid").length})
            </button>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search person name, phone, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="search-clear" onClick={() => setSearch("")}>
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Person / Customer Name</th>
                <th>Phone Number</th>
                <th className="highlight-column">Advance Amount (Deposit)</th>
                <th>Active 20L Cans</th>
                <th>Total Cans Delivered</th>
                <th>Payment Due</th>
                <th>Payment Status</th>
                <th>Actions & WhatsApp Reminders</th>
              </tr>
            </thead>
            <tbody>
              {filteredPersons.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-table-row">
                    No water can customers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPersons.map((person) => {
                  const isPending = person.paymentStatus === "Pending" || person.dueAmount > 0;

                  return (
                    <tr key={person.id}>
                      {/* 1. Name */}
                      <td>
                        <strong className="cust-name-text">{person.name}</strong>
                        <div className="table-sub-detail">{person.id}</div>
                        {person.address && (
                          <div className="person-addr-text">📍 {person.address}</div>
                        )}
                      </td>

                      {/* 2. Phone */}
                      <td>
                        <div className="phone-with-wa">
                          <strong>+91 {person.phone}</strong>
                          <button
                            type="button"
                            className="inline-wa-btn"
                            onClick={() => openWhatsAppModal(person, isPending ? "due" : "paid")}
                            title="Send WhatsApp message to customer"
                          >
                            💬 WhatsApp
                          </button>
                        </div>
                      </td>

                      {/* 3. Advance Amount */}
                      <td className="highlight-column">
                        <strong className="advance-amount-val">
                          ₹{person.advanceAmount.toFixed(2)}
                        </strong>
                        <div className="table-sub-detail">Can Security Deposit</div>
                      </td>

                      {/* 4. Active Cans */}
                      <td>
                        <span className="cans-held-badge">
                          💧 {person.cansHeld} Cans
                        </span>
                      </td>

                      {/* 5. Total Deliveries */}
                      <td>
                        <strong>{person.deliveriesCount}</strong> cans
                        <div className="table-sub-detail">Last: {person.lastDelivery}</div>
                      </td>

                      {/* 6. Payment Due */}
                      <td>
                        {person.dueAmount > 0 ? (
                          <strong className="orange-text">
                            ₹{person.dueAmount.toFixed(2)}
                          </strong>
                        ) : (
                          <span className="green-text font-bold">₹0.00</span>
                        )}
                      </td>

                      {/* 7. Status */}
                      <td>
                        <span
                          className={`status ${
                            person.paymentStatus === "Paid" ? "paid" : "pending"
                          }`}
                        >
                          {person.paymentStatus}
                        </span>
                      </td>

                      {/* 8. Actions */}
                      <td>
                        <div className="watercan-action-buttons">
                          {/* Mark Paid button */}
                          {isPending ? (
                            <button
                              type="button"
                              className="secondary-button mark-paid-btn"
                              onClick={() => {
                                onMarkAsPaid(person.id);
                                openWhatsAppModal(person, "paid");
                              }}
                              title="Mark as Paid and send confirmation"
                            >
                              💰 Mark as Paid
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="paid-confirmation-btn"
                              onClick={() => openWhatsAppModal(person, "paid")}
                              title="Send Paid Receipt on WhatsApp"
                            >
                              ✅ Paid Msg
                            </button>
                          )}

                          {/* Reminder button */}
                          <button
                            type="button"
                            className="wa-remind-btn"
                            onClick={() => openWhatsAppModal(person, isPending ? "due" : "paid")}
                            title={
                              isPending
                                ? "Send Payment Due Reminder on WhatsApp"
                                : "Send Payment Paid confirmation on WhatsApp"
                            }
                          >
                            {isPending ? "💬 Remind Due" : "💬 WhatsApp"}
                          </button>

                          {/* Quick +1 Delivery */}
                          <button
                            type="button"
                            className="deliver-can-btn"
                            onClick={() => onDeliverCan(person.id)}
                            title="Record 1 Can Delivered (+₹40)"
                          >
                            🚚 +1 Can
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="table-footer-summary">
            <p className="demo-note">
              SUNMADHI Water Can Supply Delivery Counter · Automated Person Register & WhatsApp Reminders
            </p>
            <div className="table-counts-badge">
              Showing {filteredPersons.length} of {watercanCustomers.length} persons
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          MODAL: + ADD PERSON (WATER CAN CUSTOMER)
         =================================================== */}
      {isAddPersonOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddPersonOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon cyan">💧</span>
                <div>
                  <h3>Add Person (Water Can Customer)</h3>
                  <p>Register new customer with advance deposit and active can count</p>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setIsAddPersonOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPersonSubmit} className="modal-body">
              {formError && <div className="form-alert error">{formError}</div>}

              {/* Name */}
              <div className="form-group">
                <label className="form-label">
                  Person / Customer Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Murugan, Lakshmi Bhavan Hotel, Flat 4B"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">
                  Phone Number (WhatsApp) <span className="req">*</span>
                </label>
                <div className="input-prefix-group">
                  <span className="input-prefix">+91</span>
                  <input
                    type="tel"
                    maxLength="10"
                    className="form-input"
                    placeholder="e.g. 9840123456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
              </div>

              {/* Advance Amount & Cans Count */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">
                    Advance Amount (Deposit ₹) <span className="req">*</span>
                  </label>
                  <div className="input-prefix-group">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      min="0"
                      className="form-input text-lg font-bold"
                      placeholder="e.g. 300"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      required
                    />
                  </div>
                  <small className="form-hint">Security deposit for empty cans</small>
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Initial 20L Cans Given</label>
                  <select
                    className="form-select"
                    value={cansHeld}
                    onChange={(e) => setCansHeld(e.target.value)}
                  >
                    <option value="1">1 Can (Standard)</option>
                    <option value="2">2 Cans (Most Popular)</option>
                    <option value="3">3 Cans</option>
                    <option value="4">4 Cans</option>
                    <option value="5">5 Cans (Commercial)</option>
                    <option value="10">10 Cans (Bulk)</option>
                  </select>
                </div>
              </div>

              {/* Address / Location */}
              <div className="form-group">
                <label className="form-label">Delivery Address / Flat / Floor</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 2nd Street, Block B, Door #14"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              {/* Initial Payment Status & Due */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Initial Payment Status</label>
                  <select
                    className="form-select"
                    value={initialStatus}
                    onChange={(e) => setInitialStatus(e.target.value)}
                  >
                    <option value="Paid">Paid (Up to date)</option>
                    <option value="Pending">Pending (Due)</option>
                  </select>
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Initial Due Amount (₹)</label>
                  <div className="input-prefix-group">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      placeholder="0.00"
                      value={initialDue}
                      onChange={(e) => setInitialDue(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Delivery Notes / Frequency</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Daily morning delivery, Alternate days"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsAddPersonOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  + Add Person to Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          MODAL: WHATSAPP REMINDER & PAID CONFIRMATION
         =================================================== */}
      {whatsappPerson && (
        <div className="modal-backdrop" onClick={() => setWhatsappPerson(null)}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon cyan">💬</span>
                <div>
                  <h3>WhatsApp Reminder & Receipt · Watercan Supply</h3>
                  <p>Customer: <strong>{whatsappPerson.name}</strong> · Active Cans: <strong>{whatsappPerson.cansHeld}</strong></p>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setWhatsappPerson(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {copyNotice && (
                <div className="form-alert success">
                  ✓ WhatsApp message copied to clipboard!
                </div>
              )}

              {/* Message Type Selector: Due Reminder vs Paid Confirmation */}
              <div className="tab-pill-group">
                <button
                  type="button"
                  className={`tab-pill ${reminderType === "due" ? "active" : ""}`}
                  onClick={() => handleTypeChange("due")}
                >
                  ⏰ Payment Due Reminder
                </button>
                <button
                  type="button"
                  className={`tab-pill ${reminderType === "paid" ? "active" : ""}`}
                  onClick={() => handleTypeChange("paid")}
                >
                  ✅ Payment Received (Paid) Confirmation
                </button>
              </div>

              {/* Customer Phone & Store WhatsApp */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Customer WhatsApp Number</label>
                  <div className="input-prefix-group">
                    <span className="input-prefix">+91</span>
                    <input
                      type="tel"
                      maxLength="10"
                      className="form-input"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Store WhatsApp Number</label>
                  <div className="input-prefix-group">
                    <span className="input-prefix">+91</span>
                    <input
                      type="text"
                      className="form-input"
                      value="98401 98401"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Message Preview and Editor */}
              <div className="form-group">
                <div className="label-with-hint">
                  <label className="form-label">
                    {reminderType === "paid" ? "Paid Message Text" : "Due Reminder Message Text"}
                  </label>
                  <button type="button" className="copy-link-btn" onClick={handleCopy}>
                    📋 Copy Text
                  </button>
                </div>
                <textarea
                  className="form-input wa-message-textarea"
                  rows="9"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
              </div>

              {/* WhatsApp Action Buttons */}
              <div className="wa-actions-container">
                <div className="wa-action-box">
                  <div className="wa-action-info">
                    <strong>1. Send to Customer's WhatsApp</strong>
                    <p>Opens WhatsApp with {whatsappPerson.name} (+91 {customPhone})</p>
                  </div>
                  <button
                    type="button"
                    className="wa-send-btn customer-btn"
                    onClick={handleSendToCustomer}
                  >
                    💬 Open Customer WhatsApp →
                  </button>
                </div>

                <div className="wa-action-box">
                  <div className="wa-action-info">
                    <strong>2. Send Copy to Our Shop WhatsApp</strong>
                    <p>Delivers copy to SUNMADHI STORE WhatsApp (+91 98401 98401)</p>
                  </div>
                  <button
                    type="button"
                    className="wa-send-btn store-btn"
                    onClick={handleSendToStore}
                  >
                    📱 Send Copy to Our WhatsApp →
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setWhatsappPerson(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
