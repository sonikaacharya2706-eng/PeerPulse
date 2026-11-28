import React, { useState } from 'react';
import Card from '../common/Card';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const SCHEDULE_ROWS = [
  {
    day: 'Monday',
    dayIndex: 1,
    morning: [
      { text: 'TOC (L)', colSpan: 1 },
      { text: 'RM&IPR (L)', colSpan: 1 },
      { text: 'SET', colSpan: 1 },
    ],
    afternoon: [
      { text: 'SE&PM (L)', colSpan: 1 },
      { text: 'AI (L)', colSpan: 1 },
      { text: 'ES (L)', colSpan: 1 },
      { text: 'Remedial', colSpan: 1 },
    ],
  },
  {
    day: 'Tuesday',
    dayIndex: 2,
    morning: [
      { text: 'SE&PM (L)', colSpan: 1 },
      { text: 'CN Lab (P)', colSpan: 2 },
    ],
    afternoon: [
      { text: 'CN (L)', colSpan: 1 },
      { text: 'TOC (T)', colSpan: 1 },
      { text: 'Mentoring (TG)', colSpan: 1 },
      { text: 'Remedial', colSpan: 1 },
    ],
  },
  {
    day: 'Wednesday',
    dayIndex: 3,
    morning: [
      { text: 'AI (L)', colSpan: 1 },
      { text: 'DV Lab(B1) / MiniProject(B2) (P)', colSpan: 2 },
    ],
    afternoon: [
      { text: 'TOC (L)', colSpan: 1 },
      { text: 'RM&IPR (L)', colSpan: 1 },
      { text: 'MiniProject (P)', colSpan: 2 },
    ],
  },
  {
    day: 'Thursday',
    dayIndex: 4,
    morning: [
      { text: 'TOC (L)', colSpan: 1 },
      { text: 'CN (L)', colSpan: 1 },
      { text: 'ES (L)', colSpan: 1 },
    ],
    afternoon: [
      { text: 'DV Lab(B2) / MiniProject(B1) (P)', colSpan: 2 },
      { text: 'RM&IPR (T)', colSpan: 1 },
      { text: 'Remedial', colSpan: 1 },
    ],
  },
  {
    day: 'Friday',
    dayIndex: 5,
    morning: [
      { text: 'TOC (T)', colSpan: 1 },
      { text: 'RM&IPR (T)', colSpan: 1 },
      { text: 'CN (L)', colSpan: 1 },
    ],
    afternoon: [
      { text: 'AI (L)', colSpan: 1 },
      { text: 'SE&PM (L)', colSpan: 1 },
      { text: 'BNSK559/BPEK559/BYOK559 (P)', colSpan: 2 },
    ],
  },
  {
    day: 'Saturday',
    dayIndex: 6,
    morning: [
      { text: 'CN (A)', colSpan: 1 },
      { text: 'AI (A)', colSpan: 1 },
      { text: 'SE&PM (A)', colSpan: 1 },
    ],
    afternoon: [
      { text: 'Departmental/Committee/Institutional Activities', colSpan: 4 },
    ],
  },
];

const COURSES = [
  {
    code: 'BCS501',
    course: 'PCC',
    title: 'Software Engineering & Project Management (SE&PM)',
    ltps: '3-0-0-0',
    credits: 3,
    instructor: 'Mr.Pradeep M',
  },
  {
    code: 'BCS502',
    course: 'IPCC',
    title: 'Computer Networks (CN)',
    ltps: '3-0-2-0',
    credits: 4,
    instructor: 'Mr.Sandeep Kini M / Ms.Navyashree Shetty B',
  },
  {
    code: 'BCS503',
    course: 'PCC',
    title: 'Theory of Computations (TOC)',
    ltps: '3-2-0-0',
    credits: 4,
    instructor: 'Ms.Shilpa B',
  },
  {
    code: 'BAIL504',
    course: 'PCCL',
    title: 'Data Visualization Lab (DV Lab)',
    ltps: '0-0-2-0',
    credits: 1,
    instructor: 'Ms.Geethalaxmi / Mr.Ramesh Nayak',
  },
  {
    code: 'BCS515B',
    course: 'PEC',
    title: 'Artificial Intelligence (AI)',
    ltps: '3-0-0-0',
    credits: 3,
    instructor: 'Mr.Ramesh Nayak',
  },
  {
    code: 'BIS586',
    course: 'PROJ',
    title: 'Mini Project (MP)',
    ltps: '0-0-4-0',
    credits: 2,
    instructor: 'Mr.Pradeep M',
  },
  {
    code: 'BRMK557',
    course: 'AEC',
    title: 'Research Methodology and IPR (RM&IPR)',
    ltps: '2-2-0-0',
    credits: 3,
    instructor: 'Ms.Yashaswini K L',
  },
  {
    code: 'BCS508',
    course: 'HSMS',
    title: 'Environmental Studies and E-Waste Management (ES)',
    ltps: '2-0-0-0',
    credits: 2,
    instructor: 'Ms.Geethalaxmi',
  },
  {
    code: 'BNSK559 / BPEK559 / BYOK559',
    course: 'MC',
    title: 'National Service Scheme (NSS) / Physical Education (PE) (Sports and Athletics) / Yoga',
    ltps: '0-0-2-0',
    credits: 0,
    instructor: 'Mr.Vasanth Nayak / Mr.Ramesh Nayak / Mr.Ranganatha K',
  },
];

