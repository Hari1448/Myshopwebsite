import React, { useState } from "react";

export default function NewSaleModal({ isOpen, onClose, onSaleSuccess, categories }) {
  const [item, setItem] = useState("");
  const [category, setCategory] = useState("Clothes");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("Paid");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!item.trim()) {
      setError("Please enter the product or item description.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    const newSale = {
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      item: item.trim(),
      category,
      amount: numAmount,
      fee: 0,
      status,
      type: "Retail",
      date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
      fullDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    };

    onSaleSuccess(newSale);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon blue">🛍️</span>
            <div>
              <h3>Record New Sale</h3>
              <p>Add a sale entry to your store ledger</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="form-alert error">{error}</div>}

          <div className="form-group">
            <label className="form-label">
              Product / Item Name <span className="req">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Silk Saree, Hair Dryer, 20L Water Can"
              value={item}
              onChange={(e) => setItem(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Payment Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Total Amount (₹) <span className="req">*</span>
            </label>
            <div className="input-prefix-group">
              <span className="input-prefix">₹</span>
              <input
                type="number"
                min="1"
                step="0.01"
                className="form-input text-lg font-bold"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Record Sale →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
