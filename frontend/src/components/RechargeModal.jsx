import React, { useState } from "react";

const OPERATORS = [
  { id: "jio", name: "Jio", type: "mobile", icon: "🔵" },
  { id: "airtel", name: "Airtel", type: "mobile", icon: "🔴" },
  { id: "vi", name: "Vi", type: "mobile", icon: "🟡" },
  { id: "bsnl", name: "BSNL", type: "mobile", icon: "🟢" },
  { id: "sundirect", name: "Sun Direct", type: "dth", icon: "☀️" },
  { id: "tataplay", name: "Tata Play", type: "dth", icon: "📺" },
  { id: "airteldth", name: "Airtel Digital TV", type: "dth", icon: "📡" },
  { id: "dishtv", name: "Dish TV", type: "dth", icon: "🛰️" },
];

const CIRCLES = [
  "Tamil Nadu",
  "Chennai",
  "Karnataka",
  "Kerala",
  "Andhra Pradesh & Telangana",
  "Maharashtra & Goa",
  "Delhi NCR",
  "All India",
];

const POPULAR_PLANS = {
  mobile: [
    { amount: 239, validity: "28 Days", data: "1.5 GB/Day", desc: "Truly Unlimited Calls + 100 SMS/day + Free Jio/Airtel apps", tag: "Best Seller" },
    { amount: 299, validity: "28 Days", data: "2.0 GB/Day", desc: "Unlimited 5G Data + Unlimited Calls + 100 SMS/day", tag: "Popular" },
    { amount: 349, validity: "28 Days", data: "2.5 GB/Day", desc: "Hero Unlimited + Night Binge + Weekend Data Rollover" },
    { amount: 666, validity: "84 Days", data: "1.5 GB/Day", desc: "Unlimited Voice + 100 SMS/day + 3 Months validity", tag: "Value Pack" },
    { amount: 859, validity: "84 Days", data: "2.0 GB/Day", desc: "Unlimited 5G + Disney+ Hotstar Mobile included for 84 days" },
    { amount: 19, validity: "Existing Plan", data: "1.0 GB", desc: "Data Add-on voucher for instant high-speed topup" },
    { amount: 61, validity: "Existing Plan", data: "6.0 GB", desc: "5G Data Booster pack" },
    { amount: 2999, validity: "365 Days", data: "2.5 GB/Day", desc: "Annual Pack: Unlimited calls, 100 SMS/day, All-year validity" },
  ],
  dth: [
    { amount: 249, validity: "30 Days", data: "Tamil Regional", desc: "Sun TV, KTV, Star Vijay, Zee Tamil, News + 85 channels", tag: "Top Pick" },
    { amount: 349, validity: "30 Days", data: "South Value HD", desc: "All Tamil HD + Sports + Kids + Infotainment packs", tag: "HD Pack" },
    { amount: 499, validity: "30 Days", data: "Family Premium HD", desc: "All Regional + English Movies + Sports 1 & 2 HD" },
    { amount: 1499, validity: "180 Days", data: "6 Months South Pack", desc: "Super savings semi-annual subscription with free repair visit" },
  ],
};

