import { useEffect, useState } from "react";
import { api, login as apiLogin, logout as apiLogout, getToken } from "./api";
import AddCategoryModal from "./components/AddCategoryModal";
import AddProductModal from "./components/AddProductModal";
import BillingPage from "./components/BillingPage";
import CategoriesPage from "./components/CategoriesPage";
import CreditPage from "./components/CreditPage";
import DailyReportPage from "./components/DailyReportPage";
import InvoiceBillModal from "./components/InvoiceBillModal";
import MoneyTransferModal from "./components/MoneyTransferModal";
import NewSaleModal from "./components/NewSaleModal";
import ProductsPage from "./components/ProductsPage";
import RechargeModal from "./components/RechargeModal";
import ReceiptModal from "./components/ReceiptModal";
import {
  initialCategories,
  initialCreditCustomers,
  initialProducts,
  initialSales,
  initialWatercanCustomers,
} from "./data/mockData";
import "./style.css";

const money = (value) => Number(value || 0);
const mapCategory = (c) => ({ ...c, id: String(c.id), color: c.color || "blue", count: `${c.product_count ?? 0} items`, isService: Boolean(c.is_service), description: c.description || "" });
const mapProduct = (p) => ({ ...p, id: Number(p.id), code: p.code ?? "", category: p.category_name || "General", price: money(p.price), costPrice: money(p.cost_price), stock: Number(p.stock || 0), lowStockThreshold: Number(p.low_stock_threshold ?? 5) });
const mapCredit = (c) => ({ ...c, id: Number(c.id), name: c.name, phone: c.phone || "", items: c.items || "", totalAmount: money(c.total_amount), paidAmount: money(c.paid_amount), balanceAmount: money(c.balance_amount), date: c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN") : "", dueDate: c.due_date || "Within 7 days", status: c.status || "Pending" });
const mapWatercan = (c) => ({ ...c, id: Number(c.id), phone: c.phone || "", advanceAmount: money(c.advance_amount), cansHeld: Number(c.cans_held || 0), deliveriesCount: Number(c.deliveries_count || 0), dueAmount: money(c.due_amount), paymentStatus: c.payment_status || "Pending", lastDelivery: c.last_delivery ? new Date(c.last_delivery).toLocaleString("en-IN") : "Not yet" });
const mapSale = (s) => ({ ...s, dbId: s.id, id: s.invoice_no || String(s.id), customerName: s.customer_name || "Walk-in Customer", customerPhone: s.customer_phone || "", amount: money(s.total_amount ?? s.amount), fee: money(s.fee), discount: money(s.discount), paymentMode: s.payment_mode || s.paymentMode || "Cash", status: s.payment_status || s.status || "Paid", date: s.created_at ? new Date(s.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : (s.date || ""), fullDate: s.created_at ? new Date(s.created_at).toLocaleDateString("en-IN") : (s.fullDate || ""), category: "Billing", type: "Retail", item: (s.items || s.line_items || []).map((i) => i.product_name || i.name).join(", ") || "Retail sale", itemsSummary: (s.items || s.line_items || []).map((i) => `${i.quantity}x ${i.product_name || i.name}`).join(", ") || "", lineItems: s.line_items || s.items || [] });

function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(getToken()));
  const [loginEmail, setLoginEmail] = useState("sunmadhistore@gmail.com");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [backendLoading, setBackendLoading] = useState(Boolean(getToken()));
  const [backendError, setBackendError] = useState("");

  // Navigation State: 'dashboard' | 'billing' | 'products' | 'categories' | 'credit' | 'reports'
  const [currentPage, setCurrentPage] = useState("dashboard");

  // Sidebar open/close toggle
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Core Store Data
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [sales, setSales] = useState(initialSales);
  const [creditCustomers, setCreditCustomers] = useState(initialCreditCustomers);
  const [watercanCustomers, setWatercanCustomers] = useState(initialWatercanCustomers);

  useEffect(() => {
    if (!authenticated) { setBackendLoading(false); return; }
    let cancelled = false;
    (async () => {
      setBackendLoading(true); setBackendError("");
      try {
        let cats = await api.categories();
        if (!cats.length) {
          for (const c of initialCategories) {
            try { await api.createCategory({ name: c.name, description: c.description || "", icon: c.icon || "🏷️", color: c.color || "blue", is_service: Boolean(c.isService) }); } catch (e) { if (!String(e.message).includes("already exists")) throw e; }
          }
          cats = await api.categories();
        }
        const [ps, ss, cs, ws] = await Promise.all([api.products(), api.sales(200), api.credits(), api.watercanCustomers()]);
        if (cancelled) return;
        setCategories(cats.map(mapCategory)); setProducts(ps.map(mapProduct)); setSales(ss.map(mapSale)); setCreditCustomers(cs.map(mapCredit)); setWatercanCustomers(ws.map(mapWatercan));
      } catch (e) { if (!cancelled) { setBackendError(e.message || "Could not load shop data."); if (/401|token|unauthor/i.test(e.message || "")) { apiLogout(); setAuthenticated(false); } } }
      finally { if (!cancelled) setBackendLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [authenticated]);

  const handleLogin = async (e) => {
    e.preventDefault(); setLoginError(""); setLoginBusy(true);
    try { await apiLogin(loginEmail.trim(), loginPassword); setAuthenticated(true); setLoginPassword(""); }
    catch (err) { setLoginError(err.message || "Login failed. Check your email and password."); }
    finally { setLoginBusy(false); }
  };
  const handleLogout = () => { apiLogout(); setAuthenticated(false); setProducts([]); setSales([]); setCreditCustomers([]); setWatercanCustomers([]); };

  // Filters & Search
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [addProductInitialCategory, setAddProductInitialCategory] = useState("");
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [currentInvoiceBill, setCurrentInvoiceBill] = useState(null);

  // Outstanding credit balance for a sale (looked up from the credit ledger)
  const creditDueForSale = (s) => {
    const c = creditCustomers.find((c) => String(c.sale_id) === String(s.dbId));
    if (c) return Number(c.balanceAmount) || 0;
    return Number(s.creditAmount) || 0;
  };

  // Open the printable bill for a sale (with credit details); recharge/transfer use the receipt
  const openSaleBill = (sale) => {
    const hasItems = (sale.items && sale.items.length > 0) || (sale.lineItems && sale.lineItems.length > 0);
    if (!hasItems) { setCurrentReceipt(sale); return; }
    const isCredit = sale.paymentMode === "Credit";
    const due = isCredit ? creditDueForSale(sale) : 0;
    setCurrentInvoiceBill({
      ...sale,
      creditAmount: due,
      paidAmount: isCredit ? Math.max(0, (Number(sale.amount) || 0) - due) : Number(sale.amount) || 0,
    });
  };

  // Dynamic Metrics for Daily & Total Reports
  // 1. Daily Reports (Today)
  const todayPaidTransactions = sales.filter((s) => s.status === "Paid");
  const todayGrossSales = todayPaidTransactions.reduce(
    (sum, s) => sum + s.amount + (s.fee || 0),
    0
  );
  const todayCashSales = sales
    .filter((s) => s.paymentMode === "Cash" && s.status === "Paid")
    .reduce((sum, s) => sum + s.amount + (s.fee || 0), 0);
  const todayUpiSales = sales
    .filter((s) => s.paymentMode === "UPI" && s.status === "Paid")
    .reduce((sum, s) => sum + s.amount + (s.fee || 0), 0);
  const todayCreditSales = sales.reduce((sum, s) => sum + creditDueForSale(s), 0);

  // 2. Total Reports (Cumulative)
  const totalStoreGrossRevenue = sales
    .filter((s) => s.status === "Paid")
    .reduce((sum, s) => sum + s.amount + (s.fee || 0), 0);
  const totalOutstandingCredit = creditCustomers
    .filter((c) => c.status !== "Cleared")
    .reduce((sum, c) => sum + (c.balanceAmount || 0), 0);
  const activeCreditCustomersCount = creditCustomers.filter(
    (c) => c.balanceAmount > 0
  ).length;
  const totalStockValuation = products.reduce(
    (sum, p) => sum + p.price * p.stock,
    0
  );
  const totalRegisteredPersonsCount =
    creditCustomers.length + watercanCustomers.length;

  // 3. Billing Details
  const billedInvoices = sales.filter(
    (s) => s.id.startsWith("INV") || s.type === "Retail"
  );
  const latestBill = sales[0] || null;
  const avgBillValue =
    billedInvoices.length > 0
      ? billedInvoices.reduce((sum, s) => sum + s.amount, 0) /
        billedInvoices.length
      : 0;

  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= p.lowStockThreshold
  ).length;

  const moneyTransfers = sales.filter((s) => s.category === "Money Transfer");
  const recharges = sales.filter((s) => s.category === "Recharge");

  // Dashboard All-Transactions Filter States
  const [txnCategoryFilter, setTxnCategoryFilter] = useState("all");
  const [txnPaymentFilter, setTxnPaymentFilter] = useState("all");
  const [txnStatusFilter, setTxnStatusFilter] = useState("all");
  const [txnSearchQuery, setTxnSearchQuery] = useState("");

  const filteredSales = sales.filter((s) => {
    // Category / Type filter
    const matchesCategory =
      txnCategoryFilter === "all" ||
      (txnCategoryFilter === "Billing" && s.id.startsWith("INV")) ||
      (txnCategoryFilter === "Retail" && s.type === "Retail") ||
      (txnCategoryFilter === "Credit" && (s.paymentMode === "Credit" || (s.creditAmount && s.creditAmount > 0))) ||
      (txnCategoryFilter === "Recharge" && s.category === "Recharge") ||
      (txnCategoryFilter === "Money Transfer" && s.category === "Money Transfer") ||
      s.category === txnCategoryFilter;

    // Payment Mode filter
    const matchesPayment =
      txnPaymentFilter === "all" || s.paymentMode === txnPaymentFilter;

    // Status filter
    const matchesStatus =
      txnStatusFilter === "all" || s.status === txnStatusFilter;

    // Text Search
    const q = txnSearchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      s.id.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      (s.customerPhone && s.customerPhone.toLowerCase().includes(q)) ||
      s.item.toLowerCase().includes(q) ||
      (s.itemsSummary && s.itemsSummary.toLowerCase().includes(q)) ||
      s.category.toLowerCase().includes(q) ||
      (s.utr && s.utr.toLowerCase().includes(q));

    return matchesCategory && matchesPayment && matchesStatus && matchesSearch;
  });

  // API-backed handlers: successful writes are persisted in PostgreSQL.
  const handleCompleteBill = async (billData, cartItems) => {
    try {
      const saved = await api.createSale({
        invoice_no: billData.id, customer_name: billData.customerName || "Walk-in Customer", customer_phone: billData.customerPhone || "",
        discount: Number(billData.discount || 0), fee: Number(billData.fee || 0), paid_amount: Number(billData.paidAmount || 0), payment_mode: billData.paymentMode === "Online" ? "Card" : (billData.paymentMode || "Cash"),
        payment_status: billData.paymentMode === "Credit" ? (Number(billData.paidAmount || 0) > 0 ? "Partial" : "Pending") : "Paid", notes: billData.notes || "",
        items: cartItems.map((it) => it.isCustom ? ({ name: it.name, unit_price: Number(it.price), quantity: Number(it.quantity) }) : ({ product_id: Number(it.id), name: it.name, unit_price: Number(it.price), quantity: Number(it.quantity) }))
      });
      const normalized = mapSale({ ...saved, items: saved.items || cartItems.map((it) => ({ ...it, product_name: it.name })), line_items: (saved.items || []).map((it, i) => ({ ...it, category_name: cartItems[i]?.category || "General" })) });
      setProducts((await api.products()).map(mapProduct)); setSales((prev) => [normalized, ...prev.filter((s) => s.id !== normalized.id)]);
      if (billData.paymentMode === "Credit") setCreditCustomers((await api.credits()).map(mapCredit));
      setCurrentInvoiceBill({ ...billData, id: saved.invoice_no || billData.id, amount: money(saved.total_amount) });
    } catch (e) { alert(`Bill was not saved: ${e.message}`); throw e; }
  };

  const handleAddCategory = async (newCat) => {
    try { const c = await api.createCategory({ name: newCat.name, description: newCat.description || "", icon: newCat.icon || "🏷️", color: newCat.color || "blue", is_service: Boolean(newCat.isService) }); setCategories((prev) => [...prev, mapCategory(c)]); }
    catch (e) { alert(`Category was not saved: ${e.message}`); }
  };

  const handleAddProduct = async (newProd) => {
    try { const cat = categories.find((c) => c.name === newProd.category); const p = await api.createProduct({ name: newProd.name, category_id: cat ? Number(cat.id) : null, category_name: newProd.category || "General", price: Number(newProd.price || 0), cost_price: Number(newProd.costPrice || 0), stock: Number(newProd.stock || 0), low_stock_threshold: Number(newProd.lowStockThreshold || 5), unit: newProd.unit || "pcs" }); setProducts((prev) => [mapProduct(p), ...prev]); }
    catch (e) { alert(`Product was not saved: ${e.message}`); }
  };

  const handleUpdateStock = async (productId, delta) => {
    try { const p = await api.updateStock(productId, delta); setProducts((prev) => prev.map((item) => Number(item.id) === Number(productId) ? mapProduct(p) : item)); }
    catch (e) { alert(`Stock was not updated: ${e.message}`); }
  };

  const handleAddCreditCustomer = async (c) => {
    try { const saved = await api.createCredit({ name: c.name, phone: c.phone || "", items: c.items || "", total_amount: Number(c.totalAmount), paid_amount: Number(c.paidAmount || 0), due_date: /^\d{4}-\d{2}-\d{2}$/.test(c.dueDate || "") ? c.dueDate : null, notes: c.notes || "" }); setCreditCustomers((prev) => [mapCredit(saved), ...prev]); }
    catch (e) { alert(`Credit entry was not saved: ${e.message}`); }
  };

  const handleUpdateCreditPayment = async (customerId, paymentAmount) => {
    try { const saved = await api.recordCreditPayment(customerId, { amount: Number(paymentAmount), payment_mode: "Cash" }); setCreditCustomers((prev) => prev.map((c) => Number(c.id) === Number(customerId) ? mapCredit(saved) : c)); }
    catch (e) { alert(`Credit payment was not saved: ${e.message}`); }
  };

  const handleAddWatercanPerson = async (p) => {
    try { const saved = await api.createWatercanCustomer({ name: p.name, phone: p.phone || "", address: p.address || "", advance_amount: Number(p.advanceAmount || 0), cans_held: Number(p.cansHeld || 0), deliveries_count: Number(p.deliveriesCount || 0), due_amount: Number(p.dueAmount || 0), payment_status: p.paymentStatus || "Pending", notes: p.notes || "" }); setWatercanCustomers((prev) => [mapWatercan(saved), ...prev]); }
    catch (e) { alert(`Water-can customer was not saved: ${e.message}`); }
  };

  const handleMarkWatercanPaid = async (personId) => {
    try { const saved = await api.markWatercanPaid(personId); setWatercanCustomers((prev) => prev.map((p) => Number(p.id) === Number(personId) ? mapWatercan(saved) : p)); }
    catch (e) { alert(`Payment status was not updated: ${e.message}`); }
  };

  const handleDeliverWatercan = async (personId) => {
    try { const saved = await api.recordWatercanDelivery(personId, 1); setWatercanCustomers((prev) => prev.map((p) => Number(p.id) === Number(personId) ? mapWatercan(saved) : p)); }
    catch (e) { alert(`Delivery was not recorded: ${e.message}`); }
  };

  // 6. Transfer & Recharge Success Handlers
  const handleTransferSuccess = (newTxn) => { alert("Money transfer provider integration is not configured yet. This transaction has not been submitted to a bank."); };

  const handleRechargeSuccess = (newTxn) => { alert("Recharge provider integration is not configured yet. No recharge has been submitted."); };

  const handleNewSaleSuccess = (newSale) => { alert("Use Billing POS to save a product sale to the database. This quick-service sale was not saved because it has no inventory item."); };

  if (!authenticated) {
    return <div className="sunmadhi-auth-page"><form className="sunmadhi-auth-card" onSubmit={handleLogin}><div className="sunmadhi-auth-logo">S</div><p className="sunmadhi-auth-eyebrow">SUNMADHI STORE</p><h1>Admin sign in</h1><p className="sunmadhi-auth-subtitle">Sign in to manage your shop inventory, billing and customer records.</p>{loginError && <div className="sunmadhi-auth-error">{loginError}</div>}<label>Email address<input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} autoComplete="username" required /></label><label>Password<input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} autoComplete="current-password" required /></label><button type="submit" disabled={loginBusy}>{loginBusy ? "Signing in…" : "Sign in securely"}</button><small>Use the admin credentials configured in the backend .env file.</small></form></div>;
  }

  return (
    <div className={`app ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      {backendLoading && <div className="sunmadhi-api-banner">Connecting to your PostgreSQL shop database…</div>}
      {backendError && <div className="sunmadhi-api-error">Database connection: {backendError} <button type="button" onClick={() => { apiLogout(); setAuthenticated(false); }}>Sign out</button></div>}
      <button className="sunmadhi-logout" type="button" onClick={handleLogout} title="Sign out">Sign out</button>
      {/* Sidebar Toggle Button */}
      <button
        type="button"
        className="sidebar-toggle-btn"
        onClick={() => setSidebarOpen((v) => !v)}
        title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {sidebarOpen ? "◀" : "▶"}
      </button>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-hidden"}`}>
        <div className="brand" onClick={() => setCurrentPage("dashboard")}>
          <div className="brand-icon">S</div>
          <div>
            <h2>SUNMADHI</h2>
            <span>STORE MANAGEMENT</span>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>
        <nav className="navigation">
          <button
            type="button"
            className={`nav-link ${currentPage === "dashboard" ? "active" : ""}`}
            onClick={() => setCurrentPage("dashboard")}
          >
            ▦ <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`nav-link ${currentPage === "billing" ? "active" : ""}`}
            onClick={() => setCurrentPage("billing")}
          >
            🛒 <span>Billing Counter (POS)</span>
          </button>

          <button
            type="button"
            className={`nav-link ${currentPage === "products" ? "active" : ""}`}
            onClick={() => setCurrentPage("products")}
          >
            ▣ <span>Products & Stock</span>
            {lowStockCount > 0 && <span className="nav-badge-alert">{lowStockCount}</span>}
          </button>

          <button
            type="button"
            className={`nav-link ${currentPage === "categories" ? "active" : ""}`}
            onClick={() => setCurrentPage("categories")}
          >
            ▤ <span>Categories ({categories.length})</span>
          </button>

          <button
            type="button"
            className={`nav-link ${currentPage === "credit" ? "active" : ""}`}
            onClick={() => setCurrentPage("credit")}
          >
            📋 <span>Credit (Udhar Ledger)</span>
            {creditCustomers.filter((c) => c.balanceAmount > 0).length > 0 && (
              <span className="nav-badge-credit">
                {creditCustomers.filter((c) => c.balanceAmount > 0).length}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`nav-link ${currentPage === "reports" ? "active" : ""}`}
            onClick={() => setCurrentPage("reports")}
          >
            ▨ <span>Daily Sales Report</span>
          </button>
        </nav>

        {/* Quick Instant Services */}
        <div className="sidebar-quick-actions">
          <p className="menu-label">INSTANT COUNTERS</p>
          <button
            type="button"
            className="sidebar-action-btn emerald-btn"
            onClick={() => setIsRechargeModalOpen(true)}
          >
            ⚡ Quick Recharge
          </button>
          <button
            type="button"
            className="sidebar-action-btn teal-btn"
            onClick={() => setIsTransferModalOpen(true)}
          >
            💸 Money Transfer
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="profile-avatar">S</div>
          <div>
            <strong>Shop Admin</strong>
            <span>Active Register · Main Counter</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`main-content ${sidebarOpen ? "" : "main-content-expanded"}`}>
        {/* PAGE 1: BILLING (POS) PAGE */}
        {currentPage === "billing" && (
          <BillingPage
            products={products}
            categories={categories}
            onCompleteBill={handleCompleteBill}
            onOpenQuickRecharge={() => setIsRechargeModalOpen(true)}
            onOpenQuickTransfer={() => setIsTransferModalOpen(true)}
          />
        )}

        {/* PAGE 2: PRODUCTS & INVENTORY PAGE */}
        {currentPage === "products" && (
          <ProductsPage
            products={products}
            categories={categories}
            onOpenAddProduct={() => {
              setAddProductInitialCategory("");
              setIsAddProductOpen(true);
            }}
            onUpdateStock={handleUpdateStock}
            onGoToBilling={() => setCurrentPage("billing")}
          />
        )}

        {/* PAGE 3: CATEGORIES PAGE */}
        {currentPage === "categories" && (
          <CategoriesPage
            categories={categories}
            products={products}
            watercanCustomers={watercanCustomers}
            onAddWatercanPerson={handleAddWatercanPerson}
            onMarkWatercanPaid={handleMarkWatercanPaid}
            onDeliverWatercan={handleDeliverWatercan}
            onOpenAddCategory={() => setIsAddCategoryOpen(true)}
            onOpenAddProduct={(catName) => {
              setAddProductInitialCategory(catName || "");
              setIsAddProductOpen(true);
            }}
            onUpdateStock={handleUpdateStock}
            onGoToBilling={() => setCurrentPage("billing")}
            onOpenRecharge={() => setIsRechargeModalOpen(true)}
            onOpenTransfer={() => setIsTransferModalOpen(true)}
          />
        )}

        {/* PAGE 4: CREDIT (UDHAR / KHATA) PAGE */}
        {currentPage === "credit" && (
          <CreditPage
            creditCustomers={creditCustomers}
            onAddCreditCustomer={handleAddCreditCustomer}
            onUpdateCreditPayment={handleUpdateCreditPayment}
          />
        )}

        {/* PAGE 5: DAILY SALES REPORT PAGE */}
        {currentPage === "reports" && (
          <DailyReportPage
            sales={sales}
            categories={categories}
            creditCustomers={creditCustomers}
          />
        )}

        {/* PAGE 6: DASHBOARD OVERVIEW PAGE - ONLY DAILY REPORTS, TOTAL REPORTS, BILLING DETAILS & ALL TRANSACTIONS WITH FILTERS */}
        {currentPage === "dashboard" && (
          <div className="focused-dashboard-view">
            <header className="topbar">
              <div>
                <p className="breadcrumb">SUNMADHI STORE / OVERVIEW</p>
                <h1>Store Dashboard</h1>
                <p className="subtitle">
                  Daily reports, total reports, billing details & comprehensive transactions ledger.
                </p>
              </div>
              <div className="topbar-actions">
                <button
                  type="button"
                  className="primary-button billing-top-btn"
                  onClick={() => setCurrentPage("billing")}
                >
                  🛒 Open Billing Counter
                </button>
                <button
                  type="button"
                  className="quick-btn emerald"
                  onClick={() => setIsRechargeModalOpen(true)}
                >
                  ⚡ Recharge
                </button>
                <button
                  type="button"
                  className="quick-btn teal"
                  onClick={() => setIsTransferModalOpen(true)}
                >
                  💸 Money Transfer
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsNewSaleModalOpen(true)}
                >
                  + Quick Sale
                </button>
              </div>
            </header>

            {/* 1. DAILY REPORTS (TODAY'S METRICS) */}
            <section className="section dashboard-report-section">
              <div className="section-heading">
                <div>
                  <span className="section-badge-pill blue-badge">DAILY PERFORMANCE</span>
                  <h2>📊 Daily Reports (Today)</h2>
                  <p>Real-time financial summary of sales, cash, UPI, and credit processed today.</p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setCurrentPage("reports")}
                >
                  View Full Daily Report →
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Today's Gross Sales</span>
                    <span className="stat-icon green">₹</span>
                  </div>
                  <h2>₹{todayGrossSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
                  <p>From {todayPaidTransactions.length} completed transactions</p>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Today's Cash Inflow</span>
                    <span className="stat-icon blue">💵</span>
                  </div>
                  <h2>₹{todayCashSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
                  <p>Direct cash collected at counter</p>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Today's UPI / Online</span>
                    <span className="stat-icon teal">📲</span>
                  </div>
                  <h2>₹{todayUpiSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
                  <p>GPay, PhonePe, and Paytm collections</p>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Today's Credit Sales (Udhar)</span>
                    <span className="stat-icon orange">📋</span>
                  </div>
                  <h2 className="orange-text">
                    ₹{todayCreditSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </h2>
                  <p>Customer credit/pay-later balance</p>
                </div>
              </div>
            </section>

            {/* 2. TOTAL REPORTS (CUMULATIVE OVERVIEW) */}
            <section className="section dashboard-report-section">
              <div className="section-heading">
                <div>
                  <span className="section-badge-pill purple-badge">ALL-TIME FINANCIALS</span>
                  <h2>📈 Total Reports (Cumulative)</h2>
                  <p>Store-wide lifetime revenue, outstanding udhar balance, and stock inventory value.</p>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setCurrentPage("credit")}
                >
                  Manage Credit Dues →
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-top">
                    <span>Total Store Gross Revenue</span>
                    <span className="stat-icon green">₹</span>
                  </div>
                  <h2>₹{totalStoreGrossRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
                  <p>All-time gross paid receipts</p>
                </div>

                <div className="stat-card" onClick={() => setCurrentPage("credit")}>
                  <div className="stat-top">
                    <span>Total Outstanding Credit (Khata)</span>
                    <span className="stat-icon orange">📋</span>
                  </div>
                  <h2 className="orange-text">
                    ₹{totalOutstandingCredit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </h2>
                  <p>{activeCreditCustomersCount} customer accounts with dues</p>
                </div>

                <div className="stat-card" onClick={() => setCurrentPage("products")}>
                  <div className="stat-top">
                    <span>Total Inventory Stock Value</span>
                    <span className="stat-icon blue">📦</span>
                  </div>
                  <h2>₹{totalStockValuation.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
                  <p>{products.length} products in inventory</p>
                </div>

                <div className="stat-card">
                  <div className="stat-top">
                    <span>Total Registered Customers</span>
                    <span className="stat-icon purple">👥</span>
                  </div>
                  <h2>{totalRegisteredPersonsCount}</h2>
                  <p>Credit & watercan subscribers</p>
                </div>
              </div>
            </section>

            {/* 3. BILLING DETAILS (POS COUNTER & INVOICE HIGHLIGHTS) */}
            <section className="section dashboard-report-section">
              <div className="section-heading">
                <div>
                  <span className="section-badge-pill emerald-badge">POS REGISTER</span>
                  <h2>🛒 Billing Details & Counter Overview</h2>
                  <p>Point of sale active register status, billing shortcuts, and recent invoice highlights.</p>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => setCurrentPage("billing")}
                >
                  🛒 Open Billing Counter →
                </button>
              </div>

              <div className="billing-details-dashboard-grid">
                {/* Active Counter Status Box */}
                <div className="billing-summary-box">
                  <div className="billing-box-top">
                    <span className="terminal-badge active">● Terminal Online</span>
                    <span className="counter-name">Counter #1 (Main Register)</span>
                  </div>
                  <div className="billing-kpis-row">
                    <div className="billing-kpi">
                      <span>Total Invoices Generated</span>
                      <strong>{billedInvoices.length} Bills</strong>
                    </div>
                    <div className="billing-kpi">
                      <span>Average Bill Size</span>
                      <strong>₹{avgBillValue.toFixed(2)}</strong>
                    </div>
                    <div className="billing-kpi">
                      <span>Counter Status</span>
                      <strong className="green-text">Ready to Bill</strong>
                    </div>
                  </div>
                  <div className="billing-box-actions">
                    <button
                      type="button"
                      className="primary-button billing-launch-large-btn"
                      onClick={() => setCurrentPage("billing")}
                    >
                      🛒 Start New Customer Bill (POS) →
                    </button>
                  </div>
                </div>

                {/* Latest Invoice Highlights */}
                {latestBill && (
                  <div className="latest-bill-box">
                    <div className="latest-bill-header">
                      <span>Latest Generated Invoice</span>
                      <strong className="invoice-id font-mono">{latestBill.id}</strong>
                    </div>
                    <div className="latest-bill-body">
                      <h4>{latestBill.customerName || "Walk-in Customer"}</h4>
                      <p className="latest-bill-item">{latestBill.item}</p>
                      <div className="latest-bill-meta">
                        <span className={`payment-pill ${latestBill.paymentMode?.toLowerCase()}`}>
                          {latestBill.paymentMode || "Cash"}
                        </span>
                        <strong className="latest-bill-amount">₹{latestBill.amount.toFixed(2)}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="secondary-button view-latest-bill-btn"
                      onClick={() => openSaleBill(latestBill)}
                    >
                      🧾 View / Print Latest Bill Receipt
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* 4. ALL TRANSACTIONS (ONE BY ONE) WITH FILTER OPTIONS */}
            <section className="section dashboard-report-section" id="all-transactions-section">
              <div className="section-heading">
                <div>
                  <span className="section-badge-pill teal-badge">TRANSACTION LEDGER</span>
                  <h2>🧾 All Transactions (One by One) ({filteredSales.length})</h2>
                  <p>Complete chronological log showing every single transaction with multi-criteria filters.</p>
                </div>
                {(txnCategoryFilter !== "all" || txnPaymentFilter !== "all" || txnStatusFilter !== "all" || txnSearchQuery) && (
                  <button
                    type="button"
                    className="secondary-button reset-filter-btn"
                    onClick={() => {
                      setTxnCategoryFilter("all");
                      setTxnPaymentFilter("all");
                      setTxnStatusFilter("all");
                      setTxnSearchQuery("");
                    }}
                  >
                    Reset All Filters
                  </button>
                )}
              </div>

              {/* Comprehensive Filter Bar */}
              <div className="all-transactions-filter-bar">
                {/* Type/Category Filter Pills */}
                <div className="filter-pill-group">
                  <button
                    type="button"
                    className={`filter-pill ${txnCategoryFilter === "all" ? "active" : ""}`}
                    onClick={() => setTxnCategoryFilter("all")}
                  >
                    All Transactions ({sales.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${txnCategoryFilter === "Billing" ? "active" : ""}`}
                    onClick={() => setTxnCategoryFilter("Billing")}
                  >
                    🛒 Billing Invoices ({billedInvoices.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${txnCategoryFilter === "Retail" ? "active" : ""}`}
                    onClick={() => setTxnCategoryFilter("Retail")}
                  >
                    🛍️ Retail Sales ({sales.filter((s) => s.type === "Retail").length})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${txnCategoryFilter === "Credit" ? "active" : ""}`}
                    onClick={() => setTxnCategoryFilter("Credit")}
                  >
                    📋 Credit (Udhar) ({sales.filter((s) => s.paymentMode === "Credit" || (s.creditAmount && s.creditAmount > 0)).length})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${txnCategoryFilter === "Recharge" ? "active" : ""}`}
                    onClick={() => setTxnCategoryFilter("Recharge")}
                  >
                    ⚡ Recharges ({sales.filter((s) => s.category === "Recharge").length})
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${txnCategoryFilter === "Money Transfer" ? "active" : ""}`}
                    onClick={() => setTxnCategoryFilter("Money Transfer")}
                  >
                    💸 Money Transfers ({sales.filter((s) => s.category === "Money Transfer").length})
                  </button>
                </div>

                {/* Dropdowns & Search in Row 2 */}
                <div className="filter-secondary-controls">
                  {/* Payment Mode Filter Dropdown */}
                  <div className="dropdown-filter-wrap">
                    <label>Payment Mode:</label>
                    <select
                      className="form-select form-select-sm"
                      value={txnPaymentFilter}
                      onChange={(e) => setTxnPaymentFilter(e.target.value)}
                    >
                      <option value="all">All Modes</option>
                      <option value="Cash">💵 Cash Only</option>
                      <option value="UPI">📱 UPI Only</option>
                      <option value="Credit">📋 Credit (Udhar)</option>
                    </select>
                  </div>

                  {/* Payment Status Filter Dropdown */}
                  <div className="dropdown-filter-wrap">
                    <label>Status:</label>
                    <select
                      className="form-select form-select-sm"
                      value={txnStatusFilter}
                      onChange={(e) => setTxnStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="Paid">✓ Paid / Cleared</option>
                      <option value="Pending">⏳ Pending</option>
                    </select>
                  </div>

                  {/* Real-time Search Box */}
                  <div className="search-box">
                    <input
                      type="text"
                      placeholder="Search invoice, customer, phone, or item..."
                      value={txnSearchQuery}
                      onChange={(e) => setTxnSearchQuery(e.target.value)}
                    />
                    {txnSearchQuery && (
                      <button
                        type="button"
                        className="search-clear"
                        onClick={() => setTxnSearchQuery("")}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Transactions Table - One by One */}
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Invoice / Txn ID</th>
                      <th>Date & Time</th>
                      <th>Customer Name & Phone</th>
                      <th>Product / Service / Items</th>
                      <th>Category</th>
                      <th>Payment Mode</th>
                      <th>Total Amount</th>
                      <th className="highlight-column">Credit (Balance)</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="empty-table-row">
                          No transactions found matching the selected filter options.
                        </td>
                      </tr>
                    ) : (
                      filteredSales.map((sale, index) => (
                        <tr key={sale.id}>
                          <td className="row-num-cell">{index + 1}</td>
                          <td className="invoice-id font-mono">{sale.id}</td>
                          <td>
                            <div>{sale.date}</div>
                            <small className="table-sub-detail">{sale.fullDate || "Today"}</small>
                          </td>
                          <td>
                            <strong>{sale.customerName || "Walk-in Customer"}</strong>
                            {sale.customerPhone && (
                              <div className="table-sub-detail">+91 {sale.customerPhone}</div>
                            )}
                          </td>
                          <td>
                            <div className="txn-item-name">{sale.item}</div>
                            {sale.itemsSummary && sale.itemsSummary !== sale.item && (
                              <div className="table-sub-detail">{sale.itemsSummary}</div>
                            )}
                            {sale.utr && (
                              <div className="table-sub-detail mono">{sale.utr}</div>
                            )}
                          </td>
                          <td>
                            <span className={`cat-badge ${sale.category.toLowerCase().replace(/[^a-z]/g, "-")}`}>
                              {sale.category}
                            </span>
                          </td>
                          <td>
                            <span className={`payment-pill ${sale.paymentMode?.toLowerCase()}`}>
                              {sale.paymentMode || "Cash"}
                            </span>
                          </td>
                          <td>
                            <strong className="txn-amount-val">₹{sale.amount.toFixed(2)}</strong>
                          </td>
                          <td className="highlight-column">
                            {creditDueForSale(sale) > 0 ? (
                              <strong className="orange-text">₹{creditDueForSale(sale).toFixed(2)}</strong>
                            ) : (
                              <span className="muted-dash">—</span>
                            )}
                          </td>
                          <td>
                            <span className={`status ${sale.status.toLowerCase()}`}>
                              {sale.status}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="table-action-btn view-rec-btn"
                              onClick={() => openSaleBill(sale)}
                              title="View and print bill receipt"
                            >
                              🧾 View Bill
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div className="table-footer-summary">
                  <p className="demo-note">
                    Real-time Store Transaction Log · Filtered view displaying transactions one by one
                  </p>
                  <div className="table-counts-badge">
                    Showing {filteredSales.length} of {sales.length} transactions
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        <footer>
          <div className="footer-content">
            <p>© {new Date().getFullYear()} SUNMADHI STORE · Multi-Service Shop, Billing POS & Money Transfer</p>
            <div className="footer-links">
              <button type="button" onClick={() => setCurrentPage("billing")}>Billing POS</button>
              <span>·</span>
              <button type="button" onClick={() => setCurrentPage("products")}>Inventory</button>
              <span>·</span>
              <button type="button" onClick={() => setCurrentPage("categories")}>Categories</button>
              <span>·</span>
              <button type="button" onClick={() => setCurrentPage("credit")}>Credit Ledger</button>
              <span>·</span>
              <button type="button" onClick={() => setCurrentPage("reports")}>Daily Reports</button>
            </div>
          </div>
        </footer>
      </main>

      {/* ALL MODALS */}
      {/* 1. Add Category Modal */}
      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onAddCategory={handleAddCategory}
      />

      {/* 2. Add Product Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => {
          setIsAddProductOpen(false);
          setAddProductInitialCategory("");
        }}
        onAddProduct={handleAddProduct}
        categories={categories}
        initialCategory={addProductInitialCategory}
      />

      {/* 3. Money Transfer Modal */}
      <MoneyTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onTransferSuccess={handleTransferSuccess}
      />

      {/* 4. Recharge Modal */}
      <RechargeModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        onRechargeSuccess={handleRechargeSuccess}
      />

      {/* 5. Quick Sale Modal */}
      <NewSaleModal
        isOpen={isNewSaleModalOpen}
        onClose={() => setIsNewSaleModalOpen(false)}
        onSaleSuccess={handleNewSaleSuccess}
        categories={categories.filter((c) => !c.isService)}
      />

      {/* 6. Retail Bill Invoice Modal */}
      <InvoiceBillModal
        bill={currentInvoiceBill}
        onClose={() => setCurrentInvoiceBill(null)}
      />

      {/* 7. Receipt Modal for Recharge / DMT */}
      <ReceiptModal
        receipt={currentReceipt}
        onClose={() => setCurrentReceipt(null)}
      />
    </div>
  );
}


export default App;
