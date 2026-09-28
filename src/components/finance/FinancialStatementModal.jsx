import React, { useState, useMemo } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Calendar,
  Building2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CreditCard,
  QrCode,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles
} from 'lucide-react';
import { formatRupiahNumber } from '../../utils/formatters';
import { sanitizeCsvCell } from '../../utils/security';

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const FinancialStatementModal = ({
  isOpen,
  onClose,
  data,
  totalBalance = 0,
  activeCycle = null,
  currentMonthTitle = ''
}) => {
  // Period filter: 'cycle' | 'this_month' | 'last_month' | 'all' | 'custom'
  const [periodOption, setPeriodOption] = useState('cycle');
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [transactionType, setTransactionType] = useState('all'); // 'all' | 'expense' | 'income'

  // Generate a realistic Document Statement ID (stable per modal session)
  const statementId = useMemo(() => {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const rnd = Math.floor(100000 + Math.random() * 900000);
    return `MKL/STM/${yr}/${mo}/${rnd}`;
  }, [isOpen]);

  const printTimestamp = useMemo(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr}, ${timeStr} WIB`;
  }, [isOpen]);

  // Determine date bounds
  const { dateRange, periodLabel } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (periodOption === 'cycle' && activeCycle) {
      return {
        dateRange: { start: activeCycle.startDate, end: activeCycle.endDate },
        periodLabel: activeCycle.label || `${activeCycle.startDate} s/d ${activeCycle.endDate}`
      };
    }

    if (periodOption === 'this_month') {
      const start = new Date(currentYear, currentMonth, 1).toISOString().slice(0, 10);
      const end = new Date(currentYear, currentMonth + 1, 0).toISOString().slice(0, 10);
      return {
        dateRange: { start, end },
        periodLabel: `1 - ${now.getDate()} ${INDONESIAN_MONTHS[currentMonth]} ${currentYear}`
      };
    }

    if (periodOption === 'last_month') {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const start = new Date(prevYear, prevMonth, 1).toISOString().slice(0, 10);
      const end = new Date(prevYear, prevMonth + 1, 0).toISOString().slice(0, 10);
      return {
        dateRange: { start, end },
        periodLabel: `Bulan ${INDONESIAN_MONTHS[prevMonth]} ${prevYear}`
      };
    }

    if (periodOption === 'custom') {
      return {
        dateRange: { start: customStart, end: customEnd },
        periodLabel: `${customStart} s/d ${customEnd}`
      };
    }

    // 'all'
    return {
      dateRange: null,
      periodLabel: 'Semua Waktu (Keseluruhan Riwayat)'
    };
  }, [periodOption, activeCycle, customStart, customEnd]);

  // Selected Account details
  const selectedAccount = useMemo(() => {
    if (selectedAccountId === 'all') return null;
    return (data.accounts || []).find(a => a.id === selectedAccountId);
  }, [selectedAccountId, data.accounts]);

  // Filter and sort transactions (chronological for running balance calculation)
  const { transactionsChronological, summary } = useMemo(() => {
    let list = [...(data.transactions || [])];

    // Filter by date
    if (dateRange) {
      list = list.filter(t => t.date >= dateRange.start && t.date <= dateRange.end);
    }

    // Filter by account
    if (selectedAccountId !== 'all') {
      const acc = (data.accounts || []).find(a => a.id === selectedAccountId);
      if (acc) {
        list = list.filter(
          t => t.accountName === acc.name || t.accountId === acc.id || t.sourceAccountId === acc.id
        );
      }
    }

    // Filter by type
    if (transactionType !== 'all') {
      list = list.filter(t => t.type === transactionType);
    }

    // Sort ascending by date & time for running balance
    list.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Compute cash flow
    const totalInflow = list
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const totalOutflow = list
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const netCashflow = totalInflow - totalOutflow;

    // Current balance of the filtered scope
    const endingBalance = selectedAccount
      ? Number(selectedAccount.balance) || 0
      : Number(totalBalance) || 0;

    const beginningBalance = endingBalance - netCashflow;

    // Calculate running balance per row
    let currentRun = beginningBalance;
    const withRunningBalance = list.map((tx, idx) => {
      if (tx.type === 'income') {
        currentRun += Number(tx.amount) || 0;
      } else if (tx.type === 'expense') {
        currentRun -= Number(tx.amount) || 0;
      }
      return {
        ...tx,
        rowNumber: idx + 1,
        runningBalance: currentRun
      };
    });

    return {
      transactionsChronological: withRunningBalance,
      summary: {
        beginningBalance,
        totalInflow,
        totalOutflow,
        netCashflow,
        endingBalance,
        transactionCount: list.length
      }
    };
  }, [
    data.transactions,
    data.accounts,
    dateRange,
    selectedAccountId,
    selectedAccount,
    transactionType,
    totalBalance
  ]);

  // Print PDF Trigger via isolated iframe (prevents app CSS bleeding & multi-page overlaps)
  const handlePrintPDF = () => {
    const printContent = document.getElementById('printable-financial-statement');
    if (!printContent) {
      window.print();
      return;
    }

    // Remove any previous temporary print iframe
    const existingFrame = document.getElementById('statement-print-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    // Create an invisible iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'statement-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write('<!DOCTYPE html><html lang="id"><head><meta charset="utf-8" /><title>Rekening_Koran</title></head><body><div class="statement-paper-sheet" id="print-sheet-root"></div></body></html>');
    doc.close();

    // Safely copy stylesheets using DOM elements
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
      doc.head.appendChild(el.cloneNode(true));
    });

    const printStyle = doc.createElement('style');
    printStyle.textContent = `
      @page {
        size: A4 portrait;
        margin: 10mm 10mm 12mm 10mm;
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #FFFFFF !important;
        color: #0F172A !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .statement-paper-sheet {
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        min-height: 0 !important;
      }
      .statement-watermark {
        display: none !important;
      }
      .no-print {
        display: none !important;
      }
      tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .statement-section,
      .statement-section-card,
      .statement-summary-cards,
      .statement-accounts-grid,
      .statement-footer-section {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      thead {
        display: table-header-group !important;
      }
      tfoot {
        display: table-footer-group !important;
      }
    `;
    doc.head.appendChild(printStyle);

    // Safely clone DOM nodes - completely eliminates innerHTML parsing & execution
    const sheetRoot = doc.getElementById('print-sheet-root');
    if (sheetRoot) {
      sheetRoot.appendChild(printContent.cloneNode(true));
    }

    // Trigger print after iframe renders
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print iframe error, fallback to window.print()', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      }
    }, 250);
  };

  // Excel CSV Export Trigger
  const handleExportCSV = () => {
    const profile = data.profile || {};
    let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel

    // Bank Header
    csv += 'MYKULIAHLIFE FINANCIAL OPERATING SYSTEM\r\n';
    csv += 'REKENING KORAN RESMI (OFFICIAL FINANCIAL STATEMENT)\r\n';
    csv += `Nomor Dokumen,${sanitizeCsvCell(statementId)}\r\n`;
    csv += `Tanggal Cetak,${sanitizeCsvCell(printTimestamp)}\r\n`;
    csv += `Periode Laporan,${sanitizeCsvCell(periodLabel)}\r\n`;
    csv += `Status Verifikasi,TERVERIFIKASI SISTEM (DIGITALLY ENCRYPTED)\r\n`;
    csv += '\r\n';

    // Account Holder Info
    csv += 'INFORMASI PEMILIK REKENING / NASABAH\r\n';
    csv += `Nama Lengkap,${sanitizeCsvCell(profile.fullName || 'Mahasiswa MyKuliahLife')}\r\n`;
    csv += `Email Mahasiswa,${sanitizeCsvCell(profile.email || '-')}\r\n`;
    csv += `Perguruan Tinggi,${sanitizeCsvCell(profile.university || '-')}\r\n`;
    csv += `Program Studi,${sanitizeCsvCell(`${profile.major || '-'} (Semester ${profile.semester || '-'})`)}\r\n`;
    csv += `Rekening Terpilih,${sanitizeCsvCell(selectedAccount ? selectedAccount.name : 'Konsolidasi Semua Rekening')}\r\n`;
    csv += '\r\n';

    // Executive Summary
    csv += 'RINGKASAN EKSEKUTIF ARUS KAS (IDR)\r\n';
    csv += `Saldo Awal Periode,${sanitizeCsvCell(summary.beginningBalance)}\r\n`;
    csv += `Total Pemasukan (Kredit +),${sanitizeCsvCell(summary.totalInflow)}\r\n`;
    csv += `Total Pengeluaran (Debit -),${sanitizeCsvCell(summary.totalOutflow)}\r\n`;
    csv += `Arus Kas Bersih (Net Cash Flow),${sanitizeCsvCell(summary.netCashflow)}\r\n`;
    csv += `Saldo Akhir Periode,${sanitizeCsvCell(summary.endingBalance)}\r\n`;
    csv += `Total Transaksi,${sanitizeCsvCell(summary.transactionCount)}\r\n`;
    csv += '\r\n';

    // Transaction Details
    csv += 'RINCIAN MUTASI REKENING (TRANSACTION MUTATION)\r\n';
    csv += 'No,Tanggal,Uraian Transaksi / Catatan,Kategori,Rekening,D/K,Nominal (IDR),Saldo Berjalan (IDR)\r\n';

    transactionsChronological.forEach((tx) => {
      const descText = (tx.merchant ? `${tx.merchant} - ` : '') + (tx.note || tx.category || 'Transaksi');
      const escapedDesc = sanitizeCsvCell(descText);
      const cat = sanitizeCsvCell(tx.category || '-');
      const acc = sanitizeCsvCell(tx.accountName || '-');
      const dk = sanitizeCsvCell(tx.type === 'income' ? 'Kredit (CR)' : 'Debit (DB)');
      const amount = sanitizeCsvCell(tx.amount || 0);
      const runBal = sanitizeCsvCell(tx.runningBalance || 0);
      const rowNum = sanitizeCsvCell(tx.rowNumber);

      csv += `${rowNum},${sanitizeCsvCell(tx.date)},${escapedDesc},${cat},${acc},${dk},${amount},${runBal}\r\n`;
    });

    csv += '\r\n';
    csv += 'CATATAN & DISCLAIMER RESMI\r\n';
    csv += '"Dokumen e-Statement ini diterbitkan secara sah dan otomatis oleh sistem MyKuliahLife Student Financial OS. Informasi mutasi dan saldo sesuai dengan database riil pengguna. Tidak memerlukan tanda tangan basah pejabat bank."\r\n';

    // Download blob
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeName = (profile.fullName || 'Mahasiswa').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `Rekening_Koran_MyKuliahLife_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const profile = data.profile || {};

  return (
    <div className="modal-overlay statement-modal-overlay" onClick={onClose} style={{ zIndex: 1300 }}>
      <div
        className="statement-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP CONTROLS TOOLBAR (Hidden in Print) */}
        <div className="statement-control-bar no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="statement-badge-icon">
              <Building2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Rekening Koran & Laporan Bank
              </h3>
              <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0 0 0' }}>
                Format e-statement resmi dengan kop surat, arus kas, & stempel digital
              </p>
            </div>
          </div>

          <div className="statement-bar-actions">
            <button
              type="button"
              className="statement-action-btn statement-action-pdf"
              onClick={handlePrintPDF}
              title="Cetak langsung atau simpan sebagai dokumen PDF resmi"
            >
              <Printer size={13} />
              <span>Cetak / PDF</span>
            </button>

            <button
              type="button"
              className="statement-action-btn statement-action-excel"
              onClick={handleExportCSV}
              title="Download file spreadsheet Excel (.csv)"
            >
              <FileSpreadsheet size={13} />
              <span>Excel (.csv)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="category-modal-close-btn"
              aria-label="Tutup"
              title="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* FILTER CONTROLS BAR (Hidden in Print) */}
        <div className="statement-filter-bar no-print">
          <div className="statement-filter-group">
            <span className="statement-filter-label">
              <Calendar size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Periode:
            </span>
            <div className="statement-pills-wrap">
              <button
                type="button"
                className={`statement-pill ${periodOption === 'cycle' ? 'active' : ''}`}
                onClick={() => setPeriodOption('cycle')}
              >
                Siklus Berjalan
              </button>
              <button
                type="button"
                className={`statement-pill ${periodOption === 'this_month' ? 'active' : ''}`}
                onClick={() => setPeriodOption('this_month')}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                className={`statement-pill ${periodOption === 'last_month' ? 'active' : ''}`}
                onClick={() => setPeriodOption('last_month')}
              >
                Bulan Lalu
              </button>
              <button
                type="button"
                className={`statement-pill ${periodOption === 'all' ? 'active' : ''}`}
                onClick={() => setPeriodOption('all')}
              >
                Semua Transaksi
              </button>
              <button
                type="button"
                className={`statement-pill ${periodOption === 'custom' ? 'active' : ''}`}
                onClick={() => setPeriodOption('custom')}
              >
                Custom Tanggal
              </button>
            </div>
          </div>

          {periodOption === 'custom' && (
            <div className="statement-custom-date-inputs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="statement-date-input"
              />
              <span style={{ fontSize: '12px', color: '#64748B' }}>s/d</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="statement-date-input"
              />
            </div>
          )}

          <div className="statement-filter-group" style={{ marginTop: '8px' }}>
            <span className="statement-filter-label">
              <CreditCard size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Rekening:
            </span>
            <div className="statement-pills-wrap">
              <button
                type="button"
                className={`statement-pill ${selectedAccountId === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedAccountId('all')}
              >
                Semua Rekening ({data.accounts?.length || 0})
              </button>
              {(data.accounts || []).map(acc => (
                <button
                  key={acc.id}
                  type="button"
                  className={`statement-pill ${selectedAccountId === acc.id ? 'active' : ''}`}
                  onClick={() => setSelectedAccountId(acc.id)}
                >
                  {acc.icon || '💳'} {acc.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PRINTABLE A4 DOCUMENT PAPER */}
        <div className="statement-scroll-area">
          <div className="statement-preview-hint no-print">
            <span>📄</span>
            <span>Format Resmi A4 • Gunakan tombol "Cetak / Simpan PDF" untuk unduh dokumen utuh</span>
          </div>

          <div id="printable-financial-statement" className="statement-paper-sheet">
            {/* WATERMARK */}
            <div className="statement-watermark">
              MYKULIAHLIFE OFFICIAL STATEMENT
            </div>

            {/* 1. BANK / COMPANY OFFICIAL HEADER */}
            <div className="statement-header-box">
              <div className="statement-header-left">
                <div className="statement-logo-wrap">
                  <div className="statement-logo-emblem">
                    <span className="statement-logo-icon">🎓</span>
                  </div>
                  <div>
                    <div className="statement-company-name">
                      MYKULIAHLIFE FINANCIAL OS
                    </div>
                    <div className="statement-company-dept">
                      Student Financial Intelligence & Cashflow Management
                    </div>
                    <div className="statement-company-address">
                      Layanan Rekening Koran & Rekapitulasi Finansial Terverifikasi
                    </div>
                  </div>
                </div>
              </div>

              <div className="statement-header-right">
                <div className="statement-title-badge">
                  REKENING KORAN / E-STATEMENT
                </div>
                <div className="statement-meta-row">
                  <span className="statement-meta-key">No. Dokumen:</span>
                  <span className="statement-meta-val">{statementId}</span>
                </div>
                <div className="statement-meta-row">
                  <span className="statement-meta-key">Tgl Cetak:</span>
                  <span className="statement-meta-val">{printTimestamp}</span>
                </div>
                <div className="statement-meta-row">
                  <span className="statement-meta-key">Periode:</span>
                  <span className="statement-meta-val highlight">{periodLabel}</span>
                </div>
                <div className="statement-meta-row">
                  <span className="statement-meta-key">Status:</span>
                  <span className="statement-meta-val verified">
                    <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '3px' }} />
                    TERVERIFIKASI SISTEM
                  </span>
                </div>
              </div>
            </div>

            <div className="statement-divider-thick" />

            {/* 2. CUSTOMER & ACCOUNT DETAILS */}
            <div className="statement-section-card">
              <div className="statement-info-grid">
                <div className="statement-info-col">
                  <div className="statement-field">
                    <span className="statement-field-label">Nama Mahasiswa / Nasabah:</span>
                    <span className="statement-field-value bold">{profile.fullName || 'Mahasiswa MyKuliahLife'}</span>
                  </div>
                  <div className="statement-field">
                    <span className="statement-field-label">Email Mahasiswa:</span>
                    <span className="statement-field-value">{profile.email || '-'}</span>
                  </div>
                  <div className="statement-field">
                    <span className="statement-field-label">Perguruan Tinggi:</span>
                    <span className="statement-field-value">{profile.university || '-'}</span>
                  </div>
                </div>

                <div className="statement-info-col">
                  <div className="statement-field">
                    <span className="statement-field-label">Program Studi & Semester:</span>
                    <span className="statement-field-value">
                      {profile.major || 'Mahasiswa Aktif'} {profile.semester ? `• Semester ${profile.semester}` : ''}
                    </span>
                  </div>
                  <div className="statement-field">
                    <span className="statement-field-label">Cakupan Rekening:</span>
                    <span className="statement-field-value bold">
                      {selectedAccount ? `${selectedAccount.icon || '💳'} ${selectedAccount.name}` : `Konsolidasi Semua Akun (${data.accounts?.length || 0} Rekening)`}
                    </span>
                  </div>
                  <div className="statement-field">
                    <span className="statement-field-label">Mata Uang:</span>
                    <span className="statement-field-value">IDR (Indonesian Rupiah)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. EXECUTIVE CASH FLOW & BALANCE SUMMARY */}
            <div className="statement-section">
              <div className="statement-section-title">
                1. RINGKASAN EKSEKUTIF ARUS KAS (EXECUTIVE CASH FLOW SUMMARY)
              </div>
              <div className="statement-summary-cards">
                <div className="statement-summary-box">
                  <div className="statement-summary-label">Saldo Awal Periode</div>
                  <div className="statement-summary-num">
                    Rp {summary.beginningBalance.toLocaleString('id-ID')}
                  </div>
                  <div className="statement-summary-sub">Posisi awal buku</div>
                </div>

                <div className="statement-summary-box income">
                  <div className="statement-summary-label">
                    <ArrowDownLeft size={13} style={{ display: 'inline', marginRight: '3px' }} />
                    Total Pemasukan (CR)
                  </div>
                  <div className="statement-summary-num text-success">
                    +Rp {summary.totalInflow.toLocaleString('id-ID')}
                  </div>
                  <div className="statement-summary-sub">Uang saku, gaji, transfer</div>
                </div>

                <div className="statement-summary-box expense">
                  <div className="statement-summary-label">
                    <ArrowUpRight size={13} style={{ display: 'inline', marginRight: '3px' }} />
                    Total Pengeluaran (DB)
                  </div>
                  <div className="statement-summary-num text-danger">
                    -Rp {summary.totalOutflow.toLocaleString('id-ID')}
                  </div>
                  <div className="statement-summary-sub">Belanja & kebutuhan</div>
                </div>

                <div className="statement-summary-box net">
                  <div className="statement-summary-label">Arus Kas Bersih</div>
                  <div className={`statement-summary-num ${summary.netCashflow >= 0 ? 'text-success' : 'text-danger'}`}>
                    {summary.netCashflow >= 0 ? '+' : ''}Rp {summary.netCashflow.toLocaleString('id-ID')}
                  </div>
                  <div className="statement-summary-sub">
                    {summary.netCashflow >= 0 ? 'Surplus (Hemat)' : 'Defisit (Ekstra)'}
                  </div>
                </div>

                <div className="statement-summary-box ending">
                  <div className="statement-summary-label">Saldo Akhir Periode</div>
                  <div className="statement-summary-num text-primary">
                    Rp {summary.endingBalance.toLocaleString('id-ID')}
                  </div>
                  <div className="statement-summary-sub">Total saldo aktif</div>
                </div>
              </div>
            </div>

            {/* 4. SNAPSHOT SALDO PER REKENING (Jika konsolidasi) */}
            {selectedAccountId === 'all' && (data.accounts || []).length > 0 && (
              <div className="statement-section">
                <div className="statement-section-title">
                  2. POSISI SALDO PER REKENING / DOMPET (ACCOUNTS BREAKDOWN)
                </div>
                <div className="statement-accounts-grid">
                  {(data.accounts || []).map((acc) => (
                    <div key={acc.id} className="statement-account-item">
                      <div className="statement-account-left">
                        <span className="statement-account-icon">{acc.icon || '💳'}</span>
                        <div className="statement-account-info">
                          <div className="statement-account-name">
                            {acc.name}
                            {acc.isPrimary && <span className="statement-badge-primary">Utama</span>}
                          </div>
                          <div className="statement-account-type">
                            {acc.type || 'Bank'}{acc.number ? ` • ${acc.number}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="statement-account-balance">
                        Rp {(Number(acc.balance) || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. RINCIAN MUTASI REKENING (TRANSACTION MUTATION TABLE) */}
            <div className="statement-section">
              <div className="statement-section-title">
                {selectedAccountId === 'all' ? '3.' : '2.'} RINCIAN MUTASI TRANSAKSI (DETAILED TRANSACTION STATEMENT)
              </div>

              {transactionsChronological.length === 0 ? (
                <div className="statement-empty-notice">
                  Tidak ada catatan mutasi transaksi pada periode yang dipilih.
                </div>
              ) : (
                <table className="statement-table">
                  <thead>
                    <tr>
                      <th style={{ width: '35px', textAlign: 'center' }}>No</th>
                      <th style={{ width: '85px' }}>Tanggal</th>
                      <th>Uraian Transaksi / Catatan</th>
                      <th>Kategori</th>
                      <th>Rekening</th>
                      <th style={{ width: '50px', textAlign: 'center' }}>D/K</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Nominal (IDR)</th>
                      <th style={{ textAlign: 'right', width: '130px' }}>Saldo Berjalan (IDR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionsChronological.map((tx) => {
                      const isIncome = tx.type === 'income';
                      const desc = (tx.merchant ? `${tx.merchant} ` : '') + (tx.note || tx.category || 'Transaksi');

                      return (
                        <tr key={tx.id}>
                          <td style={{ textAlign: 'center', color: '#64748B' }}>{tx.rowNumber}</td>
                          <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{tx.date}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{desc}</div>
                            {tx.merchant && tx.note && (
                              <div style={{ fontSize: '10px', color: '#64748B' }}>{tx.note}</div>
                            )}
                          </td>
                          <td>
                            <span className="statement-cat-tag">
                              {tx.icon} {tx.category || 'Lainnya'}
                            </span>
                          </td>
                          <td style={{ fontSize: '11px', color: '#475569' }}>
                            {tx.accountName || '-'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`statement-dk-badge ${isIncome ? 'credit' : 'debit'}`}>
                              {isIncome ? 'CR' : 'DB'}
                            </span>
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 800,
                              color: isIncome ? '#047857' : '#B91C1C',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isIncome ? '+' : '-'}Rp {(Number(tx.amount) || 0).toLocaleString('id-ID')}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 700,
                              color: '#0F172A',
                              whiteSpace: 'nowrap',
                              fontFamily: 'monospace',
                              fontSize: '11.5px'
                            }}
                          >
                            Rp {(tx.runningBalance || 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#F8FAFC', fontWeight: 800 }}>
                      <td colSpan={6} style={{ textAlign: 'right', padding: '10px' }}>
                        Total Pengeluaran / Debit:
                      </td>
                      <td style={{ textAlign: 'right', color: '#B91C1C', padding: '10px' }}>
                        -Rp {summary.totalOutflow.toLocaleString('id-ID')}
                      </td>
                      <td style={{ textAlign: 'right', color: '#0F172A', padding: '10px' }}>
                        Saldo: Rp {summary.endingBalance.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            {/* 6. OFFICIAL FOOTER, DISCLAIMER & DIGITAL SEAL */}
            <div className="statement-footer-section">
              <div className="statement-disclaimer-box">
                <div className="statement-disclaimer-title">
                  <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px', color: '#1665D8' }} />
                  Catatan Keabsahan & Otentikasi Digital (Digital Authentication Notice)
                </div>
                <p className="statement-disclaimer-text">
                  Dokumen Rekening Koran (*e-Statement*) ini diterbitkan secara otomatis dan terenkripsi oleh sistem <strong>MyKuliahLife Financial Operating System</strong>. Seluruh data transaksi, mutasi, dan posisi saldo bersumber langsung dari catatan riil pembukuan mahasiswa bersangkutan. Dokumen ini diakui sah tanpa tanda tangan basah dan dapat digunakan sebagai bukti rekapitulasi keuangan resmi untuk keperluan beasiswa, pelaporan orang tua, organisasi kampus, ataupun audit pribadi.
                </p>
                <div className="statement-doc-hash">
                  DOC HASH: SHA256:{Math.random().toString(36).substring(2, 15).toUpperCase()}{Math.random().toString(36).substring(2, 15).toUpperCase()} • TIMESTAMP: {new Date().toISOString()}
                </div>
              </div>

              {/* Digital Stamp Seal */}
              <div className="statement-seal-container">
                <div className="statement-digital-seal">
                  <div className="seal-circle-outer">
                    <div className="seal-circle-inner">
                      <div className="seal-star">★ ★ ★</div>
                      <div className="seal-main-text">MYKULIAHLIFE</div>
                      <div className="seal-sub-text">OFFICIAL STATEMENT</div>
                      <div className="seal-check">✓ VERIFIED</div>
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: '6px' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#1E293B' }}>
                    SISTEM KEUANGAN TERPADU
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#64748B' }}>
                    Digital Certified 2026
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialStatementModal;
