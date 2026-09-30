import React from 'react';
import mascotRelax from '../../assets/mascot/mascot-relax.png';
import mascotWallet from '../../assets/mascot/mascot-empty-wallet.png';
import mascotStudy from '../../assets/mascot/mascot-study.png';
import mascotTask from '../../assets/mascot/mascot-task.png';
import mascotCourses from '../../assets/mascot/mascot-courses.png';

const MASCOT_MAP = {
  relax: mascotRelax,
  chill: mascotRelax,
  coffee: mascotRelax,
  wallet: mascotWallet,
  emptyWallet: mascotWallet,
  money: mascotWallet,
  study: mascotStudy,
  book: mascotStudy,
  notes: mascotStudy,
  task: mascotTask,
  checklist: mascotTask,
  courses: mascotCourses,
  folder: mascotCourses,
  semester: mascotCourses
};

export const MascotEmptyState = ({
  mascot = 'relax',
  title,
  description,
  actionText,
  actionIcon,
  onAction,
  secondaryText,
  secondaryIcon,
  onSecondary,
  mascotSize = 100,
  className = '',
  style = {}
}) => {
  const imgSrc = MASCOT_MAP[mascot] || mascot;

  return (
    <div
      className={`mascot-empty-state-card ${className}`.trim()}
      style={{
        background: '#FFFFFF',
        border: '1px dashed #CBD5E1',
        borderRadius: '20px',
        padding: '24px 18px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.25s ease',
        ...style
      }}
    >
      <div className="mascot-img-wrap" style={{ position: 'relative', display: 'inline-block' }}>
        <img
          src={imgSrc}
          alt={title || 'Maskot Kampus'}
          style={{
            width: `${mascotSize}px`,
            height: 'auto',
            maxHeight: `${mascotSize + 15}px`,
            objectFit: 'contain',
            display: 'block',
            margin: '0 auto',
            filter: 'drop-shadow(0 6px 14px rgba(22, 101, 216, 0.12))',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          className="mascot-empty-img"
          loading="lazy"
        />
      </div>

      {title && (
        <h4
          style={{
            fontSize: '14.5px',
            fontWeight: 800,
            color: '#0F172A',
            margin: '2px 0 0 0',
            letterSpacing: '-0.2px'
          }}
          className="mascot-empty-title"
        >
          {title}
        </h4>
      )}

      {description && (
        <p
          style={{
            fontSize: '12px',
            color: '#64748B',
            maxWidth: '320px',
            lineHeight: 1.45,
            margin: 0
          }}
          className="mascot-empty-desc"
        >
          {description}
        </p>
      )}

      {(actionText || secondaryText) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginTop: '6px'
          }}
        >
          {actionText && (
            <button
              type="button"
              onClick={onAction}
              style={{
                background: '#1665D8',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '10px',
                padding: '7px 15px',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(22, 101, 216, 0.22)',
                transition: 'all 0.15s ease'
              }}
              className="mascot-action-btn"
            >
              {actionIcon}
              <span>{actionText}</span>
            </button>
          )}

          {secondaryText && (
            <button
              type="button"
              onClick={onSecondary}
              style={{
                background: '#FFFFFF',
                color: '#475569',
                border: '1px solid #CBD5E1',
                borderRadius: '10px',
                padding: '7px 14px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
              className="mascot-secondary-btn"
            >
              {secondaryIcon}
              <span>{secondaryText}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MascotEmptyState;
