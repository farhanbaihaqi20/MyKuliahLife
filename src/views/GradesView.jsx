import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Award,
  TrendingUp,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  Star,
  Trash2,
  MoreVertical,
  Edit2,
  X,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import EditCourseModal from '../components/academic/EditCourseModal';

const GRADE_OPTIONS = [
  { letter: 'A', point: 4.0, label: 'Sangat Baik' },
  { letter: 'A-', point: 3.75, label: 'Hampir Sempurna' },
  { letter: 'B+', point: 3.5, label: 'Lebih dari Baik' },
  { letter: 'B', point: 3.0, label: 'Baik' },
  { letter: 'B-', point: 2.75, label: 'Cukup Baik' },
  { letter: 'C+', point: 2.5, label: 'Cukup' },
  { letter: 'C', point: 2.0, label: 'Sedang' },
  { letter: 'D', point: 1.0, label: 'Kurang (Wajib Ulang)' },
  { letter: 'E', point: 0.0, label: 'Gagal' }
];

export const GradesView = () => {
  const {
    data,
    cumulativeGpa,
    totalCumulativeSks,
    unifiedSemesterData,
    setCourseGrade,
    deleteCourse,
    deleteSemesterCourse,
    addCourse
  } = useApp();

  const [expandedSemester, setExpandedSemester] = useState(() => {
    return data.activeSemester || data.profile?.semester || 1;
  });

  // Action sheet menu state for course in grades list
  const [activeActionCourse, setActiveActionCourse] = useState(null);

  // Grade Picker Modal state (for fast input/change grade)
  const [gradePickerCourse, setGradePickerCourse] = useState(null);
  const [selectedGradeChoice, setSelectedGradeChoice] = useState('A');

  // Edit Course Modal state
  const [editingCourseObj, setEditingCourseObj] = useState(null);

  // Add new course modal state
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [targetSemester, setTargetSemester] = useState(1);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseSks, setNewCourseSks] = useState(3);
  const [newCourseGrade, setNewCourseGrade] = useState('A');

  const handleOpenGradePicker = (courseItem, semesterNum) => {
    setGradePickerCourse({ ...courseItem, semesterNumber: semesterNum });
    setSelectedGradeChoice(courseItem.letter && courseItem.letter !== '-' ? courseItem.letter : 'A');
    setActiveActionCourse(null);
  };

  const handleSaveGradePicker = () => {
    if (!gradePickerCourse) return;
    const gradeObj = GRADE_OPTIONS.find(g => g.letter === selectedGradeChoice) || GRADE_OPTIONS[0];

    // If it's a registered course in data.courses
    if (gradePickerCourse.courseId || gradePickerCourse.id) {
      setCourseGrade(gradePickerCourse.courseId || gradePickerCourse.id, gradeObj.letter, gradeObj.point);
    }

    confetti({ particleCount: 45, spread: 65, origin: { y: 0.7 } });
    setGradePickerCourse(null);
  };

  const handleDeleteCourseAction = (courseItem, semesterNum) => {
    if (window.confirm(`Hapus mata kuliah "${courseItem.name}" dari Semester ${semesterNum}?`)) {
      if (courseItem.courseId && courseItem.isFromCourses) {
        deleteCourse(courseItem.courseId);
      } else {
        const sem = data.semesters.find(s => s.semesterNumber === semesterNum);
        if (sem) {
          const idx = sem.courses.findIndex(c => c.name.toLowerCase() === courseItem.name.toLowerCase());
          if (idx >= 0) deleteSemesterCourse(semesterNum, idx);
        }
      }
      setActiveActionCourse(null);
    }
  };

  const handleAddManualCourse = (e) => {
    e.preventDefault();
    if (!newCourseName.trim()) return;

    const gradeObj = GRADE_OPTIONS.find(g => g.letter === newCourseGrade) || GRADE_OPTIONS[0];

    addCourse({
      name: newCourseName.trim(),
      code: 'MK',
      sks: Number(newCourseSks) || 3,
      semester: Number(targetSemester),
      grade: { letter: gradeObj.letter, point: gradeObj.point }
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
            {predikat.badge} {data.profile?.major || 'Mahasiswa'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', margin: '12px 0 6px' }}>
          <span style={{ fontSize: '42px', fontWeight: 800, letterSpacing: '-1px' }}>
            {cumulativeGpa > 0 ? cumulativeGpa.toFixed(2) : '0.00'}
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
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>Total SKS Dinilai</div>
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

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '120px', paddingTop: '20px' }}>
          {unifiedSemesterData.map(sem => {
            const hasIps = sem.ips !== null && sem.ips > 0;
            const heightPercent = hasIps ? Math.min(100, Math.round((sem.ips / 4.0) * 100)) : 10;

            return (
              <div key={sem.semesterNumber} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: hasIps ? '#1665D8' : '#94A3B8' }}>
                  {hasIps ? sem.ips.toFixed(2) : '-'}
                </span>
                <div
                  style={{
                    width: '32px',
                    height: `${heightPercent}px`,
                    background: hasIps
                      ? 'linear-gradient(180deg, #3B82F6 0%, #1665D8 100%)'
                      : '#E2E8F0',
                    borderRadius: '8px 8px 3px 3px',
                    transition: 'height 0.3s ease'
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

      {/* 3. Rekap Matakuliah per Semester (Tersinkron Penuh) */}
      <div>
        <div className="section-header-row">
          <div>
            <h3 className="section-title">Rekap Matakuliah per Semester</h3>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              Tersinkron otomatis dengan mata kuliah aktif
            </span>
          </div>
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
          {unifiedSemesterData.map(sem => {
            const isExpanded = expandedSemester === sem.semesterNumber;
            const hasIps = sem.ips !== null;

            return (
              <div key={sem.semesterNumber} className="card-standard" style={{ padding: '14px 16px' }}>
                {/* Semester Accordion Header */}
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpandedSemester(isExpanded ? null : sem.semesterNumber)}
                >
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                      Semester {sem.semesterNumber}
                    </h4>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      {sem.totalSks} SKS • {sem.courses.length} Mata Kuliah ({sem.gradedCourses.length} dinilai)
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: hasIps ? '#1665D8' : '#94A3B8'
                        }}
                      >
                        {hasIps ? `IPS: ${sem.ips.toFixed(2)}` : 'Belum Dihitung'}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
                  </div>
                </div>

                {/* Expanded Course List inside Semester */}
                {isExpanded && (
                  <div style={{ marginTop: '14px', borderTop: '1px solid #F1F5F9', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {sem.courses.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: '#94A3B8' }}>
                        Belum ada matakuliah di semester ini.
                      </div>
                    ) : (
                      sem.courses.map((c, i) => (
                        <div
                          key={c.id || i}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 10px',
                            background: '#F8FAFC',
                            borderRadius: '12px',
                            border: '1px solid #E2E8F0'
                          }}
                        >
                          {/* Course Details */}
                          <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>
                                {c.name}
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                                • {c.sks} SKS
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                              {c.code || 'MK'} {c.lecturer ? `• ${c.lecturer}` : ''}
                            </div>
                          </div>

                          {/* Grade Badge & 3-Dots Action Button */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            {c.isGraded ? (
                              <div
                                onClick={() => handleOpenGradePicker(c, sem.semesterNumber)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'baseline',
                                  gap: '4px',
                                  background: '#EFF6FF',
                                  border: '1px solid #BFDBFE',
                                  color: '#1665D8',
                                  padding: '3px 8px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  fontWeight: 800
                                }}
                                title="Klik untuk ubah nilai"
                              >
                                <span>{c.letter}</span>
                                <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>
                                  ({c.point.toFixed(2)})
                                </span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenGradePicker(c, sem.semesterNumber)}
                                style={{
                                  background: '#FEF3C7',
                                  border: '1px solid #FDE68A',
                                  color: '#B45309',
                                  padding: '3px 8px',
                                  borderRadius: '8px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                                title="Mata kuliah belum diinput nilai. Nilai default E (tidak dihitung di IPS sebelum diinput)"
                              >
                                <span>E • Belum Diinput</span>
                              </button>
                            )}

                            {/* Beautiful 3-Dots Action Button */}
                            <button
                              type="button"
                              className="dots-action-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionCourse({ course: c, semesterNumber: sem.semesterNumber });
                              }}
                              title="Opsi Mata Kuliah"
                            >
                              <MoreVertical size={15} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Sheet Menu for Course in GradesView */}
      {activeActionCourse && (
        <div className="action-sheet-overlay" onClick={() => setActiveActionCourse(null)}>
          <div className="action-sheet-box" onClick={(e) => e.stopPropagation()}>
            <div className="action-sheet-header">
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  {activeActionCourse.course.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  Semester {activeActionCourse.semesterNumber} • {activeActionCourse.course.sks} SKS
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveActionCourse(null)}
                style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F1F5F9', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            <div>
              {/* Option 1: Input / Ubah Nilai */}
              <button
                type="button"
                className="action-sheet-item edit"
                onClick={() => handleOpenGradePicker(activeActionCourse.course, activeActionCourse.semesterNumber)}
              >
                <Award size={16} />
                <span>{activeActionCourse.course.isGraded ? 'Ubah Nilai Akhir' : 'Input Nilai Akhir'}</span>
              </button>

              {/* Option 2: Edit Matakuliah (if in data.courses) */}
              {activeActionCourse.course.isFromCourses && (
                <button
                  type="button"
                  className="action-sheet-item"
                  style={{ background: '#F0FDF4', color: '#166534' }}
                  onClick={() => {
                    const fullCourse = data.courses.find(c => c.id === activeActionCourse.course.id) || activeActionCourse.course;
                    setEditingCourseObj(fullCourse);
                    setActiveActionCourse(null);
                  }}
                >
                  <Edit2 size={16} />
                  <span>Edit Rincian Mata Kuliah</span>
                </button>
              )}

              {/* Option 3: Hapus */}
              <button
                type="button"
                className="action-sheet-item delete"
                onClick={() => handleDeleteCourseAction(activeActionCourse.course, activeActionCourse.semesterNumber)}
              >
                <Trash2 size={16} />
                <span>Hapus Mata Kuliah</span>
              </button>

              <button
                type="button"
                className="action-sheet-item cancel"
                onClick={() => setActiveActionCourse(null)}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Picker Modal */}
      {gradePickerCourse && (
        <div className="hub-modal-overlay" onClick={() => setGradePickerCourse(null)}>
          <div className="hub-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #F1F5F9' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Input Nilai Akhir</h3>
                <p style={{ fontSize: '11px', color: '#64748B' }}>
                  {gradePickerCourse.name} • {gradePickerCourse.sks} SKS (Semester {gradePickerCourse.semesterNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGradePickerCourse(null)}
                style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#F1F5F9', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: '#475569' }}>
                Pilih nilai huruf yang diperoleh untuk mengkalkulasi IPS & IPK:
              </div>

              <div className="grade-selector-grid">
                {GRADE_OPTIONS.map(opt => {
                  const isSelected = selectedGradeChoice === opt.letter;
                  return (
                    <button
                      key={opt.letter}
                      type="button"
                      className={`grade-choice-btn ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedGradeChoice(opt.letter)}
                    >
                      <div className="grade-choice-letter">{opt.letter}</div>
                      <div className="grade-choice-point">Bobot: {opt.point.toFixed(2)}</div>
                      <div className="grade-choice-desc">{opt.label}</div>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setGradePickerCourse(null)}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveGradePicker}
                  className="btn-primary"
                  style={{ flex: 2 }}
                >
                  <Check size={16} /> Simpan & Hitung IPS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal (if opened from grades) */}
      <EditCourseModal
        course={editingCourseObj}
        isOpen={Boolean(editingCourseObj)}
        onClose={() => setEditingCourseObj(null)}
      />

      {/* Modal Tambah Matakuliah / Nilai Baru */}
      {isAddCourseModalOpen && (
        <div className="hub-modal-overlay" onClick={() => setIsAddCourseModalOpen(false)}>
          <div className="hub-modal-content" onClick={e => e.stopPropagation()} style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Tambah Nilai Matakuliah</h3>
              <button
                type="button"
                onClick={() => setIsAddCourseModalOpen(false)}
                style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#F1F5F9', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleAddManualCourse} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
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

              <div className="input-group" style={{ marginBottom: 0 }}>
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
                <div className="input-group" style={{ marginBottom: 0 }}>
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

                <div className="input-group" style={{ marginBottom: 0 }}>
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

              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                <Check size={16} /> Simpan & Hitung Ulang IPS
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
