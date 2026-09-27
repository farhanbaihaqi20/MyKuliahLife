import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  CheckSquare,
  BookOpen,
  FileText,
  AlertTriangle,
  Plus,
  ExternalLink,
  Trash2,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  CheckCircle2,
  Clock,
  Award,
  Edit2,
  MoreVertical
} from 'lucide-react';
import confetti from 'canvas-confetti';
import SwipeableItem from '../components/common/SwipeableItem';
import CourseDetailModal from '../components/academic/CourseDetailModal';
import EditCourseModal from '../components/academic/EditCourseModal';
import { sanitizeUrl, isSafeExternalUrl } from '../utils/security';

export const AcademicView = () => {
  const {
    data,
    activeSemester,
    unlockedSemesters,
    viewSemester,
    setViewSemester,
    changeActiveSemester,
    unlockNewSemester,
    navigateTo,
    toggleAssignmentStatus,
    deleteAssignment,
    updateAttendance,
    addCourse,
    deleteCourse,
    deleteCourseNote,
    setIsQuickAddOpen,
    setQuickAddType,
    academicTab,
    setAcademicTab
  } = useApp();

  const indonesianDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayDayName = indonesianDays[new Date().getDay()];

  // Auto-select today's day by default (Senin-Minggu)
  const [selectedDay, setSelectedDay] = useState(todayDayName);

  // Semester Picker Modal state
  const [isSemesterPickerOpen, setIsSemesterPickerOpen] = useState(false);

  // Course Detail, Edit & Action states
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState(null);
  const [selectedCourseForEdit, setSelectedCourseForEdit] = useState(null);
  const [selectedCourseForAction, setSelectedCourseForAction] = useState(null);

  // Dedicated Add Course Modal state
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    sks: 3,
    lecturer: '',
    room: '',
    dayOfWeek: 'Senin',
    startTime: '08:00',
    endTime: '10:30',
    color: '#1665D8',
    semester: viewSemester
  });

  const days = ['Semua', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

  // All semesters available in the system: up to activeSemester, unlockedSemesters, or existing course/grade semesters
  const currentActiveSem = activeSemester || data.profile?.semester || 1;
  const existingCourseSemesters = (data.courses || []).map(c => c.semester || 1);
  const existingGradeSemesters = (data.semesters || []).map(s => s.semesterNumber || 1);
  const unlocked = unlockedSemesters || data.unlockedSemesters || [currentActiveSem];
  const highestSemester = Math.max(currentActiveSem, ...existingCourseSemesters, ...existingGradeSemesters, ...unlocked, 1);
  const availableSemesters = Array.from({ length: highestSemester }, (_, i) => i + 1);

  // Filter courses for the selected viewSemester
  const semesterCourses = (data.courses || []).filter(c => (c.semester || 1) === viewSemester);
  const totalSemesterSks = semesterCourses.reduce((sum, c) => sum + (Number(c.sks) || 0), 0);
  const isCurrentActive = viewSemester === activeSemester;
  const isArchived = viewSemester < activeSemester;

  // Filter by day
  const filteredCourses = selectedDay === 'Semua'
    ? semesterCourses
    : semesterCourses.filter(c => c.dayOfWeek?.trim().toLowerCase() === selectedDay.toLowerCase());

  // Filter assignments for viewSemester
  const semesterAssignments = data.assignments.filter(a => (a.semester || 5) === viewSemester);

  // Filter notes for viewSemester
  const semesterNotes = data.courseNotes.filter(n => (n.semester || 5) === viewSemester);

  // Attendance stats calculator
  const getAttendanceStats = (course) => {
    const validAttendance = (course.attendance || []).filter(a => a.status && a.status !== 'unrecorded');
    const totalMeetingsRecorded = validAttendance.length;
    const presentCount = validAttendance.filter(a => a.status === 'present').length;
    const sickCount = validAttendance.filter(a => a.status === 'sick').length;
    const permCount = validAttendance.filter(a => a.status === 'permission').length;
    const absentCount = validAttendance.filter(a => a.status === 'absent').length;

    const currentRate = totalMeetingsRecorded > 0
      ? Math.round(((presentCount + permCount) / totalMeetingsRecorded) * 100)
      : 100;

    const isNearDanger = absentCount >= 3 || currentRate < 80;
    const isDisqualified = absentCount >= 4 || currentRate < 75;

    return {
      presentCount,
      sickCount,
      permCount,
      absentCount,
      totalMeetingsRecorded,
      currentRate,
      isNearDanger,
      isDisqualified
    };
  };

  const handleOpenAddCourse = () => {
    setCourseForm(prev => ({
      ...prev,
      semester: viewSemester,
      dayOfWeek: selectedDay !== 'Semua' ? selectedDay : 'Senin'
    }));
    setIsAddCourseModalOpen(true);
  };

  const handleSaveCourse = (e) => {
    e.preventDefault();
    if (!courseForm.name.trim()) return;

    addCourse({
      name: courseForm.name.trim(),
      code: courseForm.code.trim() || 'MK',
      sks: Number(courseForm.sks) || 3,
      lecturer: courseForm.lecturer.trim() || 'Dosen Pengampu',
      room: courseForm.room.trim() || 'Ruang Kuliah',
      dayOfWeek: courseForm.dayOfWeek,
      startTime: courseForm.startTime || '08:00',
      endTime: courseForm.endTime || '10:30',
      color: courseForm.color || '#1665D8',
      semester: Number(courseForm.semester) || viewSemester
    });

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    setIsAddCourseModalOpen(false);
    setCourseForm({
      name: '',
      code: '',
      sks: 3,
      lecturer: '',
      room: '',
      dayOfWeek: 'Senin',
      startTime: '08:00',
      endTime: '10:30',
      color: '#1665D8',
      semester: viewSemester
    });
  };

  const handleDeleteCourse = (courseId, courseName) => {
    if (window.confirm(`Hapus matakuliah "${courseName}" beserta semua jadwal, tugas, dan presensinya?`)) {
      deleteCourse(courseId);
    }
  };

  const handleDeleteNote = (noteId, topic) => {
    if (window.confirm(`Hapus catatan "${topic}"?`)) {
      deleteCourseNote(noteId);
    }
  };

  return (
    <div className="main-content" style={{ paddingTop: '16px' }}>
      {/* Modern Semester Switcher Card */}
      <div
        className="academic-semester-card"
        onClick={() => setIsSemesterPickerOpen(true)}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '12px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '13px',
              background: isCurrentActive
                ? 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)'
                : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
              border: isCurrentActive ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: isCurrentActive ? '#1665D8' : '#64748B'
            }}
          >
            <GraduationCap size={22} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.2px' }}>
                Semester {viewSemester}
              </span>
              {isCurrentActive ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0'
                  }}
                >
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 5px #10B981' }} />
                  Aktif
                </span>
              ) : isArchived ? (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#F1F5F9',
                    color: '#64748B',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  Arsip
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: '#FEF3C7',
                    color: '#B45309',
                    border: '1px solid #FDE68A'
                  }}
                >
                  Mendatang
                </span>
              )}
            </div>

            <div style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 500, marginTop: '2px' }}>
              {semesterCourses.length} Mata Kuliah • {totalSemesterSks} SKS
            </div>
          </div>
        </div>

        {/* Right Action Button Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '7px 12px',
            borderRadius: '12px',
            background: '#EFF6FF',
            color: '#1665D8',
            fontSize: '12px',
            fontWeight: 800,
            border: '1px solid #DBEAFE',
            flexShrink: 0
          }}
        >
          <span>Ganti</span>
          <ChevronDown size={14} />
        </div>
      </div>

      {/* Sub Tabs: Jadwal, Tugas, Presensi, Catatan */}
      <div className="subtab-pills" style={{ marginTop: '14px', marginBottom: '14px', display: 'flex', width: '100%', gap: '4px' }}>
        <button
          className={`subtab-btn ${academicTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setAcademicTab('schedule')}
          style={{ flex: 1, padding: '8px 6px', justifyContent: 'center' }}
        >
          <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Jadwal
        </button>
        <button
          className={`subtab-btn ${academicTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setAcademicTab('assignments')}
          style={{ flex: 1, padding: '8px 6px', justifyContent: 'center' }}
        >
          <CheckSquare size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Tugas
          {semesterAssignments.filter(a => a.status !== 'completed').length > 0 && (
            <span className="subtab-btn-badge" style={{ marginLeft: '4px' }}>
              {semesterAssignments.filter(a => a.status !== 'completed').length}
            </span>
          )}
        </button>
        <button
          className={`subtab-btn ${academicTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setAcademicTab('attendance')}
          style={{ flex: 1, padding: '8px 6px', justifyContent: 'center' }}
        >
          <BookOpen size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Presensi
        </button>
        <button
          className={`subtab-btn ${academicTab === 'notes' ? 'active' : ''}`}
          onClick={() => setAcademicTab('notes')}
          style={{ flex: 1, padding: '8px 6px', justifyContent: 'center' }}
        >
          <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Catatan
        </button>
      </div>

      {/* 1. JADWAL KULIAH */}
      {academicTab === 'schedule' && (
        <div>
          {/* Header row with Add Course button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                Jadwal Kuliah Semester {viewSemester}
              </h3>
              <div style={{ fontSize: '11px', color: '#64748B' }}>
                {semesterCourses.length} Mata Kuliah Terdaftar
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={handleOpenAddCourse}
              style={{ width: 'auto', padding: '8px 14px', fontSize: '12px', borderRadius: '12px', margin: 0 }}
            >
              <Plus size={15} /> Tambah Matakuliah
            </button>
          </div>

          {/* Day pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px' }}>
            {days.map(d => {
              const isSelected = selectedDay === d;
              const isToday = d === todayDayName;
              return (
                <button
                  key={d}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '16px',
                    border: 'none',
                    background: isSelected ? '#1665D8' : '#E2E8F0',
                    color: isSelected ? '#FFFFFF' : '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  onClick={() => setSelectedDay(d)}
                >
                  <span>{d}</span>
                  {isToday && (
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '1px 5px',
                        borderRadius: '6px',
                        background: isSelected ? 'rgba(255,255,255,0.25)' : '#CBD5E1',
                        color: isSelected ? '#FFFFFF' : '#334155',
                        fontWeight: 800
                      }}
                    >
                      Hari Ini
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Empty state if semester has no courses */}
          {semesterCourses.length === 0 ? (
            <div className="card-standard" style={{ textAlign: 'center', padding: '36px 20px' }}>
              <span style={{ fontSize: '36px' }}>📚</span>
              <h4 style={{ fontSize: '16px', fontWeight: 800, marginTop: '10px' }}>
                Semester {viewSemester} Masih Kosong
              </h4>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', marginBottom: '16px' }}>
                Belum ada matakuliah yang terdaftar untuk semester ini. Yuk mulai tambahkan matakuliah dan jadwal barumu!
              </p>
              <button
                className="btn-primary"
                onClick={handleOpenAddCourse}
                style={{ width: 'auto', margin: '0 auto' }}
              >
                <Plus size={16} /> Tambah Matakuliah
              </button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedDay === 'Minggu' ? (
                <div
                  className="card-standard"
                  style={{
                    textAlign: 'center',
                    padding: '36px 20px',
                    background: '#F8FAFC',
                    border: '1px dashed #CBD5E1',
                    borderRadius: '18px'
                  }}
                >
                  <span style={{ fontSize: '36px' }}>🌴</span>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, marginTop: '8px', color: '#0F172A' }}>
                    Hari Minggu — Libur Kuliah!
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', marginBottom: '16px', lineHeight: 1.5, maxWidth: '320px', margin: '4px auto 16px' }}>
                    Tidak ada jadwal kuliah di hari Minggu. Waktunya istirahat, recharge energimu, atau persiapan untuk perkuliahan besok.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => setSelectedDay('Senin')}
                      style={{ width: 'auto', padding: '8px 16px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      Lihat Jadwal Besok (Senin) →
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDay('Semua')}
                      style={{
                        background: 'white',
                        border: '1px solid #CBD5E1',
                        color: '#334155',
                        padding: '8px 14px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Lihat Semua Hari
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="card-standard"
                  style={{
                    textAlign: 'center',
                    padding: '36px 20px',
                    background: '#F8FAFC',
                    border: '1px dashed #CBD5E1',
                    borderRadius: '18px'
                  }}
                >
                  <span style={{ fontSize: '32px' }}>☕</span>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, marginTop: '8px', color: '#0F172A' }}>
                    Tidak Ada Kuliah Hari {selectedDay}
                  </h4>
                  <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', marginBottom: '16px', maxWidth: '320px', margin: '4px auto 16px' }}>
                    Tidak ada mata kuliah yang terdaftar di hari {selectedDay} untuk Semester {viewSemester}.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedDay('Semua')}
                      style={{
                        background: '#1665D8',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Lihat Semua Hari
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenAddCourse}
                      style={{
                        background: 'white',
                        border: '1px solid #CBD5E1',
                        color: '#1665D8',
                        padding: '8px 14px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + Tambah Kuliah {selectedDay}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Interaction Hint Banner */}
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>💡</span>
                <span>
                  <strong>Tips:</strong> Ketuk matkul untuk buka <strong>Hub Presensi, Tugas, Catatan & Nilai</strong>. Geser kanan untuk <strong>Hapus</strong>, geser kiri untuk <strong>Edit</strong>.
                </span>
              </div>

              {filteredCourses.map(course => {
                const stats = getAttendanceStats(course);
                const semRecord = data.semesters?.find(s => s.semesterNumber === course.semester);
                const gradeRecord = semRecord?.courses?.find(c => c.courseId === course.id || c.name === course.name);
                const currentGrade = course.grade?.letter || gradeRecord?.letter;

                return (
                  <SwipeableItem
                    key={course.id}
                    itemTitle={course.name}
                    showDots={false}
                    onEdit={() => setSelectedCourseForEdit(course)}
                    onDelete={() => deleteCourse(course.id)}
                    onClick={() => setSelectedCourseForDetail(course)}
                  >
                    <div
                      className="course-card"
                      style={{
                        borderLeftColor: course.color || '#1665D8',
                        cursor: 'pointer',
                        margin: 0
                      }}
                    >
                      <div className="course-top-row">
                        <div style={{ flex: 1, paddingRight: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span className="course-badge">{course.code || 'MK'}</span>
                            {currentGrade && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: '#EFF6FF',
                                  color: '#1665D8',
                                  border: '1px solid #BFDBFE'
                                }}
                              >
                                Nilai: {currentGrade}
                              </span>
                            )}
                          </div>
                          <h4 className="course-title" style={{ marginTop: '6px' }}>{course.name}</h4>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span style={{ fontWeight: 800, fontSize: '13px', color: '#1665D8' }}>
                            {course.sks} SKS
                          </span>
                          <button
                            type="button"
                            className="dots-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCourseForAction(course);
                            }}
                            title="Menu Aksi"
                          >
                            <MoreVertical size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="course-meta" style={{ marginTop: '8px' }}>
                        <span>📅 {course.dayOfWeek}, {course.startTime} - {course.endTime}</span>
                        <span>📍 {course.room || 'Ruang Kuliah'}</span>
                        <span>👨‍🏫 {course.lecturer || 'Dosen Pengampu'}</span>
                      </div>

                      {/* Mini footer status */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '10px',
                          paddingTop: '8px',
                          borderTop: '1px solid #F1F5F9',
                          fontSize: '11px'
                        }}
                      >
                        <span style={{ color: stats.isDisqualified ? '#EF4444' : (stats.isNearDanger ? '#F59E0B' : '#10B981'), fontWeight: 700 }}>
                          Kehadiran: {stats.currentRate}% ({stats.totalMeetingsRecorded}/16)
                        </span>
                        <span style={{ color: '#1665D8', fontWeight: 700 }}>
                          Buka Hub Kuliah →
                        </span>
                      </div>
                    </div>
                  </SwipeableItem>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. TUGAS KULIAH */}
      {academicTab === 'assignments' && (
        <div>
          <div className="section-header-row">
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
              {semesterAssignments.filter(a => a.status === 'completed').length} dari {semesterAssignments.length} tugas selesai
            </span>
            <button
              onClick={() => {
                setQuickAddType('assignment');
                setIsQuickAddOpen(true);
              }}
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
              <Plus size={14} /> Tambah Tugas
            </button>
          </div>

          {semesterAssignments.length === 0 ? (
            <div className="card-standard" style={{ textAlign: 'center', padding: '30px 20px', color: '#64748B' }}>
              Tidak ada tugas untuk Semester {viewSemester}. Santai dulu! ☕
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {semesterAssignments.map(asg => {
                const isCompleted = asg.status === 'completed';
                const deadlineDate = new Date(asg.deadline);
                const formattedDeadline = deadlineDate.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div key={asg.id} className="assignment-card">
                    <div
                      className={`checkbox-custom ${isCompleted ? 'completed' : ''}`}
                      onClick={() => toggleAssignmentStatus(asg.id)}
                    >
                      {isCompleted && '✓'}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 className={`assignment-title ${isCompleted ? 'completed' : ''}`}>
                          {asg.title}
                        </h4>
                        <span className={`priority-tag ${asg.priority}`}>
                          {asg.priority === 'high' ? 'Tinggi' : (asg.priority === 'medium' ? 'Sedang' : 'Santai')}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                        {asg.courseName}
                      </div>

                      {asg.description && (
                        <p style={{ fontSize: '12px', color: '#475569', marginTop: '6px', background: '#F8FAFC', padding: '8px', borderRadius: '8px' }}>
                          {asg.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#DC2626' }}>
                          ⏳ Deadline: {formattedDeadline}
                        </span>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus tugas "${asg.title}"?`)) {
                              deleteAssignment(asg.id);
                            }
                          }}
                          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                          title="Hapus Tugas"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. PRESENSI KULIAH */}
      {academicTab === 'attendance' && (
        <div>
          {/* Info Banner */}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '16px', padding: '14px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#1D4ED8', fontWeight: 700, fontSize: '13px' }}>
              <AlertTriangle size={16} /> Aturan Kehadiran Minimal 75%
            </div>
            <p style={{ fontSize: '12px', color: '#1E40AF', marginTop: '4px' }}>
              Maksimal tidak hadir (alpa/tanpa keterangan) adalah <strong>3 kali</strong> dalam satu semester agar tetap bisa mengikuti Ujian Akhir Semester (UAS).
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {semesterCourses.length === 0 ? (
              <div className="card-standard" style={{ textAlign: 'center', padding: '30px 20px', color: '#64748B' }}>
                Belum ada matakuliah di Semester {viewSemester} untuk dilacak presensinya.
              </div>
            ) : (
              semesterCourses.map(course => {
                const stats = getAttendanceStats(course);

                return (
                  <div key={course.id} className="card-standard">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                          {course.name}
                        </h4>
                        <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                          {course.code} • {course.sks} SKS
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '18px',
                            fontWeight: 800,
                            color: stats.isDisqualified ? '#EF4444' : (stats.isNearDanger ? '#F59E0B' : '#10B981')
                          }}
                        >
                          {stats.currentRate}%
                        </span>
                        <div style={{ fontSize: '10px', color: '#64748B' }}>Kehadiran</div>
                      </div>
                    </div>

                    {stats.absentCount >= 2 && (
                      <div style={{ background: '#FEF2F2', padding: '6px 10px', borderRadius: '8px', marginTop: '8px', fontSize: '11px', color: '#B91C1C', fontWeight: 700 }}>
                        ⚠️ Perhatian: Sudah alpa {stats.absentCount}x! Jangan bolos lagi.
                      </div>
                    )}

                    {/* 16 Meetings Dots Grid */}
                    <div style={{ marginTop: '14px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '8px' }}>
                        Pertemuan 1 s/d 16:
                      </div>
                      <div className="attendance-pills-row">
                        {Array.from({ length: 16 }, (_, i) => i + 1).map(num => {
                          const rec = course.attendance?.find(a => a.meeting === num);
                          const status = rec?.status || 'unrecorded';

                          return (
                            <div
                              key={num}
                              className={`attendance-pill ${status}`}
                              title={`Pertemuan ${num}: ${status}`}
                              onClick={() => {
                                const nextStatus =
                                  status === 'unrecorded' ? 'present' :
                                  status === 'present' ? 'permission' :
                                  status === 'permission' ? 'sick' :
                                  status === 'sick' ? 'absent' : 'unrecorded';
                                updateAttendance(course.id, num, nextStatus);
                              }}
                            >
                              {num}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#64748B', marginTop: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                      <span>✅ Hadir: {stats.presentCount}</span>
                      <span>📑 Izin: {stats.permCount}</span>
                      <span>💊 Sakit: {stats.sickCount}</span>
                      <span style={{ color: stats.absentCount > 0 ? '#EF4444' : 'inherit', fontWeight: stats.absentCount > 0 ? 800 : 400 }}>
                        ❌ Alpa: {stats.absentCount}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. CATATAN KULIAH */}
      {academicTab === 'notes' && (
        <div>
          <div className="section-header-row">
            <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
              {semesterNotes.length} Catatan tersimpan di Semester {viewSemester}
            </span>
            <button
              onClick={() => {
                setQuickAddType('note');
                setIsQuickAddOpen(true);
              }}
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
              <Plus size={14} /> Tulis Catatan
            </button>
          </div>

          {semesterNotes.length === 0 ? (
            <div className="card-standard" style={{ textAlign: 'center', padding: '30px 20px', color: '#64748B' }}>
              Belum ada catatan materi di Semester {viewSemester}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {semesterNotes.map(note => (
                <div key={note.id} className="card-standard">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="course-badge">Minggu {note.weekNumber}</span>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
                        {note.topic}
                      </h4>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        {note.courseName}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id, note.topic)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                      title="Hapus Catatan"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <p style={{ fontSize: '13px', color: '#334155', marginTop: '10px', lineHeight: 1.5, background: '#F8FAFC', padding: '12px', borderRadius: '12px' }}>
                    {note.content}
                  </p>

                  {isSafeExternalUrl(note.materialUrl) && (
                    <a
                      href={sanitizeUrl(note.materialUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: '#1665D8',
                        fontWeight: 700,
                        textDecoration: 'none',
                        marginTop: '10px'
                      }}
                    >
                      <ExternalLink size={13} /> Buka Folder / Drive Materi
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Tambah Matakuliah Baru */}
      {isAddCourseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddCourseModalOpen(false)}>
          <div className="modal-bottom-sheet" style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <div className="sheet-handle-bar" />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} style={{ color: '#1665D8' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  Tambah Mata Kuliah Baru
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCourseModalOpen(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCourse}>
              <div className="input-group">
                <label className="input-label">Nama Mata Kuliah *</label>
                <input
                  type="text"
                  placeholder="cth: Struktur Data & Algoritma"
                  className="input-field"
                  value={courseForm.name}
                  onChange={e => setCourseForm({ ...courseForm, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label">Kode MK</label>
                  <input
                    type="text"
                    placeholder="cth: IF201"
                    className="input-field"
                    value={courseForm.code}
                    onChange={e => setCourseForm({ ...courseForm, code: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Jumlah SKS</label>
                  <select
                    className="input-field"
                    value={courseForm.sks}
                    onChange={e => setCourseForm({ ...courseForm, sks: Number(e.target.value) })}
                  >
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num} SKS</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label">Dosen Pengampu</label>
                  <input
                    type="text"
                    placeholder="cth: Dr. Ir. Budi Santoso"
                    className="input-field"
                    value={courseForm.lecturer}
                    onChange={e => setCourseForm({ ...courseForm, lecturer: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Ruang Kelas / Lab</label>
                  <input
                    type="text"
                    placeholder="cth: Lab Komputer 2"
                    className="input-field"
                    value={courseForm.room}
                    onChange={e => setCourseForm({ ...courseForm, room: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label">Hari Kuliah</label>
                  <select
                    className="input-field"
                    value={courseForm.dayOfWeek}
                    onChange={e => setCourseForm({ ...courseForm, dayOfWeek: e.target.value })}
                  >
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Semester</label>
                  <select
                    className="input-field"
                    value={courseForm.semester}
                    onChange={e => setCourseForm({ ...courseForm, semester: Number(e.target.value) })}
                  >
                    {availableSemesters.map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="input-group">
                  <label className="input-label">Jam Mulai</label>
                  <input
                    type="time"
                    className="input-field"
                    value={courseForm.startTime}
                    onChange={e => setCourseForm({ ...courseForm, startTime: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Jam Selesai</label>
                  <input
                    type="time"
                    className="input-field"
                    value={courseForm.endTime}
                    onChange={e => setCourseForm({ ...courseForm, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Warna Label</label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  {['#1665D8', '#059669', '#D97706', '#7C3AED', '#DC2626', '#DB2777'].map(clr => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => setCourseForm({ ...courseForm, color: clr })}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: clr,
                        border: courseForm.color === clr ? '3px solid #0F172A' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}
                    >
                      {courseForm.color === clr && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '16px' }}>
                <Check size={16} /> Simpan Mata Kuliah
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Integrated Course Detail Hub Modal */}
      <CourseDetailModal
        course={selectedCourseForDetail}
        isOpen={Boolean(selectedCourseForDetail)}
        onClose={() => setSelectedCourseForDetail(null)}
        onEditCourse={(courseToEdit) => {
          setSelectedCourseForEdit(courseToEdit);
        }}
      />

      {/* Course Edit Modal */}
      <EditCourseModal
        course={selectedCourseForEdit}
        isOpen={Boolean(selectedCourseForEdit)}
        onClose={() => setSelectedCourseForEdit(null)}
      />

      {/* Course Action Sheet Modal */}
      {selectedCourseForAction && (
        <div className="action-sheet-overlay" onClick={() => setSelectedCourseForAction(null)}>
          <div className="action-sheet-box" onClick={(e) => e.stopPropagation()}>
            <div className="action-sheet-header">
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                  {selectedCourseForAction.name}
                </div>
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  Semester {selectedCourseForAction.semester} • {selectedCourseForAction.sks} SKS
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCourseForAction(null)}
                style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F1F5F9', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            <div>
              <button
                type="button"
                className="action-sheet-item"
                style={{ background: '#EFF6FF', color: '#1665D8' }}
                onClick={() => {
                  const c = selectedCourseForAction;
                  setSelectedCourseForAction(null);
                  setSelectedCourseForDetail(c);
                }}
              >
                <BookOpen size={16} />
                <span>Buka Hub Kuliah (Presensi & Nilai)</span>
              </button>

              <button
                type="button"
                className="action-sheet-item edit"
                onClick={() => {
                  const c = selectedCourseForAction;
                  setSelectedCourseForAction(null);
                  setSelectedCourseForEdit(c);
                }}
              >
                <Edit2 size={16} />
                <span>Edit Rincian Mata Kuliah</span>
              </button>

              <button
                type="button"
                className="action-sheet-item delete"
                onClick={() => {
                  const c = selectedCourseForAction;
                  setSelectedCourseForAction(null);
                  if (window.confirm(`Hapus matakuliah "${c.name}" beserta jadwal, tugas, dan presensinya?`)) {
                    deleteCourse(c.id);
                  }
                }}
              >
                <Trash2 size={16} />
                <span>Hapus Mata Kuliah</span>
              </button>

              <button
                type="button"
                className="action-sheet-item cancel"
                onClick={() => setSelectedCourseForAction(null)}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Semester Picker Action Sheet Modal */}
      {isSemesterPickerOpen && (
        <div
          className="action-sheet-overlay"
          onClick={() => setIsSemesterPickerOpen(false)}
          style={{ zIndex: 1000 }}
        >
          <div
            className="action-sheet-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Header */}
            <div className="action-sheet-header" style={{ marginBottom: '14px', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '11px',
                    background: '#EFF6FF',
                    color: '#1665D8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <GraduationCap size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                    Pilih Semester
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>
                    Kelola jadwal & riwayat perkuliahan
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSemesterPickerOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  border: 'none',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Semesters List */}
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '10px' }}>
              {availableSemesters.map(s => {
                const isSelected = s === viewSemester;
                const isSemActive = s === activeSemester;
                const isArchivedSem = s < activeSemester;
                const sCourses = (data.courses || []).filter(c => (c.semester || 1) === s);
                const sSks = sCourses.reduce((sum, c) => sum + (Number(c.sks) || 0), 0);

                return (
                  <div
                    key={s}
                    onClick={() => {
                      setViewSemester(s);
                      changeActiveSemester(s);
                      setIsSemesterPickerOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: isSelected ? '2px solid #1665D8' : '1px solid #E2E8F0',
                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          background: isSelected ? '#1665D8' : '#F1F5F9',
                          color: isSelected ? '#FFFFFF' : '#475569',
                          fontWeight: 800,
                          fontSize: '13px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {s < 10 ? `0${s}` : s}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: isSelected ? '#1665D8' : '#0F172A' }}>
                            Semester {s}
                          </span>
                          {isSemActive ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '999px',
                                background: '#DCFCE7',
                                color: '#15803D',
                                border: '1px solid #BBF7D0'
                              }}
                            >
                              ★ Aktif
                            </span>
                          ) : isArchivedSem ? (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '999px',
                                background: '#F1F5F9',
                                color: '#64748B',
                                border: '1px solid #E2E8F0'
                              }}
                            >
                              Arsip
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '999px',
                                background: '#FEF3C7',
                                color: '#B45309',
                                border: '1px solid #FDE68A'
                              }}
                            >
                              Baru
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          {sCourses.length} Mata Kuliah • {sSks} SKS
                        </div>
                      </div>
                    </div>

                    <div>
                      {isSelected ? (
                        <CheckCircle2 size={20} style={{ color: '#1665D8' }} />
                      ) : (
                        <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid #CBD5E1' }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Set as Active button if current view is not active */}
            {viewSemester !== activeSemester && (
              <div style={{ marginTop: '8px', padding: '10px 12px', background: '#F8FAFC', borderRadius: '12px', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ fontSize: '11.5px', color: '#475569' }}>
                  Jadikan <strong>Semester {viewSemester}</strong> sebagai semester aktif saat ini?
                </div>
                <button
                  type="button"
                  onClick={() => {
                    changeActiveSemester(viewSemester);
                    confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
                    setIsSemesterPickerOpen(false);
                  }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#1665D8',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Set Aktif
                </button>
              </div>
            )}

            {/* Footer Action: Unlock new semester */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  const nextSem = highestSemester + 1;
                  unlockNewSemester(nextSem);
                  confetti({ particleCount: 40, spread: 70, origin: { y: 0.7 } });
                  setIsSemesterPickerOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '1px dashed #93C5FD',
                  background: '#F0F7FF',
                  color: '#1665D8',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={15} />
                <span>Buka Semester {highestSemester + 1} Baru</span>
              </button>

              <div style={{ fontSize: '10.5px', color: '#94A3B8', textAlign: 'center' }}>
                💡 Data jadwal & nilai tersimpan terpisah dan aman antar-semester
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
