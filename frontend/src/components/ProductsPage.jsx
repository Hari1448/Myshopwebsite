import React, { useState } from "react";

export default function ProductsPage({
  products,
  categories,
  onOpenAddProduct,
  onUpdateStock,
  onGoToBilling,
}) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");
  const [stockFilter, setStockFilter] = useState("all"); // 'all' | 'low' | 'out'

  // Per-product restock quantity map: { [productId]: number }
  const [restockQty, setRestockQty] = useState({});

  const physicalCategories = categories.filter((c) => !c.isService);

  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= p.lowStockThreshold
  ).length;

  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCat === "all" || p.category === selectedCat;
    const matchesSearch =
      search.trim() === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      String(p.code ?? "").includes(search.trim());

    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && p.stock > 0 && p.stock <= p.lowStockThreshold) ||
      (stockFilter === "out" && p.stock === 0);

    return matchesCat && matchesSearch && matchesStock;
  });

  return (
    <div className="products-page">
      <div className="page-header-row">
        <div>
          <h2>Product Inventory & Stock Management</h2>
          <p>Monitor real-time stock levels, restock items, and track low-stock inventory alerts.</p>
        </div>
        <div className="page-header-actions">
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
            onClick={onOpenAddProduct}
          >
            + Add New Product
          </button>
        </div>
      </div>

      {/* Stock Alert Summary Cards */}
      <div className="stats-grid">
        {/* Card 1: Total Products — click to show all */}
        <div
          className={`stat-card stat-card-clickable ${stockFilter === "all" ? "stat-card-active" : ""}`}
          onClick={() => { setStockFilter("all"); setSelectedCat("all"); setSearch(""); }}
          title="Click to view all products"
        >
          <div className="stat-top">
            <span>Total Products Catalog</span>
            <span className="stat-icon blue">📦</span>
          </div>
          <h2>{products.length}</h2>
          <p>Across {physicalCategories.length} retail categories</p>
          <span className="stat-card-filter-hint">View All →</span>
        </div>

        {/* Card 2: Low Stock — click to filter low stock */}
        <div
          className={`stat-card stat-card-clickable ${stockFilter === "low" ? "stat-card-active stat-card-active-orange" : ""}`}
          onClick={() => { setStockFilter("low"); setSelectedCat("all"); setSearch(""); }}
          title="Click to view low stock items"
        >
          <div className="stat-top">
            <span>Low Stock Items (Alert)</span>
            <span className="stat-icon orange">⚠️</span>
          </div>
          <h2 className={lowStockCount > 0 ? "orange-text" : ""}>{lowStockCount}</h2>
          <p>{lowStockCount > 0 ? "Items below minimum threshold" : "Stock healthy"}</p>
          <span className="stat-card-filter-hint">View Low Stock →</span>
        </div>

        {/* Card 3: Out of Stock — click to filter out-of-stock */}
        <div
          className={`stat-card stat-card-clickable ${stockFilter === "out" ? "stat-card-active stat-card-active-red" : ""}`}
          onClick={() => { setStockFilter("out"); setSelectedCat("all"); setSearch(""); }}
          title="Click to view out of stock items"
        >
          <div className="stat-top">
            <span>Out of Stock</span>
            <span className="stat-icon purple">🚫</span>
          </div>
          <h2 className={outOfStockCount > 0 ? "red-text" : ""}>{outOfStockCount}</h2>
          <p>{outOfStockCount > 0 ? "Need immediate restocking" : "None out of stock"}</p>
          <span className="stat-card-filter-hint">View Out of Stock →</span>
        </div>

        {/* Card 4: Inventory Valuation — click to show all */}
        <div
          className={`stat-card stat-card-clickable ${stockFilter === "all" && search === "" && selectedCat === "all" ? "" : ""}`}
          onClick={() => { setStockFilter("all"); setSelectedCat("all"); setSearch(""); }}
          title="Click to view full inventory"
        >
          <div className="stat-top">
            <span>Inventory Valuation</span>
            <span className="stat-icon green">₹</span>
          </div>
          <h2>
            ₹{products
              .reduce((sum, p) => sum + p.price * p.stock, 0)
              .toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </h2>
          <p>Total retail value in stock</p>
          <span className="stat-card-filter-hint">View Inventory →</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="section">
        <div className="table-controls">
          <div className="filter-pill-group">
            <button
              type="button"
              className={`filter-pill ${stockFilter === "all" ? "active" : ""}`}
              onClick={() => setStockFilter("all")}
            >
              All Items ({products.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${stockFilter === "low" ? "active" : ""}`}
              onClick={() => setStockFilter("low")}
            >
              ⚠️ Low Stock ({lowStockCount})
            </button>
            {outOfStockCount > 0 && (
              <button
                type="button"
                className={`filter-pill ${stockFilter === "out" ? "active" : ""}`}
                onClick={() => setStockFilter("out")}
              >
                🚫 Out of Stock ({outOfStockCount})
              </button>
            )}
          </div>

          <div className="table-search-row">
            <select
              className="form-select form-select-sm"
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
            >
              <option value="all">All Categories</option>
              {physicalCategories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>

            <div className="search-box">
              <input
                type="text"
                placeholder="Search by name or code..."
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
        </div>

        {/* Inventory Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Stock Status</th>
                <th>Restock Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-table-row">
                    No products found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.lowStockThreshold;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p.id}>
                      <td className="invoice-id">{p.code}</td>
                      <td>
                        <strong>{p.name}</strong>
                      </td>
                      <td>
                        <span className={`cat-badge ${p.category.toLowerCase().replace(/[^a-z]/g, "-")}`}>
                          {p.category}
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
                        <div className="restock-stepper-wrap">
                          {/* Decrease button */}
                          <button
                            type="button"
                            className="restock-step-btn restock-minus"
                            onClick={() =>
                              setRestockQty((prev) => ({
                                ...prev,
                                [p.id]: Math.max(1, (prev[p.id] ?? 1) - 1),
                              }))
                            }
                            title="Decrease quantity"
                          >
                            −
                          </button>

                          {/* Manual quantity input */}
                          <input
                            type="number"
                            min="1"
                            className="restock-qty-input"
                            value={restockQty[p.id] ?? 1}
                            onChange={(e) => {
                              const v = parseInt(e.target.value, 10);
                              setRestockQty((prev) => ({
                                ...prev,
                                [p.id]: isNaN(v) || v < 1 ? 1 : v,
                              }));
                            }}
                            title="Enter quantity"
                          />

                          {/* Increase button */}
                          <button
                            type="button"
                            className="restock-step-btn restock-plus"
                            onClick={() =>
                              setRestockQty((prev) => ({
                                ...prev,
                                [p.id]: (prev[p.id] ?? 1) + 1,
                              }))
                            }
                            title="Increase quantity"
                          >
                            +
                          </button>

                          {/* Apply restock */}
                          <button
                            type="button"
                            className="restock-apply-btn"
                            onClick={() => {
                              onUpdateStock(p.id, restockQty[p.id] ?? 1);
                              setRestockQty((prev) => ({ ...prev, [p.id]: 1 }));
                            }}
                            title={`Add ${restockQty[p.id] ?? 1} units to stock`}
                          >
                            ✓ Add
                          </button>

                          {/* Remove stock */}
                          <button
                            type="button"
                            className="restock-remove-btn"
                            onClick={() => {
                              onUpdateStock(p.id, -(restockQty[p.id] ?? 1));
                              setRestockQty((prev) => ({ ...prev, [p.id]: 1 }));
                            }}
                            title={`Remove ${restockQty[p.id] ?? 1} units from stock`}
                          >
                            − Remove
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
              Live Stock Level Synchronization · Automatically decreases on counter billing checkout
            </p>
            <div className="table-counts-badge">
              Showing {filteredProducts.length} of {products.length} products
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
