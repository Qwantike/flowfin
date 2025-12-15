import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Transaction, TransactionType } from '../types';

interface FinancialFlowChartProps {
  transactions: Transaction[];
}

const FinancialFlowChart: React.FC<FinancialFlowChartProps> = ({ transactions }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hovered, setHovered] = useState<null | { label: string; x: number; y: number; type: 'income' | 'expense' }>(null);

  // Helper to aggregate transactions by label (group on label)
  const aggregateTransactionsByLabel = (txs: Transaction[]) => {
    const map = new Map<string, { id: string; name: string; amount: number }>();

    txs.forEach(t => {
      const labelKey = (t.label || 'Perso').trim();
      const existing = map.get(labelKey);
      if (existing) {
        map.set(labelKey, {
          ...existing,
          amount: existing.amount + t.amount
        });
      } else {
        map.set(labelKey, { id: `${labelKey}-${Math.random().toString(36).slice(2, 8)}`, name: labelKey, amount: t.amount });
      }
    });

    return Array.from(map.values());
  };

  // Filter and Aggregate data
  const incomes = useMemo(() => {
    const rawIncomes = transactions.filter(t => t.type === TransactionType.INCOME);
    const aggregated = aggregateTransactionsByLabel(rawIncomes);
    return aggregated.sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const expenses = useMemo(() => {
    const rawExpenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const aggregated = aggregateTransactionsByLabel(rawExpenses);
    return aggregated.sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate Layout
  const layoutData = useMemo(() => {
    const { width, height } = dimensions;
    if (width === 0 || height === 0) return null;

    const centerX = width / 2;
    const centerY = height / 2;
    const centerBarWidth = 60;
    const gap = 2;

    // Scale setup
    const maxTotal = Math.max(totalIncome, totalExpense, 1);
    const maxFlowHeight = height * 0.50;
    const scale = d3.scaleLinear().domain([0, maxTotal]).range([0, maxFlowHeight]);

    // Safe numeric accessor
    const safeNumber = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    };

    // Precompute visual thickness per item (ensures finite numbers)
    const incomeHeights = incomes.map(i => Math.max(scale(safeNumber(i.amount)), 2));
    const expenseHeights = expenses.map(i => Math.max(scale(safeNumber(i.amount)), 2));

    // Total visual heights (clamped to >= 0)
    const incomeVisualHeight = Math.max(incomeHeights.reduce((acc, h) => acc + h + gap, 0) - gap, 0);
    const expenseVisualHeight = Math.max(expenseHeights.reduce((acc, h) => acc + h + gap, 0) - gap, 0);

    // Helper to calculate stack positions; returns [] if no items or zero total height
    const calculateFlows = (items: any[], isLeft: boolean, totalStackHeight: number, heights: number[]) => {
      if (!items || items.length === 0 || totalStackHeight <= 0) return [];

      let currentStackY = centerY - (totalStackHeight / 2);

      // Spread logic with safe denominators
      const spreadHeight = Math.min(Math.max(totalStackHeight * 1.5, height * 0.5), height * 0.85);
      let currentSpreadY = centerY - (spreadHeight / 2);

      // Avoid divide-by-zero by using sumHeights >= 1
      const sumHeights = Math.max(heights.reduce((s, v) => s + (Number(v) || 0), 0), 1);

      return items.map((item, idx) => {
        const flowThickness = Math.max(Number(heights[idx]) || Math.max(scale(safeNumber(item.amount)), 2), 2);

        // Stack center position
        const stackYCenter = currentStackY + flowThickness / 2;
        currentStackY += flowThickness + gap;

        // Proportional spread step, clamped to a reasonable minimum
        const proportion = flowThickness / sumHeights;
        const spreadStep = proportion * spreadHeight;
        const minStep = 28;
        const adjustedSpreadStep = Math.max(spreadStep, minStep);

        const outerYCenter = currentSpreadY + adjustedSpreadStep / 2;
        currentSpreadY += adjustedSpreadStep;

        return {
          ...item,
          flowThickness,
          source: isLeft ? { x: 0, y: outerYCenter } : { x: centerX + centerBarWidth / 2, y: stackYCenter },
          target: isLeft ? { x: centerX - centerBarWidth / 2, y: stackYCenter } : { x: width, y: outerYCenter },
          color: isLeft ? '#10b981' : '#ef4444',
          gradientId: `grad-${item.id}`
        };
      });
    };

    const incomeNodes = calculateFlows(incomes as any, true, incomeVisualHeight, incomeHeights);
    const expenseNodes = calculateFlows(expenses as any, false, expenseVisualHeight, expenseHeights);

    const linkGen = d3.linkHorizontal<any, any>()
      .x(d => d.x)
      .y(d => d.y);

    return {
      incomeNodes,
      expenseNodes,
      incomeVisualHeight,
      expenseVisualHeight,
      linkGen,
      centerX,
      centerY,
      centerBarWidth
    };
  }, [dimensions, incomes, expenses, totalIncome, totalExpense]);

  if (!layoutData) return <div ref={containerRef} className="w-full h-full min-h-[400px]" />;

  const {
    incomeNodes,
    expenseNodes,
    incomeVisualHeight,
    expenseVisualHeight,
    centerX,
    centerY,
    centerBarWidth
  } = layoutData;

  const balanceColor = totalIncome >= totalExpense ? '#10b981' : '#ef4444'; // Emerald vs Red
  const balance = totalIncome - totalExpense;

  return (
    <div ref={containerRef} className="w-full h-full relative min-h-0 overflow-hidden bg-slate-900/50 rounded-2xl border border-slate-800 shadow-xl">
      <svg width={dimensions.width} height={dimensions.height} className="absolute inset-0 pointer-events-none">
        <defs>
          {/* Income Gradients */}
          {incomeNodes.map(node => (
            <linearGradient key={node.gradientId} id={node.gradientId} gradientUnits="userSpaceOnUse" x1={node.source.x} y1="0" x2={node.target.x} y2="0">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.05" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
            </linearGradient>
          ))}
          {/* Expense Gradients */}
          {expenseNodes.map(node => (
            <linearGradient key={node.gradientId} id={node.gradientId} gradientUnits="userSpaceOnUse" x1={node.source.x} y1="0" x2={node.target.x} y2="0">
              <stop offset="0%" stopColor="#fb923c" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
            </linearGradient>
          ))}

          <filter id="glow-bar" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Central Hub Visualization */}
        <g transform={`translate(${centerX}, ${centerY})`}>
          {/* Background Track */}
          <rect
            x={-centerBarWidth / 2}
            y={-Math.max(incomeVisualHeight, expenseVisualHeight) / 2 - 10}
            width={centerBarWidth}
            height={Math.max(incomeVisualHeight, expenseVisualHeight) + 20}
            rx={centerBarWidth / 2}
            className="fill-slate-800/50 stroke-slate-700"
          />

          {/* Income Bar (Left Half) */}
          <path
            d={`M ${-centerBarWidth / 2 + 4} ${-incomeVisualHeight / 2} 
                L ${0} ${-incomeVisualHeight / 2} 
                L ${0} ${incomeVisualHeight / 2} 
                L ${-centerBarWidth / 2 + 4} ${incomeVisualHeight / 2} 
                A 1 1 0 0 1 ${-centerBarWidth / 2 + 4} ${-incomeVisualHeight / 2}`}
            className="fill-emerald-500/20 stroke-emerald-500/50"
            strokeWidth="1"
            rx="4"
          />

          {/* Expense Bar (Right Half) */}
          <path
            d={`M ${0} ${-expenseVisualHeight / 2} 
                L ${centerBarWidth / 2 - 4} ${-expenseVisualHeight / 2} 
                A 1 1 0 0 1 ${centerBarWidth / 2 - 4} ${expenseVisualHeight / 2}
                L ${0} ${expenseVisualHeight / 2} 
                Z`}
            className="fill-rose-500/20 stroke-rose-500/50"
            strokeWidth="1"
          />

          {/* Balance Indicator Line (Visual helper) */}
          {totalIncome > totalExpense && (
            <rect
              x={-2}
              y={expenseVisualHeight / 2}
              width={4}
              height={(incomeVisualHeight - expenseVisualHeight) / 2}
              className="fill-emerald-500 animate-pulse"
              style={{ transform: `translateY(0)` }} // Just to anchor
            />
          )}

          {/* Label Group */}
          <foreignObject x={-60} y={-30} width={120} height={60}>
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Solde</span>
              <span className={`text-sm font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {balance > 0 ? '+' : ''}{balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
              </span>
            </div>
          </foreignObject>
        </g>

        {/* Income Paths */}
        {incomeNodes.map(node => (
          <path
            key={node.id}
            d={layoutData.linkGen({ source: node.source, target: node.target }) || ''}
            stroke={`url(#${node.gradientId})`}
            strokeWidth={node.flowThickness}
            fill="none"
            className="transition-all duration-500 ease-out hover:opacity-100"
            style={{ opacity: 0.7 }}
          />
        ))}

        {/* Expense Paths */}
        {expenseNodes.map(node => (
          <path
            key={node.id}
            d={layoutData.linkGen({ source: node.source, target: node.target }) || ''}
            stroke={`url(#${node.gradientId})`}
            strokeWidth={node.flowThickness}
            fill="none"
            className="transition-all duration-500 ease-out hover:opacity-100"
            style={{ opacity: 0.7 }}
          />
        ))}
      </svg>

      {/* HTML Labels Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Income Labels (Left) */}
        {incomeNodes.map(node => (
          <div
            key={`label-${node.id}`}
            className="absolute flex items-center pr-4 transition-all duration-500 ease-out"
            style={{
              left: 20,
              top: node.source.y,
              transform: 'translateY(-50%)',
              justifyContent: 'flex-start',
            }}
            onMouseEnter={(e) => setHovered({ label: node.name, x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY, type: 'income' })}
            onMouseMove={(e) => setHovered(h => h && h.label === node.name ? { ...h, x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY } : h)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-3 min-w-[140px] group hover:scale-105 transition-transform pointer-events-auto cursor-default">
              <div className="w-1.5 rounded-full bg-emerald-500" style={{ height: 24 }}></div>
              <div>
                <div className="text-emerald-100 text-xs font-bold uppercase tracking-wide truncate max-w-[100px]">{node.name}</div>
                <div className="text-white font-mono text-sm">{node.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
              </div>
            </div>
          </div>
        ))}

        {/* Expense Labels (Right) */}
        {expenseNodes.map(node => (
          <div
            key={`label-${node.id}`}
            className="absolute flex items-center pl-4 transition-all duration-500 ease-out"
            style={{
              right: 20,
              top: node.target.y,
              transform: 'translateY(-50%)',
              justifyContent: 'flex-end',
            }}
            onMouseEnter={(e) => setHovered({ label: node.name, x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY, type: 'expense' })}
            onMouseMove={(e) => setHovered(h => h && h.label === node.name ? { ...h, x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY } : h)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="bg-slate-900/90 backdrop-blur-md border border-rose-500/30 px-3 py-1.5 rounded-lg shadow-xl flex flex-row-reverse items-center gap-3 min-w-[140px] group hover:scale-105 transition-transform pointer-events-auto cursor-default">
              <div className="w-1.5 rounded-full bg-rose-500" style={{ height: 24 }}></div>
              <div className="text-right">
                <div className="text-rose-100 text-xs font-bold uppercase tracking-wide truncate max-w-[100px]">{node.name}</div>
                <div className="text-white font-mono text-sm">{node.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Hover panel showing transactions for label */}
      {hovered && (
        <div style={{ position: 'fixed', left: hovered.x + 12, top: hovered.y + 12, zIndex: 60 }}>
          <div className="bg-slate-900/95 text-sm text-white rounded-lg border border-slate-700 shadow-xl p-3 max-w-xs">
            <div className="text-xs text-slate-400 font-semibold mb-2">{hovered.label} — Détails</div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {transactions.filter(t => (t.label || 'Perso') === hovered.label && (hovered.type === 'income' ? t.type === TransactionType.INCOME : t.type === TransactionType.EXPENSE)).map(t => (
                <div key={t.id} className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-200 font-medium">{t.name}</div>
                    <div className="text-[11px] text-slate-500">{new Date(t.date).toLocaleDateString('fr-FR')}</div>
                  </div>
                  <div className={`font-mono ${t.type === TransactionType.INCOME ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialFlowChart;
