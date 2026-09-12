import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Award, TrendingUp, Plus, Check, ChevronDown, ChevronUp, Star, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const GRADE_OPTIONS = [
  { letter: 'A', point: 4.0 },
  { letter: 'A-', point: 3.75 },
  { letter: 'B+', point: 3.5 },
  { letter: 'B', point: 3.0 },
  { letter: 'B-', point: 2.75 },
  { letter: 'C+', point: 2.5 },
  { letter: 'C', point: 2.0 },
  { letter: 'D', point: 1.0 },
  { letter: 'E', point: 0.0 }
];

export const GradesView = () => {
  const {
    data,
    cumulativeGpa,
    totalCumulativeSks,
    addSemesterCourse,
    deleteSemesterCourse
  } = useApp();

  const [expandedSemester, setExpandedSemester] = useState(1);
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [targetSemester, setTargetSemester] = useState(1);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseSks, setNewCourseSks] = useState(3);
  const [newCourseGrade, setNewCourseGrade] = useState('A');

  const handleAddCourse = (e) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    const gradeObj = GRADE_OPTIONS.find(g => g.letter === newCourseGrade) || GRADE_OPTIONS[0];

    addSemesterCourse(Number(targetSemester), {
      name: newCourseName,
      sks: Number(newCourseSks),
      letter: gradeObj.letter,
      point: gradeObj.point
    });

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    setIsAddCourseModalOpen(false);
    setNewCourseName('');
  };

  const getPredikat = (gpa) => {
    if (gpa >= 3.80) return { title: 'Dengan Pujian Tertinggi (Summa Cumlaude)', color: '#D97706', badge: '🏆' };
    if (gpa >= 3.50) return { title: 'Dengan Pujian (Cumlaude)', color: '#1665D8', badge: '🎓' };
    if (gpa >= 3.00) return { title: 'Sangat Memuaskan', color: '#059669', badge: '⭐' };
    if (gpa >= 2.75) return { title: 'Memuaskan', color: '#475569', badge: '👍' };
    return { title: 'Cukup', color: '#DC2626', badge: '⚠️' };
  };

  const predikat = getPredikat(cumulativeGpa);

  return (
    <div className="main-content" style={{ paddingTop: '20px' }}>
      {/* 1. Hero IPK Card */}
      <div
        className="card-standard"
        style={{
          background: 'linear-gradient(135deg, #1665D8 0%, #1E40AF 100%)',
          color: 'white',
          padding: '22px 20px',
          boxShadow: '0 10px 25px rgba(22, 101, 216, 0.25)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
            Indeks Prestasi Kumulatif (IPK)
          </span>
          <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '12px' }}>
            {predikat.badge} {data.profile.major}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '12px 0 6px' }}>
          <span style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-1px' }}>
            {cumulativeGpa.toFixed(2)}
          </span>
          <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
            / 4.00
          </span>
        </div>

        <div style={{ fontSize: '12px', color: '#FDE68A', fontWeight: 700 }}>
          {predikat.title}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.18)', paddingTop: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>Total SKS Ditempuh</div>
            <div style={{ fontSize: '15px', fontWeight: 800 }}>{totalCumulativeSks} SKS</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>Target Kelulusan</div>
            <div style={{ fontSize: '15px', fontWeight: 800 }}>144 SKS ({Math.round((totalCumulativeSks / 144) * 100)}%)</div>
          </div>
        </div>
      </div>

      {/* 2. Grafik Tren IP Semester */}
      <div className="card-standard">
        <div className="section-header-row">
          <h3 className="section-title">
            <TrendingUp size={18} style={{ color: '#1665D8' }} />
            Tren Nilai per Semester
          </h3>
        </div>

        {/* Bar chart representation */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '120px', paddingTop: '20px' }}>
          {data.semesters.map(sem => {
            const heightPercent = Math.min(100, Math.round((sem.ips / 4.0) * 100));

            return (
              <div key={sem.semesterNumber} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#1665D8' }}>
                  {sem.ips.toFixed(2)}
                </span>
                <div
                  style={{
                    width: '32px',
                    height: `${heightPercent}px`,
                    background: 'linear-gradient(180deg, #3B82F6 0%, #1665D8 100%)',
                    borderRadius: '8px 8px 3px 3px'
                  }}
                />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
                  Smt {sem.semesterNumber}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Daftar Semester & Matakuliah */}
      <div>
        <div className="section-header-row">
          <h3 className="section-title">Rekap Matakuliah per Semester</h3>
          <button
            onClick={() => setIsAddCourseModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: '#1665D8',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Plus size={14} /> Tambah Nilai
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.semesters.map(sem => {
            const isExpanded = expandedSemester === sem.semesterNumber;

            return (
              <div key={sem.semesterNumber} className="card-standard" style={{ padding: '14px 16px' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpandedSemester(isExpanded ? null : sem.semesterNumber)}
                >
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                      Semester {sem.semesterNumber}
                    </h4>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      {sem.totalSks} SKS • {sem.courses.length} Mata Kuliah
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#1665D8' }}>
                        IPS: {sem.ips.toFixed(2)}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '14px', borderTop: '1px solid #F1F5F9', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sem.courses.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '6px 0',
                          fontSize: '13px',
                          borderBottom: i < sem.courses.length - 1 ? '1px solid #F8FAFC' : 'none'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: '#1E293B' }}>{c.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748B' }}>{c.sks} SKS (Bobot: {c.point})</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: c.letter.startsWith('A') ? '#ECFDF5' : '#EFF6FF',
                              color: c.letter.startsWith('A') ? '#059669' : '#1D4ED8'
                            }}
                          >
                            {c.letter}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Hapus nilai mata kuliah "${c.name}" dari Semester ${sem.semesterNumber}?`)) {
                                deleteSemesterCourse(sem.semesterNumber, i);
                              }
                            }}
                            title="Hapus Nilai"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '4px',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEE2E2'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'none'; }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Tambah Nilai Matakuliah */}
      {isAddCourseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddCourseModalOpen(false)}>
          <div className="modal-bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle-bar" />
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>Input Nilai Matakuliah</h3>
            <form onSubmit={handleAddCourse}>
              <div className="input-group">
                <label className="input-label">Pilih Semester</label>
                <select
                  className="input-field"
                  value={targetSemester}
                  onChange={e => setTargetSemester(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Nama Mata Kuliah</label>
                <input
                  type="text"
                  placeholder="cth: Keamanan Informasi"
                  className="input-field"
                  value={newCourseName}
                  onChange={e => setNewCourseName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label">Jumlah SKS</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    className="input-field"
                    value={newCourseSks}
                    onChange={e => setNewCourseSks(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Nilai Huruf</label>
                  <select
                    className="input-field"
                    value={newCourseGrade}
                    onChange={e => setNewCourseGrade(e.target.value)}
                  >
                    {GRADE_OPTIONS.map(g => (
                      <option key={g.letter} value={g.letter}>
                        {g.letter} (Bobot {g.point})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '14px' }}>
                <Check size={16} /> Simpan & Hitung Ulang IPS
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
