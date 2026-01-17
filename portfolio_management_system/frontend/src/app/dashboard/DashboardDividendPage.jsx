import { useMemo, useState } from "react";
import { toast } from "react-hot-toast"; // if you already use it; otherwise remove


function getCookie(name) {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  } 

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function apiFetch(path, options = {}) {

  const csrftoken = getCookie('csrftoken');

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // if using session auth
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken || '',
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {}

  if (!res.ok) {
    const msg =
      data?.detail ||            // 👈 DRF standard
      data?.error ||
      `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return data;
}


export default function DividendConfirmTable({
  dividendEvents = [],
  formatMoney,
  selectedPortfolio = "All"
}) {
  // Keep selected items like legacy checkboxes (symbol|ex_date)
  const [selected, setSelected] = useState(() => new Set());
  const [transactionType, setTransactionType] = useState("Dividend Deposit");
  const [submitting, setSubmitting] = useState(false);

  const allSelected = useMemo(() => {
    return dividendEvents.length > 0 && selected.size === dividendEvents.length;
  }, [selected, dividendEvents]);

  function toggleOne(key) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set();
      if (prev.size !== dividendEvents.length) {
        dividendEvents.forEach((e) => next.add(`${e.symbol}|${e.ex_date}`));
      }
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();

    const chosen = dividendEvents.filter((evt) =>
      selected.has(`${evt.symbol}|${evt.ex_date}`)
    );

    if (chosen.length === 0) {
      toast?.error?.("Please select at least one dividend.");
      return;
    }

    // legacy dropdown decides transaction type for ALL selected rows
    const reinvest = transactionType === "Dividend Reinvestment";

    // Build payload expected by ConfirmMultipleDividendsAPI
    // NOTE: reinvest requires price in your backend to calculate qty.
    // If you have price in event (e.g. evt.price / evt.ltp), send it.
    const payload = {
      events: chosen.map((evt) => ({
        pf_id : selectedPortfolio,
        symbol: evt.symbol,
        ex_date: evt.ex_date,
        shares: evt.shares,
        exchange: evt.exchange,
        div_per_share : evt.div_per_share,
        total_dividend: evt.total_dividend, // IMPORTANT: match your serializer field
        reinvest,
        price: reinvest ? (evt.price ?? evt.ltp ?? null) : null,
      })),
    };

    try {
      setSubmitting(true);
      const res = await apiFetch("/api/v1/dashboard/dividends/confirm-multiple/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast?.success?.("Selected dividends confirmed.");
      // Optionally: clear selection + refresh list
      setSelected(new Set());
      return res;
    } catch (err) {
      toast?.error?.(err.message || "Failed to confirm dividends.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="table-responsive">
        <table className="table table-striped table-centered mb-0">
          <thead>
            <tr>
              <th style={{ width: 80 }}>
                {/* <input
                  type="checkbox"
                  className="form-check-input"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all dividends"
                /> */}
                Select
              </th>
              <th>Symbol</th>
              <th>Ex-Date</th>
              <th className="text-end">Dividend/Share</th>
              <th className="text-end">Shares</th>
              <th className="text-end">Total</th>
            </tr>
          </thead>

          <tbody>
            {dividendEvents.map((event) => {
              const key = `${event.symbol}|${event.ex_date}`;
              const isChecked = selected.has(key);

              return (
                <tr key={`${event.symbol}-${event.ex_date}-${event.total_dividend}`}>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      name="selected_dividends"
                      value={key} // ✅ legacy format: symbol|ex_date
                      className="form-check-input"
                      checked={isChecked}
                      onChange={() => toggleOne(key)}
                    />
                  </td>
                  <td>{event.symbol} | {event.exchange}</td>
                  <td>{event.ex_date}</td>
                  <td className="text-end">${formatMoney(event.div_per_share,4)}</td>
                  <td className="text-end">{event.shares}</td>
                  <td className="text-end">${formatMoney(event.total_dividend)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            <label
              htmlFor="transaction_type"
              className="form-label me-2 fw-semibold"
            >
              Transaction Type:
            </label>

            <select
              name="transaction_type"
              id="transaction_type"
              className="form-select d-inline-block w-auto"
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
            >
              <option value="Dividend Deposit">Dividend Deposit</option>
              <option value="Dividend Reinvestment">Dividend Reinvestment</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-success"
            disabled={submitting}
          >
            {submitting ? "Confirming..." : "Confirm Selected Dividends"}
          </button>
        </div>
      </div>
    </form>
  );
}
