import React, { useState } from "react";
import WatercanManager from "./WatercanManager";

export default function CategoriesPage({
  categories,
  products,
  watercanCustomers = [],
  onAddWatercanPerson,
  onMarkWatercanPaid,
  onDeliverWatercan,
  onOpenAddCategory,
  onOpenAddProduct,
  onUpdateStock,
  onGoToBilling,
  onOpenRecharge,
  onOpenTransfer,
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(null); // When user clicks "View Inventory"

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  // If a category's inventory is being viewed
  const categoryProducts = activeCategory
    ? products.filter((p) => p.category === activeCategory.name)
    : [];

  const isWatercanActive =
    activeCategory &&
    (activeCategory.id === "watercan" ||
      activeCategory.name.toLowerCase().includes("watercan"));

  const handleCardClick = (cat) => {
    if (cat.action === "recharge") {
      onOpenRecharge();
    } else if (cat.action === "transfer") {
      onOpenTransfer();
    } else {
      setActiveCategory(cat);
    }
  };

  const totalWaterCansWithCustomers = watercanCustomers.reduce(
    (sum, c) => sum + (c.cansHeld || 0),
    0
  );

  return (
    <div className="categories-page">
      {/* View 1: When WATERCAN SUPPLY is clicked -> SHOW WATERCAN CUSTOMER REGISTER (ADD PERSON) */}
      {isWatercanActive ? (
        <WatercanManager
          watercanCustomers={watercanCustomers}
          onAddWatercanPerson={onAddWatercanPerson}
          onMarkAsPaid={onMarkWatercanPaid}
          onDeliverCan={onDeliverWatercan}
          onBack={() => setActiveCategory(null)}
        />
      ) : activeCategory ? (
        /* View 2: When Regular Retail Category is clicked -> SHOW PRODUCT INVENTORY VIEW */
        <div className="category-detail-inventory-view">
          {/* Back Navigation & Breadcrumb */}
          <div className="category-view-nav">
            <button
              type="button"
              className="back-to-categories-btn"
              onClick={() => setActiveCategory(null)}
            >
              ← Back to All Categories
            </button>
            <span className="crumb-sep">/</span>
            <span className="current-crumb">
              {activeCategory.icon} {activeCategory.name}
            </span>
          </div>

          {/* Category Info Header Card */}
          <div className="category-inventory-header-card">
            <div className="cat-header-left">
              <div className={`category-icon large ${activeCategory.color}`}>
                {activeCategory.icon}
              </div>
              <div>
                <h2>{activeCategory.name} Products</h2>
                <p className="cat-desc-text">{activeCategory.description}</p>
                <div className="cat-meta-tags">
                  <span className="cat-count-pill">
                    {categoryProducts.length} Products in Stock
                  </span>
                  <span className="cat-val-pill">
                    Total Value: ₹
                    {categoryProducts
                      .reduce((sum, p) => sum + p.price * p.stock, 0)
                      .toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="cat-header-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={onGoToBilling}
              >
                🛒 Open Billing Counter
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => onOpenAddProduct(activeCategory.name)}
              >
                + Add Product to {activeCategory.name}
              </button>
            </div>
          </div>

          {/* Products List for this Category */}
          <div className="section">
            <div className="section-heading">
              <div>
                <h3>
                  Inventory Items in {activeCategory.name} ({categoryProducts.length})
                </h3>
                <p>Live inventory, price management, and stock alerts for this category.</p>
              </div>
              <button
                type="button"
                className="primary-button add-item-sm-btn"
                onClick={() => onOpenAddProduct(activeCategory.name)}
              >
                + Add New Product
              </button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Selling Price</th>
                    <th>Cost Price</th>
                    <th>Current Stock</th>
                    <th>Stock Status</th>
                    <th>Restock Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-category-table">
                        <div className="empty-cat-box">
                          <span className="empty-cat-icon">📦</span>
                          <h4>No products added to {activeCategory.name} yet</h4>
                          <p>Start registering inventory items for this category.</p>
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => onOpenAddProduct(activeCategory.name)}
                          >
                            + Add First Product to {activeCategory.name}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    categoryProducts.map((p) => {
                      const isLow = p.stock > 0 && p.stock <= p.lowStockThreshold;
                      const isOut = p.stock === 0;

                      return (
                        <tr key={p.id}>
                          <td className="invoice-id">{p.id}</td>
                          <td>
                            <strong>{p.name}</strong>
                          </td>
                          <td>
                            <strong>₹{p.price.toFixed(2)}</strong>
                          </td>
                          <td>
                            <span className="cost-price-text">
                              ₹{(p.costPrice || p.price * 0.7).toFixed(2)}
                            </span>
                          </td>
                          <td>
                            <strong className="stock-number">
                              {p.stock} {p.unit || "pcs"}
                            </strong>
                          </td>
                          <td>
                            {isOut ? (
                              <span className="status pending">Out of Stock</span>
                            ) : isLow ? (
                              <span className="status pending low-stock-pill">
                                ⚠️ Low Stock (≤{p.lowStockThreshold})
                              </span>
                            ) : (
                              <span className="status paid">In Stock</span>
                            )}
                          </td>
                          <td>
                            <div className="stock-btn-group">
                              <button
                                type="button"
                                className="stock-adjust-btn"
                                onClick={() => onUpdateStock(p.id, 5)}
                                title="Add +5 units to stock"
                              >
                                +5 Restock
                              </button>
                              <button
                                type="button"
                                className="stock-adjust-btn"
                                onClick={() => onUpdateStock(p.id, 10)}
                                title="Add +10 units to stock"
                              >
                                +10
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
                  SUNMADHI Inventory · Category: {activeCategory.name}
                </p>
                <div className="table-counts-badge">
                  Showing {categoryProducts.length} items
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* View 3: All Categories Overview Grid */
        <>
          <div className="page-header-row">
            <div>
              <h2>Shop Categories ({categories.length})</h2>
              <p>
                Click on any category to view its customer register or product inventory.
              </p>
            </div>
            <div className="page-header-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => onOpenAddProduct()}
              >
                + Add Product
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={onOpenAddCategory}
              >
                + Add Category
              </button>
            </div>
          </div>

          {/* Category search & quick stats */}
          <div className="section-toolbar">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearch("")}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="toolbar-info">
              <span>
                {categories.filter((c) => !c.isService && c.id !== "watercan").length} Retail Product Categories
              </span>
              <span>·</span>
              <span>1 Watercan Customer Register</span>
              <span>·</span>
              <span>
                {categories.filter((c) => c.isService).length} Instant Counter Services
              </span>
            </div>
          </div>

          {/* Categories Grid */}
          <div className="category-grid full-page-grid">
            {filteredCategories.map((cat) => {
              const isWatercan =
                cat.id === "watercan" || cat.name.toLowerCase().includes("watercan");
              const productCount = products.filter((p) => p.category === cat.name).length;

              return (
                <div key={cat.id || cat.name} className="category-card interactive">
                  {cat.isService && <span className="service-tag">SERVICE</span>}
                  {isWatercan && <span className="service-tag cyan-tag">PERSONS REGISTER</span>}

                  <div
                    className={`category-icon ${cat.color}`}
                    onClick={() => handleCardClick(cat)}
                  >
                    {cat.icon}
                  </div>
                  <h3 onClick={() => handleCardClick(cat)}>{cat.name}</h3>
                  <p className="category-count">
                    {isWatercan
                      ? `${watercanCustomers.length} Persons · ${totalWaterCansWithCustomers} Cans`
                      : cat.isService
                      ? cat.count
                      : `${productCount} registered products`}
                  </p>
                  <p className="category-subtext">
                    {isWatercan
                      ? "Customer register with advance deposit & can delivery"
                      : cat.description}
                  </p>

                  <div className="category-card-actions-row">
                    <button
                      type="button"
                      className="cat-card-btn view-inv-btn"
                      onClick={() => handleCardClick(cat)}
                    >
                      {isWatercan
                        ? "👥 View Persons & Cans →"
                        : cat.isService
                        ? "⚡ Launch Service"
                        : "📦 View Inventory →"}
                    </button>

                    {isWatercan ? (
                      <button
                        type="button"
                        className="cat-card-btn add-prod-btn cyan-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCategory(cat);
                        }}
                        title="Add new person / customer to Watercan Supply"
                      >
                        + Add Person
                      </button>
                    ) : !cat.isService ? (
                      <button
                        type="button"
                        className="cat-card-btn add-prod-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAddProduct(cat.name);
                        }}
                        title={`Add new product to ${cat.name}`}
                      >
                        + Add Product
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Add Callout near the categories */}
          <div className="add-category-callout-banner">
            <div className="callout-left">
              <span className="callout-icon">✨</span>
              <div>
                <h4>Need to start a new business category or add products?</h4>
                <p>
                  Add Stationery, Groceries, Footwear, or manage your water can customer register anytime.
                </p>
              </div>
            </div>
            <div className="callout-btns">
              <button
                type="button"
                className="secondary-button"
                onClick={() => onOpenAddProduct()}
              >
                + Add Product
              </button>
              <button
                type="button"
                className="primary-button add-cat-callout-btn"
                onClick={onOpenAddCategory}
              >
                + Add Category Now
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
