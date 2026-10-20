import React, { useState } from 'react';
import { useTradeContext } from '../context/TradeContext';
import { getDailyPnlMap } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle, XCircle } from 'lucide-react';

export const CalendarHeatmap: React.FC = () => {
  const { trades, currency, setFilter, setActiveTab } = useTradeContext();

  const [currentDate, setCurrentDate] = useState(() => {
    // default to October 2026 or current month
    return new Date(2026, 9, 1); // 2026-10-01
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const dailyMap = getDailyPnlMap(trades);

  // Month navigation labels
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
  // Convert so Monday is 0, Sunday is 6:
  const startOffset = (firstDayIndex + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < startOffset; i++) {
    calendarDays.push({ type: 'empty', id: `empty-${i}` });
  }

  let greenDays = 0;
  let redDays = 0;
  let totalTradingDays = 0;
  let monthlyPnl = 0;
  let bestDay = { date: '', pnl: -Infinity };
  let worstDay = { date: '', pnl: Infinity };

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayRecord = dailyMap[dayStr];
    
    if (dayRecord && dayRecord.tradesCount > 0) {
      totalTradingDays++;
      monthlyPnl += dayRecord.pnl;
      if (dayRecord.pnl > 0.01) greenDays++;
      if (dayRecord.pnl < -0.01) redDays++;

      if (dayRecord.pnl > bestDay.pnl) {
        bestDay = { date: dayStr, pnl: dayRecord.pnl };
      }
      if (dayRecord.pnl < worstDay.pnl) {
        worstDay = { date: dayStr, pnl: dayRecord.pnl };
      }
    }

    calendarDays.push({
      type: 'day',
      dayNumber: day,
      dateStr: dayStr,
      record: dayRecord
    });
  }

  const handleDayClick = (dateStr: string) => {
    setFilter(prev => ({
      ...prev,
      dateRange: 'custom',
      customStartDate: dateStr,
      customEndDate: dateStr
    }));
    setActiveTab('journal');
  };

  return (
    <div className="space-y-6">
      {/* Month Navigator & Summary Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white font-mono">
            {monthNames[month]} {year}
          </h2>
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 ml-2">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Monthly Summary Strip */}
        <div className="flex items-center flex-wrap gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 block">Monthly P&L</span>
            <span className={`text-sm font-bold ${monthlyPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(monthlyPnl, currency, true)}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div>
            <span className="text-slate-500 block">Trading Days</span>
            <span className="text-sm font-semibold text-white">
              {totalTradingDays} Days <span className="text-emerald-400">({greenDays}G</span> / <span className="text-rose-400">{redDays}R)</span>
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div>
            <span className="text-slate-500 block">Green Day Rate</span>
            <span className="text-sm font-semibold text-white">
              {totalTradingDays > 0 ? ((greenDays / totalTradingDays) * 100).toFixed(0) : 0}%
            </span>
          </div>

          {bestDay.pnl > -Infinity && (
            <>
              <div className="h-8 w-px bg-slate-800 hidden sm:block" />
              <div>
                <span className="text-slate-500 block">Best Day</span>
                <span className="text-sm font-semibold text-emerald-400">
                  +{formatCurrency(bestDay.pnl, currency)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-medium text-slate-400">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-slate-600">Sat</div>
          <div className="text-slate-600">Sun</div>
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((item) => {
            if (item.type === 'empty') {
              return (
                <div 
                  key={item.id} 
                  className="min-h-[85px] sm:min-h-[100px] bg-slate-950/20 border border-slate-900/60 rounded-lg opacity-40" 
                />
              );
            }

            const rec = item.record;
            const hasTrades = rec && rec.tradesCount > 0;
            const isProfit = hasTrades && rec.pnl > 0.01;
            const isLoss = hasTrades && rec.pnl < -0.01;

            let cardBg = 'bg-slate-950/40 border-slate-800/60';
            if (isProfit) {
              cardBg = 'bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-500/60';
            } else if (isLoss) {
              cardBg = 'bg-rose-950/20 border-rose-800/40 hover:border-rose-500/60';
            } else if (hasTrades) {
              cardBg = 'bg-slate-900 border-slate-700 hover:border-slate-500';
            }

            return (
              <div
                key={item.dateStr}
                onClick={() => hasTrades && item.dateStr && handleDayClick(item.dateStr)}
                className={`min-h-[85px] sm:min-h-[100px] p-2 border rounded-lg flex flex-col justify-between transition-all ${cardBg} ${
                  hasTrades ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : 'cursor-default'
                }`}
              >
                {/* Day number & indicators */}
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-mono font-medium ${hasTrades ? 'text-white' : 'text-slate-500'}`}>
                    {item.dayNumber}
                  </span>
                  {hasTrades && (
                    <span className="text-[10px] text-slate-500 font-mono">
                      {rec.tradesCount} trade{rec.tradesCount > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Day P&L */}
                {hasTrades ? (
                  <div className="my-auto text-center font-mono">
                    <div className={`text-xs sm:text-sm font-bold tabular-nums ${
                      isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'
                    }`}>
                      {formatCurrency(rec.pnl, currency, true)}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {rec.winCount}W / {rec.lossCount}L
                    </div>
                  </div>
                ) : (
                  <div className="h-6" />
                )}

                {/* Bottom subtle indicator */}
                <div className="text-[10px] text-slate-600 text-right">
                  {hasTrades && (
                    <span className="text-[10px] text-slate-500 hover:text-emerald-400">View &rarr;</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
