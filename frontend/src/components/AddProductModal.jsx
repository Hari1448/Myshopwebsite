import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function AddProductModal({
  isOpen,
  onClose,
  onAddProduct,
  categories,
  initialCategory,
}) {
  const physicalCategories = categories.filter((c) => !c.isService);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(
    initialCategory || physicalCategories[0]?.name || "Clothes"
  );
  const [stock, setStock] = useState("10");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [unit, setUnit] = useState("pcs");
  const [nextCode, setNextCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    } else if (physicalCategories.length > 0) {
      setCategory(physicalCategories[0].name);
    }
  }, [initialCategory, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setNextCode("");
    api.nextProductCode().then((r) => setNextCode(r.code)).catch(() => setNextCode(""));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter product name.");
      return;
    }

    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock < 0) {
      setError("Please enter valid stock quantity.");
      return;
    }

    // Price is entered at billing time; the product code (101, 102, ...) is created automatically.
    onAddProduct({
      name: name.trim(),
      category,
      price: 0,
      costPrice: 0,
      stock: numStock,
      lowStockThreshold: parseInt(lowStockThreshold, 10) || 5,
      unit: unit || "pcs",
    });
    setName("");
    setStock("10");
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon blue">📦</span>
            <div>
              <h3>Add New Product to Inventory</h3>
              <p>Name and stock - a product code is created automatically</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="form-alert error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Product Code (automatic)</label>
            <input
              type="text"
              className="form-input"
              value={nextCode === "" ? "Assigned when saved" : nextCode}
              readOnly
              style={{ background: "#f1f5f9", fontWeight: 700 }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Product Name <span className="req">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Cotton Formal Shirt"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
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
                {physicalCategories.map((c) => (
                  <option key={c.id || c.name} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Unit of Measure</label>
              <select
                className="form-select"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="bottle">Bottle</option>
                <option value="pack">Pack</option>
                <option value="box">Box</option>
                <option value="can">Can (20L)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="set">Set</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">
                Stock Quantity <span className="req">*</span>
              </label>
              <input
                type="number"
                min="0"
                className="form-input"
                placeholder="e.g. 15"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Low Stock Alert Level</label>
              <input
                type="number"
                min="1"
                className="form-input"
                placeholder="Alert when <= 5"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              + Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
