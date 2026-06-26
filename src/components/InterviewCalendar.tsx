import React, { useState, useMemo } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Video, 
  Plus, 
  Trash2, 
  User, 
  Award, 
  AlertTriangle, 
  Check, 
  Users, 
  Eye, 
  Search,
  CheckCircle,
  HelpCircle,
  VideoOff,
  Briefcase
} from "lucide-react";

interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  technologyArea: string;
  score: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutes
  type: string;
  platform: string;
  meetingLink: string;
  notes?: string;
  status: "scheduled" | "confirmed" | "completed";
}

interface InterviewCalendarProps {
  interviews: Interview[];
  onUpdateInterviews: (interviews: Interview[]) => void;
  candidates: any[];
  demoCandidates: any[];
}

export default function InterviewCalendar({ 
  interviews, 
  onUpdateInterviews, 
  candidates = [], 
  demoCandidates = [] 
}: InterviewCalendarProps) {
  // Current date for navigation
  const [currentDate, setCurrentDate] = useState<Date>(new Date("2026-06-26"));
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-06-26");
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  
  // Quick booking state
  const [isBooking, setIsBooking] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [bookingTime, setBookingTime] = useState("10:00");
  const [bookingDuration, setBookingDuration] = useState(45);
  const [bookingPlatform, setBookingPlatform] = useState("Google Meet");
  const [bookingType, setBookingType] = useState("Technical Screening");
  const [bookingNotes, setBookingNotes] = useState("");
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Combine parent lists
  const allCandidates = useMemo(() => {
    const map = new Map<string, any>();
    
    // Seed demo candidates
    demoCandidates.forEach(c => {
      map.set(c.id, {
        id: c.id,
        fullName: c.fullName,
        email: c.email,
        score: c.score,
        area: c.area || "Software Engineering"
      });
    });

    // Merge search candidates (filter those who scored >= 70%)
    candidates.forEach(c => {
      if ((c.overallCandidateScore || 0) >= 70) {
        map.set(c.id, {
          id: c.id,
          fullName: c.fullName,
          email: c.email,
          score: c.overallCandidateScore,
          area: c.latestCertifiedArea || "Full Stack Development"
        });
      }
    });

    return Array.from(map.values());
  }, [candidates, demoCandidates]);

  // Top performers who need interviews (not scheduled yet)
  const unscheduledTopPerformers = useMemo(() => {
    return allCandidates.filter(c => {
      // Check if already has a scheduled interview
      const isScheduled = interviews.some(i => i.candidateId === c.id);
      return !isScheduled;
    }).sort((a, b) => b.score - a.score); // Highest score first
  }, [allCandidates, interviews]);

  // Monthly stats & calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Month navigation helpers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date("2026-06-26"));
    setSelectedDateStr("2026-06-26");
  };

  // Days in month calculation
  const daysInMonth = useMemo(() => {
    const days = [];
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    // Padding from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = prevMonthTotalDays - i;
      const prevMonthObj = month === 0 ? 11 : month - 1;
      const prevYearObj = month === 0 ? year - 1 : year;
      const padStr = `${prevYearObj}-${String(prevMonthObj + 1).padStart(2, "0")}-${String(prevDate).padStart(2, "0")}`;
      days.push({ day: prevDate, isCurrentMonth: false, dateStr: padStr });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const padStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ day: d, isCurrentMonth: true, dateStr: padStr });
    }

    // Padding from next month
    const remainingSlots = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingSlots; i++) {
      const nextMonthObj = month === 11 ? 0 : month + 1;
      const nextYearObj = month === 11 ? year + 1 : year;
      const padStr = `${nextYearObj}-${String(nextMonthObj + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ day: i, isCurrentMonth: false, dateStr: padStr });
    }

    return days;
  }, [year, month]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Intersect interviews with calendar day cells
  const dayInterviewsMap = useMemo(() => {
    const map: Record<string, Interview[]> = {};
    interviews.forEach(int => {
      if (!map[int.date]) {
        map[int.date] = [];
      }
      map[int.date].push(int);
    });
    return map;
  }, [interviews]);

  // Selected date's interviews
  const selectedInterviews = useMemo(() => {
    return dayInterviewsMap[selectedDateStr] || [];
  }, [dayInterviewsMap, selectedDateStr]);

  // Check for conflicts on change of date, time or candidate
  const checkConflicts = (date: string, time: string, duration: number, candidateId: string) => {
    setConflictWarning(null);

    if (!date || !time) return;

    // Convert booking start/end to minutes of day
    const [h, m] = time.split(":").map(Number);
    const bookingStart = h * 60 + m;
    const bookingEnd = bookingStart + duration;

    // 1. Check if candidate is already booked today
    const candidateConflict = interviews.find(int => 
      int.date === date && 
      int.candidateId === candidateId
    );

    if (candidateConflict) {
      setConflictWarning(`⚠️ Candidate ${candidateConflict.candidateName} is already booked for an interview today at ${candidateConflict.time} UTC.`);
      return;
    }

    // 2. Check if recruiter is busy with an overlapping slot on the same day
    const recruiterOverlap = interviews.find(int => {
      if (int.date !== date) return false;
      const [ih, im] = int.time.split(":").map(Number);
      const intStart = ih * 60 + im;
      const intEnd = intStart + int.duration;

      // Overlap calculation: (start1 < end2) && (end1 > start2)
      return (bookingStart < intEnd) && (bookingEnd > intStart);
    });

    if (recruiterOverlap) {
      setConflictWarning(`⚠️ Time Conflict: You are already hosting a '${recruiterOverlap.type}' with ${recruiterOverlap.candidateName} at ${recruiterOverlap.time} UTC (${recruiterOverlap.duration} mins).`);
    }
  };

  // Trigger conflict check when booking values alter
  React.useEffect(() => {
    if (isBooking && selectedCandidateId) {
      checkConflicts(selectedDateStr, bookingTime, bookingDuration, selectedCandidateId);
    } else {
      setConflictWarning(null);
    }
  }, [selectedDateStr, bookingTime, bookingDuration, selectedCandidateId, isBooking, interviews]);

  // Submit interview creation
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateId) return;

    const cand = allCandidates.find(c => c.id === selectedCandidateId);
    if (!cand) return;

    // Generating realistic video dynamic links
    let meetLink = "https://meet.google.com/abc-defg-hij";
    if (bookingPlatform === "Zoom") {
      meetLink = `https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    } else if (bookingPlatform === "MS Teams") {
      meetLink = `https://teams.microsoft.com/l/meetup-join/${Math.random().toString(36).substring(2, 15)}`;
    } else {
      const code = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
      meetLink = `https://meet.google.com/${code}`;
    }

    const newInterview: Interview = {
      id: `int_${Date.now()}`,
      candidateId: cand.id,
      candidateName: cand.fullName,
      candidateEmail: cand.email,
      technologyArea: cand.area,
      score: cand.score,
      date: selectedDateStr,
      time: bookingTime,
      duration: bookingDuration,
      type: bookingType,
      platform: bookingPlatform,
      meetingLink: meetLink,
      notes: bookingNotes,
      status: "scheduled"
    };

    const updated = [newInterview, ...interviews];
    onUpdateInterviews(updated);
    localStorage.setItem("techscreen_interviews", JSON.stringify(updated));

    setSuccessMessage(`Interview scheduled with ${cand.fullName}! Email dispatch & Calendar invite generated.`);
    setBookingNotes("");
    setIsBooking(false);

    setTimeout(() => {
      setSuccessMessage(null);
    }, 4500);
  };

  // Instant booking from Top Performers sidebar
  const handleQuickBook = (cand: any) => {
    setSelectedCandidateId(cand.id);
    setIsBooking(true);
    setBookingNotes(`Walkthrough of peak assessment results (${cand.score}% in ${cand.area}).`);
  };

  // Cancel interview
  const handleCancelInterview = (id: string, name: string) => {
    if (confirm(`Are you sure you want to cancel the technical interview for ${name}?`)) {
      const updated = interviews.filter(i => i.id !== id);
      onUpdateInterviews(updated);
      localStorage.setItem("techscreen_interviews", JSON.stringify(updated));
    }
  };

  // Weeks range calculations (for the week view tab)
  const currentWeekDays = useMemo(() => {
    // Locate the Sunday of current active date
    const baseDate = new Date(selectedDateStr);
    const dayOfWeek = baseDate.getDay();
    const sunday = new Date(baseDate);
    sunday.setDate(baseDate.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const wDate = new Date(sunday);
      wDate.setDate(sunday.getDate() + i);
      const str = `${wDate.getFullYear()}-${String(wDate.getMonth() + 1).padStart(2, "0")}-${String(wDate.getDate()).padStart(2, "0")}`;
      days.push({
        name: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
        dayNum: wDate.getDate(),
        dateStr: str,
        isToday: str === "2026-06-26"
      });
    }
    return days;
  }, [selectedDateStr]);

  const filteredUnscheduled = useMemo(() => {
    if (!searchQuery) return unscheduledTopPerformers;
    return unscheduledTopPerformers.filter(c => 
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.area.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [unscheduledTopPerformers, searchQuery]);

  return (
    <div className="space-y-4" id="custom-interview-scheduler-wrapper">
      {/* SUCCESS / ERROR NOTIFICATIONS */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between shadow-xs animate-fade-in" id="calendar-success-banner">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Slot Booked Successfully!</p>
              <p className="text-emerald-600 text-[11px]">{successMessage}</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold font-mono text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TWO COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: INTERACTIVE CALENDAR ENGINE */}
        <div className="xl:col-span-8 space-y-4 flex flex-col">
          
          {/* Calendar Toolbar Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 border border-indigo-150 rounded-lg text-indigo-600">
                <CalendarIcon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>Interactive Scheduler</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 font-mono font-bold px-1.5 py-0.5 rounded-full">
                    {interviews.length} Scheduled
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Coordinate and check live technical video panels instantly.</p>
              </div>
            </div>

            {/* Toggle Calendar Month vs Weekly Agenda */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode("month")}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                    viewMode === "month" 
                      ? "bg-white text-slate-800 shadow-2xs border border-slate-150" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  id="viewmode-month-btn"
                >
                  Month View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("week")}
                  className={`px-3 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                    viewMode === "week" 
                      ? "bg-white text-slate-800 shadow-2xs border border-slate-150" 
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  id="viewmode-week-btn"
                >
                  Weekly Agenda
                </button>
              </div>

              <button
                onClick={handleGoToToday}
                className="px-2.5 py-1 text-[11px] bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition shadow-2xs"
                title="Go back to June 26, 2026"
                id="calendar-today-btn"
              >
                Today
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: MONTHLY GRID */}
          {viewMode === "month" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-grow">
              {/* Monthly Control Bar */}
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span>{monthNames[month]} {year}</span>
                  <span className="text-[10px] text-slate-400 font-mono font-medium">(Selected: {selectedDateStr})</span>
                </h4>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 bg-white hover:bg-slate-150 border border-slate-250 rounded-lg text-slate-600 transition cursor-pointer shadow-3xs"
                    title="Previous Month"
                    id="prev-month-btn"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 bg-white hover:bg-slate-150 border border-slate-250 rounded-lg text-slate-600 transition cursor-pointer shadow-3xs"
                    title="Next Month"
                    id="next-month-btn"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Titles */}
              <div className="grid grid-cols-7 border-b border-slate-150 bg-slate-50/50 text-center py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 bg-slate-150/20 divide-x divide-y divide-slate-150" id="calendar-month-grid">
                {daysInMonth.map(({ day, isCurrentMonth, dateStr }, index) => {
                  const dayInst = dayInterviewsMap[dateStr] || [];
                  const isSelected = dateStr === selectedDateStr;
                  const isToday = dateStr === "2026-06-26";

                  return (
                    <div
                      key={`${dateStr}-${index}`}
                      onClick={() => setSelectedDateStr(dateStr)}
                      className={`min-h-24 p-2 transition-all flex flex-col justify-between cursor-pointer select-none group relative ${
                        isCurrentMonth ? "bg-white" : "bg-slate-50/40 text-slate-400"
                      } ${isSelected ? "ring-2 ring-indigo-500 ring-inset bg-indigo-50/10" : "hover:bg-slate-50"}`}
                      id={`day-cell-${dateStr}`}
                    >
                      {/* Day Number Header */}
                      <div className="flex justify-between items-center">
                        <span 
                          className={`text-xs font-mono font-bold w-5.5 h-5.5 rounded-full flex items-center justify-center transition-all ${
                            isToday 
                              ? "bg-indigo-600 text-white shadow-2xs font-extrabold" 
                              : isSelected 
                                ? "bg-slate-800 text-white" 
                                : "text-slate-700"
                          }`}
                        >
                          {day}
                        </span>
                        
                        {/* Conflict or event indicators inside cell */}
                        {dayInst.length > 0 && (
                          <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-black font-mono px-1 rounded">
                            {dayInst.length}
                          </span>
                        )}
                      </div>

                      {/* Mini list of items inside cell */}
                      <div className="mt-2 space-y-1 overflow-hidden max-h-12 flex-grow">
                        {dayInst.slice(0, 2).map((int) => (
                          <div 
                            key={int.id} 
                            className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-tight truncate border flex items-center gap-0.5 bg-slate-900 border-slate-800 text-slate-100"
                            title={`${int.candidateName} - ${int.type}`}
                          >
                            <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                            <span className="truncate">{int.candidateName.split(" ")[0]} ({int.time})</span>
                          </div>
                        ))}
                        {dayInst.length > 2 && (
                          <p className="text-[7.5px] font-bold font-mono text-indigo-600 pl-1">
                            + {dayInst.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW MODE 2: WEEKLY AGENDA TIMELINE */}
          {viewMode === "week" && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-grow">
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span>Weekly Agenda Outline</span>
                  <span className="text-[10px] text-slate-400 font-mono font-medium">(Selected Week View)</span>
                </h4>
              </div>

              {/* Weekly agenda days mapping */}
              <div className="divide-y divide-slate-150" id="weekly-agenda-container">
                {currentWeekDays.map((wDay) => {
                  const dayInst = dayInterviewsMap[wDay.dateStr] || [];
                  const isSelected = wDay.dateStr === selectedDateStr;

                  return (
                    <div 
                      key={wDay.dateStr}
                      onClick={() => setSelectedDateStr(wDay.dateStr)}
                      className={`p-4 transition flex flex-col md:flex-row items-start md:items-center gap-4 cursor-pointer hover:bg-slate-50/50 ${
                        isSelected ? "bg-indigo-50/15 border-l-4 border-indigo-500" : ""
                      }`}
                      id={`week-day-row-${wDay.dateStr}`}
                    >
                      {/* Left: Day info */}
                      <div className="w-24 shrink-0 space-y-0.5">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 font-mono">{wDay.name}</p>
                        <p className={`text-xl font-black font-mono leading-none ${wDay.isToday ? "text-indigo-600 font-extrabold" : "text-slate-800"}`}>
                          {wDay.dayNum}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono">{wDay.dateStr.slice(5)}</p>
                      </div>

                      {/* Right: Slots List */}
                      <div className="flex-grow space-y-2 w-full">
                        {dayInst.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {dayInst.map((int) => (
                              <div 
                                key={int.id}
                                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 shadow-3xs group hover:border-slate-350 transition-all"
                              >
                                <div className="space-y-1 truncate">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-slate-850 text-xs truncate">{int.candidateName}</span>
                                    <span className="text-[8.5px] bg-indigo-50 text-indigo-700 font-bold px-1 rounded font-mono shrink-0">
                                      {int.score}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500">
                                    <span className="flex items-center gap-0.5 font-bold text-slate-800">
                                      <Clock className="w-3 h-3 text-slate-400" />
                                      {int.time}
                                    </span>
                                    <span>•</span>
                                    <span className="truncate">{int.type.split(" ")[0]}</span>
                                  </div>
                                </div>

                                <a 
                                  href={int.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 rounded-md transition shadow-3xs"
                                  title="Join direct Video Call"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Video className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No screens scheduled for this day.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DAY AGENDA DRAWER (SHOWS DETAILED LIST OF THE SELECTED CALENDAR DATE) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3.5">
            <div className="flex justify-between items-center border-b border-slate-150 pb-2.5">
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Clock className="text-indigo-600 w-4 h-4" />
                  <span>Agenda for {selectedDateStr}</span>
                </h4>
                <p className="text-[11px] text-slate-500">Specific interview times booked for this selected date.</p>
              </div>

              {!isBooking && (
                <button
                  type="button"
                  onClick={() => setIsBooking(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg flex items-center gap-1 transition cursor-pointer shadow-3xs"
                  id="agenda-book-new-btn"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Slot</span>
                </button>
              )}
            </div>

            {/* List of screens on Selected Date */}
            <div className="space-y-2.5" id="agenda-day-list">
              {selectedInterviews.map((int) => (
                <div 
                  key={int.id} 
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-3xs hover:border-slate-350 transition-all"
                >
                  <div className="space-y-1 flex-grow">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs">{int.candidateName}</span>
                      <span className="text-[9px] bg-slate-900 text-white font-mono font-bold px-1.5 py-0.5 rounded">
                        Score: {int.score}%
                      </span>
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded font-mono uppercase">
                        {int.type}
                      </span>
                      <span className="text-[9px] bg-slate-200 text-slate-700 font-mono px-1.5 rounded">
                        {int.platform}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{int.candidateEmail} • {int.technologyArea}</p>
                    
                    {int.notes && (
                      <p className="text-[10px] text-slate-500 italic bg-white border border-slate-150 p-1.5 rounded mt-1.5 leading-relaxed">
                        " {int.notes} "
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 justify-end shrink-0">
                    <span className="text-[10px] font-bold font-mono text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      <span>{int.time} UTC ({int.duration} min)</span>
                    </span>

                    <a
                      href={int.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg text-[10px] flex items-center gap-1 transition cursor-pointer shadow-3xs"
                    >
                      <Video className="w-3 h-3" />
                      <span>Join</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCancelInterview(int.id, int.candidateName)}
                      className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-rose-600 rounded-lg transition cursor-pointer"
                      title="Cancel Interview Slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {selectedInterviews.length === 0 && (
                <div className="py-6 bg-slate-50/50 border border-slate-150 border-dashed rounded-xl text-center space-y-1.5">
                  <VideoOff className="w-6 h-6 text-slate-300 mx-auto" />
                  <p className="text-slate-500 text-[11px] font-semibold">No interviews scheduled on {selectedDateStr}.</p>
                  <p className="text-slate-400 text-[9.5px]">Click "Schedule Slot" to book a candidate on this date.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: BOOKING CONTROLLER & RECOMMENDED POOL */}
        <div className="xl:col-span-4 space-y-4">
          
          {/* THE BOOKING FORM PANEL (SHOWS DYNAMICALLY IF OPENED) */}
          {isBooking ? (
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 shadow-md text-slate-100 animate-fade-in" id="live-booking-drawer">
              <div className="border-b border-slate-800 pb-3 mb-4 flex justify-between items-center">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Book Screen Panel</span>
                  </h4>
                  <p className="text-slate-400 text-[11px]">Scheduling for: {selectedDateStr}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBooking(false)}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-slate-800 text-xs font-bold text-slate-300 rounded cursor-pointer transition"
                >
                  Cancel
                </button>
              </div>

              {/* Conflict Warnings Warning */}
              {conflictWarning && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-[10px] leading-relaxed flex items-start gap-2 mb-4 animate-pulse">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <p>{conflictWarning}</p>
                </div>
              )}

              <form onSubmit={handleCreateBooking} className="space-y-3.5">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Select Candidate</label>
                  <select
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 transition cursor-pointer"
                    required
                  >
                    <option value="" className="text-slate-500">-- Select Certified Performer --</option>
                    {allCandidates.map(c => (
                      <option key={c.id} value={c.id} className="text-slate-850 bg-white">
                        {c.fullName} ({c.score}%, {c.area.slice(0, 20)}...)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Start Time (UTC)</label>
                    <input
                      type="time"
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Duration</label>
                    <select
                      value={bookingDuration}
                      onChange={(e) => setBookingDuration(Number(e.target.value))}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value={30}>30 mins</option>
                      <option value={45}>45 mins</option>
                      <option value={60}>60 mins</option>
                      <option value={90}>90 mins</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Platform</label>
                    <select
                      value={bookingPlatform}
                      onChange={(e) => setBookingPlatform(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom Video</option>
                      <option value="MS Teams">MS Teams</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Type Style</label>
                    <select
                      value={bookingType}
                      onChange={(e) => setBookingType(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="Technical Screening">Technical Screening</option>
                      <option value="System Design">System Design</option>
                      <option value="Cultural Fit">Cultural Fit</option>
                      <option value="Final Review">Final Review</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-1">Discussion Notes</label>
                  <textarea
                    rows={2}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Focus areas, particular tasks or questions to inspect..."
                    className="w-full text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none placeholder-slate-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-lg text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Slot Reservation</span>
                </button>
              </form>
            </div>
          ) : (
            /* QUICK TIP CONTAINER */
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 rounded-xl p-4 text-slate-100 space-y-2">
              <h4 className="text-[10px] font-black tracking-widest uppercase text-indigo-400 font-mono flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Smart Scheduler tip</span>
              </h4>
              <p className="text-xs leading-relaxed opacity-90">
                TechScreen filters and highlights top-performing candidates who scored <strong>≥70%</strong>. You can book an interview directly with them below.
              </p>
              <div className="text-[10px] text-slate-400 font-mono bg-slate-950/40 p-2 rounded border border-slate-850/60 leading-normal">
                Click a performer's <strong>Quick Book</strong> card to automatically pre-populate assessment benchmarks into the agenda calendar!
              </div>
            </div>
          )}

          {/* SIDEBAR: TOP-PERFORMING CANDIDATES POOL */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3.5">
            <div className="border-b border-slate-150 pb-2.5 space-y-0.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Users className="text-indigo-600 w-4.5 h-4.5" />
                <span>Top Performers Waiting Screen ({unscheduledTopPerformers.length})</span>
              </h4>
              <p className="text-[11px] text-slate-500">Unscheduled certified candidates with outstanding results.</p>
            </div>

            {/* Candidate search inside sidebar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search candidates/skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-[11px] pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            {/* List of candidates */}
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-0.5" id="waiting-candidates-container">
              {filteredUnscheduled.map((cand) => (
                <div 
                  key={cand.id}
                  className="p-3 bg-slate-50 border border-slate-150 rounded-xl hover:border-slate-250 transition flex flex-col justify-between gap-2.5 shadow-3xs"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-1">
                      <div className="truncate">
                        <p className="font-bold text-xs text-slate-900 truncate">{cand.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate">{cand.area}</p>
                      </div>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-150 font-black font-mono px-1.5 py-0.5 rounded shrink-0">
                        {cand.score}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{cand.email}</p>
                  </div>

                  <button
                    onClick={() => handleQuickBook(cand)}
                    className="w-full py-1.5 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-700 font-bold text-[10px] rounded-lg transition cursor-pointer flex items-center justify-center gap-1 shadow-3xs"
                    id={`quick-book-${cand.id}`}
                  >
                    <Plus className="w-3 h-3 text-indigo-600" />
                    <span>Quick Book Screen</span>
                  </button>
                </div>
              ))}

              {filteredUnscheduled.length === 0 && (
                <div className="py-8 bg-slate-50/50 border border-slate-150 rounded-xl text-center space-y-1">
                  <User className="w-5 h-5 text-slate-350 mx-auto" />
                  <p className="text-slate-400 text-[10px] italic">No unscheduled top performers found.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
