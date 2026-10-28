import React, { useState } from "react";

// ── Store's Google Pay / UPI receiving number ──────────────
const STORE_UPI = "9042623572@okaxis"; // Primary GPay VPA
const STORE_NAME = "SUNMADHI STORE";
const STORE_PHONE = "9042623572";

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export default function MoneyTransferModal({ isOpen, onClose, onTransferSuccess }) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [requestSent, setRequestSent] = useState(false);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  // Build UPI payment link pointing to store's GPay number
  const buildUPILink = (scheme = "upi") => {
    const params = new URLSearchParams({
      pa: STORE_UPI,
      pn: STORE_NAME,
      am: numAmount.toFixed(2),
      cu: "INR",
      tn: note.trim() || `Payment from ${customerName.trim() || "Customer"}`,
    });
    return `${scheme}://pay?${params.toString()}`;
  };

  // Google Pay deep link (tez:// on Android)
  const gPayLink = buildUPILink("tez");
  // Universal UPI fallback
  const upiLink = buildUPILink("upi");

  const handleSendRequest = (e) => {
    e.preventDefault();
    setError("");

    if (!customerName.trim()) {
      setError("Please enter the customer name.");
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 10) {
      setError("Please enter a valid 10-digit customer phone number.");
      return;
    }
    if (numAmount <= 0) {
      setError("Please enter a valid transfer amount.");
      return;
    }
    if (numAmount > 100000) {
      setError("Maximum transfer amount is ₹1,00,000.");
      return;
    }

    // Open Google Pay on device
    window.open(gPayLink, "_blank");
    setRequestSent(true);
  };

  const handleConfirmReceived = () => {
    const txnId = `DMT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTxn = {
      id: txnId,
      utr: `UPI${Date.now().toString().slice(-9)}`,
      type: "Money Transfer",
      category: "Money Transfer",
      item: `GPay Collection from ${customerName.trim()}`,
      details: `Phone: ${customerPhone} · UPI to ${STORE_UPI}`,
      amount: numAmount,
      fee: 0,
      status: "Paid",
      paymentMode: "UPI",
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      destination: STORE_UPI,
      date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
      fullDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    };

    onTransferSuccess(newTxn);
    // Reset
    setCustomerName("");
    setCustomerPhone("");
    setAmount("");
    setNote("");
    setRequestSent(false);
    onClose();
  };

  const handleClose = () => {
    setCustomerName("");
    setCustomerPhone("");
    setAmount("");
    setNote("");
    setError("");
    setRequestSent(false);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-card gpay-modal-card" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon" style={{ background: "#ecfdf5" }}>💸</span>
            <div>
              <h3>Collect Payment via Google Pay</h3>
              <p>Enter customer details — opens GPay to collect directly to your account</p>
            </div>
          </div>
          <button className="modal-close" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        {/* Store UPI Info Banner */}
        <div className="gpay-store-banner">
          <span className="gpay-store-icon">🏪</span>
          <div className="gpay-store-info">
            <span className="gpay-store-label">Receiving to your Google Pay</span>
            <strong className="gpay-store-upi">{STORE_PHONE} (GPay)</strong>
          </div>
          <span className="gpay-verified-badge">✓ Verified</span>
        </div>

        {!requestSent ? (
          /* ── STEP 1: ENTER DETAILS ─────────────── */
          <form onSubmit={handleSendRequest} className="modal-body">
            {error && <div className="form-alert error">{error}</div>}

            {/* Customer Name & Phone */}
            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">
                  Customer Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="form-group flex-1">
                <label className="form-label">
                  Customer Phone <span className="req">*</span>
                </label>
                <div className="input-prefix-group">
                  <span className="input-prefix">+91</span>
                  <input
                    type="tel"
                    maxLength="10"
                    className="form-input"
                    placeholder="10-digit number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label">
                Amount to Collect (₹) <span className="req">*</span>
              </label>
              <div className="input-prefix-group">
                <span className="input-prefix gpay-rupee">₹</span>
                <input
                  type="number"
                  min="1"
                  max="100000"
                  step="0.01"
                  className="form-input gpay-amount-input"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              {/* Quick amount chips */}
              <div className="quick-amount-chips">
                {QUICK_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`chip ${numAmount === val ? "selected" : ""}`}
                    onClick={() => setAmount(val.toString())}
                  >
                    ₹{val.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment note */}
            <div className="form-group">
              <label className="form-label">Note / Purpose (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Mobile Recharge, Purchase, Loan repayment"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength="50"
              />
            </div>

            {/* Preview */}
            {numAmount > 0 && (
              <div className="gpay-preview-card">
                <div className="gpay-preview-row">
                  <span>Customer</span>
                  <strong>{customerName || "—"}</strong>
                </div>
                <div className="gpay-preview-row">
                  <span>Phone</span>
                  <strong>{customerPhone ? `+91 ${customerPhone}` : "—"}</strong>
                </div>
                <div className="gpay-preview-row">
                  <span>Collecting to</span>
                  <strong>{STORE_PHONE} (GPay)</strong>
                </div>
                <div className="gpay-preview-divider" />
                <div className="gpay-preview-row gpay-amount-row">
                  <span>Amount</span>
                  <strong className="gpay-big-amount">
                    ₹{numAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={handleClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="gpay-open-btn"
                disabled={numAmount <= 0}
              >
                <span className="gpay-btn-icon">G</span>
                Open Google Pay &nbsp;→
              </button>
            </div>

            {/* Alternative UPI link */}
            {numAmount > 0 && (
              <div className="gpay-alt-link-row">
                <span>Not on GPay?</span>
                <a href={upiLink} target="_blank" rel="noreferrer" className="gpay-alt-link">
                  Open any UPI app ↗
                </a>
              </div>
            )}
          </form>
        ) : (
          /* ── STEP 2: CONFIRM PAYMENT RECEIVED ─── */
          <div className="modal-body gpay-confirm-body">
            <div className="gpay-confirm-icon">📲</div>
            <h3 className="gpay-confirm-title">Google Pay Opened!</h3>
            <p className="gpay-confirm-desc">
              Request of <strong>₹{numAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong> sent to <strong>{customerName}</strong>.
              <br />Ask the customer to approve the payment in their Google Pay app.
            </p>

            <div className="gpay-confirm-card">
              <div className="gpay-preview-row">
                <span>Collecting to</span>
                <strong>{STORE_PHONE} (GPay)</strong>
              </div>
              <div className="gpay-preview-row">
                <span>Amount</span>
                <strong className="gpay-big-amount">
                  ₹{numAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            <div className="gpay-confirm-actions">
              <button
                type="button"
                className="gpay-open-btn"
                onClick={() => window.open(gPayLink, "_blank")}
              >
                <span className="gpay-btn-icon">G</span>
                Re-open Google Pay
              </button>
              <button
                type="button"
                className="primary-button gpay-received-btn"
                onClick={handleConfirmReceived}
              >
                ✓ Payment Received — Save Record
              </button>
              <button type="button" className="secondary-button" onClick={handleClose}>
                Cancel / Not Paid
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
