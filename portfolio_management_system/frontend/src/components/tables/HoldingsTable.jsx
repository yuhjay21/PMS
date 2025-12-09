'use client';

export default function HoldingsTable({ holdings }) {
  if (!holdings.length) {
    return <p style={{ fontSize: '0.85rem' }}>No positions in this portfolio.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>Exchange</th>
            <th>Shares</th>
            <th>LTP</th>
            <th>Value</th>
            <th>Inv. Cost</th>
            <th>uPnL</th>
            <th>Total PnL</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.id}>
              <td>{h.CompanySymbol}</td>
              <td>{h.CompanyName}</td>
              <td>{h.exchange}</td>
              <td>{h.NumberShares}</td>
              <td>
                {h.LTP.toLocaleString('en-AU', {
                  style: 'currency',
                  currency: 'AUD',
                })}
              </td>
              <td>
                {h.Value.toLocaleString('en-AU', {
                  style: 'currency',
                  currency: 'AUD',
                })}
              </td>
              <td>
                {h.InvestmentAmount.toLocaleString('en-AU', {
                  style: 'currency',
                  currency: 'AUD',
                })}
              </td>
              <td
                style={{ color: h.uPnL >= 0 ? '#16a34a' : '#dc2626' }}
              >
                {h.uPnL.toLocaleString('en-AU', {
                  style: 'currency',
                  currency: 'AUD',
                })}
              </td>
              <td
                style={{ color: h.PnL >= 0 ? '#16a34a' : '#dc2626' }}
              >
                {h.PnL.toLocaleString('en-AU', {
                  style: 'currency',
                  currency: 'AUD',
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
