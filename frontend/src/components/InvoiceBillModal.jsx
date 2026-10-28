import React from "react";

const rupee = (n) => `₹${(Number(n) || 0).toFixed(2)}`;

const th = {
  padding: "6px 4px",
  borderTop: "1px solid #000",
  borderBottom: "1px solid #000",
  fontSize: 13,
  fontWeight: 700,
};
const td = { padding: "6px 4px", borderBottom: "1px dashed #999", fontSize: 14, verticalAlign: "top" };
const row = { display: "flex", justifyContent: "space-between", gap: 12, padding: "3px 0", fontSize: 14 };

export default function InvoiceBillModal({ bill, onClose }) {
  if (!bill) return null;

  // Print ONLY the bill: it is copied into a hidden frame, so nothing else on the page prints
  const handlePrint = () => {
    const node = document.getElementById("printable-receipt");
    if (!node) return;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = win.document;
    doc.open();
    doc.write(
      "<!doctype html><html><head><meta charset='utf-8'><title>Bill " + bill.id + "</title>" +
      "<style>@page{margin:6mm}html,body{margin:0;padding:0;background:#fff;color:#000;" +
      "font-family:'Nirmala UI','Noto Sans Tamil',Arial,sans-serif}</style></head><body>" +
      node.innerHTML +
      "</body></html>"
    );
    doc.close();

    const cleanup = () => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    };
    win.onafterprint = cleanup;
    setTimeout(() => {
      win.focus();
      win.print();
      setTimeout(cleanup, 60000);
    }, 300);
  };

  const isCredit = bill.paymentMode === "Credit";
  const isUPI = bill.paymentMode === "UPI";
  const total = Number(bill.amount) || 0;

  // Items from the POS cart (name / price) or from a saved sale (product_name / unit_price)
  const rawItems =
    bill.items && bill.items.length > 0 ? bill.items : bill.lineItems || [];

  const lines = rawItems.map((it) => {
    const qty = Number(it.quantity) || 0;
    const price = Number(it.price ?? it.unit_price) || 0;
    return {
      name: it.name || it.product_name || "Item",
      qty,
      amount: Number(it.line_total ?? price * qty) || 0,
    };
  });
  if (lines.length === 0) {
    lines.push({ name: bill.item || "Retail sale", qty: 1, amount: total });
  }

  const linesTotal = lines.reduce((sum, l) => sum + l.amount, 0);
  const subtotal = Number(bill.subtotal) || linesTotal;
  const discount = Number(bill.discount) || 0;

  // Credit details
  const paid = Number(bill.paidAmount) || 0;
  const due =
    bill.creditAmount !== undefined && bill.creditAmount !== null && bill.creditAmount !== ""
      ? Number(bill.creditAmount) || 0
      : Math.max(0, total - paid);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card receipt-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-view" id="printable-receipt" style={{ maxHeight: "calc(100vh - 170px)", overflowY: "auto" }}>
          <div style={{ maxWidth: 380, margin: "0 auto", color: "#000" }}>
            {/* Shop details - top centre */}
            <div style={{ textAlign: "center", marginBottom: 12, lineHeight: 1.5 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>சன்மதி மல்டி ஸ்டோர்</div>
              <div style={{ fontSize: 14 }}>ராமகிருஷ்ணாபுரம் பஸ் ஸ்டாப் பொட்டிபுரம் போஸ்ட் தேனி</div>
              <div style={{ fontSize: 14 }}>7010884838</div>
              <div style={{ fontSize: 14 }}>9042623572</div>
            </div>

            {/* Bill details */}
            <div style={{ borderTop: "1px dashed #000", paddingTop: 6, marginBottom: 8 }}>
              <div style={row}>
                <span>Bill No:</span>
                <strong>{bill.id}</strong>
              </div>
              <div style={row}>
                <span>Date:</span>
                <span>
                  {bill.fullDate || "Today"} {bill.date ? `· ${bill.date}` : ""}
                </span>
              </div>
              <div style={row}>
                <span>Customer:</span>
                <span>
                  {bill.customerName || "Walk-in Customer"}
                  {bill.customerPhone ? ` (${bill.customerPhone})` : ""}
                </span>
              </div>
            </div>

            {/* Items: S.No | Product Name | Quantity | Amount */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...th, textAlign: "left", width: 40 }}>S.No</th>
                  <th style={{ ...th, textAlign: "left" }}>Product Name</th>
                  <th style={{ ...th, textAlign: "center", width: 60 }}>Quantity</th>
                  <th style={{ ...th, textAlign: "right", width: 80 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, idx) => (
                  <tr key={idx}>
                    <td style={td}>{idx + 1}</td>
                    <td style={td}>{l.name}</td>
                    <td style={{ ...td, textAlign: "center" }}>{l.qty}</td>
                    <td style={{ ...td, textAlign: "right" }}>{rupee(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ marginTop: 8 }}>
              {discount > 0 && (
                <>
                  <div style={row}>
                    <span>Subtotal:</span>
                    <span>{rupee(subtotal)}</span>
                  </div>
                  <div style={row}>
                    <span>Discount:</span>
                    <span>-{rupee(discount)}</span>
                  </div>
                </>
              )}
              <div style={{ ...row, fontSize: 18, fontWeight: 800, borderTop: "1px solid #000", marginTop: 4, paddingTop: 6 }}>
                <span>Total:</span>
                <span>{rupee(total)}</span>
              </div>

              <div style={row}>
                <span>Payment:</span>
                <strong>{isCredit ? "Credit (Udhar)" : isUPI ? "UPI" : bill.paymentMode === "Card" || bill.paymentMode === "Online" ? "Online" : "Cash"}</strong>
              </div>

              {/* Cash received and balance returned */}
              {!isCredit && Number(bill.receivedAmount) > 0 && (
                <>
                  <div style={row}>
                    <span>Cash Received:</span>
                    <span>{rupee(Number(bill.receivedAmount))}</span>
                  </div>
                  <div style={{ ...row, fontWeight: 800 }}>
                    <span>Balance Returned:</span>
                    <span>{rupee(Number(bill.changeAmount) || 0)}</span>
                  </div>
                </>
              )}

              {/* Credit details */}
              {isCredit && (
                <div style={{ border: "1px solid #000", borderRadius: 4, padding: "6px 8px", marginTop: 6 }}>
                  <div style={row}>
                    <span>Paid Now:</span>
                    <span>{rupee(paid)}</span>
                  </div>
                  <div style={{ ...row, fontWeight: 800 }}>
                    <span>Balance Due (Credit):</span>
                    <span>{rupee(due)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-actions-bar">
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
          <button type="button" className="primary-button print-btn" onClick={handlePrint}>
            🖨️ Print Bill
          </button>
        </div>
      </div>
    </div>
  );
}
