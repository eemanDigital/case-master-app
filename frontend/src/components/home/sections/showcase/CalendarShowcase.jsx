import React, { memo } from "react";
import { useReveal } from "../../hooks";
import { calendarBenefits } from "../../data/homePageData";

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const calendarDays = [
  { d: 22, hasEvents: true, events: 2, today: false },
  { d: 23, hasEvents: true, events: 1, today: false },
  { d: 24, hasEvents: false, today: false },
  { d: 25, hasEvents: true, events: 3, today: false },
  { d: 26, hasEvents: true, events: 2, today: false },
  { d: 27, hasEvents: false, today: false },
  { d: 28, hasEvents: false, today: false },
  { d: 29, today: true, current: true },
  { d: 30, hasEvents: true, events: 1, today: false },
  { d: 31, hasEvents: true, events: 2, today: false },
  { d: 1, hasEvents: false, today: false },
  { d: 2, hasEvents: true, events: 1, today: false },
  { d: 3, hasEvents: false, today: false },
  { d: 4, hasEvents: false, today: false },
];

const events = [
  { time: '9:00 AM', title: 'Adeyemi v. Lagos State', type: 'Court Hearing', color: '#722ed1', loc: 'High Court, Lagos' },
  { time: '11:30 AM', title: 'Client Meeting - Fola Kuti', type: 'Client Meeting', color: '#52c41a', loc: 'Conference Room A' },
  { time: '2:00 PM', title: 'Filing Deadline - Chukwu Case', type: 'Filing Deadline', color: '#ff4d4f', loc: 'Lagos State Court' },
  { time: '4:30 PM', title: 'Team Standup', type: 'Internal Meeting', color: '#13c2c2', loc: 'Virtual' },
];

const statBars = [
  { label: 'Total', value: '12', color: '#60a5fa' },
  { label: 'Hearings', value: '4', color: '#722ed1' },
  { label: 'Meetings', value: '5', color: '#52c41a' },
  { label: 'Deadlines', value: '3', color: '#ff4d4f' },
];

const CalendarShowcase = memo(function CalendarShowcase() {
  const rCalL = useReveal();
  const rCalR = useReveal();

  return (
    <section id="calendar" className="lm-showcase">
      <div className="lm-showcase-inner">
        <div ref={rCalL} className="lm-reveal">
          <div className="lm-eyebrow">
            <div className="lm-eyebrow-line" />
            Calendar & Scheduling
          </div>
          <h2 className="lm-h2">
            Never miss a
            <br />
            court date again.
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-2)", fontWeight: 300, lineHeight: 1.72 }}>
            Sync court schedules automatically. Get smart reminders for
            hearings, filing deadlines, and team meetings — all in one
            unified calendar.
          </p>
          <ul className="lm-benefits">
            {calendarBenefits.map((b, i) => (
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

        <div ref={rCalR} className="lm-reveal lm-rd2">
          <div className="lm-showcase-screen">
            <div className="lm-screen-hdr">
              <span className="lm-screen-title">Calendar — March 2026</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <span className="lm-pill lm-pill-blue">Month</span>
                <span className="lm-pill lm-pill-dim">Week</span>
                <span className="lm-pill lm-pill-dim">Agenda</span>
              </div>
            </div>
            <div style={{ padding: '12px', background: 'var(--ink2)' }}>
              <MiniCalendar />
              <UpcomingEvents />
              <StatsBar />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default CalendarShowcase;

function MiniCalendar() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 10 }}>
      {days.map((d, i) => (
        <div key={i} style={{ textAlign: 'center', fontSize: 9, color: 'var(--text-4)', padding: '4px 0', fontWeight: 500, letterSpacing: '0.04em' }}>{d}</div>
      ))}
      {calendarDays.map((day, i) => (
        <div key={i} style={{
          textAlign: 'center', padding: '5px 2px', borderRadius: 5,
          background: day.current ? 'var(--primary)' : day.today ? 'var(--primary-light)' : 'transparent',
          border: day.current ? '1px solid var(--primary)' : '1px solid transparent', position: 'relative'
        }}>
          <div style={{ fontSize: 10, fontWeight: day.current || day.today ? 600 : 400, color: day.current ? '#fff' : day.today ? '#93c5fd' : 'var(--text-2)' }}>
            {day.d}
          </div>
          {day.hasEvents && (
            <div style={{ display: 'flex', gap: 1, justifyContent: 'center', marginTop: 2 }}>
              {Array(day.events).fill(0).slice(0, 3).map((_, j) => (
                <div key={j} style={{ width: 4, height: 4, borderRadius: '50%', background: j === 0 ? '#722ed1' : j === 1 ? '#52c41a' : '#fa8c16' }} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function UpcomingEvents() {
  return (
    <div style={{ borderTop: '1px solid var(--rim)', paddingTop: 10 }}>
      <div style={{ fontSize: 9, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontWeight: 600 }}>
        Upcoming Events
      </div>
      {events.map((event, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: i < 3 ? '1px solid var(--rim)' : 'none' }}>
          <div style={{ width: 36, flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: 'var(--text-4)' }}>{event.time}</div>
          </div>
          <div style={{ width: 4, height: 32, borderRadius: 2, background: event.color, flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
            <div style={{ fontSize: 9, color: 'var(--text-4)', marginTop: 1 }}>{event.type} · {event.loc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatsBar() {
  return (
    <div style={{ display: 'flex', gap: 1, background: 'var(--rim)', marginTop: 10, borderRadius: 6, overflow: 'hidden' }}>
      {statBars.map((stat, i) => (
        <div key={i} style={{ flex: 1, background: 'var(--ink)', padding: '8px 6px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          <div style={{ fontSize: 8, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 1 }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