export default function RechargeModal({ isOpen, onClose, onRechargeSuccess }) {
  const [serviceCategory, setServiceCategory] = useState("mobile"); // 'mobile' | 'dth'
  const [operator, setOperator] = useState("jio");
  const [circle, setCircle] = useState("Tamil Nadu");
  const [mobileNumber, setMobileNumber] = useState("");
  const [amount, setAmount] = useState("239");
  const [selectedPlanDesc, setSelectedPlanDesc] = useState("Truly Unlimited Calls + 1.5 GB/Day (28 Days)");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const filteredOperators = OPERATORS.filter((op) => op.type === serviceCategory);
  const activePlans = POPULAR_PLANS[serviceCategory] || [];

  const handleServiceChange = (cat) => {
    setServiceCategory(cat);
    const firstOp = OPERATORS.find((op) => op.type === cat);
    if (firstOp) setOperator(firstOp.id);
    const defaultPlan = POPULAR_PLANS[cat][0];
    if (defaultPlan) {
      setAmount(defaultPlan.amount.toString());
      setSelectedPlanDesc(`${defaultPlan.data} (${defaultPlan.validity})`);
    }
  };

  const handlePlanSelect = (plan) => {
    setAmount(plan.amount.toString());
    setSelectedPlanDesc(`${plan.data} · ${plan.validity} · ${plan.desc}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (serviceCategory === "mobile") {
      if (!mobileNumber || mobileNumber.trim().length !== 10) {
        setError("Please enter a valid 10-digit mobile number.");
        return;
      }
    } else {
      if (!mobileNumber || mobileNumber.trim().length < 8) {
        setError("Please enter a valid DTH Smart Card / Subscriber ID (min 8 digits).");
        return;
      }
    }

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError("Please select or enter a valid recharge amount.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const txnId = `RCH-${Math.floor(1000 + Math.random() * 9000)}`;
      const opObj = OPERATORS.find((op) => op.id === operator) || { name: operator };

      const newTxn = {
        id: txnId,
        type: "Recharge",
        category: "Recharge",
        item: `${opObj.name} ${serviceCategory === "mobile" ? "Prepaid" : "DTH"} ₹${numAmount}`,
        details: `${serviceCategory === "mobile" ? "Mob: " : "SmartCard: "}${mobileNumber} (${circle})`,
        planSummary: selectedPlanDesc,
        amount: numAmount,
        fee: 0,
        status: "Paid",
        operator: opObj.name,
        targetNumber: mobileNumber,
        circle,
        date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
        fullDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      };

      setIsSubmitting(false);
      onRechargeSuccess(newTxn);
      onClose();
    }, 600);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon emerald">⚡</span>
            <div>
              <h3>Mobile & DTH Recharge</h3>
              <p>Instant recharge across all major telecom & DTH operators</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="form-alert error">{error}</div>}

          {/* Service Toggle */}
          <div className="tab-pill-group">
            <button
              type="button"
              className={`tab-pill ${serviceCategory === "mobile" ? "active" : ""}`}
              onClick={() => handleServiceChange("mobile")}
            >
              📱 Mobile Recharge
            </button>
            <button
              type="button"
              className={`tab-pill ${serviceCategory === "dth" ? "active" : ""}`}
              onClick={() => handleServiceChange("dth")}
            >
              📺 DTH / Cable Recharge
            </button>
          </div>

          {/* Operator Selection */}
          <div className="form-group">
            <label className="form-label">Select Operator</label>
            <div className="operator-chips-grid">
              {filteredOperators.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  className={`operator-chip ${operator === op.id ? "selected" : ""}`}
                  onClick={() => setOperator(op.id)}
                >
                  <span className="operator-icon">{op.icon}</span>
                  <span className="operator-name">{op.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Number and Circle */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label className="form-label">
                {serviceCategory === "mobile" ? "Mobile Number" : "Smart Card / Subscriber ID"}{" "}
                <span className="req">*</span>
              </label>
              <div className="input-prefix-group">
                {serviceCategory === "mobile" && <span className="input-prefix">+91</span>}
                <input
                  type="tel"
                  className="form-input"
                  placeholder={serviceCategory === "mobile" ? "e.g. 9840123456" : "e.g. 4109283719"}
                  value={mobileNumber}
                  maxLength={serviceCategory === "mobile" ? 10 : 14}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
            </div>

            <div className="form-group flex-1">
              <label className="form-label">Circle / State</label>
              <select
                className="form-select"
                value={circle}
                onChange={(e) => setCircle(e.target.value)}
              >
                {CIRCLES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount field */}
          <div className="form-group">
            <div className="label-with-hint">
              <label className="form-label">
                Recharge Amount (₹) <span className="req">*</span>
              </label>
              <span className="hint-tag">{selectedPlanDesc}</span>
            </div>
            <div className="input-prefix-group">
              <span className="input-prefix">₹</span>
              <input
                type="number"
                min="10"
                className="form-input text-lg font-bold"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setSelectedPlanDesc("Custom Amount");
                }}
                required
              />
            </div>
          </div>

          {/* Popular Plans Grid */}
          <div className="form-group">
            <label className="form-label">Popular Plans & Packs</label>
            <div className="plans-grid">
              {activePlans.map((plan) => (
                <div
                  key={plan.amount}
                  className={`plan-card ${amount === plan.amount.toString() ? "active" : ""}`}
                  onClick={() => handlePlanSelect(plan)}
                >
                  <div className="plan-card-top">
                    <span className="plan-price">₹{plan.amount}</span>
                    {plan.tag && <span className="plan-badge">{plan.tag}</span>}
                  </div>
                  <div className="plan-meta">
                    <strong>{plan.validity}</strong>
                    <span>{plan.data}</span>
                  </div>
                  <p className="plan-desc">{plan.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button recharge-submit-btn"
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
            >
              {isSubmitting ? "Recharging..." : `Proceed to Recharge ₹${amount || 0} →`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
