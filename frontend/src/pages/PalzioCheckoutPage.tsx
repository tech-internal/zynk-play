import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  clearPalzioCheckoutToken,
  palzioCompletePayment,
  readPalzioCheckoutToken,
  type PalzioMethod,
  type PalzioOutcome,
} from "../api/palzio";
import ApiLoaderOverlay from "../components/ApiLoaderOverlay";
import { useEntitlements } from "../context/EntitlementsContext";
import "./PalzioCheckoutPage.css";

const METHODS: { id: PalzioMethod; label: string; subtitle: string }[] = [
  { id: "card", label: "Card", subtitle: "Visa, Mastercard, RuPay" },
  { id: "upi", label: "UPI", subtitle: "Google Pay, PhonePe, etc." },
  { id: "wallet", label: "Wallet", subtitle: "Paytm, Mobikwik, etc." },
];

const OUTCOMES: { id: PalzioOutcome; label: string; hint: string }[] = [
  { id: "success", label: "Success", hint: "Platform grants subscription" },
  { id: "failed", label: "Failed", hint: "Generic decline" },
  {
    id: "insufficient_balance",
    label: "Insufficient balance",
    hint: "Mapped to failed",
  },
  {
    id: "user_dropped",
    label: "User dropped",
    hint: "Abandoned — transaction cancelled",
  },
];

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

function formatCardDisplay(raw: string): string {
  const d = digitsOnly(raw).slice(0, 19);
  const groups: string[] = [];
  for (let i = 0; i < d.length; i += 4) {
    groups.push(d.slice(i, i + 4));
  }
  return groups.join(" ");
}

function isPlausibleCardNumber(d: string): boolean {
  return d.length >= 15 && d.length <= 19;
}

function isExpiryValid(mmYy: string): boolean {
  const t = mmYy.replace(/\D/g, "");
  if (t.length !== 4) return false;
  const mm = parseInt(t.slice(0, 2), 10);
  const yy = parseInt(t.slice(2, 4), 10);
  if (mm < 1 || mm > 12) return false;
  const fullYear = 2000 + yy;
  const now = new Date();
  const last = new Date(fullYear, mm, 0);
  return last >= new Date(now.getFullYear(), now.getMonth(), 1);
}

function isPlausibleVpa(v: string): boolean {
  const s = v.trim().toLowerCase();
  if (s.length < 5 || s.length > 50) return false;
  const at = s.indexOf("@");
  if (at < 1 || at === s.length - 1) return false;
  return /^[a-z0-9._-]+@[a-z0-9.-]+$/.test(s);
}

function isPlausibleWalletId(s: string): boolean {
  const t = s.trim();
  return t.length >= 6;
}

const PalzioCheckoutPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useEntitlements();
  const transactionRef = params.get("transaction_ref") ?? "";

  const [checkoutToken, setCheckoutToken] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionRef) {
      setCheckoutToken(null);
      return;
    }
    const fromSession = readPalzioCheckoutToken(transactionRef);
    const fromQuery = params.get("checkout_token");
    setCheckoutToken(fromSession || fromQuery);
  }, [transactionRef, params]);

  const [method, setMethod] = useState<PalzioMethod>("card");
  const [outcome, setOutcome] = useState<PalzioOutcome>("success");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<{
    tone: "ok" | "bad" | "neutral";
    text: string;
  } | null>(null);

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiId, setUpiId] = useState("");
  const [walletId, setWalletId] = useState("");

  const missing = !transactionRef || !checkoutToken;

  const formValid = useMemo(() => {
    if (missing) return false;
    if (method === "card") {
      const num = digitsOnly(cardNumber);
      const cvv = digitsOnly(cardCvv);
      return (
        isPlausibleCardNumber(num) &&
        cardName.trim().length >= 2 &&
        isExpiryValid(cardExpiry) &&
        cvv.length >= 3 &&
        cvv.length <= 4
      );
    }
    if (method === "upi") {
      return isPlausibleVpa(upiId);
    }
    return isPlausibleWalletId(walletId);
  }, [
    missing,
    method,
    cardNumber,
    cardName,
    cardExpiry,
    cardCvv,
    upiId,
    walletId,
  ]);

  const runComplete = async () => {
    if (!transactionRef || !checkoutToken) return;
    if (!formValid) {
      setError("Please fill in valid payment details.");
      return;
    }
    setBusy(true);
    setError(null);
    setDoneMessage(null);
    try {
      await palzioCompletePayment({
        transaction_ref: transactionRef,
        checkout_token: checkoutToken,
        outcome,
        payment_method: method,
      });
      if (outcome === "success") {
        clearPalzioCheckoutToken(transactionRef);
        setDoneMessage({
          tone: "ok",
          text: "Payment completed. Your subscription is active when the platform accepted the callback.",
        });
        await refresh();
        window.setTimeout(() => navigate("/dashboard", { replace: true }), 1600);
      } else if (outcome === "user_dropped") {
        clearPalzioCheckoutToken(transactionRef);
        setDoneMessage({
          tone: "neutral",
          text: "Checkout abandoned. The platform marked this transaction as cancelled.",
        });
      } else {
        clearPalzioCheckoutToken(transactionRef);
        setDoneMessage({
          tone: "bad",
          text: "Payment did not succeed. You can start a new purchase from your profile.",
        });
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not reach Palzio PSP or platform.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pcheckout-page">
      <ApiLoaderOverlay active={busy} label="Completing your payment..." />
      <div className="pcheckout-shell">
        <header className="pcheckout-topbar">
          <div className="pcheckout-brand">
            <span className="pcheckout-brand-mark" aria-hidden>
              ◆
            </span>
            <div>
              <h1 className="pcheckout-title">Secure checkout</h1>
              <p className="pcheckout-sub">Mock gateway · Palzio PSP</p>
            </div>
          </div>
        </header>

        {missing && (
          <div className="pcheckout-panel">
            <p className="pcheckout-error">
              Missing checkout session. Choose a plan on the subscription page and continue to payment.
            </p>
            <Link to="/subscription" className="pcheckout-link-btn">
              View plans
            </Link>
          </div>
        )}

        {!missing && (
          <>
            <div className="pcheckout-panel pcheckout-order">
              <p className="pcheckout-order-label">Order reference</p>
              <p className="pcheckout-order-ref">{transactionRef}</p>
              <p className="pcheckout-order-hint">
                Details you enter below are for this demo UI only. Completion
                still uses the simulated result in &quot;Developer options&quot;.
              </p>
            </div>

            <div className="pcheckout-panel pcheckout-main">
              <div
                className="pcheckout-tabs"
                role="tablist"
                aria-label="Payment method"
              >
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={method === m.id}
                    className={`pcheckout-tab ${method === m.id ? "is-active" : ""}`}
                    onClick={() => setMethod(m.id)}
                  >
                    <span className="pcheckout-tab-label">{m.label}</span>
                    <span className="pcheckout-tab-sub">{m.subtitle}</span>
                  </button>
                ))}
              </div>

              {method === "card" && (
                <div
                  className="pcheckout-fields"
                  role="tabpanel"
                  aria-label="Card"
                >
                  <label className="pcheckout-field">
                    <span className="pcheckout-field-label">Card number</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="1234 5678 9012 3456"
                      className="pcheckout-input"
                      value={formatCardDisplay(cardNumber)}
                      onChange={(e) =>
                        setCardNumber(digitsOnly(e.target.value).slice(0, 19))
                      }
                    />
                  </label>
                  <label className="pcheckout-field">
                    <span className="pcheckout-field-label">Name on card</span>
                    <input
                      type="text"
                      autoComplete="cc-name"
                      placeholder="As printed on card"
                      className="pcheckout-input"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </label>
                  <div className="pcheckout-row2">
                    <label className="pcheckout-field">
                      <span className="pcheckout-field-label">Valid thru</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM / YY"
                        className="pcheckout-input"
                        value={cardExpiry}
                        onChange={(e) => {
                          const d = digitsOnly(e.target.value).slice(0, 4);
                          let v = d;
                          if (d.length > 2) {
                            v = `${d.slice(0, 2)} / ${d.slice(2)}`;
                          }
                          setCardExpiry(v);
                        }}
                      />
                    </label>
                    <label className="pcheckout-field">
                      <span className="pcheckout-field-label">CVV</span>
                      <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="•••"
                        className="pcheckout-input"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) =>
                          setCardCvv(digitsOnly(e.target.value).slice(0, 4))
                        }
                      />
                    </label>
                  </div>
                </div>
              )}

              {method === "upi" && (
                <div
                  className="pcheckout-fields"
                  role="tabpanel"
                  aria-label="UPI"
                >
                  <label className="pcheckout-field">
                    <span className="pcheckout-field-label">UPI ID</span>
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="yourname@paytm"
                      className="pcheckout-input"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value.trimStart())}
                    />
                  </label>
                  <p className="pcheckout-field-hint">
                    Enter the UPI address linked to your bank account or app.
                  </p>
                </div>
              )}

              {method === "wallet" && (
                <div
                  className="pcheckout-fields"
                  role="tabpanel"
                  aria-label="Wallet"
                >
                  <label className="pcheckout-field">
                    <span className="pcheckout-field-label">
                      Registered mobile / wallet ID
                    </span>
                    <input
                      type="text"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="10-digit mobile or wallet login"
                      className="pcheckout-input"
                      value={walletId}
                      onChange={(e) => setWalletId(e.target.value)}
                    />
                  </label>
                  <p className="pcheckout-field-hint">
                    Same as you use to log in to your wallet app.
                  </p>
                </div>
              )}

              <div className="pcheckout-actions">
                <button
                  type="button"
                  className="pcheckout-pay"
                  disabled={busy || !formValid}
                  onClick={() => void runComplete()}
                >
                  {busy ? "Processing…" : "Pay now"}
                </button>
                <button
                  type="button"
                  className="pcheckout-cancel"
                  disabled={busy}
                  onClick={() => navigate("/subscription")}
                >
                  Cancel
                </button>
              </div>
            </div>

            <details className="pcheckout-dev">
              <summary>Developer options (mock)</summary>
              <p className="pcheckout-dev-intro">
                Real PSPs resolve success or failure on their servers. Here you
                pick the outcome before paying.
              </p>
              <p className="pcheckout-dev-label">Simulate result</p>
              <div
                className="pcheckout-chips"
                role="group"
                aria-label="Outcome"
              >
                {OUTCOMES.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={`pcheckout-chip ${outcome === o.id ? "is-on" : ""}`}
                    onClick={() => setOutcome(o.id)}
                    title={o.hint}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <p className="pcheckout-dev-hint">
                {OUTCOMES.find((o) => o.id === outcome)?.hint}
              </p>
            </details>

            {error && <p className="pcheckout-error pcheckout-error-below">{error}</p>}
            {doneMessage && (
              <div className={`pcheckout-toast pcheckout-toast--${doneMessage.tone}`}>
                {doneMessage.text}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PalzioCheckoutPage;
