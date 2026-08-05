import { useState, useEffect } from 'react'
import axios from 'axios'
import './ReportDashboard.css'

function ReportDashboard({ user }) {
  // Sub-tabs: 'income' | 'expense' | 'profit' | 'collection' | 'tenant' | 'property'
  const [activeReportTab, setActiveReportTab] = useState('income');
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReportsData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/dashboard/reports?landlordId=${user.id}`);
      if (response.data.status === 'success') {
        setReportsData(response.data.reports);
      } else {
        setError('Error generating reports.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to report aggregation engine.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [user.id]);

  if (loading) {
    return (
      <div className="reports-loading-box">
        <div className="loading-spinner"></div>
        <p>Analyzing financials and occupancy logs...</p>
      </div>
    );
  }

  if (error || !reportsData) {
    return (
      <div className="reports-error-box">
        <p>{error || 'Could not compile reports.'}</p>
        <button className="cta-primary" onClick={fetchReportsData}>Retry Aggregation</button>
      </div>
    );
  }

  const { financialReport, rentCollection, tenantStats, propertyStats } = reportsData;

  // Find max value in monthly metrics to scale visual CSS charts
  const maxIncome = Math.max(...financialReport.map(r => r.income), 100);
  const maxExpense = Math.max(...financialReport.map(r => r.expense), 100);
  const maxProfit = Math.max(...financialReport.map(r => Math.abs(r.profit)), 100);
  const maxFinVal = Math.max(maxIncome, maxExpense, 100);

  return (
    <div className="reports-dashboard-wrapper">
      
      {/* Header Panel */}
      <div className="list-header-row">
        <h2>📊 Intelligence & Reports Ledger</h2>
        <button className="refresh-reports-btn" onClick={fetchReportsData}>
          🔄 Recalculate Reports
        </button>
      </div>

      {/* Sub-tabs Selection bar */}
      <div className="reports-tabs-bar">
        <button 
          className={`reports-tab-btn ${activeReportTab === 'income' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('income')}
        >
          📈 Income
        </button>
        <button 
          className={`reports-tab-btn ${activeReportTab === 'expense' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('expense')}
        >
          💸 Expenses
        </button>
        <button 
          className={`reports-tab-btn ${activeReportTab === 'profit' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('profit')}
        >
          ⚖️ Profit & Loss
        </button>
        <button 
          className={`reports-tab-btn ${activeReportTab === 'collection' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('collection')}
        >
          💳 Collection Rate
        </button>
        <button 
          className={`reports-tab-btn ${activeReportTab === 'tenant' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('tenant')}
        >
          👥 Tenants
        </button>
        <button 
          className={`reports-tab-btn ${activeReportTab === 'property' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('property')}
        >
          🏠 Occupancy
        </button>
      </div>

      {/* ----------------------------------------------------
         SUB-TAB 1: MONTHLY INCOME REPORT
      ---------------------------------------------------- */}
      {activeReportTab === 'income' && (
        <div className="report-panel-container animate-fade">
          <div className="panel-summary-desc">
            <h3>Monthly Rent Income</h3>
            <p>Receipt ledger of rent collections generated over the last 6 months.</p>
          </div>

          {/* Visual CSS Bar Chart */}
          <div className="chart-container">
            <div className="chart-bar-layout">
              {financialReport.map((r, idx) => {
                const percentHeight = (r.income / maxFinVal) * 80; // scale to max 80%
                return (
                  <div className="chart-column" key={idx}>
                    <div className="column-bar income" style={{ height: `${Math.max(percentHeight, 4)}%` }}>
                      <span className="tooltip-value">${r.income}</span>
                    </div>
                    <span className="column-label">{r.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Ledger List */}
          <div className="ledger-table-wrapper">
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>Billing Month</th>
                  <th>Total Collected Income</th>
                  <th>Status Ratio</th>
                </tr>
              </thead>
              <tbody>
                {financialReport.map((r, idx) => (
                  <tr key={idx}>
                    <td className="font-bold">{r.month}</td>
                    <td className="income-val font-bold">${r.income}</td>
                    <td>
                      <div className="status-progress-track">
                        <div className="progress-fill income" style={{ width: `${(r.income / maxIncome) * 100}%` }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
         SUB-TAB 2: MONTHLY EXPENSE REPORT
      ---------------------------------------------------- */}
      {activeReportTab === 'expense' && (
        <div className="report-panel-container animate-fade">
          <div className="panel-summary-desc">
            <h3>Monthly Operational Expenses</h3>
            <p>Breakdown of outflows from maintenance, utility fees, taxes, and other property-wise expenses.</p>
          </div>

          {/* Visual CSS Bar Chart */}
          <div className="chart-container">
            <div className="chart-bar-layout">
              {financialReport.map((r, idx) => {
                const percentHeight = (r.expense / maxFinVal) * 80;
                return (
                  <div className="chart-column" key={idx}>
                    <div className="column-bar expense" style={{ height: `${Math.max(percentHeight, 4)}%` }}>
                      <span className="tooltip-value">${r.expense}</span>
                    </div>
                    <span className="column-label">{r.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Ledger List */}
          <div className="ledger-table-wrapper">
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Outflow Expense Total</th>
                  <th>Volume Rate</th>
                </tr>
              </thead>
              <tbody>
                {financialReport.map((r, idx) => (
                  <tr key={idx}>
                    <td className="font-bold">{r.month}</td>
                    <td className="expense-val font-bold">${r.expense}</td>
                    <td>
                      <div className="status-progress-track">
                        <div className="progress-fill expense" style={{ width: `${(r.expense / maxExpense) * 100}%` }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
         SUB-TAB 3: PROFIT & LOSS REPORT
      ---------------------------------------------------- */}
      {activeReportTab === 'profit' && (
        <div className="report-panel-container animate-fade">
          <div className="panel-summary-desc">
            <h3>Profit & Loss Summary</h3>
            <p>Net income metrics showing total collected rent minus operational expenses.</p>
          </div>

          {/* Dual Bar Chart (Income vs Expense) */}
          <div className="chart-container profit-mode">
            <div className="chart-bar-layout">
              {financialReport.map((r, idx) => {
                const profitHeight = (Math.max(r.profit, 0) / maxFinVal) * 80;
                const isLoss = r.profit < 0;
                const absProfitHeight = (Math.abs(r.profit) / maxFinVal) * 80;
                return (
                  <div className="chart-column dual-columns" key={idx}>
                    <div className="bar-group">
                      <div className="column-bar income mini" style={{ height: `${(r.income / maxFinVal) * 80}%` }} title={`Income: $${r.income}`}></div>
                      <div className="column-bar expense mini" style={{ height: `${(r.expense / maxFinVal) * 80}%` }} title={`Expense: $${r.expense}`}></div>
                    </div>
                    <span className="column-label">{r.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Ledger List */}
          <div className="ledger-table-wrapper">
            <table className="report-data-table">
              <thead>
                <tr>
                  <th>Accounting Period</th>
                  <th>Rent Income</th>
                  <th>Expenses Outflow</th>
                  <th>Net Profit / Margin</th>
                </tr>
              </thead>
              <tbody>
                {financialReport.map((r, idx) => (
                  <tr key={idx}>
                    <td className="font-bold">{r.month}</td>
                    <td className="income-val font-bold">${r.income}</td>
                    <td className="expense-val font-bold">${r.expense}</td>
                    <td className={`font-bold ${r.profit >= 0 ? 'profit-val' : 'loss-val'}`}>
                      {r.profit >= 0 ? `+$${r.profit}` : `-$${Math.abs(r.profit)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
         SUB-TAB 4: RENT COLLECTION RATE REPORT
      ---------------------------------------------------- */}
      {activeReportTab === 'collection' && (
        <div className="report-panel-container animate-fade">
          <div className="panel-summary-desc">
            <h3>Collection Rate Metrics</h3>
            <p>Efficiency of rent collection billing runs, outlining collected, due, and past due status lists.</p>
          </div>

          {/* Collection Rate Meter */}
          <div className="collection-rate-radial-card">
            <div className="radial-meter-box">
              <span className="radial-val">{rentCollection.rate}%</span>
              <span className="radial-lbl">Collection Efficiency</span>
            </div>
            <div className="meter-legend-details">
              <div className="legend-item">
                <span className="color-dot settled"></span>
                <span className="lbl">Settled Invoices</span>
                <span className="val">${rentCollection.paid}</span>
              </div>
              <div className="legend-item">
                <span className="color-dot pending"></span>
                <span className="lbl">Outstanding Due</span>
                <span className="val">${rentCollection.due}</span>
              </div>
              <div className="legend-item">
                <span className="color-dot overdue"></span>
                <span className="lbl">Past Due Overdue</span>
                <span className="val">${rentCollection.overdue}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
         SUB-TAB 5: TENANTS CRM STATS REPORT
      ---------------------------------------------------- */}
      {activeReportTab === 'tenant' && (
        <div className="report-panel-container animate-fade">
          <div className="panel-summary-desc">
            <h3>Tenant Occupancy Distribution</h3>
            <p>Breakdown of registered tenant account distributions and status tags.</p>
          </div>

          <div className="tenant-distribution-layout">
            <div className="stats-metric-row">
              <div className="metric-box">
                <span className="val">{tenantStats.statuses.Total}</span>
                <span className="lbl">Total Tenants on File</span>
              </div>
              <div className="metric-box">
                <span className="val tenant-active">{tenantStats.statuses.Active}</span>
                <span className="lbl">Active Leases</span>
              </div>
              <div className="metric-box">
                <span className="val tenant-pending">{tenantStats.statuses.Pending}</span>
                <span className="lbl">Awaiting Approvals</span>
              </div>
            </div>

            <div className="ledger-table-wrapper margin-top-2">
              <table className="report-data-table">
                <thead>
                  <tr>
                    <th>Lease Status Category</th>
                    <th>Account count</th>
                    <th>Percentage Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold">Active Occupying Tenants</td>
                    <td className="font-bold">{tenantStats.statuses.Active}</td>
                    <td>
                      <div className="status-progress-track">
                        <div className="progress-fill income" style={{ width: `${tenantStats.statuses.Total > 0 ? (tenantStats.statuses.Active / tenantStats.statuses.Total) * 100 : 0}%` }}></div>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold">Pending Accounts Awaiting Signatures</td>
                    <td className="font-bold">{tenantStats.statuses.Pending}</td>
                    <td>
                      <div className="status-progress-track">
                        <div className="progress-fill expense" style={{ width: `${tenantStats.statuses.Total > 0 ? (tenantStats.statuses.Pending / tenantStats.statuses.Total) * 100 : 0}%` }}></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
         SUB-TAB 6: PROPERTY REPORT SUMMARY
      ---------------------------------------------------- */}
      {activeReportTab === 'property' && (
        <div className="report-panel-container animate-fade">
          <div className="panel-summary-desc">
            <h3>Property Occupancy & Vacancy Breakdowns</h3>
            <p>Occupancy efficiency rates and property-wise income/expense breakdown ledger.</p>
          </div>

          <div className="occupancy-efficiency-bar-card">
            <div className="bar-header">
              <span className="title font-bold">Occupancy Efficiency</span>
              <span className="val font-bold">{propertyStats.rate}% Occupied</span>
            </div>
            <div className="efficiency-bar-track">
              <div className="efficiency-bar-fill" style={{ width: `${propertyStats.rate}%` }}></div>
            </div>
            <div className="occupancy-stats-legend">
              <span>🏠 Total Suites: {propertyStats.total}</span>
              <span>👥 Occupied: {propertyStats.occupied}</span>
              <span>📭 Vacant/Vacancy: {propertyStats.vacant}</span>
            </div>
          </div>

          {/* Property wise breakdown Ledger */}
          <div className="ledger-table-wrapper margin-top-2">
            <h3 className="sub-title">Individual Property Ledger</h3>
            <table className="report-data-table font-size-085">
              <thead>
                <tr>
                  <th>Property Name</th>
                  <th>Occupancy</th>
                  <th>Rent Collected</th>
                  <th>Maintenance Incurred</th>
                  <th>Net Earnings</th>
                </tr>
              </thead>
              <tbody>
                {propertyStats.breakdown.map((p, idx) => (
                  <tr key={idx}>
                    <td className="font-bold">{p.name}</td>
                    <td>
                      <span className={`status-badge-lbl ${p.isOccupied ? 'paid' : 'due'}`}>
                        {p.isOccupied ? 'Occupied' : 'Vacant'}
                      </span>
                    </td>
                    <td className="income-val font-bold">${p.income}</td>
                    <td className="expense-val font-bold">${p.expense}</td>
                    <td className={`font-bold ${p.profit >= 0 ? 'profit-val' : 'loss-val'}`}>
                      {p.profit >= 0 ? `+$${p.profit}` : `-$${Math.abs(p.profit)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}

export default ReportDashboard;
