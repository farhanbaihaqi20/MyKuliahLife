import React from 'react';
import { useApp } from '../../context/AppContext';
import { maskMoney } from '../../utils/formatters';
import { getBudgetMascotState } from '../../utils/budgetMascot';
import { ChevronRight } from 'lucide-react';

export const SmartBudgetTipCard = ({ onClick, style, className = '' }) => {
  const {
    totalBudget,
    remainingBudget,
    cycleExpenses,
    percentUsed,
    dailyAllowance,
    financialCycle,
    isBalanceVisible,
    navigateTo
  } = useApp();

  const mascotState = getBudgetMascotState({
    totalBudget,
    remainingBudget,
    cycleExpenses,
    percentUsed,
    dailyAllowance,
    financialCycle
  });

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (navigateTo) {
      navigateTo('finance', 'budget');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <div
      className={`smart-tip-card smart-tip-${mascotState.status} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      style={style}
      title="Klik untuk melihat rincian alokasi budget"
    >
      <div className={`smart-tip-avatar-box smart-tip-avatar-${mascotState.status}`}>
        <img
          src={mascotState.mascotSrc}
          alt={mascotState.mascotAlt}
          className="smart-tip-mascot-img"
          loading="eager"
        />
      </div>

      <div className="smart-tip-content">
        <div className="smart-tip-header-row">
          <span className="smart-tip-title">{mascotState.title}</span>
          <span className={`smart-tip-badge ${mascotState.badgeClass}`}>
            <span className="badge-dot" />
            {mascotState.badgeLabel}
          </span>
        </div>

        <div className="smart-tip-desc">
          {mascotState.descPrefix}
          {!mascotState.isExceeded && (
            <span className="smart-tip-amount-pill">
              <strong className="smart-tip-highlight">
                {maskMoney(mascotState.dailyAllowance, isBalanceVisible)}
              </strong>
              <span className="smart-tip-unit">/hari</span>
            </span>
          )}
          {mascotState.descSuffix}
        </div>
      </div>

      <div className="smart-tip-action-circle" aria-hidden="true">
        <ChevronRight size={15} strokeWidth={2.4} />
      </div>
    </div>
  );
};

export default SmartBudgetTipCard;
