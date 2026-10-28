import React from "react";

export default function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const isDMT = receipt.category === "Money Transfer" || receipt.type === "Money Transfer";
  const isRecharge = receipt.category === "Recharge" || receipt.type === "Recharge";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card receipt-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-view" id="printable-receipt">
          {/* Shop Header */}
          <div className="receipt-header">
            <div className="receipt-store-logo">S</div>
            <h2>SUNMADHI STORE</h2>
            <p className="receipt-store-tag">MULTI-SERVICE SHOP & MONEY TRANSFER</p>
            <p className="receipt-store-contact">Main Road, Near Bus Stand · Phone: +91 98401 98401</p>
          </div>

          <div className="receipt-status-banner">
            <span className="receipt-check">✓</span>
            <div>
              <h4>TRANSACTION SUCCESSFUL</h4>
              <p>{receipt.fullDate || "Today"} · {receipt.date || "Just now"}</p>
            </div>
          </div>

          <div className="receipt-divider"></div>

          {/* Details Table */}
          <div className="receipt-details">
            <div className="receipt-row">
              <span className="label">Transaction / Invoice ID:</span>
              <strong className="value id-value">{receipt.id}</strong>
            </div>

            {receipt.utr && (
              <div className="receipt-row">
                <span className="label">Bank UTR Reference:</span>
                <strong className="value font-mono">{receipt.utr}</strong>
              </div>
            )}

            <div className="receipt-row">
              <span className="label">Service Category:</span>
              <span className="value badge-cat">{receipt.category}</span>
            </div>

            <div className="receipt-row">
              <span className="label">Description / Item:</span>
              <span className="value">{receipt.item}</span>
            </div>

            {receipt.destination && (
              <div className="receipt-row">
                <span className="label">Beneficiary / Destination:</span>
                <span className="value">{receipt.destination}</span>
              </div>
            )}

            {receipt.senderPhone && (
              <div className="receipt-row">
                <span className="label">Sender Mobile:</span>
                <span className="value">+91 {receipt.senderPhone}</span>
              </div>
            )}

            {receipt.targetNumber && (
              <div className="receipt-row">
                <span className="label">Recharged Number:</span>
                <span className="value">{receipt.targetNumber} ({receipt.operator})</span>
              </div>
            )}

            {receipt.planSummary && (
              <div className="receipt-row">
                <span className="label">Plan Details:</span>
                <span className="value plan-text">{receipt.planSummary}</span>
              </div>
            )}

            <div className="receipt-divider"></div>

            {/* Financials */}
            <div className="receipt-row">
              <span className="label">Base Amount:</span>
              <span className="value">₹{receipt.amount?.toFixed(2)}</span>
            </div>

            {receipt.fee !== undefined && receipt.fee > 0 && (
              <div className="receipt-row">
                <span className="label">Service Charge / Convenience Fee:</span>
                <span className="value">₹{receipt.fee?.toFixed(2)}</span>
              </div>
            )}

            <div className="receipt-row grand-total">
              <span className="label">Total Paid:</span>
              <strong className="value total-val">
                ₹{(receipt.totalCollected || (receipt.amount + (receipt.fee || 0))).toFixed(2)}
              </strong>
            </div>

            <div className="receipt-row payment-status">
              <span className="label">Payment Mode & Status:</span>
              <span className="value status-pill success">CASH PAID · COMPLETED</span>
            </div>
          </div>

          <div className="receipt-footer">
            <p className="thank-you">Thank you for visiting SUNMADHI STORE!</p>
            <p className="terms">Computer generated receipt · Valid across all authorized partner services</p>
          </div>
        </div>

        <div className="modal-actions-bar">
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
          <button type="button" className="primary-button print-btn" onClick={handlePrint}>
            🖨️ Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
