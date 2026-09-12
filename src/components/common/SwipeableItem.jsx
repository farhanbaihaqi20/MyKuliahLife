import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Trash2, MoreVertical, X, AlertTriangle } from 'lucide-react';

export default function SwipeableItem({
  children,
  onEdit,
  onDelete,
  onClick,
  itemTitle = 'item ini',
  disabled = false,
  showDots = true,
  className = ''
}) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const hasMovedRef = useRef(false);
  const longPressTimerRef = useRef(null);
  const isLongPressedRef = useRef(false);
  const isHorizontalSwipeRef = useRef(null);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const handleTouchStart = (e) => {
    if (disabled) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentXRef.current = touch.clientX;
    hasMovedRef.current = false;
    isLongPressedRef.current = false;
    isHorizontalSwipeRef.current = null;

    longPressTimerRef.current = setTimeout(() => {
      if (!hasMovedRef.current) {
        isLongPressedRef.current = true;
        if (navigator.vibrate) navigator.vibrate(40);
        setShowMenu(true);
        setTranslateX(0);
        setIsSwiping(false);
      }
    }, 600);
  };

  const handleTouchMove = (e) => {
    if (disabled || isLongPressedRef.current) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - startXRef.current;
    const diffY = touch.clientY - startYRef.current;

    if (Math.abs(diffX) > 12 || Math.abs(diffY) > 12) {
      hasMovedRef.current = true;
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    }

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 15 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        isHorizontalSwipeRef.current = true;
      } else if (Math.abs(diffY) > 15) {
        isHorizontalSwipeRef.current = false;
      }
    }

    if (isHorizontalSwipeRef.current === true) {
      currentXRef.current = touch.clientX;
      setIsSwiping(true);
      const damped = Math.sign(diffX) * Math.min(Math.abs(diffX) * 0.8, 100);
      setTranslateX(damped);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    if (isLongPressedRef.current) {
      setTranslateX(0);
      setIsSwiping(false);
      return;
    }

    if (isSwiping) {
      const finalDiff = currentXRef.current - startXRef.current;
      if (finalDiff > 60 && onDelete) {
        if (navigator.vibrate) navigator.vibrate(30);
        setShowConfirmDelete(true);
      } else if (finalDiff < -60 && onEdit) {
        if (navigator.vibrate) navigator.vibrate(30);
        onEdit();
      }
      setTranslateX(0);
      setIsSwiping(false);
      isHorizontalSwipeRef.current = null;
    }
  };

  const handleCardClick = (e) => {
    // If action menu was opened by long press or user actively swiped, don't trigger click
    if (isLongPressedRef.current || hasMovedRef.current || Math.abs(translateX) > 10) {
      return;
    }
    onClick?.(e);
  };

  return (
    <div className={`swipeable-card-outer ${className}`}>
      {/* Right swipe background indicator = DELETE (Red) */}
      <div
        className="swipe-reveal-left"
        style={{ opacity: translateX > 15 ? Math.min(1, translateX / 50) : 0 }}
      >
        <Trash2 size={18} />
        <span>Geser untuk Hapus</span>
      </div>

      {/* Left swipe background indicator = EDIT (Blue) */}
      <div
        className="swipe-reveal-right"
        style={{ opacity: translateX < -15 ? Math.min(1, Math.abs(translateX) / 50) : 0 }}
      >
        <span>Geser untuk Edit</span>
        <Edit2 size={18} />
      </div>

      {/* Main card content container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)',
          position: 'relative'
        }}
        className="swipeable-card-inner"
      >
        {children}

        {/* Beautiful 3-dots action button */}
        {showDots && (onEdit || onDelete) && (
          <button
            type="button"
            className="dots-action-btn"
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(true);
            }}
            title="Menu Aksi"
          >
            <MoreVertical size={16} />
          </button>
        )}
      </div>

      {/* Action Sheet Menu Modal */}
      {showMenu && (
        <div className="action-sheet-overlay" onClick={() => setShowMenu(false)}>
          <div className="action-sheet-box" onClick={(e) => e.stopPropagation()}>
            <div className="action-sheet-header">
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>Pilihan Menu</div>
                <div style={{ fontSize: '11px', color: '#64748B', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {itemTitle}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMenu(false)}
                style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F1F5F9', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            </div>

            <div>
              {onEdit && (
                <button
                  type="button"
                  className="action-sheet-item edit"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit();
                  }}
                >
                  <Edit2 size={16} />
                  <span>Edit Data</span>
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  className="action-sheet-item delete"
                  onClick={() => {
                    setShowMenu(false);
                    setShowConfirmDelete(true);
                  }}
                >
                  <Trash2 size={16} />
                  <span>Hapus Data</span>
                </button>
              )}

              <button
                type="button"
                className="action-sheet-item cancel"
                onClick={() => setShowMenu(false)}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="action-sheet-overlay" onClick={() => setShowConfirmDelete(false)}>
          <div
            className="action-sheet-box"
            onClick={(e) => e.stopPropagation()}
            style={{ textAlign: 'center', padding: '24px 20px' }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                background: '#FEE2E2',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}
            >
              <AlertTriangle size={24} />
            </div>

            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
              Hapus Data?
            </h4>
            <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '18px', lineHeight: '1.45' }}>
              Apakah kamu yakin ingin menghapus <strong>"{itemTitle}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmDelete(false);
                  onDelete();
                }}
                className="btn-primary"
                style={{ flex: 1, padding: '10px', background: '#EF4444' }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
