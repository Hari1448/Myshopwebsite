import React, { useState } from "react";

const PRESET_ICONS = ["🏷️", "🌾", "🧴", "👟", "🎒", "💊", "🛠️", "🛒", "📦", "🎁", "📱", "🥛", "🪑", "📚", "🚗"];
const PRESET_COLORS = [
  { id: "blue", name: "Blue", bg: "#eff6ff" },
  { id: "emerald", name: "Emerald", bg: "#ecfdf5" },
  { id: "teal", name: "Teal", bg: "#f0fdfa" },
  { id: "purple", name: "Purple", bg: "#f5f3ff" },
  { id: "pink", name: "Pink", bg: "#fdf2f8" },
  { id: "orange", name: "Orange", bg: "#fff7ed" },
  { id: "cyan", name: "Cyan", bg: "#ecfeff" },
];

export default function AddCategoryModal({ isOpen, onClose, onAddCategory }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏷️");
  const [color, setColor] = useState("blue");
  const [description, setDescription] = useState("");
  const [isService, setIsService] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a category name.");
      return;
    }

    const newCategory = {
      id: name.trim().toLowerCase().replace(/[^a-z0-9]/g, "-"),
      name: name.trim(),
      icon,
      color,
      count: isService ? "Instant Service" : "0 items",
      description: description.trim() || `${name.trim()} products & goods`,
      isService,
    };

    onAddCategory(newCategory);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className={`modal-icon ${color}`}>{icon}</span>
            <div>
              <h3>Add New Category</h3>
              <p>Add a new product or service category to your store</p>
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
              Category Name <span className="req">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Groceries, Footwear, Stationery, Dairy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Icon Selection */}
          <div className="form-group">
            <label className="form-label">Choose Category Icon</label>
            <div className="icons-picker-row">
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  className={`icon-choice-btn ${icon === ic ? "selected" : ""}`}
                  onClick={() => setIcon(ic)}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="form-group">
            <label className="form-label">Category Theme Color</label>
            <div className="colors-picker-row">
              {PRESET_COLORS.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  className={`color-choice-pill ${color === col.id ? "selected" : ""} ${col.id}`}
                  onClick={() => setColor(col.id)}
                >
                  <span className="color-dot" style={{ background: col.bg }}></span>
                  {col.name}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Short Description / Subtext</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Rice, Dhal, Oils, Spices & FMCG"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isService}
                onChange={(e) => setIsService(e.target.checked)}
              />
              <span>This is an Instant Service (not physical goods inventory)</span>
            </label>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              + Add Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
