import React, { useState } from "react";
import * as XLSX from "xlsx";

const todayLocal = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD (local time)
const toLocalDate = (iso) => new Date(iso).toLocaleDateString("en-CA");

export default function DailyReportPage({ sales, categories, creditCustomers = [] }) {
  const [reportDate, setReportDate] = useState(todayLocal());

  // Sales for the selected date only
  const daySales = sales.filter(
    (s) => !s.created_at || toLocalDate(s.created_at) === reportDate
  );

  // Credit record linked to a sale
  const creditRecordFor = (s) =>
    creditCustomers.find((c) => String(c.sale_id) === String(s.dbId));

  // Outstanding credit balance for a sale
  const creditDueFor = (s) => {
    const c = creditRecordFor(s);
    if (c) return Number(c.balanceAmount) || 0;
    return Number(s.creditAmount) || 0;
  };

  // Money actually received for a sale (credit sales count only the paid part)
  const receivedFor = (s) => {
    const amount = Number(s.amount) || 0;
    if (s.status === "Cancelled") return 0;
    if (s.paymentMode === "Credit") return Math.max(0, amount - creditDueFor(s));
    return s.status === "Paid" ? amount : 0;
  };

  // Top cards
  const totalReceived = daySales.reduce((sum, s) => sum + receivedFor(s), 0);

  const cashSales = daySales
    .filter((s) => s.paymentMode === "Cash" || s.paymentMode === "Credit")
    .reduce((sum, s) => sum + receivedFor(s), 0);

  const upiSales = daySales
    .filter((s) => ["UPI", "Card", "Online"].includes(s.paymentMode))
    .reduce((sum, s) => sum + receivedFor(s), 0);

  const creditSales = daySales.reduce((sum, s) => sum + creditDueFor(s), 0);

  // Category-wise performance (from the items sold in each sale)
  const lineAmount = (li) =>
    Number(
      li.line_total ??
        Number(li.unit_price ?? li.price ?? 0) * Number(li.quantity || 1)
    ) || 0;

  const catTotals = {};
  daySales.forEach((s) => {
    const lines =
      Array.isArray(s.lineItems) && s.lineItems.length > 0 ? s.lineItems : null;
    const parts = lines
      ? lines.map((li) => ({
          name: li.category_name || li.category || s.category || "General",
          amount: lineAmount(li),
        }))
      : [{ name: s.category || "General", amount: Number(s.amount) || 0 }];

    const counted = new Set();
    parts.forEach((p) => {
      if (!catTotals[p.name]) catTotals[p.name] = { total: 0, count: 0 };
      catTotals[p.name].total += p.amount;
      if (!counted.has(p.name)) {
        catTotals[p.name].count += 1;
        counted.add(p.name);
      }
    });
  });

  const grandCategoryTotal = Object.values(catTotals).reduce(
    (sum, c) => sum + c.total,
    0
  );
  const knownNames = new Set(categories.map((c) => c.name));

  const categoryStats = [
    ...categories.map((cat) => ({
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      ...(catTotals[cat.name] || { total: 0, count: 0 }),
    })),
    ...Object.keys(catTotals)
      .filter((n) => !knownNames.has(n))
      .map((n) => ({ name: n, icon: "🏷️", color: "blue", ...catTotals[n] })),
  ].map((c) => ({
    ...c,
    percentage:
      grandCategoryTotal > 0 ? Math.round((c.total / grandCategoryTotal) * 100) : 0,
  }));

  // Category name(s) shown for a sale in the ledger
  const categoryLabel = (s) => {
    if (Array.isArray(s.lineItems) && s.lineItems.length > 0) {
      return [
        ...new Set(
          s.lineItems.map((li) => li.category_name || li.category || s.category || "General")
        ),
      ].join(", ");
    }
    return s.category || "General";
  };

  // Export Transaction Ledger to Excel
  const handleExportExcel = () => {
    if (daySales.length === 0) {
      alert("No transactions found for the selected date.");
      return;
    }

    const rows = daySales.map((s) => ({
      "Date": s.fullDate || reportDate,
      "Time": s.date,
      "Invoice ID": s.id,
      "Customer": s.customerName || "Walk-in Customer",
      "Product / Service": s.item,
      "Category": categoryLabel(s),
      "Payment Mode": s.paymentMode || "Cash",
      "Amount": Number(s.amount) || 0,
      "Credit Due": creditDueFor(s),
      "Status": s.status,
    }));

    const totalAmount = rows.reduce((sum, r) => sum + (r["Amount"] || 0), 0);
    const totalCreditDue = rows.reduce((sum, r) => sum + (r["Credit Due"] || 0), 0);

    rows.push({});
    rows.push({
      "Payment Mode": "TOTAL",
      "Amount": totalAmount,
      "Credit Due": totalCreditDue,
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 12 }, { wch: 10 }, { wch: 16 }, { wch: 22 }, { wch: 34 },
      { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaction Ledger");
    XLSX.writeFile(wb, `Sunmadhi-Ledger-${reportDate}.xlsx`);
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="daily-report-page">
      <div className="page-header-row">
        <div>
          <h2>Daily Store Sales & Financial Report</h2>
          <p>Comprehensive daily summary of retail counter sales, recharges, transfers & credit ledger.</p>
        </div>
        <div className="page-header-actions">
          <input
            type="date"
            className="form-input report-date-picker"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />
          <button type="button" className="primary-button print-btn" onClick={handlePrint}>
            🖨️ Print Daily Report
          </button>
          <button type="button" className="primary-button" onClick={handleExportExcel}>
            📥 Export Ledger to Excel
          </button>
        </div>
      </div>

      <div id="printable-daily-report">
        {/* Printable Report Header */}
        <div className="report-print-header">
          <h1>SUNMADHI STORE · DAILY SALES REPORT</h1>
          <p>
            Date:{" "}
            {new Date(`${reportDate}T00:00:00`).toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <div className="report-divider"></div>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <span>Total Gross Sales (Paid)</span>
              <span className="stat-icon green">₹</span>
            </div>
            <h2>₹{totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
            <p>From {daySales.length} transactions recorded</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Cash Inflow</span>
              <span className="stat-icon blue">💵</span>
            </div>
            <h2>₹{cashSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
            <p>Direct cash collected at counter</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>UPI / Online Payments</span>
              <span className="stat-icon teal">📲</span>
            </div>
            <h2>₹{upiSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
            <p>GPay, PhonePe & Paytm</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Credit Sales (Dues)</span>
              <span className="stat-icon orange">📋</span>
            </div>
            <h2 className="orange-text">
              ₹{creditSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h2>
            <p>Pending balance in Khata ledger</p>
          </div>
        </div>

        {/* Category-wise Sales Distribution */}
        <div className="section">
          <div className="section-heading">
            <div>
              <h3>Category-Wise Performance</h3>
              <p>Breakdown of sales on the selected date across business categories</p>
            </div>
          </div>

          <div className="category-performance-grid">
            {categoryStats.map((cat) => (
              <div key={cat.name} className="cat-perf-card">
                <div className="cat-perf-top">
                  <div className="cat-perf-name">
                    <span className="cat-perf-icon">{cat.icon}</span>
                    <strong>{cat.name}</strong>
                  </div>
                  <span className="cat-perf-amount">₹{cat.total.toFixed(2)}</span>
                </div>
                <div className="cat-perf-bar-bg">
                  <div
                    className={`cat-perf-bar-fill ${cat.color}`}
                    style={{ width: `${cat.percentage || (cat.total > 0 ? 15 : 0)}%` }}
                  ></div>
                </div>
                <div className="cat-perf-footer">
                  <span>{cat.count} sales</span>
                  <span className="cat-perf-pct">{cat.percentage}% of sales</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chronological Detailed Log Table */}
        <div className="section">
          <div className="section-heading">
            <div>
              <h3>Detailed Transaction Ledger</h3>
              <p>All retail, recharge, transfer & credit events logged on the selected date</p>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Invoice ID</th>
                  <th>Customer</th>
                  <th>Product / Service</th>
                  <th>Category</th>
                  <th>Payment Mode</th>
                  <th>Amount</th>
                  <th>Credit Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {daySales.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-table-row">
                      No transactions found for the selected date.
                    </td>
                  </tr>
                ) : (
                  daySales.map((s) => (
                    <tr key={s.id}>
                      <td>{s.date}</td>
                      <td className="invoice-id">{s.id}</td>
                      <td>{s.customerName || "Walk-in Customer"}</td>
                      <td>
                        <strong>{s.item}</strong>
                      </td>
                      <td>
                        <span
                          className={`cat-badge ${categoryLabel(s)
                            .toLowerCase()
                            .replace(/[^a-z]/g, "-")}`}
                        >
                          {categoryLabel(s)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`payment-pill ${
                            s.paymentMode === "Credit"
                              ? "credit"
                              : s.paymentMode === "UPI"
                              ? "upi"
                              : "cash"
                          }`}
                        >
                          {s.paymentMode || "Cash"}
                        </span>
                      </td>
                      <td>
                        <strong>₹{(Number(s.amount) || 0).toFixed(2)}</strong>
                      </td>
                      <td>
                        {creditDueFor(s) > 0 ? (
                          <span className="orange-text font-bold">
                            ₹{creditDueFor(s).toFixed(2)}
                          </span>
                        ) : (
                          <span className="muted-dash">—</span>
                        )}
                      </td>
                      <td>
                        <span className={`status ${(s.status || "").toLowerCase()}`}>{s.status}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="table-footer-summary">
              <p className="demo-note">
                End of Day Financial Reconciliation · SUNMADHI STORE MANAGEMENT
              </p>
              <div className="table-counts-badge">
                Total Received: ₹{totalReceived.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
