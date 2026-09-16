import React, { useState } from 'react';
import {
  X,
  Edit2,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertTriangle,
  FileText,
  CheckSquare,
  Award,
  Plus,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';

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

export default function CourseDetailModal({
  course,
  isOpen,
  onClose,
  onEditCourse
}) {
  const {
    data,
    updateAttendance,
    setCourseGrade,
    addAssignment,
    toggleAssignmentStatus,
    deleteAssignment,
    addCourseNote,
    deleteCourseNote,
    deleteCourse
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('attendance'); // attendance | tasks | notes | grade
  const [selectedGrade, setSelectedGrade] = useState(() => {
    if (course?.grade?.letter) return course.grade.letter;
    const sem = data.semesters?.find(s => s.semesterNumber === course?.semester);
    const semCourse = sem?.courses?.find(c => c.courseId === course?.id || c.name === course?.name);
    return semCourse?.letter || 'A';
  });

  // Inline Quick Add Task
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    deadline: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
    priority: 'medium',
    description: ''
  });

  // Inline Quick Add Note
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteForm, setNoteForm] = useState({
    topic: '',
    driveUrl: '',
    tags: '#CatatanKuliah',
    summary: ''
  });

  if (!isOpen || !course) return null;

  // Real-time course data lookup from context
  const currentCourse = data.courses?.find(c => c.id === course.id) || course;
  const courseAssignments = (data.assignments || []).filter(a => a.courseId === currentCourse.id);
  const courseNotes = (data.courseNotes || []).filter(n => n.courseId === currentCourse.id);

  // Find recorded semester grade if any
  const semRecord = data.semesters?.find(s => s.semesterNumber === currentCourse.semester);
  const existingGradeRecord = semRecord?.courses?.find(
    c => c.courseId === currentCourse.id || c.name === currentCourse.name
  );

  // Attendance Statistics
  const totalMeetings = 16;
  const recordedAttendance = (currentCourse.attendance || []).filter(a => a.status && a.status !== 'unrecorded');
  const presentCount = recordedAttendance.filter(a => a.status === 'present').length;
  const permCount = recordedAttendance.filter(a => a.status === 'permission').length;
  const sickCount = recordedAttendance.filter(a => a.status === 'sick').length;
  const absentCount = recordedAttendance.filter(a => a.status === 'absent').length;
  const meetingsHeld = recordedAttendance.length;

  const attendanceRate = meetingsHeld > 0
    ? Math.round(((presentCount + permCount) / meetingsHeld) * 100)
    : 100;
  const isNearDanger = absentCount >= 3 || (meetingsHeld >= 4 && attendanceRate < 80);
  const isDisqualified = absentCount >= 4 || (meetingsHeld >= 6 && attendanceRate < 75);

  const handleSaveGrade = () => {
    const opt = GRADE_OPTIONS.find(g => g.letter === selectedGrade) || GRADE_OPTIONS[0];
    setCourseGrade(currentCourse.id, opt.letter, opt.point);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    addAssignment({
      courseId: currentCourse.id,
      courseName: currentCourse.name,
      title: taskForm.title.trim(),
      deadline: taskForm.deadline,
      priority: taskForm.priority,
      description: taskForm.description.trim(),
      semester: currentCourse.semester
    });

    setTaskForm({
      title: '',
      deadline: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
      priority: 'medium',
      description: ''
    });
    setIsAddingTask(false);
  };

  const handleCreateNote = (e) => {
    e.preventDefault();
    if (!noteForm.topic.trim()) return;

    addCourseNote({
      courseId: currentCourse.id,
      courseName: currentCourse.name,
      topic: noteForm.topic.trim(),
      driveUrl: noteForm.driveUrl.trim(),
      tags: noteForm.tags.trim() ? noteForm.tags.split(' ').filter(Boolean) : ['#Materi'],
      summary: noteForm.summary.trim(),
      semester: currentCourse.semester
    });

    setNoteForm({
      topic: '',
      driveUrl: '',
      tags: '#CatatanKuliah',
      summary: ''
    });
    setIsAddingNote(false);
  };

  const handleDeleteThisCourse = () => {
    if (window.confirm(`Hapus mata kuliah "${currentCourse.name}" beserta jadwal, tugas, dan presensinya?`)) {
      deleteCourse(currentCourse.id);
      onClose();
    }
  };

  return (
    <div className="hub-modal-overlay" onClick={onClose}>
      <div className="hub-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Hub Header with dynamic theme color */}
        <div
          className="hub-header"
          style={{
            background: `linear-gradient(135deg, ${currentCourse.color || '#1665D8'} 0%, #0F172A 100%)`
          }}
        >
          <div className="hub-header-top">
            <div className="hub-badge-group">
              <span>{currentCourse.code || 'MK'}</span>
              <span>•</span>
              <span>{currentCourse.sks} SKS</span>
              <span>•</span>
              <span>Semester {currentCourse.semester}</span>
            </div>

            <div className="hub-actions-top">
              <button
                type="button"
                className="hub-icon-btn"
                onClick={() => {
                  onClose();
                  onEditCourse(currentCourse);
                }}
                title="Edit Data Matkul"
              >
                <Edit2 size={13} /> Edit
              </button>
              <button
                type="button"
                className="hub-icon-btn danger"
                onClick={handleDeleteThisCourse}
                title="Hapus Matkul"
              >
                <Trash2 size={13} />
              </button>
              <button
                type="button"
                className="hub-icon-btn"
                onClick={onClose}
                title="Tutup"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <h2 className="hub-title">{currentCourse.name}</h2>

          <div className="hub-meta-row">
            <div className="hub-meta-item">
              <Calendar size={13} style={{ opacity: 0.8 }} />
              <span>{currentCourse.dayOfWeek}, {currentCourse.startTime} - {currentCourse.endTime}</span>
            </div>
            <div className="hub-meta-item">
              <MapPin size={13} style={{ opacity: 0.8 }} />
              <span>{currentCourse.room || 'Ruang Kuliah'}</span>
            </div>
            <div className="hub-meta-item">
              <User size={13} style={{ opacity: 0.8 }} />
              <span>{currentCourse.lecturer || 'Dosen Pengampu'}</span>
            </div>
          </div>
        </div>

        {/* Hub Navigation Tabs */}
        <div className="hub-subtabs-row">
          <button
            type="button"
            className={`hub-subtab-pill ${activeSubTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('attendance')}
          >
            <Calendar size={14} /> Presensi (16)
          </button>
          <button
            type="button"
            className={`hub-subtab-pill ${activeSubTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('tasks')}
          >
            <CheckSquare size={14} /> Tugas ({courseAssignments.length})
          </button>
          <button
            type="button"
            className={`hub-subtab-pill ${activeSubTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('notes')}
          >
            <FileText size={14} /> Catatan ({courseNotes.length})
          </button>
          <button
            type="button"
            className={`hub-subtab-pill ${activeSubTab === 'grade' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('grade')}
          >
            <Award size={14} /> Nilai Akhir & IPS
          </button>
        </div>

        {/* Hub Body with Scroll */}
        <div className="hub-body">
          {/* TAB 1: PRESENSI */}
          {activeSubTab === 'attendance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Stat card */}
              <div className="att-stat-card">
                <div className="att-stat-top">
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                      Tingkat Kehadiran
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '2px' }}>
                      <span
                        className="att-rate-big"
                        style={{
                          color: isDisqualified ? '#EF4444' : (isNearDanger ? '#F59E0B' : '#10B981')
                        }}
                      >
                        {attendanceRate}%
                      </span>
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                        ({meetingsHeld}/16 pertemuan berjalan)
                      </span>
                    </div>
                  </div>

                  <div>
                    {isDisqualified ? (
                      <span className="att-status-badge danger">
                        <AlertTriangle size={12} /> Terancam Tidak UAS
                      </span>
                    ) : isNearDanger ? (
                      <span className="att-status-badge warning">
                        <AlertTriangle size={12} /> Waspada Kehadiran
                      </span>
                    ) : (
                      <span className="att-status-badge safe">
                        <CheckCircle2 size={12} /> Syarat UAS Terpenuhi
                      </span>
                    )}
                  </div>
                </div>

                <div className="att-counters-grid">
                  <div className="att-counter-item">
                    <div className="att-counter-num" style={{ color: '#10B981' }}>{presentCount}</div>
                    <div className="att-counter-lbl">Hadir</div>
                  </div>
                  <div className="att-counter-item">
                    <div className="att-counter-num" style={{ color: '#3B82F6' }}>{permCount}</div>
                    <div className="att-counter-lbl">Izin</div>
                  </div>
                  <div className="att-counter-item">
                    <div className="att-counter-num" style={{ color: '#F59E0B' }}>{sickCount}</div>
                    <div className="att-counter-lbl">Sakit</div>
                  </div>
                  <div className="att-counter-item">
                    <div className="att-counter-num" style={{ color: '#EF4444' }}>{absentCount}</div>
                    <div className="att-counter-lbl">Alpa</div>
                  </div>
                </div>
              </div>

              {/* 16 Pertemuan Grid */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>
                    Daftar 16 Pertemuan Kuliah:
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    Ketuk untuk ganti status
                  </span>
                </div>

                <div className="meetings-grid-16">
                  {Array.from({ length: totalMeetings }, (_, i) => i + 1).map((num) => {
                    const record = recordedAttendance.find(a => a.meeting === num);
                    const status = record?.status || 'unrecorded';

                    let statusLabel = 'Belum';
                    if (status === 'present') statusLabel = 'Hadir';
                    else if (status === 'permission') statusLabel = 'Izin';
                    else if (status === 'sick') statusLabel = 'Sakit';
                    else if (status === 'absent') statusLabel = 'Alpa';

                    return (
                      <button
                        key={num}
                        type="button"
                        className={`meeting-tile ${status}`}
                        onClick={() => {
                          const next =
                            status === 'unrecorded' ? 'present' :
                            status === 'present' ? 'permission' :
                            status === 'permission' ? 'sick' :
                            status === 'sick' ? 'absent' : 'unrecorded';
                          updateAttendance(currentCourse.id, num, next);
                        }}
                      >
                        <span className="meeting-tile-num">P-{num}</span>
                        <span className="meeting-tile-status">{statusLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tips Banner */}
              <div
                style={{
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  fontSize: '11px',
                  color: '#1E40AF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  lineHeight: '1.4'
                }}
              >
                <AlertTriangle size={15} style={{ flexShrink: 0, color: '#2563EB' }} />
                <span>
                  Ketuk angka pertemuan untuk rotasi: <strong>Belum → Hadir → Izin → Sakit → Alpa → Reset</strong>. Kehadiran minimal 75% wajib untuk UAS.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: TUGAS KULIAH */}
          {activeSubTab === 'tasks' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                  {courseAssignments.filter(a => a.status === 'completed').length} dari {courseAssignments.length} tugas selesai
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingTask(!isAddingTask)}
                  style={{
                    background: '#1665D8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={13} /> {isAddingTask ? 'Tutup Form' : 'Tambah Tugas'}
                </button>
              </div>

              {/* Inline Add Task Form */}
              {isAddingTask && (
                <form
                  onSubmit={handleCreateTask}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '16px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
                    Tambah Tugas Baru
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Judul Tugas (misal: Laporan Praktikum)"
                    className="input-field"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label className="input-label">Deadline</label>
                      <input
                        type="datetime-local"
                        required
                        className="input-field"
                        value={taskForm.deadline}
                        onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="input-label">Prioritas</label>
                      <select
                        className="input-field"
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      >
                        <option value="high">🔥 Tinggi</option>
                        <option value="medium">⚡ Sedang</option>
                        <option value="low">🌱 Santai</option>
                      </select>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Catatan pengerjaan (opsional)"
                    className="input-field"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="btn-secondary"
                      style={{ width: 'auto', padding: '6px 14px', fontSize: '12px' }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ width: 'auto', padding: '6px 16px', fontSize: '12px' }}
                    >
                      Simpan Tugas
                    </button>
                  </div>
                </form>
              )}

              {/* Task Items */}
              {courseAssignments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: '#64748B', fontSize: '12px', border: '1px dashed #CBD5E1', borderRadius: '16px' }}>
                  Belum ada tugas untuk mata kuliah ini. Santai dulu! ☕
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {courseAssignments.map(asg => {
                    const isCompleted = asg.status === 'completed';
                    const deadlineDate = new Date(asg.deadline);
                    const formatted = deadlineDate.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={asg.id}
                        className="card-standard"
                        style={{
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                          background: isCompleted ? '#F8FAFC' : '#FFFFFF',
                          opacity: isCompleted ? 0.7 : 1
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleAssignmentStatus(asg.id)}
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '7px',
                            border: isCompleted ? 'none' : '2px solid #CBD5E1',
                            background: isCompleted ? '#10B981' : '#FFFFFF',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 800,
                            flexShrink: 0,
                            marginTop: '2px'
                          }}
                        >
                          {isCompleted && '✓'}
                        </button>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#0F172A',
                                textDecoration: isCompleted ? 'line-through' : 'none'
                              }}
                            >
                              {asg.title}
                            </span>
                            <span className={`priority-tag ${asg.priority}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                              {asg.priority === 'high' ? 'Tinggi' : (asg.priority === 'medium' ? 'Sedang' : 'Santai')}
                            </span>
                          </div>

                          {asg.description && (
                            <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                              {asg.description}
                            </p>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '6px', borderTop: '1px solid #F1F5F9', fontSize: '11px' }}>
                            <span style={{ color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {formatted}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus tugas "${asg.title}"?`)) {
                                  deleteAssignment(asg.id);
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                              title="Hapus Tugas"
                            >
                              <Trash2 size={13} />
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

          {/* TAB 3: CATATAN MATERI */}
          {activeSubTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                  {courseNotes.length} Catatan Tersimpan
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  style={{
                    background: '#1665D8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={13} /> {isAddingNote ? 'Tutup Form' : 'Tambah Catatan'}
                </button>
              </div>

              {/* Inline Add Note Form */}
              {isAddingNote && (
                <form
                  onSubmit={handleCreateNote}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: '16px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
                    Tambah Catatan Materi
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Topik / Judul Materi (misal: Rangkuman UTS)"
                    className="input-field"
                    value={noteForm.topic}
                    onChange={(e) => setNoteForm({ ...noteForm, topic: e.target.value })}
                  />
                  <input
                    type="url"
                    placeholder="Tautan Google Drive / Dokumen (opsional)"
                    className="input-field"
                    value={noteForm.driveUrl}
                    onChange={(e) => setNoteForm({ ...noteForm, driveUrl: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Tag materi (misal: #UTS #Pertemuan3)"
                    className="input-field"
                    value={noteForm.tags}
                    onChange={(e) => setNoteForm({ ...noteForm, tags: e.target.value })}
                  />
                  <textarea
                    rows={2}
                    placeholder="Rangkuman poin penting materi..."
                    className="input-field"
                    value={noteForm.summary}
                    onChange={(e) => setNoteForm({ ...noteForm, summary: e.target.value })}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="btn-secondary"
                      style={{ width: 'auto', padding: '6px 14px', fontSize: '12px' }}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ width: 'auto', padding: '6px 16px', fontSize: '12px' }}
                    >
                      Simpan Catatan
                    </button>
                  </div>
                </form>
              )}

              {/* Notes List */}
              {courseNotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 16px', color: '#64748B', fontSize: '12px', border: '1px dashed #CBD5E1', borderRadius: '16px' }}>
                  Belum ada rangkuman atau catatan untuk mata kuliah ini.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {courseNotes.map(n => (
                    <div key={n.id} className="card-standard" style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                          {n.topic}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Hapus catatan "${n.topic}"?`)) {
                              deleteCourseNote(n.id);
                            }
                          }}
                          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
                          title="Hapus Catatan"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {n.summary && (
                        <p style={{ fontSize: '12px', color: '#475569', marginTop: '6px', background: '#F8FAFC', padding: '8px 10px', borderRadius: '8px', lineHeight: '1.4' }}>
                          {n.summary}
                        </p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '6px', borderTop: '1px solid #F1F5F9', fontSize: '11px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {Array.isArray(n.tags) ? n.tags.map((t, idx) => (
                            <span key={idx} style={{ background: '#EFF6FF', color: '#1665D8', padding: '2px 7px', borderRadius: '6px', fontWeight: 700 }}>
                              {t}
                            </span>
                          )) : (
                            <span style={{ background: '#EFF6FF', color: '#1665D8', padding: '2px 7px', borderRadius: '6px', fontWeight: 700 }}>
                              #Materi
                            </span>
                          )}
                        </div>

                        {n.driveUrl && (
                          <a
                            href={n.driveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#1665D8', fontWeight: 700, textDecoration: 'none' }}
                          >
                            <ExternalLink size={12} /> Buka Drive
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: NILAI AKHIR & IPS */}
          {activeSubTab === 'grade' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                  border: '1px solid #BFDBFE',
                  borderRadius: '16px',
                  padding: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E40AF', fontWeight: 800, fontSize: '13px' }}>
                  <Award size={16} /> Integrasi Rekap Nilai Akademik
                </div>
                <p style={{ fontSize: '12px', color: '#1E3A8A', marginTop: '4px', lineHeight: '1.45' }}>
                  Nilai yang kamu pilih di sini akan otomatis disinkronkan ke rekapitulasi nilai <strong>Semester {currentCourse.semester}</strong> dan langsung mengkalkulasi <strong>IPS & IPK Kumulatif</strong> kamu secara *real-time*!
                </p>
              </div>

              {/* Status Card */}
              <div className="card-standard" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Nilai Tercatat Saat Ini
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px' }}>
                    Bobot: <strong>{currentCourse.sks} SKS</strong> • Semester: <strong>{currentCourse.semester}</strong>
                  </div>
                </div>

                <div>
                  {existingGradeRecord ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 900, color: '#1665D8' }}>
                        {existingGradeRecord.letter}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                        ({existingGradeRecord.point.toFixed(2)})
                      </span>
                    </div>
                  ) : (
                    <span style={{ background: '#FEF3C7', color: '#B45309', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}>
                      Belum Dinilai
                    </span>
                  )}
                </div>
              </div>

              {/* Grade Selector Grid */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
                  Pilih Nilai Akhir:
                </label>
                <div className="grade-selector-grid">
                  {GRADE_OPTIONS.map(opt => {
                    const isSelected = selectedGrade === opt.letter;
                    return (
                      <button
                        key={opt.letter}
                        type="button"
                        className={`grade-choice-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedGrade(opt.letter)}
                      >
                        <div className="grade-choice-letter">{opt.letter}</div>
                        <div className="grade-choice-point">Bobot: {opt.point.toFixed(2)}</div>
                        <div className="grade-choice-desc">{opt.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveGrade}
                className="btn-primary"
                style={{ marginTop: '6px' }}
              >
                <CheckCircle2 size={16} /> Simpan Nilai & Sinkronkan ke IPS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
