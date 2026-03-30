import React, { memo } from "react";
import { useReveal } from "../../hooks";
import { matterBenefits } from "../../data/homePageData";

const MatterShowcase = memo(function MatterShowcase() {
  const rSL = useReveal();
  const rSR = useReveal();

  return (
    <section id="showcase" className="lm-showcase">
      <div className="lm-showcase-inner">
        <div ref={rSL} className="lm-reveal">
          <div className="lm-showcase-screen" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <div className="lm-screen-hdr" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="lm-screen-title">Matter: Adeyemi v. Lagos State</span>
                <span className="lm-pill lm-pill-blue">● Active</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="lm-pill lm-pill-amber">⚡ Expedited</span>
                <span className="lm-pill lm-pill-dim">Commercial Litigation</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 1, background: 'var(--rim)', borderBottom: '1px solid var(--rim)' }}>
              {[
                { label: 'Phase', value: 'Discovery', color: '#60a5fa' },
                { label: 'Days Left', value: '23', color: '#fbbf24' },
                { label: 'Tasks', value: '12/18', color: '#34d399' },
                { label: 'Docs', value: '47', color: '#a78bfa' },
              ].map((stat, i) => (
                <div key={i} style={{ flex: 1, background: 'var(--ink2)', padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: 'var(--text-4)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: stat.color }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="lm-screen-body" style={{ padding: '12px' }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Workflow
                </div>
                <div style={{ display: 'flex', gap: 3, alignItems: 'center', overflow: 'hidden' }}>
                  {['Intake', 'Review', 'Filed', 'Discovery', 'Trial', 'Judgment'].map((phase, i) => (
                    <React.Fragment key={i}>
                      <div style={{ flex: 1, padding: '4px 6px', background: i <= 3 ? 'var(--primary-light)' : 'var(--glass)', border: `1px solid ${i <= 3 ? 'var(--primary-rim)' : 'var(--rim)'}`, borderRadius: 5, textAlign: 'center', fontSize: 9, color: i <= 3 ? '#93c5fd' : 'var(--text-4)', fontWeight: i <= 3 ? 600 : 400, whiteSpace: 'nowrap' }}>
                        {phase}
                      </div>
                      {i < 5 && <div style={{ color: 'var(--text-5)', fontSize: 10, flexShrink: 0 }}>›</div>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <TaskPanel />
                <TeamPanel />
              </div>

              <ActivityTimeline />
            </div>
          </div>
        </div>

        <div ref={rSR} className="lm-reveal lm-rd2">
          <div className="lm-eyebrow">
            <div className="lm-eyebrow-line" />
            Matter Management
          </div>
          <h2 className="lm-h2">
            Every case.
            <br />
            Always on track.
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-2)", fontWeight: 300, lineHeight: 1.72 }}>
            From first intake to final judgment — LawMaster gives your team
            complete visibility, precise control, and zero dropped balls.
          </p>
          <ul className="lm-benefits">
            {matterBenefits.map((b, i) => (
              <li key={i} className="lm-benefit">
                <div className="lm-benefit-ico">{b.ico}</div>
                <div>
                  <div className="lm-benefit-title">{b.t}</div>
                  <div className="lm-benefit-desc">{b.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
});

export default MatterShowcase;

function TaskPanel() {
  const tasks = [
    { task: 'Review discovery docs', due: 'Today', done: false },
    { task: 'Draft interrogatories', due: 'Mar 30', done: false },
    { task: 'Client meeting notes', due: 'Mar 28', done: true },
  ];

  return (
    <div style={{ background: 'var(--glass)', borderRadius: 8, padding: 10, border: '1px solid var(--rim)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-1)' }}>🔖 Tasks</span>
        <span className="lm-pill lm-pill-blue" style={{ fontSize: 8 }}>+ Add</span>
      </div>
      {tasks.map((t, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: i < 2 ? '1px solid var(--rim)' : 'none', opacity: t.done ? 0.5 : 1 }}>
          <div style={{ width: 12, height: 12, borderRadius: 3, background: t.done ? 'var(--primary)' : 'transparent', border: `1.5px solid ${t.done ? 'var(--primary)' : 'var(--text-4)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, color: '#fff', flexShrink: 0 }}>
            {t.done && '✓'}
          </div>
          <span style={{ flex: 1, fontSize: 10, color: t.done ? 'var(--text-4)' : 'var(--text-2)', textDecoration: t.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t.task}
          </span>
          <span style={{ fontSize: 8, color: t.due === 'Today' ? '#f87171' : 'var(--text-4)', flexShrink: 0 }}>
            {t.due}
          </span>
        </div>
      ))}
    </div>
  );
}

function TeamPanel() {
  const members = [
    { name: 'Chidi Okafor', role: 'Lead Counsel', avatar: 'CO', status: 'online' },
    { name: 'Amara Nwosu', role: 'Associate', avatar: 'AN', status: 'online' },
    { name: 'Emeka Okoro', role: 'Paralegal', avatar: 'EO', status: 'away' },
  ];

  return (
    <div style={{ background: 'var(--glass)', borderRadius: 8, padding: 10, border: '1px solid var(--rim)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-1)' }}>👥 Team</span>
        <span className="lm-pill lm-pill-blue" style={{ fontSize: 8 }}>Invite</span>
      </div>
      {members.map((member, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: i < 2 ? '1px solid var(--rim)' : 'none' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--ink3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--text-3)' }}>{member.avatar}</div>
            <div style={{ position: 'absolute', bottom: -1, right: -1, width: 7, height: 7, borderRadius: '50%', background: member.status === 'online' ? '#34d399' : '#fbbf24', border: '1.5px solid var(--ink2)' }} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</div>
            <div style={{ fontSize: 9, color: 'var(--text-4)' }}>{member.role}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityTimeline() {
  const activities = [
    { time: '2h ago', action: 'Document uploaded', detail: 'Exhibit A - Witness Statement.pdf', user: 'CO' },
    { time: '5h ago', action: 'Task completed', detail: 'Client consultation notes', user: 'AN' },
    { time: '1d ago', action: 'Deadline added', detail: 'Motion filing deadline', user: 'EO' },
  ];

  return (
    <div style={{ marginTop: 8, background: 'var(--glass)', borderRadius: 8, padding: 10, border: '1px solid var(--rim)' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>📋 Recent Activity</div>
      {activities.map((activity, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: i < 2 ? '1px solid var(--rim)' : 'none', alignItems: 'flex-start' }}>
          <div style={{ width: 20, height: 20, borderRadius: 5, background: 'var(--ink3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 700, color: 'var(--text-3)', flexShrink: 0 }}>{activity.user}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 9, color: 'var(--text-2)' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-1)' }}>{activity.action}</span>
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.detail}</div>
          </div>
          <span style={{ fontSize: 8, color: 'var(--text-5)', flexShrink: 0 }}>{activity.time}</span>
        </div>
      ))}
    </div>
  );
}
