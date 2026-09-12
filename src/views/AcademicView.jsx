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
  Clock,
  Award,
  Edit2,
  MoreVertical
} from 'lucide-react';
import confetti from 'canvas-confetti';
import SwipeableItem from '../components/common/SwipeableItem';
import CourseDetailModal from '../components/academic/CourseDetailModal';
import EditCourseModal from '../components/academic/EditCourseModal';

export const AcademicView = () => {
  const {
    data,
    activeSemester,
    viewSemester,
    setViewSemester,
    promoteToNextSemester,
    toggleAssignmentStatus,
    deleteAssignment,
    updateAttendance,
    addCourse,
    deleteCourse,
    deleteCourseNote,
    setIsQuickAddOpen,
    setQuickAddType
  } = useApp();

  const [academicTab, setAcademicTab] = useState('schedule'); // schedule | assignments | attendance | notes
  const [selectedDay, setSelectedDay] = useState('Semua');

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

  const days = ['Semua', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // All semesters available in the system: only up to activeSemester, plus any created semesters with data
  const currentActiveSem = activeSemester || data.profile?.semester || 1;
  const existingCourseSemesters = (data.courses || []).map(c => c.semester || 1);
  const existingGradeSemesters = (data.semesters || []).map(s => s.semesterNumber || 1);
  const highestSemester = Math.max(currentActiveSem, ...existingCourseSemesters, ...existingGradeSemesters, 1);
  const availableSemesters = Array.from({ length: highestSemester }, (_, i) => i + 1);

  // Filter courses for the selected viewSemester
  const semesterCourses = (data.courses || []).filter(c => (c.semester || 1) === viewSemester);

  // Filter by day
  const filteredCourses = selectedDay === 'Semua'
    ? semesterCourses
    : semesterCourses.filter(c => c.dayOfWeek === selectedDay);

  // Filter assignments for viewSemester
  const semesterAssignments = data.assignments.filter(a => (a.semester || 5) === viewSemester);

  // Filter notes for viewSemester
  const semesterNotes = data.courseNotes.filter(n => (n.semester || 5) === viewSemester);

  // Attendance stats calculator
  const getAttendanceStats = (course) => {
    const totalMeetingsRecorded = course.attendance?.length || 0;
    const presentCount = course.attendance?.filter(a => a.status === 'present').length || 0;
    const sickCount = course.attendance?.filter(a => a.status === 'sick').length || 0;
    const permCount = course.attendance?.filter(a => a.status === 'permission').length || 0;
    const absentCount = course.attendance?.filter(a => a.status === 'absent').length || 0;

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
      {/* Semester Switcher Bar (Isolasi & Arsip antar semester) */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto', minWidth: '170px' }}>
          <GraduationCap size={18} style={{ color: '#1665D8', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155', flexShrink: 0 }}>Semester:</span>
          <select
            value={viewSemester}
            onChange={(e) => setViewSemester(Number(e.target.value))}
            style={{
              padding: '6px 10px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              background: '#F8FAFC',
              fontWeight: 800,
              fontSize: '12px',
              color: '#1665D8',
              cursor: 'pointer',
              flex: '1 1 auto',
              maxWidth: '180px'
            }}
          >
            {availableSemesters.map(s => (
              <option key={s} value={s}>
                Semester {s} {s === activeSemester ? '⭐ (Aktif)' : '📁 (Arsip)'}
              </option>
            ))}
          </select>
        </div>

        {viewSemester === activeSemester && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Buka lembar kerja Semester ${activeSemester + 1}? Semua data semester ${activeSemester} tetap tersimpan aman di arsip.`)) {
                promoteToNextSemester();
              }
            }}
            style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#1665D8',
              borderRadius: '10px',
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            title="Buka Lembar Kerja Semester Baru"
          >
            <Plus size={13} /> Semester Baru
          </button>
        )}
      </div>

      {/* Sub Tabs: Jadwal, Tugas, Presensi, Catatan */}
      <div className="subtab-pills" style={{ marginTop: '14px', marginBottom: '14px' }}>
        <button
          className={`subtab-btn ${academicTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setAcademicTab('schedule')}
        >
          <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Jadwal
        </button>
        <button
          className={`subtab-btn ${academicTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setAcademicTab('assignments')}
        >
          <CheckSquare size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Tugas
        </button>
        <button
          className={`subtab-btn ${academicTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setAcademicTab('attendance')}
        >
          <BookOpen size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Presensi
        </button>
        <button
          className={`subtab-btn ${academicTab === 'notes' ? 'active' : ''}`}
          onClick={() => setAcademicTab('notes')}
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
            {days.map(d => (
              <button
                key={d}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: 'none',
                  background: selectedDay === d ? '#1665D8' : '#E2E8F0',
                  color: selectedDay === d ? '#FFFFFF' : '#475569',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                onClick={() => setSelectedDay(d)}
              >
                {d}
              </button>
            ))}
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
                                  status === 'sick' ? 'absent' : 'present';
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

                  {note.materialUrl && (
                    <a
                      href={note.materialUrl}
                      target="_blank"
                      rel="noreferrer"
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
                    {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(day => (
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
    </div>
  );
};