const AcademicTimetableCard = () => {
  const [showCourses, setShowCourses] = useState(true);
  const todayIndex = new Date().getDay();

  return (
    <Card
      title="Academic Time Table (w.e.f: 07/09/2026)"
      subtitle="Canara Engineering College · ISE Sem V-B · Room LH 105 · Class Adviser: Ms. Yashaswini K L"
      action={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300">
          <Calendar className="h-3.5 w-3.5" /> Form - 4A · AY 2026-27
        </span>
      }
    >
      {/* Metadata bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/70 text-[11px]">
        <div>
          <span className="text-slate-400 block">Programme</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Information Science &amp; Engg.
          </span>
        </div>
        <div>
          <span className="text-slate-400 block">Sem &amp; Section</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">V-B (Scheme 2022)</span>
        </div>
        <div>
          <span className="text-slate-400 block">Room</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">LH 105</span>
        </div>
        <div>
          <span className="text-slate-400 block">Class Adviser</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">Ms. Yashaswini K L</span>
        </div>
      </div>

      {/* Weekly Timetable Grid */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-[11px] border-collapse text-center min-w-[780px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold">
              <th className="border border-slate-200 dark:border-slate-700 px-2.5 py-2">Day</th>
              <th className="border border-slate-200 dark:border-slate-700 px-2 py-2">9.00-9.55</th>
              <th className="border border-slate-200 dark:border-slate-700 px-2 py-2">10.15-11.10</th>
              <th className="border border-slate-200 dark:border-slate-700 px-2 py-2">11.10-12.05</th>
              <th className="border border-slate-200 dark:border-slate-700 px-2 py-2">12.05-1.00</th>
              <th className="border border-slate-200 dark:border-slate-700 px-2 py-2">1.00-1.55</th>
              <th className="border border-slate-200 dark:border-slate-700 px-2 py-2">1.55-2.45</th>
              <th className="border border-slate-200 dark:border-slate-700 px-2 py-2">2.55-3.40</th>
              <th className="border border-slate-200 dark:border-slate-700 px-2 py-2">3.40-4.35</th>
            </tr>
          </thead>
          <tbody>
            {SCHEDULE_ROWS.map((row, idx) => {
              const isToday = row.dayIndex === todayIndex;
              return (
                <tr
                  key={row.day}
                  className={
                    isToday
                      ? 'bg-brand-50/70 dark:bg-brand-950/30 font-semibold'
                      : 'bg-white dark:bg-slate-800/40'
                  }
                >
                  <td className="border border-slate-200 dark:border-slate-700 px-2.5 py-2.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {row.day}
                    {isToday && (
                      <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-brand-600 align-middle" />
                    )}
                  </td>

                  {row.morning.map((cell, cellIdx) => (
                    <td
                      key={`m-${cellIdx}`}
                      colSpan={cell.colSpan}
                      className="border border-slate-200 dark:border-slate-700 px-2 py-2.5 text-slate-800 dark:text-slate-200 font-medium"
                    >
                      {cell.text}
                    </td>
                  ))}

                  {idx === 0 && (
                    <td
                      rowSpan={SCHEDULE_ROWS.length}
                      className="border border-slate-200 dark:border-slate-700 px-1.5 py-2 bg-slate-50 dark:bg-slate-900/70 font-bold text-slate-500 dark:text-slate-400 tracking-widest"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                      LUNCH BREAK
                    </td>
                  )}

                  {row.afternoon.map((cell, cellIdx) => (
                    <td
                      key={`a-${cellIdx}`}
                      colSpan={cell.colSpan}
                      className="border border-slate-200 dark:border-slate-700 px-2 py-2.5 text-slate-800 dark:text-slate-200 font-medium"
                    >
                      {cell.text}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Course & Instructor Details Toggle */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowCourses((prev) => !prev)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
        >
          {showCourses ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {showCourses ? 'Hide Course & Instructor Details' : 'Show Course & Instructor Details'}
        </button>

        {showCourses && (
          <div className="mt-2.5 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-[11px] border-collapse text-left min-w-[680px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold">
                  <th className="border border-slate-200 dark:border-slate-700 px-2.5 py-2">Code</th>
                  <th className="border border-slate-200 dark:border-slate-700 px-2.5 py-2">Course</th>
                  <th className="border border-slate-200 dark:border-slate-700 px-2.5 py-2">Title</th>
                  <th className="border border-slate-200 dark:border-slate-700 px-2.5 py-2 text-center">L-T-P-S</th>
                  <th className="border border-slate-200 dark:border-slate-700 px-2.5 py-2 text-center">Credits</th>
                  <th className="border border-slate-200 dark:border-slate-700 px-2.5 py-2">Course Instructor</th>
                </tr>
              </thead>
              <tbody>
                {COURSES.map((c) => (
                  <tr key={c.code} className="bg-white dark:bg-slate-800/40">
                    <td className="border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {c.code}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-slate-600 dark:text-slate-300">
                      {c.course}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-slate-800 dark:text-slate-200">
                      {c.title}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-center font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      {c.ltps}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-center font-semibold text-slate-800 dark:text-slate-200">
                      {c.credits}
                    </td>
                    <td className="border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-slate-700 dark:text-slate-300">
                      {c.instructor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AcademicTimetableCard;
