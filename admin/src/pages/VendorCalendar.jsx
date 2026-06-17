import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar, CheckCircle, XCircle } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const DEMO_BOOKINGS = {
  "2026-05-15": { vendor: "Grand Plaza Hall", status: "booked", couple: "Ahmed & Sara" },
  "2026-05-22": { vendor: "Grand Plaza Hall", status: "booked", couple: "Khalid & Noura" },
  "2026-06-05": { vendor: "Luna Photography", status: "booked", couple: "Omar & Layla" },
  "2026-06-12": { vendor: "Royal Catering", status: "blocked" },
  "2026-06-19": { vendor: "Bloom & Petal", status: "booked", couple: "Faisal & Reem" },
  "2026-07-03": { vendor: "Grand Plaza Hall", status: "booked", couple: "Tariq & Hana" },
  "2026-07-10": { vendor: "Elegance Planners", status: "booked", couple: "Yasser & Dina" },
};

export default function VendorCalendar() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const result = [];
    for (let i = 0; i < startPad; i++) result.push(null);
    for (let d = 1; d <= last.getDate(); d++) result.push(d);
    return result;
  }, [year, month]);

  function dateKey(d) { return `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }

  const selected = selectedDate ? DEMO_BOOKINGS[dateKey(selectedDate)] : null;

  const stats = { booked: Object.values(DEMO_BOOKINGS).filter(b => b.status === "booked").length, blocked: Object.values(DEMO_BOOKINGS).filter(b => b.status === "blocked").length };

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-md)", padding: "12px 20px", flex: 1, boxShadow: "var(--card-shadow)" }}>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "var(--coral)" }}>{stats.booked}</div>
          <div style={{ fontSize: 12, color: "var(--slate-500)" }}>Confirmed Bookings</div>
        </div>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-md)", padding: "12px 20px", flex: 1, boxShadow: "var(--card-shadow)" }}>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "#f59e0b" }}>{stats.blocked}</div>
          <div style={{ fontSize: 12, color: "var(--slate-500)" }}>Blocked Dates</div>
        </div>
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-md)", padding: "12px 20px", flex: 1, boxShadow: "var(--card-shadow)" }}>
          <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: "#22c55e" }}>{30 - stats.booked - stats.blocked}</div>
          <div style={{ fontSize: 12, color: "var(--slate-500)" }}>Available This Month</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
        {/* Calendar */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--card-shadow)", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button onClick={prevMonth} style={{ background: "none", border: "1px solid var(--card-border)", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "var(--slate-600)" }}><ChevronLeft size={16} /></button>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: "var(--slate-900)" }}>{MONTHS[month]} {year}</span>
            <button onClick={nextMonth} style={{ background: "none", border: "1px solid var(--card-border)", borderRadius: 6, padding: "5px 8px", cursor: "pointer", color: "var(--slate-600)" }}><ChevronRight size={16} /></button>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
              {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--slate-400)", padding: 4 }}>{d}</div>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {days.map((d, i) => {
                if (!d) return <div key={i} />;
                const key = dateKey(d);
                const booking = DEMO_BOOKINGS[key];
                const isSelected = selectedDate === d;
                const isToday = new Date().getDate() === d && new Date().getMonth() === month;
                return (
                  <button key={i} onClick={() => setSelectedDate(d)} style={{
                    width: "100%", aspectRatio: "1", borderRadius: 8,
                    border: isSelected ? "2px solid var(--coral)" : isToday ? "2px solid var(--gold)" : "1px solid transparent",
                    background: booking?.status === "booked" ? "rgba(254,105,114,0.12)" : booking?.status === "blocked" ? "rgba(245,158,11,0.12)" : "transparent",
                    cursor: "pointer", fontSize: 13, fontWeight: isToday ? 700 : 400,
                    color: booking ? (booking.status === "booked" ? "var(--coral)" : "#f59e0b") : "var(--slate-700)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 150ms",
                  }}>{d}</button>
                );
              })}
            </div>
          </div>
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--card-border)", display: "flex", gap: 16, fontSize: 11, color: "var(--slate-400)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(254,105,114,0.3)" }} /> Booked</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(245,158,11,0.3)" }} /> Blocked</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, border: "2px solid var(--gold)" }} /> Today</span>
          </div>
        </div>

        {/* Details Panel */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "var(--radius-lg)", boxShadow: "var(--card-shadow)", padding: 20, height: "fit-content" }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={16} style={{ color: "var(--coral)" }} /> Booking Details
          </h3>
          {!selectedDate ? (
            <p style={{ color: "var(--slate-400)", fontSize: 13 }}>Select a date to view details</p>
          ) : selected ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--slate-900)" }}>{MONTHS[month]} {selectedDate}, {year}</div>
              <div><span style={{ fontSize: 11, color: "var(--slate-400)" }}>Status</span><div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>{selected.status === "booked" ? <CheckCircle size={14} style={{ color: "var(--coral)" }} /> : <XCircle size={14} style={{ color: "#f59e0b" }} />}<span style={{ fontSize: 13, fontWeight: 600, textTransform: "capitalize", color: selected.status === "booked" ? "var(--coral)" : "#f59e0b" }}>{selected.status}</span></div></div>
              <div><span style={{ fontSize: 11, color: "var(--slate-400)" }}>Vendor</span><div style={{ fontSize: 13, fontWeight: 500, color: "var(--slate-700)", marginTop: 2 }}>{selected.vendor}</div></div>
              {selected.couple && <div><span style={{ fontSize: 11, color: "var(--slate-400)" }}>Couple</span><div style={{ fontSize: 13, fontWeight: 500, color: "var(--slate-700)", marginTop: 2 }}>{selected.couple}</div></div>}
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--slate-900)", marginBottom: 4 }}>{MONTHS[month]} {selectedDate}, {year}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}><CheckCircle size={14} style={{ color: "#22c55e" }} /><span style={{ fontSize: 13, color: "#22c55e", fontWeight: 600 }}>Available</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
