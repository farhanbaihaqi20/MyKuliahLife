import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiahNumber, parseRupiahNumber } from '../../utils/formatters';
import { X, Check, DollarSign, BookOpen, CheckSquare, FileText } from 'lucide-react';
import confetti from 'canvas-confetti';

export const QuickAddModal = () => {
  const {
    isQuickAddOpen,
    setIsQuickAddOpen,
    quickAddType,
    setQuickAddType,
    data,
    activeSemester,
    addTransaction,
    addAssignment,
    addCourseNote,
    updateAttendance
  } = useApp();

  const currentSemester = Number(activeSemester || data.activeSemester || data.profile?.semester || 1);
  const activeSemesterCourses = (data.courses || []).filter(
    crs => Number(crs.semester || 1) === currentSemester
  );

  // Transaction form state
  const [txType, setTxType] = useState('expense'); // expense | income | transfer
  const [txAmount, setTxAmount] = useState('');
  const [txAccount, setTxAccount] = useState(data.accounts[0]?.name || '');
  const [txCategory, setTxCategory] = useState(data.budget?.categories?.[0]?.name || 'Makanan & minuman');
  const [txMerchant, setTxMerchant] = useState('');
  const [txNote, setTxNote] = useState('');
  const [txError, setTxError] = useState('');

  // Synchronize txAccount with available accounts dynamically
  React.useEffect(() => {
    if (data.accounts && data.accounts.length > 0) {
      const exists = data.accounts.some(a => a.name === txAccount);
      if (!exists || !txAccount) {
        setTxAccount(data.accounts[0].name);
      }
    }
  }, [data.accounts, isQuickAddOpen]);

  // Assignment form state
  const [asgCourseId, setAsgCourseId] = useState(activeSemesterCourses[0]?.id || '');
  const [asgTitle, setAsgTitle] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgDeadline, setAsgDeadline] = useState(new Date().toISOString().split('T')[0] + 'T23:59');
  const [asgPriority, setAsgPriority] = useState('medium');

  // Course Note form state
  const [noteCourseId, setNoteCourseId] = useState(activeSemesterCourses[0]?.id || '');
  const [noteWeek, setNoteWeek] = useState(1);
  const [noteTopic, setNoteTopic] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteUrl, setNoteUrl] = useState('');

  // Attendance form state
  const [attCourseId, setAttCourseId] = useState(activeSemesterCourses[0]?.id || '');
  const [attMeeting, setAttMeeting] = useState(1);
  const [attStatus, setAttStatus] = useState('present');

  // Synchronize academic form course IDs with active semester courses
  React.useEffect(() => {
    if (activeSemesterCourses.length > 0) {
      if (!activeSemesterCourses.some(c => c.id === asgCourseId)) {
        setAsgCourseId(activeSemesterCourses[0].id);
      }
      if (!activeSemesterCourses.some(c => c.id === noteCourseId)) {
        setNoteCourseId(activeSemesterCourses[0].id);
      }
      if (!activeSemesterCourses.some(c => c.id === attCourseId)) {
        setAttCourseId(activeSemesterCourses[0].id);
      }
    } else {
      setAsgCourseId('');
      setNoteCourseId('');
      setAttCourseId('');
    }
  }, [activeSemesterCourses, isQuickAddOpen, currentSemester]);

  if (!isQuickAddOpen) return null;

  const handleTransactionSubmit = (e) => {
    e.preventDefault();
    setTxError('');

    const rawAmount = parseRupiahNumber(txAmount);
    if (!rawAmount || rawAmount <= 0) {
      setTxError('Masukkan nominal transaksi yang valid.');
      return;
    }

    if (!data.accounts || data.accounts.length === 0) {
      setTxError('Kamu belum memiliki dompet/rekening aktif. Silakan tambahkan dompet di menu Keuangan.');
      return;
    }

    const currentAcc = data.accounts.find(a => a.name === txAccount) || data.accounts[0];
    if (!currentAcc) {
      setTxError('Pilih dompet sumber transaksi yang valid.');
      return;
    }

    // Cek kecukupan saldo untuk Pengeluaran & Transfer
    if ((txType === 'expense' || txType === 'transfer') && rawAmount > currentAcc.balance) {
      setTxError(`Saldo di ${currentAcc.name} tidak mencukupi! Saldo saat ini: Rp ${currentAcc.balance.toLocaleString('id-ID')}, sedangkan transaksi sebesar Rp ${rawAmount.toLocaleString('id-ID')}.`);
      return;
    }

    addTransaction({
      type: txType,
      amount: rawAmount,
      accountName: currentAcc.name,
      category: txType === 'income' ? 'Pemasukan' : txCategory,
      merchant: txMerchant || (txType === 'expense' ? 'Kantin / Toko' : 'Sumber Dana'),
      note: txNote,
      icon: txType === 'income' ? '💰' : (txType === 'transfer' ? '🔁' : '🍜')
    });

    confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    setIsQuickAddOpen(false);
    setTxAmount('');
    setTxMerchant('');
    setTxNote('');
    setTxError('');
  };

  const handleAssignmentSubmit = (e) => {
    e.preventDefault();
    if (!asgTitle.trim()) return;

    const course = activeSemesterCourses.find(c => c.id === asgCourseId) || activeSemesterCourses[0];
    if (!course) {
      alert(`Belum ada mata kuliah di Semester ${currentSemester}. Tambahkan mata kuliah terlebih dahulu di menu Jadwal Kuliah.`);
      return;
    }

    addAssignment({
      courseId: course.id,
      courseName: course.name,
      semester: currentSemester,
      title: asgTitle.trim(),
      description: asgDesc.trim(),
      deadline: asgDeadline,
      priority: asgPriority
    });

    confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
    setIsQuickAddOpen(false);
    setAsgTitle('');
    setAsgDesc('');
  };

  const handleNoteSubmit = (e) => {
    e.preventDefault();
    if (!noteTopic.trim()) return;

    const course = activeSemesterCourses.find(c => c.id === noteCourseId) || activeSemesterCourses[0];
    if (!course) {
      alert(`Belum ada mata kuliah di Semester ${currentSemester}. Tambahkan mata kuliah terlebih dahulu.`);
      return;
    }

    addCourseNote({
      courseId: course.id,
      courseName: course.name,
      semester: currentSemester,
      weekNumber: Number(noteWeek),
      topic: noteTopic.trim(),
      content: noteContent.trim(),
      materialUrl: noteUrl.trim()
    });

    setIsQuickAddOpen(false);
    setNoteTopic('');
    setNoteContent('');
  };

  const handleAttendanceSubmit = (e) => {
    e.preventDefault();
    if (!attCourseId) {
      alert(`Belum ada mata kuliah di Semester ${currentSemester}.`);
      return;
    }
    updateAttendance(attCourseId, Number(attMeeting), attStatus);
    setIsQuickAddOpen(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsQuickAddOpen(false)} style={{ zIndex: 1300 }}>
      <div className="modal-bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle-bar" />

        {/* Modal Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A' }}>
            Tambah Data Cepat
          </h3>
          <button
            onClick={() => setIsQuickAddOpen(false)}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="subtab-bar" style={{ marginBottom: '18px' }}>
          <button
            className={`subtab-btn ${quickAddType === 'transaction' ? 'active' : ''}`}
            onClick={() => setQuickAddType('transaction')}
          >
            <DollarSign size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Transaksi
          </button>
          <button
            className={`subtab-btn ${quickAddType === 'assignment' ? 'active' : ''}`}
            onClick={() => setQuickAddType('assignment')}
          >
            <CheckSquare size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Tugas
          </button>
          <button
            className={`subtab-btn ${quickAddType === 'attendance' ? 'active' : ''}`}
            onClick={() => setQuickAddType('attendance')}
          >
            <BookOpen size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Presensi
          </button>
          <button
            className={`subtab-btn ${quickAddType === 'note' ? 'active' : ''}`}
            onClick={() => setQuickAddType('note')}
          >
            <FileText size={14} style={{ display: 'inline', marginRight: '4px' }} />
            Catatan
          </button>
        </div>

        {/* 1. Form Transaksi */}
        {quickAddType === 'transaction' && (
          <form onSubmit={handleTransactionSubmit}>
            {/* Type selector (Pengeluaran, Pemasukan, Transfer) */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                className="pill-btn"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  background: txType === 'expense' ? '#EF4444' : '#F1F5F9',
                  color: txType === 'expense' ? '#FFFFFF' : '#475569',
                  borderColor: 'transparent'
                }}
                onClick={() => {
                  setTxType('expense');
                  if (!txCategory) {
                    setTxCategory(data.budget?.categories?.[0]?.name || 'Makanan & minuman');
                  }
                }}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                className="pill-btn"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  background: txType === 'income' ? '#10B981' : '#F1F5F9',
                  color: txType === 'income' ? '#FFFFFF' : '#475569',
                  borderColor: 'transparent'
                }}
                onClick={() => setTxType('income')}
              >
                Pemasukan
              </button>
              <button
                type="button"
                className="pill-btn"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  background: txType === 'transfer' ? '#1665D8' : '#F1F5F9',
                  color: txType === 'transfer' ? '#FFFFFF' : '#475569',
                  borderColor: 'transparent'
                }}
                onClick={() => setTxType('transfer')}
              >
                Transfer
              </button>
            </div>

            {/* Big Amount Input */}
            <div className="input-group">
              <label className="input-label">Nominal Transaksi (Rp)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, fontSize: '20px', color: '#64748B' }}>
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  className="input-field"
                  style={{ fontSize: '24px', fontWeight: '800', textAlign: 'center', paddingLeft: '45px' }}
                  value={txAmount}
                  onChange={(e) => setTxAmount(formatRupiahNumber(e.target.value))}
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Account Selector */}
            <div className="input-group">
              <label className="input-label">Pilih Dompet / Akun</label>
              <select
                className="input-field"
                value={txAccount}
                onChange={(e) => setTxAccount(e.target.value)}
              >
                {data.accounts.map(acc => (
                  <option key={acc.id} value={acc.name}>
                    {acc.name} (Sisa: Rp {acc.balance.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selector (for expense) */}
            {txType === 'expense' && (
              <div className="input-group">
                <label className="input-label">Kategori Pengeluaran</label>
                <select
                  className="input-field"
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                >
                  {data.budget.categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Merchant / Lokasi */}
            <div className="input-group">
              <label className="input-label">Tempat / Merchant (Opsional)</label>
              <input
                type="text"
                placeholder="cth: Kantin Rektorat, Bu Yayuk, Alfamart"
                className="input-field"
                value={txMerchant}
                onChange={(e) => setTxMerchant(e.target.value)}
              />
            </div>

            {/* Catatan */}
            <div className="input-group">
              <label className="input-label">Catatan / Keterangan</label>
              <input
                type="text"
                placeholder="cth: Makan siang komplit + es teh"
                className="input-field"
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
              />
            </div>

            {txError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #F87171',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#B91C1C',
                lineHeight: '1.4',
                marginTop: '8px',
                marginBottom: '8px',
                fontWeight: 600
              }}>
                ⚠️ {txError}
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
              <Check size={18} /> Simpan Transaksi
            </button>
          </form>
        )}

        {/* 2. Form Tugas Kuliah */}
        {quickAddType === 'assignment' && (
          <form onSubmit={handleAssignmentSubmit}>
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Mata Kuliah</label>
                <span style={{ fontSize: '11px', color: '#1665D8', fontWeight: 700, background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                  Semester {currentSemester} (Aktif)
                </span>
              </div>
              <select
                className="input-field"
                value={asgCourseId}
                onChange={(e) => setAsgCourseId(e.target.value)}
                disabled={activeSemesterCourses.length === 0}
                required
              >
                {activeSemesterCourses.length === 0 ? (
                  <option value="">Belum ada matkul di Semester {currentSemester}</option>
                ) : (
                  activeSemesterCourses.map(crs => (
                    <option key={crs.id} value={crs.id}>
                      {crs.name} ({crs.code || 'MK'})
                    </option>
                  ))
                )}
              </select>
              {activeSemesterCourses.length === 0 && (
                <span style={{ fontSize: '11px', color: '#EF4444', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                  ⚠️ Tambahkan matakuliah Semester {currentSemester} terlebih dahulu di menu Jadwal Kuliah.
                </span>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Judul Tugas / Proyek</label>
              <input
                type="text"
                placeholder="cth: Laporan Praktikum Modul 3"
                className="input-field"
                value={asgTitle}
                onChange={(e) => setAsgTitle(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Keterangan / Instruksi Dosen</label>
              <textarea
                placeholder="cth: Dikumpulkan via Google Classroom format PDF maks 5MB"
                className="input-field"
                style={{ height: '70px', resize: 'none' }}
                value={asgDesc}
                onChange={(e) => setAsgDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="input-group">
                <label className="input-label">Tenggat (Deadline)</label>
                <input
                  type="datetime-local"
                  className="input-field"
                  value={asgDeadline}
                  onChange={(e) => setAsgDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Prioritas</label>
                <select
                  className="input-field"
                  value={asgPriority}
                  onChange={(e) => setAsgPriority(e.target.value)}
                >
                  <option value="high">🔴 Tinggi (Mendesak)</option>
                  <option value="medium">🟡 Sedang</option>
                  <option value="low">🔵 Santai</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
              <Check size={18} /> Simpan Pengingat Tugas
            </button>
          </form>
        )}

        {/* 3. Form Presensi Kuliah */}
        {quickAddType === 'attendance' && (
          <form onSubmit={handleAttendanceSubmit}>
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Pilih Mata Kuliah</label>
                <span style={{ fontSize: '11px', color: '#1665D8', fontWeight: 700, background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                  Semester {currentSemester} (Aktif)
                </span>
              </div>
              <select
                className="input-field"
                value={attCourseId}
                onChange={(e) => setAttCourseId(e.target.value)}
                disabled={activeSemesterCourses.length === 0}
                required
              >
                {activeSemesterCourses.length === 0 ? (
                  <option value="">Belum ada matkul di Semester {currentSemester}</option>
                ) : (
                  activeSemesterCourses.map(crs => (
                    <option key={crs.id} value={crs.id}>
                      {crs.name} ({crs.code || 'MK'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Pertemuan Ke-</label>
              <input
                type="number"
                min="1"
                max="16"
                className="input-field"
                value={attMeeting}
                onChange={(e) => setAttMeeting(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Status Kehadiran</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[
                  { key: 'present', label: 'Hadir', color: '#10B981' },
                  { key: 'permission', label: 'Izin', color: '#3B82F6' },
                  { key: 'sick', label: 'Sakit', color: '#F59E0B' },
                  { key: 'absent', label: 'Alpa', color: '#EF4444' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    style={{
                      padding: '10px 4px',
                      borderRadius: '12px',
                      border: '1px solid #CBD5E1',
                      background: attStatus === item.key ? item.color : '#F8FAFC',
                      color: attStatus === item.key ? '#FFFFFF' : '#475569',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => setAttStatus(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '14px' }}>
              <Check size={18} /> Update Presensi
            </button>
          </form>
        )}

        {/* 4. Form Catatan Kuliah */}
        {quickAddType === 'note' && (
          <form onSubmit={handleNoteSubmit}>
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="input-label" style={{ marginBottom: 0 }}>Mata Kuliah</label>
                <span style={{ fontSize: '11px', color: '#1665D8', fontWeight: 700, background: '#EFF6FF', padding: '2px 8px', borderRadius: '6px' }}>
                  Semester {currentSemester} (Aktif)
                </span>
              </div>
              <select
                className="input-field"
                value={noteCourseId}
                onChange={(e) => setNoteCourseId(e.target.value)}
                disabled={activeSemesterCourses.length === 0}
                required
              >
                {activeSemesterCourses.length === 0 ? (
                  <option value="">Belum ada matkul di Semester {currentSemester}</option>
                ) : (
                  activeSemesterCourses.map(crs => (
                    <option key={crs.id} value={crs.id}>
                      {crs.name} ({crs.code || 'MK'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '10px' }}>
              <div className="input-group">
                <label className="input-label">Minggu ke</label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  className="input-field"
                  value={noteWeek}
                  onChange={(e) => setNoteWeek(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Topik Pembahasan</label>
                <input
                  type="text"
                  placeholder="cth: Relational Normalization"
                  className="input-field"
                  value={noteTopic}
                  onChange={(e) => setNoteTopic(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Ringkasan Materi Kuliah</label>
              <textarea
                placeholder="Catat poin-poin penting penjelasan dosen di sini..."
                className="input-field"
                style={{ height: '90px', resize: 'none' }}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Link File / Drive Materi (Opsional)</label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                className="input-field"
                value={noteUrl}
                onChange={(e) => setNoteUrl(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '12px' }}>
              <Check size={18} /> Simpan Catatan
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
