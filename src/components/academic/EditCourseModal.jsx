import React, { useState, useEffect } from 'react';
import { X, Check, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const COLOR_OPTIONS = [
  '#1665D8', // Blue
  '#0D9488', // Teal
  '#7C3AED', // Purple
  '#DB2777', // Pink
  '#EA580C', // Orange
  '#16A34A', // Green
  '#4F46E5', // Indigo
  '#CA8A04'  // Yellow
];

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export default function EditCourseModal({ course, isOpen, onClose }) {
  const { updateCourse } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    sks: 3,
    lecturer: '',
    room: '',
    dayOfWeek: 'Senin',
    startTime: '08:00',
    endTime: '10:30',
    color: '#1665D8',
    semester: 1
  });

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name || '',
        code: course.code || '',
        sks: course.sks || 3,
        lecturer: course.lecturer || '',
        room: course.room || '',
        dayOfWeek: course.dayOfWeek || 'Senin',
        startTime: course.startTime || '08:00',
        endTime: course.endTime || '10:30',
        color: course.color || '#1665D8',
        semester: course.semester || 1
      });
    }
  }, [course]);

  if (!isOpen || !course) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    updateCourse(course.id, {
      name: formData.name.trim(),
      code: formData.code.trim() || 'MK',
      sks: Number(formData.sks) || 3,
      lecturer: formData.lecturer.trim() || 'Dosen Pengampu',
      room: formData.room.trim() || 'Ruang Kuliah',
      dayOfWeek: formData.dayOfWeek,
      startTime: formData.startTime,
      endTime: formData.endTime,
      color: formData.color,
      semester: Number(formData.semester)
    });

    onClose();
  };

  return (
    <div className="hub-modal-overlay" onClick={onClose}>
      <div className="hub-modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#EFF6FF', color: '#1665D8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>Edit Mata Kuliah</h3>
              <p style={{ fontSize: '11px', color: '#64748B' }}>Perbarui rincian jadwal & mata kuliah</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F1F5F9', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Nama Mata Kuliah *</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Pemrograman Web Lanjut"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Kode Matkul</label>
              <input
                type="text"
                className="input-field"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="IF3101"
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Bobot SKS</label>
              <select
                className="input-field"
                value={formData.sks}
                onChange={(e) => setFormData({ ...formData, sks: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 6].map(s => (
                  <option key={s} value={s}>{s} SKS</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Dosen Pengampu</label>
              <input
                type="text"
                className="input-field"
                value={formData.lecturer}
                onChange={(e) => setFormData({ ...formData, lecturer: e.target.value })}
                placeholder="Nama Dosen"
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Ruang Kuliah</label>
              <input
                type="text"
                className="input-field"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="R. 302"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Hari</label>
              <select
                className="input-field"
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
              >
                {DAYS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Mulai</label>
              <input
                type="time"
                className="input-field"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Selesai</label>
              <input
                type="time"
                className="input-field"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Warna Label</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: c,
                    border: formData.color === c ? '3px solid #0F172A' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}
                >
                  {formData.color === c && <Check size={14} />}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 2 }}
            >
              <Check size={16} /> Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
