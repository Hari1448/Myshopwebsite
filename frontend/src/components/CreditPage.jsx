import React, { useState } from "react";

export default function CreditPage({
  creditCustomers,
  onAddCreditCustomer,
  onUpdateCreditPayment,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [settleCustomer, setSettleCustomer] = useState(null);
  const [settleAmount, setSettleAmount] = useState("");
  const [settleError, setSettleError] = useState("");

  // WhatsApp Reminder State
  const [whatsappCustomer, setWhatsappCustomer] = useState(null);
  const [reminderPhone, setReminderPhone] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // New Credit Entry Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paidAmount, setPaidAmount] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const numTotal = parseFloat(totalAmount) || 0;
  const numPaid = parseFloat(paidAmount) || 0;
  const calculatedBalance = Math.max(0, numTotal - numPaid);

  // Financial summary
  const totalOutstanding = creditCustomers
    .filter((c) => c.status !== "Cleared")
    .reduce((sum, c) => sum + (c.balanceAmount || 0), 0);

  const activeCreditCount = creditCustomers.filter((c) => c.balanceAmount > 0).length;
  const clearedCount = creditCustomers.filter((c) => c.status === "Cleared").length;

  // Filtered list
  const filteredCustomers = creditCustomers.filter((c) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "Pending" && c.status === "Pending") ||
      (statusFilter === "Overdue" && c.status === "Overdue") ||
      (statusFilter === "Cleared" && c.status === "Cleared");

    const matchesSearch =
      searchQuery.trim() === "" ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.items.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleAddNewCredit = (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Please enter customer name.");
      return;
    }

    if (!items.trim()) {
      setFormError("Please enter items purchased on credit.");
      return;
    }

    if (numTotal <= 0) {
      setFormError("Please enter a valid total amount.");
      return;
    }

    const newEntry = {
      id: `CRD-${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      phone: phone.trim() || "—",
      items: items.trim(),
      totalAmount: numTotal,
      paidAmount: numPaid,
      balanceAmount: calculatedBalance,
      date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
      dueDate: dueDate || "Within 7 days",
      status: calculatedBalance === 0 ? "Cleared" : "Pending",
      notes: notes.trim(),
    };

    onAddCreditCustomer(newEntry);
    setIsAddModalOpen(false);

    // Reset form
    setName("");
    setPhone("");
    setItems("");
    setTotalAmount("");
    setPaidAmount("0");
    setDueDate("");
    setNotes("");
  };

  const handleSettlePayment = (e) => {
    e.preventDefault();
    setSettleError("");

    if (!settleCustomer) return;

    const payment = parseFloat(settleAmount);
    if (!payment || payment <= 0) {
      setSettleError("Please enter a valid payment amount.");
      return;
    }

    if (payment > settleCustomer.balanceAmount) {
      setSettleError(`Payment cannot exceed outstanding balance of ₹${settleCustomer.balanceAmount}.`);
      return;
    }

    onUpdateCreditPayment(settleCustomer.id, payment);
    setSettleCustomer(null);
    setSettleAmount("");
  };

  // Open WhatsApp Reminder Modal
  const openWhatsAppModal = (cust) => {
    setWhatsappCustomer(cust);
    const cleanPhone = cust.phone ? cust.phone.replace(/\D/g, "") : "";
    setReminderPhone(cleanPhone);
    setCopySuccess(false);

    const messageTemplate = `VANAKKAM *${cust.name}* SIR 🙏,

This is a gentle payment reminder from *SUNMADHI STORE*.

📋 *Credit Bill Summary:*
• Purchased Items: ${cust.items}
• Total Bill Amount: ₹${cust.totalAmount.toFixed(2)}
• Amount Paid So Far: ₹${cust.paidAmount.toFixed(2)}
• *Pending Balance Amount: ₹${cust.balanceAmount.toFixed(2)}*
• Due Date: ${cust.dueDate}

Kindly clear the pending balance of *₹${cust.balanceAmount.toFixed(2)}* at our store counter or pay online via GPay/PhonePe to our shop number: *9042623572/HARIHARASUDHAN* (SUNMADHI STORE).

Thank you for your business!
— *SUNMADHI STORE MANAGEMENT*
 Near Bus Stand,Ramakrishnapuram ,pottipuram · Phone: +91 9042623572`;

    setReminderMessage(messageTemplate);
  };

  // Send to Customer's WhatsApp
  const sendToCustomerWhatsApp = () => {
    const cleanPhone = reminderPhone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      alert("Please enter a valid 10-digit mobile number for the customer.");
      return;
    }
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(reminderMessage)}`;
    window.open(url, "_blank");
  };

  // Send to Our Store's WhatsApp
  const sendToStoreWhatsApp = () => {
    const storeNumber = "9042623572"; // Sunmadhi Store WhatsApp
    const url = `https://wa.me/91${storeNumber}?text=${encodeURIComponent(
      `[STORE COPY - CREDIT REMINDER]\nCustomer: ${whatsappCustomer?.name} (${reminderPhone})\n\n${reminderMessage}`
    )}`;
    window.open(url, "_blank");
  };

  // Copy Reminder Message to Clipboard
  const handleCopyMessage = () => {
    navigator.clipboard.writeText(reminderMessage);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div className="credit-page">
      <div className="page-header-row">
        <div>
          <h2>Credit / கடன் Customer Ledger</h2>
          <p>
            Track customer credit dues, items purchased on credit (கடன்), and send payment reminders on WhatsApp.
          </p>
        </div>
        <div className="page-header-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => setIsAddModalOpen(true)}
          >
            + Add Credit Customer
          </button>
        </div>
      </div>

      {/* Credit Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span>Total Outstanding Credit Balance</span>
            <span className="stat-icon orange">₹</span>
          </div>
          <h2 className="orange-text">
            ₹{totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h2>
          <p>Pending to collect from customers</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Active Credit Customers</span>
            <span className="stat-icon purple">👥</span>
          </div>
          <h2>{activeCreditCount}</h2>
          <p>Accounts with unpaid balance</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>Accounts Cleared</span>
            <span className="stat-icon green">✓</span>
          </div>
          <h2>{clearedCount}</h2>
          <p>Settled in full</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span>WhatsApp Reminders</span>
            <span className="stat-icon emerald">💬</span>
          </div>
          <h2>Ready</h2>
          <p>Direct WhatsApp Click-to-Chat</p>
        </div>
      </div>

      {/* Credit Table Section */}
      <div className="section">
        <div className="table-controls">
          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${statusFilter === "all" ? "active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All Customers ({creditCustomers.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === "Pending" ? "active" : ""}`}
              onClick={() => setStatusFilter("Pending")}
            >
              ⏳ Pending Dues ({activeCreditCount})
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === "Overdue" ? "active" : ""}`}
              onClick={() => setStatusFilter("Overdue")}
            >
              ⚠️ Overdue
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === "Cleared" ? "active" : ""}`}
              onClick={() => setStatusFilter("Cleared")}
            >
              ✓ Cleared ({clearedCount})
            </button>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search by customer name, phone, or item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone Number</th>
                <th>Items Purchased (On Credit)</th>
                <th>Date / Due Date</th>
                <th>Total Bill</th>
                <th>Paid Amount</th>
                <th className="highlight-column">Balance Amount (கடன்)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-table-row">
                    No credit records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id}>
                    <td>
                      <strong className="cust-name-text">{cust.name}</strong>
                      <div className="table-sub-detail">{cust.id}</div>
                    </td>
                    <td>
                      <div className="phone-with-wa">
                        <span>{cust.phone}</span>
                        {cust.balanceAmount > 0 && cust.phone !== "—" && (
                          <button
                            type="button"
                            className="inline-wa-btn"
                            onClick={() => openWhatsAppModal(cust)}
                            title="Send WhatsApp Reminder"
                          >
                            💬 WhatsApp
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="credit-items-badge">{cust.items}</span>
                      {cust.notes && (
                        <div className="table-sub-detail">Note: {cust.notes}</div>
                      )}
                    </td>
                    <td>
                      <div>{cust.date}</div>
                      <small className="due-date-text">Due: {cust.dueDate}</small>
                    </td>
                    <td>₹{cust.totalAmount.toFixed(2)}</td>
                    <td>₹{cust.paidAmount.toFixed(2)}</td>
                    <td className="highlight-column">
                      <strong
                        className={`balance-amount-tag ${
                          cust.balanceAmount > 0 ? "due" : "zero"
                        }`}
                      >
                        ₹{cust.balanceAmount.toFixed(2)}
                      </strong>
                    </td>
                    <td>
                      <span
                        className={`status ${
                          cust.status === "Cleared"
                            ? "paid"
                            : cust.status === "Overdue"
                            ? "pending"
                            : "pending"
                        }`}
                      >
                        {cust.status}
                      </span>
                    </td>
                    <td>
                      <div className="credit-action-btns">
                        {cust.balanceAmount > 0 ? (
                          <>
                            <button
                              type="button"
                              className="secondary-button table-action-btn pay-btn"
                              onClick={() => {
                                setSettleCustomer(cust);
                                setSettleAmount(cust.balanceAmount.toString());
                              }}
                              title="Collect cash or payment"
                            >
                              💰 Settle
                            </button>
                            <button
                              type="button"
                              className="table-action-btn wa-remind-btn"
                              onClick={() => openWhatsAppModal(cust)}
                              title="Send Reminder on WhatsApp"
                            >
                              💬 Remind
                            </button>
                          </>
                        ) : (
                          <span className="settled-check">✓ Fully Paid</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="table-footer-summary">
            <p className="demo-note">
              SUNMADHI Customer Credit / கடன் Ledger · Direct balance settlement & automated WhatsApp reminders
            </p>
            <div className="table-counts-badge">
              Showing {filteredCustomers.length} of {creditCustomers.length} accounts
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          MODAL: WHATSAPP PAYMENT REMINDER
         =================================================== */}
      {whatsappCustomer && (
        <div className="modal-backdrop" onClick={() => setWhatsappCustomer(null)}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon emerald">💬</span>
                <div>
                  <h3>Send WhatsApp Payment Reminder</h3>
                  <p>Customer: <strong>{whatsappCustomer.name}</strong> · Pending: <strong className="orange-text">₹{whatsappCustomer.balanceAmount.toFixed(2)}</strong></p>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setWhatsappCustomer(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {copySuccess && (
                <div className="form-alert success">
                  ✓ Reminder message copied to clipboard!
                </div>
              )}

              {/* Recipient Number */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">
                    Customer WhatsApp Number <span className="req">*</span>
                  </label>
                  <div className="input-prefix-group">
                    <span className="input-prefix">+91</span>
                    <input
                      type="tel"
                      maxLength="10"
                      className="form-input"
                      placeholder="e.g. 9841234567"
                      value={reminderPhone}
                      onChange={(e) => setReminderPhone(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Our Shop WhatsApp Number</label>
                  <div className="input-prefix-group">
                    <span className="input-prefix">+91</span>
                    <input
                      type="text"
                      className="form-input"
                      value="9042623572"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Message Preview and Editor */}
              <div className="form-group">
                <div className="label-with-hint">
                  <label className="form-label">WhatsApp Message Preview & Text</label>
                  <button
                    type="button"
                    className="copy-link-btn"
                    onClick={handleCopyMessage}
                  >
                    📋 Copy Text
                  </button>
                </div>
                <textarea
                  className="form-input wa-message-textarea"
                  rows="9"
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                />
              </div>

              {/* Action Buttons: Customer WhatsApp vs Store WhatsApp */}
              <div className="wa-actions-container">
                <div className="wa-action-box">
                  <div className="wa-action-info">
                    <strong>1. Send to Customer WhatsApp</strong>
                    <p>Opens WhatsApp chat directly with {whatsappCustomer.name} (+91 {reminderPhone})</p>
                  </div>
                  <button
                    type="button"
                    className="wa-send-btn customer-btn"
                    onClick={sendToCustomerWhatsApp}
                  >
                    💬 Open Customer WhatsApp →
                  </button>
                </div>

                <div className="wa-action-box">
                  <div className="wa-action-info">
                    <strong>2. Send Copy to Our Shop WhatsApp</strong>
                    <p>Delivers this reminder record to your store WhatsApp (+91 9042623572) for bookkeeping</p>
                  </div>
                  <button
                    type="button"
                    className="wa-send-btn store-btn"
                    onClick={sendToStoreWhatsApp}
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
                onClick={() => setWhatsappCustomer(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Credit Customer */}
      {isAddModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon orange">📋</span>
                <div>
                  <h3>Add Credit Customer (கடன் Entry)</h3>
                  <p>Register customer credit purchase and balance amount</p>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setIsAddModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewCredit} className="modal-body">
              {formError && <div className="form-alert error">{formError}</div>}

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">
                    Customer Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Senthil Nathan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">WhatsApp / Phone Number</label>
                  <input
                    type="tel"
                    maxLength="10"
                    className="form-input"
                    placeholder="e.g. 98412 34567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Items Purchased on Credit <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 2x 20L Water Can, 1x Cotton Shirt"
                  value={items}
                  onChange={(e) => setItems(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">
                    Total Bill Amount (₹) <span className="req">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Amount Paid Advance (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* Live calculated Balance Amount */}
              <div className="fee-breakdown-card">
                <div className="fee-row">
                  <span>Total Purchase:</span>
                  <strong>₹{numTotal.toFixed(2)}</strong>
                </div>
                <div className="fee-row">
                  <span>Advance Received:</span>
                  <span className="green-text">₹{numPaid.toFixed(2)}</span>
                </div>
                <div className="fee-divider"></div>
                <div className="fee-row total">
                  <span>Balance Amount (Credit Owed):</span>
                  <strong className="orange-text font-bold">
                    ₹{calculatedBalance.toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Expected Due Date</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 30-Oct-2026 or 1 Week"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Remarks / Address</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 2nd Street resident"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  Save to Credit Ledger →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Customer Payment / Settle Balance */}
      {settleCustomer && (
        <div className="modal-backdrop" onClick={() => setSettleCustomer(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon green">💰</span>
                <div>
                  <h3>Collect Customer Balance Payment</h3>
                  <p>Customer: <strong>{settleCustomer.name}</strong></p>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setSettleCustomer(null)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSettlePayment} className="modal-body">
              {settleError && <div className="form-alert error">{settleError}</div>}

              <div className="fee-breakdown-card">
                <div className="fee-row">
                  <span>Items on Credit:</span>
                  <strong>{settleCustomer.items}</strong>
                </div>
                <div className="fee-row">
                  <span>Current Outstanding Balance:</span>
                  <strong className="orange-text">₹{settleCustomer.balanceAmount.toFixed(2)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Payment Amount Received (₹) <span className="req">*</span>
                </label>
                <div className="input-prefix-group">
                  <span className="input-prefix">₹</span>
                  <input
                    type="number"
                    min="1"
                    max={settleCustomer.balanceAmount}
                    className="form-input text-lg font-bold"
                    placeholder="Enter amount paid"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="quick-amount-chips">
                  <button
                    type="button"
                    className="chip"
                    onClick={() => setSettleAmount(settleCustomer.balanceAmount.toString())}
                  >
                    Full Balance (₹{settleCustomer.balanceAmount})
                  </button>
                  {settleCustomer.balanceAmount > 100 && (
                    <button
                      type="button"
                      className="chip"
                      onClick={() => setSettleAmount("100")}
                    >
                      ₹100
                    </button>
                  )}
                  {settleCustomer.balanceAmount > 500 && (
                    <button
                      type="button"
                      className="chip"
                      onClick={() => setSettleAmount("500")}
                    >
                      ₹500
                    </button>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setSettleCustomer(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button emerald-btn">
                  Confirm Payment Received →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
