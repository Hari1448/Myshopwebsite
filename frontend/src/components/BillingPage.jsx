import React, { useState } from "react";
import { api } from "../api";
import "../pos-billing.css";

export default function BillingPage({
  products,
  categories,
  onCompleteBill,
  onOpenQuickRecharge,
  onOpenQuickTransfer,
}) {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [addItemMode, setAddItemMode] = useState("catalog"); // 'catalog' | 'custom'

  // Custom Item Form
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [customItemQty, setCustomItemQty] = useState("1");
  const [customItemCategory, setCustomItemCategory] = useState("General");

  // Customer & Bill Details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash"); // Cash | UPI | Credit | Online
  const [upiApp, setUpiApp] = useState("Google Pay");
  const [upiRefNumber, setUpiRefNumber] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [receivedAmount, setReceivedAmount] = useState(""); // cash given by customer
  const [discount, setDiscount] = useState("0");
  const [creditNotes, setCreditNotes] = useState("");
  const [error, setError] = useState("");

  const physicalCategories = categories.filter((c) => !c.isService);

  // Filter products for the billing catalog
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.code ?? "").includes(searchQuery.trim());
    return matchesCat && matchesSearch;
  });

  // Cart operations
  const addToCart = (product) => {
    setError("");
    const existing = cart.find((item) => item.id === product.id);
    const currentQtyInCart = existing ? Number(existing.quantity || 0) : 0;
    if (currentQtyInCart + 1 > product.stock) {
      setError(`Cannot add more "${product.name}". Only ${product.stock} left in stock!`);
      return;
    }
    if (existing) {
      setCart(cart.map((item) => (item.id === product.id ? { ...item, quantity: Number(item.quantity || 0) + 1 } : item)));
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          code: product.code,
          name: product.name,
          category: product.category,
          price: product.price > 0 ? product.price : "",
          quantity: 1,
          maxStock: product.stock,
          unit: product.unit || "pcs",
        },
      ]);
    }
  };

  // Add Custom / Loose Item to Cart
  const handleAddCustomItem = (e) => {
    e.preventDefault();
    setError("");

    if (!customItemName.trim()) {
      setError("Please enter the custom item name.");
      return;
    }

    const priceNum = parseFloat(customItemPrice);
    if (!priceNum || priceNum <= 0) {
      setError("Please enter a valid price for the custom item.");
      return;
    }

    const qtyNum = parseInt(customItemQty, 10) || 1;
    const customId = `CST-${Date.now().toString().slice(-6)}`;

    setCart([
      ...cart,
      {
        id: customId,
        name: customItemName.trim(),
        category: customItemCategory || "General",
        price: priceNum,
        quantity: qtyNum,
        maxStock: 9999,
        unit: "pcs",
        isCustom: true,
      },
    ]);

    setCustomItemName("");
    setCustomItemPrice("");
    setCustomItemQty("1");
  };

  const updateQuantity = (productId, newQty) => {
    setError("");
    if (newQty === "") {
      setCart(cart.map((it) => (it.id === productId ? { ...it, quantity: "" } : it)));
      return;
    }
    const n = Number(newQty);
    if (!Number.isFinite(n)) return;
    if (n <= 0) {
      removeFromCart(productId);
      return;
    }
    const item = cart.find((it) => it.id === productId);
    if (item && !item.isCustom) {
      const product = products.find((p) => p.id === productId);
      if (product && Math.floor(n) > product.stock) {
        setError(`Cannot set quantity to ${Math.floor(n)}. Only ${product.stock} available in stock!`);
        return;
      }
    }
    setCart(cart.map((it) => (it.id === productId ? { ...it, quantity: Math.floor(n) } : it)));
  };

  const updatePrice = (productId, newPrice) => {
    setError("");
    setCart(cart.map((it) => (it.id === productId ? { ...it, price: newPrice } : it)));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setError("");
    setDiscount("0");
    setCustomerName("");
    setCustomerPhone("");
    setPaidAmount("");
    setReceivedAmount("");
    setCreditNotes("");
    setPaymentMode("Cash");
    setUpiRefNumber("");
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  const discountVal = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discountVal);

  const numReceived = parseFloat(receivedAmount) || 0;
  const changeToReturn = paymentMode === "Cash" && numReceived > grandTotal ? numReceived - grandTotal : 0;
  const stillToCollect = paymentMode === "Cash" && numReceived > 0 && numReceived < grandTotal ? grandTotal - numReceived : 0;

  const numPaid = parseFloat(paidAmount) || 0;
  const creditBalance = paymentMode === "Credit" ? Math.max(0, grandTotal - numPaid) : 0;

  const startOnlinePayment = async (billData, cartSnapshot) => {
    const config = await api.paymentConfig();
    if (!config.enabled || !config.keyId) throw new Error("Online payments are not configured. Add Razorpay test keys to backend/.env first.");
    if (!window.Razorpay) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = resolve;
        script.onerror = () => reject(new Error("Could not load Razorpay Checkout. Check your internet connection."));
        document.body.appendChild(script);
      });
    }
    const order = await api.createPaymentOrder({ amount: grandTotal, receipt: billData.id });
    await new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, name: "SUNMADHI STORE",
        description: `Invoice ${billData.id}`, order_id: order.orderId,
        prefill: { name: billData.customerName || "", contact: billData.customerPhone || "" },
        theme: { color: "#1d4ed8" },
        handler: async (response) => {
          try {
            const verification = await api.verifyPayment(response);
            if (!verification.verified) throw new Error("Payment could not be verified.");
            await onCompleteBill({ ...billData, paymentMode: "Online", status: "Paid", paidAmount: grandTotal, creditAmount: 0, notes: `${billData.notes || ""} Razorpay payment ${verification.paymentId}` }, cartSnapshot);
            clearCart();
            resolve();
          } catch (err) { setError(err.message || "Payment verification failed. Do not treat this order as paid."); reject(err); }
        },
        modal: { ondismiss: () => reject(new Error("Payment window closed. No invoice was saved as paid.")) }
      });
      checkout.on("payment.failed", (response) => reject(new Error(response.error?.description || "Payment failed. Please try again.")));
      checkout.open();
    });
  };

  // Handle billing submission (Place Bill)
  const handlePlaceBill = async (e) => {
    e.preventDefault();
    setError("");

    if (cart.length === 0) {
      setError("Please add at least one item to the bill before placing.");
      return;
    }

    if (paymentMode === "Credit") {
      if (!customerName.trim()) {
        setError("Customer Name is required for Credit / கடன் bills!");
        return;
      }
      if (!customerPhone.trim() || customerPhone.trim().length < 10) {
        setError("Valid 10-digit Customer Phone is required for Credit records.");
        return;
      }
    }

    for (const item of cart) {
      if (!item.isCustom) {
        const prod = products.find((p) => p.id === item.id);
        if (!prod || prod.stock < Number(item.quantity)) {
          setError(`Insufficient stock for "${item.name}". Only ${prod ? prod.stock : 0} left in stock.`);
          return;
        }
      }
      if (!(Number(item.quantity) > 0)) {
        setError(`Enter a quantity for "${item.name}".`);
        return;
      }
      if (!(Number(item.price) > 0)) {
        setError(`Enter the rate for "${item.name}".`);
        return;
      }
    }
    if (paymentMode === "Cash" && numReceived > 0 && numReceived < grandTotal) {
      setError(`Cash received (₹${numReceived.toFixed(2)}) is less than the bill (₹${grandTotal.toFixed(2)}). Still to collect ₹${(grandTotal - numReceived).toFixed(2)}.`);
      return;
    }
    const cartFinal = cart.map((it) => ({ ...it, price: Number(it.price), quantity: Number(it.quantity) }));

    const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const itemsSummary = cartFinal.map((it) => `${it.quantity}x ${it.name}`).join(", ");
    const generatedUpiRef =
      upiRefNumber.trim() || `UPI${Date.now().toString().slice(-8)}`;

    const billData = {
      id: invoiceId,
      customerName: customerName.trim() || "Walk-in Customer",
      customerPhone: customerPhone.trim(),
      item: cart.length === 1 ? cart[0].name : `${cart[0].name} + ${cart.length - 1} more items`,
      itemsSummary,
      items: cartFinal,
      category: cart[0]?.category || "General",
      subtotal,
      discount: discountVal,
      amount: grandTotal,
      paymentMode,
      upiApp: paymentMode === "UPI" ? upiApp : null,
      upiRef: paymentMode === "UPI" ? generatedUpiRef : null,
      paidAmount: paymentMode === "Credit" ? numPaid : grandTotal,
      creditAmount: creditBalance,
      receivedAmount: paymentMode === "Cash" && numReceived > 0 ? numReceived : 0,
      changeAmount: paymentMode === "Cash" ? changeToReturn : 0,
      status: paymentMode === "Credit" && creditBalance > 0 ? "Pending" : "Paid",
      type: "Retail",
      notes: creditNotes,
      date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
      fullDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    };

    try {
      if (paymentMode === "Online") {
        await startOnlinePayment(billData, cartFinal);
        return;
      }
      await onCompleteBill(billData, cartFinal);
      clearCart();
    } catch (err) {
      setError(err?.message || "Bill could not be saved. Please try again.");
    }
  };

  return (
    <div className="pos-billing-page">
      {cart.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button type="button" className="secondary-button" onClick={clearCart}>
            ✕ Clear Bill
          </button>
        </div>
      )}

      {error && <div className="form-alert error pos-page-alert">{error}</div>}

      {/* Main 2-Column POS Layout */}
      <div className="pos-two-col-layout">
        {/* =========================================================
            COLUMN 1: ADD ITEMS TO BILL (CATALOG + CUSTOM ITEMS)
           ========================================================= */}
        <div className="pos-add-bill-panel">
          <div className="panel-header-box">
            <div className="panel-title-wrap">
              <span className="panel-step-num">1</span>
              <div>
                <h3>Add Items to Bill</h3>
                <p>Choose from inventory catalog or add loose custom items</p>
              </div>
            </div>

            {/* Catalog vs Custom Item Mode Tabs */}
            <div className="add-mode-toggle-pills">
              <button
                type="button"
                className={`add-mode-btn ${addItemMode === "catalog" ? "active" : ""}`}
                onClick={() => setAddItemMode("catalog")}
              >
                📦 Store Catalog
              </button>
              <button
                type="button"
                className={`add-mode-btn ${addItemMode === "custom" ? "active" : ""}`}
                onClick={() => setAddItemMode("custom")}
              >
                ✏️ Custom / Loose Item
              </button>
            </div>
          </div>

          {/* Mode A: Store Inventory Catalog */}
          {addItemMode === "catalog" ? (
            <div className="catalog-browser-wrap">
              {/* Search & Category Pills */}
              <div className="catalog-filter-bar">
                <div className="catalog-search-input-wrap">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const match = products.find((p) => String(p.code) === searchQuery.trim());
                        if (match) {
                          addToCart(match);
                          setSearchQuery("");
                        }
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSearchQuery("")}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="category-scroll-pills">
                  <button
                    type="button"
                    className={`cat-scroll-pill ${selectedCategory === "all" ? "active" : ""}`}
                    onClick={() => setSelectedCategory("all")}
                  >
                    All Items
                  </button>
                  {physicalCategories.map((c) => (
                    <button
                      key={c.id || c.name}
                      type="button"
                      className={`cat-scroll-pill ${selectedCategory === c.name ? "active" : ""}`}
                      onClick={() => setSelectedCategory(c.name)}
                    >
                      {c.icon} {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Cards Grid */}
              <div className="pos-products-grid">
                {filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.lowStockThreshold;
                  const isOut = p.stock === 0;
                  const itemInCart = cart.find((it) => it.id === p.id);

                  return (
                    <div
                      key={p.id}
                      className={`pos-product-item-card ${isOut ? "disabled-card" : ""} ${
                        itemInCart ? "in-bill-card" : ""
                      }`}
                      onClick={() => !isOut && addToCart(p)}
                    >
                      <div className="card-top-row">
                        <span className="category-tag-pill">{p.category}</span>
                        {isOut ? (
                          <span className="stock-pill out">Out of Stock</span>
                        ) : isLow ? (
                          <span className="stock-pill low">Low: {p.stock} {p.unit}</span>
                        ) : (
                          <span className="stock-pill in">{p.stock} {p.unit}</span>
                        )}
                      </div>

                      <h4 className="product-title-text">{p.code} - {p.name}</h4>

                      <div className="card-bottom-row">
                        <div className="price-tag-wrap">
                          <strong>#{p.code}</strong>
                        </div>
                        <button
                          type="button"
                          className={`add-bill-btn ${itemInCart ? "btn-in-bill" : ""}`}
                          disabled={isOut}
                        >
                          {itemInCart ? `In Bill (${itemInCart.quantity})` : "+ Add"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Mode B: Add Quick Custom / Loose Item Form */
            <div className="custom-item-card-form">
              <div className="custom-form-notice">
                <span>💡</span>
                <p>
                  Add any non-catalog product, loose grocery, tailoring charge, or custom store service directly to this bill.
                </p>
              </div>

              <form onSubmit={handleAddCustomItem} className="custom-form-inputs">
                <div className="form-group">
                  <label className="form-label">
                    Item / Service Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 2kg Loose Rice, Gift Wrapping, Xerox Copy"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">
                      Unit Price (₹) <span className="req">*</span>
                    </label>
                    <div className="input-prefix-group">
                      <span className="input-prefix">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        className="form-input text-lg font-bold"
                        placeholder="0.00"
                        value={customItemPrice}
                        onChange={(e) => setCustomItemPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group flex-1">
                    <label className="form-label">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={customItemQty}
                      onChange={(e) => setCustomItemQty(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={customItemCategory}
                    onChange={(e) => setCustomItemCategory(e.target.value)}
                  >
                    <option value="General">General / Loose</option>
                    <option value="Clothes">Clothes</option>
                    <option value="Cosmetics">Cosmetics</option>
                    <option value="Fancy Store">Fancy Store</option>
                    <option value="Electrical & Electronics">Electricals</option>
                    <option value="Services">Custom Services</option>
                  </select>
                </div>

                <button type="submit" className="primary-button add-custom-item-btn">
                  + Add Custom Item to Bill
                </button>
              </form>
            </div>
          )}
        </div>

        {/* =========================================================
            COLUMN 2: REVIEW & PLACE BILL (CART, TOTALS & PAYMENT)
           ========================================================= */}
        <div className="pos-place-bill-panel">
          <div className="panel-header-box">
            <div className="panel-title-wrap">
              <span className="panel-step-num step-2">2</span>
              <div>
                <h3>Review & Place Bill</h3>
                <p>Verify customer, bill items, and select payment mode</p>
              </div>
            </div>
            <span className="cart-count-badge">{cart.length} items</span>
          </div>

          {/* Customer Details Box */}
          <div className="customer-info-box">
            <div className="customer-box-header">
              <span className="box-section-title">Customer Information</span>
              <button
                type="button"
                className="walk-in-btn"
                onClick={() => {
                  setCustomerName("Walk-in Customer");
                  setCustomerPhone("");
                }}
              >
                + Walk-in Customer
              </button>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label">
                  Customer Name {paymentMode === "Credit" && <span className="req">*</span>}
                </label>
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="e.g. Ramesh Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label">
                  Phone (10 digits) {paymentMode === "Credit" && <span className="req">*</span>}
                </label>
                <input
                  type="tel"
                  maxLength="10"
                  className="form-input form-input-sm"
                  placeholder="e.g. 9840123456"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>
          </div>

          {/* Bill Items List */}
          <div className="bill-items-container">
            {cart.length === 0 ? (
              <div className="empty-bill-box">
                <span className="empty-bill-icon">🛒</span>
                <h4>Your bill is currently empty</h4>
                <p>Click items from the catalog on the left to add them to this bill.</p>
              </div>
            ) : (
              <table className="pos-bill-table">
                <thead>
                  <tr>
                    <th>Code / Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Rate (₹)</th>
                    <th className="text-right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong className="bill-item-name">{item.code ? `${item.code} - ` : ""}{item.name}</strong>
                        <span className="bill-item-sub">
                          {item.category} {item.isCustom && "· Custom"}
                        </span>
                      </td>
                      <td className="text-center">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          className="form-input"
                          style={{ width: 80, textAlign: "center" }}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, e.target.value)}
                        />
                      </td>
                      <td className="text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="form-input"
                          style={{ width: 100, textAlign: "right" }}
                          placeholder="Rate"
                          value={item.price}
                          onChange={(e) => updatePrice(item.id, e.target.value)}
                        />
                      </td>
                      <td className="text-right font-bold">
                        ₹{((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          className="item-remove-btn"
                          onClick={() => removeFromCart(item.id)}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Calculation Breakdown */}
          <div className="bill-calculation-card">
            <div className="calc-row">
              <span>Subtotal ({cart.length} items):</span>
              <strong>₹{subtotal.toFixed(2)}</strong>
            </div>

            <div className="calc-row discount-input-row">
              <span>Special Discount (₹):</span>
              <input
                type="number"
                min="0"
                max={subtotal}
                className="pos-discount-input"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>

            <div className="calc-divider"></div>

            <div className="calc-row grand-total-line">
              <span>Total Bill Amount:</span>
              <strong className="grand-total-amount">₹{grandTotal.toFixed(2)}</strong>
            </div>

            {paymentMode === "Cash" && (
              <>
                <div className="calc-divider"></div>
                <div className="calc-row discount-input-row">
                  <span>Cash Received from Customer (₹):</span>
                  <input
                    type="number"
                    min="0"
                    className="pos-discount-input"
                    placeholder="e.g. 500"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                  />
                </div>
                <div className="calc-row">
                  <span>Balance to Give Back:</span>
                  <strong style={{ color: "#15803d", fontSize: 20 }}>₹{changeToReturn.toFixed(2)}</strong>
                </div>
                {stillToCollect > 0 && (
                  <div className="calc-row">
                    <span>Still to Collect:</span>
                    <strong style={{ color: "#dc2626" }}>₹{stillToCollect.toFixed(2)}</strong>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="payment-method-selector-box">
            <label className="form-label font-bold">Choose Payment Method</label>
            <div className="payment-cards-grid">
              {/* Option 1: Cash */}
              <div
                className={`payment-method-card ${paymentMode === "Cash" ? "selected" : ""}`}
                onClick={() => setPaymentMode("Cash")}
              >
                <span className="payment-card-icon">💵</span>
                <strong>Cash</strong>
                <small>Pay at Counter</small>
              </div>

              {/* Option 2: UPI */}
              <div
                className={`payment-method-card upi-card ${paymentMode === "UPI" ? "selected" : ""}`}
                onClick={() => setPaymentMode("UPI")}
              >
                <span className="payment-card-icon">📱</span>
                <strong>UPI / QR</strong>
                <small>GPay · PhonePe · QR</small>
              </div>

              {/* Option 3: Online payment gateway */}
              <div
                className={`payment-method-card ${paymentMode === "Online" ? "selected" : ""}`}
                onClick={() => setPaymentMode("Online")}
              >
                <span className="payment-card-icon">🔐</span>
                <strong>Online Payment</strong>
                <small>Secure Razorpay Checkout</small>
              </div>

              {/* Option 4: Credit */}
              <div
                className={`payment-method-card credit-card ${paymentMode === "Credit" ? "selected" : ""}`}
                onClick={() => setPaymentMode("Credit")}
              >
                <span className="payment-card-icon">📋</span>
                <strong>Credit / கடன்</strong>
                <small>Pay Later</small>
              </div>
            </div>
          </div>

          {/* UPI SPECIFIC PAYMENT ENTRY CARD */}
          {paymentMode === "UPI" && (
            <div className="upi-payment-details-card">
              <div className="upi-card-header">
                <span className="upi-badge">UPI PAYMENT DETAILS</span>
                <span className="upi-vpa-text">Merchant: <strong>9840198401@paytm</strong></span>
              </div>

              <div className="form-group">
                <label className="form-label">Payment App Used by Customer</label>
                <div className="upi-app-pills">
                  {["Google Pay", "PhonePe", "Paytm", "BHIM / Other"].map((app) => (
                    <button
                      key={app}
                      type="button"
                      className={`upi-app-btn ${upiApp === app ? "active" : ""}`}
                      onClick={() => setUpiApp(app)}
                    >
                      {app}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  UPI UTR / Reference Number (Optional)
                </label>
                <input
                  type="text"
                  className="form-input font-mono"
                  placeholder="e.g. 429104829103 or leave blank to auto-generate"
                  value={upiRefNumber}
                  onChange={(e) => setUpiRefNumber(e.target.value)}
                />
              </div>

              <div className="upi-print-notice">
                <span>✓</span>
                <p>
                  UPI Payment & UTR reference will be <strong>explicitly printed on the customer bill invoice</strong>.
                </p>
              </div>
            </div>
          )}

          {/* CREDIT SPECIFIC ENTRY CARD */}
          {paymentMode === "Credit" && (
            <div className="credit-details-entry-card">
              <div className="credit-card-header">
                <strong>📋 Customer Credit / கடன் Details</strong>
                <span className="badge-credit">Pay Later</span>
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label className="form-label">Amount Paid Now (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    className="form-input"
                    placeholder="0.00"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>

                <div className="form-group flex-1">
                  <label className="form-label">Balance Due (Credit)</label>
                  <div className="credit-balance-display">
                    ₹{creditBalance.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date / Notes</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Will pay in 1 week / salary day"
                  value={creditNotes}
                  onChange={(e) => setCreditNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* PLACE BILL BUTTON */}
          <div className="place-bill-action-box">
            <button
              type="button"
              className="primary-button place-bill-large-btn"
              disabled={cart.length === 0}
              onClick={handlePlaceBill}
            >
              {paymentMode === "Credit"
                ? `🛒 PLACE BILL & RECORD ₹${creditBalance.toFixed(2)} CREDIT →`
                : paymentMode === "UPI"
                ? `📱 PLACE BILL & PRINT UPI INVOICE (₹${grandTotal.toFixed(2)}) →`
                : paymentMode === "Online"
                ? `🔐 PAY SECURELY & SAVE INVOICE (₹${grandTotal.toFixed(2)}) →`
                : `💵 PLACE BILL & PRINT INVOICE (₹${grandTotal.toFixed(2)}) →`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
