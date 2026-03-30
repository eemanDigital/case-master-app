export default function PreviewCard() {
  return (
    <div className="lm-hero-preview">
      <div className="lm-preview-glow" />
      <div className="lm-preview-card">
        <div className="lm-preview-topbar">
          <div className="lm-preview-dot" style={{ background: "#ff5f57" }} />
          <div className="lm-preview-dot" style={{ background: "#ffbd2e" }} />
          <div className="lm-preview-dot" style={{ background: "#28ca41" }} />
          <div className="lm-preview-tabs">
            <div className="lm-preview-tab active">Dashboard</div>
            <div className="lm-preview-tab">Matters</div>
            <div className="lm-preview-tab">Billing</div>
          </div>
        </div>
        <div className="lm-preview-body">
          <div className="lm-stat-row">
            <div className="lm-stat-cell">
              <div className="lm-stat-cell-lbl">Active Matters</div>
              <div className="lm-stat-cell-val">47</div>
              <div className="lm-stat-cell-sub">↑ 8 this week</div>
            </div>
            <div className="lm-stat-cell">
              <div className="lm-stat-cell-lbl">Revenue</div>
              <div className="lm-stat-cell-val">₦4.2M</div>
              <div className="lm-stat-cell-sub">↑ 23% MoM</div>
            </div>
            <div className="lm-stat-cell">
              <div className="lm-stat-cell-lbl">Pending Tasks</div>
              <div className="lm-stat-cell-val">12</div>
              <div className="lm-stat-cell-sub">3 due today</div>
            </div>
          </div>
          <table className="lm-tbl">
            <thead className="lm-tbl-head">
              <tr>
                <th>Matter</th>
                <th>Type</th>
                <th>Status</th>
                <th>Hearing</th>
              </tr>
            </thead>
            <tbody className="lm-tbl-body">
              <tr>
                <td>Adeyemi v. Lagos State</td>
                <td>Commercial</td>
                <td><span className="lm-pill lm-pill-blue">● Active</span></td>
                <td>Mar 15</td>
              </tr>
              <tr>
                <td>Fola Kuti Estate</td>
                <td>Probate</td>
                <td><span className="lm-pill lm-pill-amber">● Review</span></td>
                <td>Mar 22</td>
              </tr>
              <tr>
                <td>GTBank Deed Review</td>
                <td>Corporate</td>
                <td><span className="lm-pill lm-pill-blue">● Active</span></td>
                <td>Apr 02</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="lm-float lm-float-1">
        <div className="lm-float-inner">
          <div className="lm-float-ico lm-float-ico-b">✅</div>
          <div>
            <div className="lm-float-lbl">Invoice paid</div>
            <div className="lm-float-val">₦850,000</div>
          </div>
        </div>
      </div>
      <div className="lm-float lm-float-2">
        <div className="lm-float-inner">
          <div className="lm-float-ico lm-float-ico-r">📅</div>
          <div>
            <div className="lm-float-lbl">Hearing in</div>
            <div className="lm-float-val">2 days</div>
          </div>
        </div>
      </div>
    </div>
  );
}
