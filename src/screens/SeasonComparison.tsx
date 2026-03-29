import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

type Metric = 'income' | 'debt' | 'stress' | 'score';

interface SeasonData {
  season: number;
  income: number;
  debt: number;
  stress: number;
  score: number;
  decisions: {
    usedKCC: boolean;
    usedMoneylender: boolean;
    usedENWR: boolean;
    distressSold: boolean;
    enrolledPMFBY: boolean;
    invokedMSP: boolean;
  };
}

export const SeasonComparison: React.FC<{ onBack?: () => void; onNavigate?: (screen: string) => void }> = ({ onBack, onNavigate }) => {
  const { t } = useTranslation();
  const { gameState, seasonHistory } = useGameStore();
  const [activeMetric, setActiveMetric] = useState<Metric>('income');

  // Generate sample data for demonstration
  const sampleData: SeasonData[] = [
    { season: 1, income: 45000, debt: 25000, stress: 75, score: 65, 
      decisions: { usedKCC: false, usedMoneylender: true, usedENWR: false, distressSold: true, enrolledPMFBY: false, invokedMSP: false } },
    { season: 2, income: 52000, debt: 20000, stress: 60, score: 72,
      decisions: { usedKCC: true, usedMoneylender: false, usedENWR: true, distressSold: false, enrolledPMFBY: true, invokedMSP: true } },
    { season: 3, income: 58000, debt: 15000, stress: 45, score: 78,
      decisions: { usedKCC: true, usedMoneylender: false, usedENWR: true, distressSold: false, enrolledPMFBY: true, invokedMSP: true } },
    { season: 4, income: 62000, debt: 10000, stress: 35, score: 82,
      decisions: { usedKCC: true, usedMoneylender: false, usedENWR: true, distressSold: false, enrolledPMFBY: true, invokedMSP: true } },
    { season: 5, income: 68000, debt: 5000, stress: 25, score: 88,
      decisions: { usedKCC: true, usedMoneylender: false, usedENWR: true, distressSold: false, enrolledPMFBY: true, invokedMSP: true } },
  ];
  const data: SeasonData[] = Array.isArray(seasonHistory) && seasonHistory.length > 0
    ? (seasonHistory as any as SeasonData[])
    : sampleData;

  const metrics = [
    { id: 'income' as Metric, label: '📈 ' + t('seasonComparison.income'), color: 'text-green-600', bgColor: 'bg-green-500' },
    { id: 'debt' as Metric, label: '💸 ' + t('seasonComparison.debt'), color: 'text-red-600', bgColor: 'bg-red-500' },
    { id: 'stress' as Metric, label: '😓 ' + t('seasonComparison.stress'), color: 'text-amber-600', bgColor: 'bg-amber-500' },
    { id: 'score' as Metric, label: '⭐ ' + t('seasonComparison.score'), color: 'text-purple-600', bgColor: 'bg-purple-500' },
  ];

  const maxValue = Math.max(...data.map(d => d[activeMetric]));
  const minValue = Math.min(...data.map(d => d[activeMetric]));
  const range = maxValue - minValue || 1;

  const getValue = (d: SeasonData) => d[activeMetric];

  // Calculate totals
  const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
  const totalDebt = data.reduce((sum, d) => sum + d.debt, 0);
  const avgStress = data.length > 0
    ? Math.round(data.reduce((sum, d) => sum + d.stress, 0) / data.length)
    : 0;
  const finalScore = data[data.length - 1]?.score || 0;

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => {
              if (onBack) return onBack();
              if (onNavigate) return onNavigate('dashboard');
              window.history.back();
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            ←
          </button>
          <h1 className="text-xl text-gray-900 font-bold">
            {t('seasonComparison.title')}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500">{t('seasonComparison.income')}</p>
            <p className="text-2xl text-green-600 font-bold">₹{totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500">{t('seasonComparison.debt')}</p>
            <p className="text-2xl text-red-600 font-bold">₹{totalDebt.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500">{t('seasonComparison.stress')}</p>
            <p className="text-2xl text-amber-600 font-bold">{avgStress}%</p>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500">{t('seasonComparison.score')}</p>
            <p className="text-2xl text-purple-600 font-bold">{finalScore}</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-lg text-gray-900 mb-4 font-bold">
            {t('seasonComparison.subtitle')}
          </h2>

          {/* Metric Toggles */}
          <div className="flex gap-2 mb-6">
            {metrics.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                  ${activeMetric === m.id ? m.bgColor + ' text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Simple Bar Chart */}
          <div className="flex items-end justify-between h-48 gap-2 mb-2">
            {data.map((d, i) => {
              const height = ((getValue(d) - minValue) / range) * 100;
              const metric = metrics.find(m => m.id === activeMetric);
              return (
                <div key={d.season} className="flex-1 flex flex-col items-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 10)}%` }}
                    className={`w-full rounded-t-lg ${metric?.bgColor || 'bg-green-500'}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">S{d.season}</p>
                </div>
              );
            })}
          </div>

          {/* Learning Line */}
          {activeMetric === 'income' && data.length > 1 && (
            <div className="mt-4 p-4 bg-green-50 rounded-xl">
              <p className="text-green-800 font-medium">
                Income grew by ₹{(data[data.length-1].income - data[0].income).toLocaleString()} from Season 1
              </p>
            </div>
          )}
        </div>

        {/* Decision Pattern Grid */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-lg text-gray-900 mb-4 font-bold">
            {t('seasonComparison.decisions')}
          </h2>
          <div className="grid grid-cols-5 gap-1 mb-2">
            {['S1', 'S2', 'S3', 'S4', 'S5'].map(s => (
              <div key={s} className="text-center text-xs text-gray-500 font-semibold">{s}</div>
            ))}
          </div>
          <div className="space-y-2">
            {[
              { key: 'usedKCC', icon: '💳', label: t('seasonComparison.usedKCC') },
              { key: 'usedMoneylender', icon: '💰', label: t('seasonComparison.usedMoneylender') },
              { key: 'usedENWR', icon: '🏛️', label: t('seasonComparison.usedENWR') },
              { key: 'distressSold', icon: '⚡', label: t('seasonComparison.distressSold') },
              { key: 'enrolledPMFBY', icon: '🛡️', label: t('seasonComparison.enrolledPMFBY') },
              { key: 'invokedMSP', icon: '📜', label: t('seasonComparison.invokedMSP') },
            ].map((item) => (
              <div key={item.key} className="grid grid-cols-5 gap-1 items-center">
                {data.map((d) => (
                  <div key={d.season} className="flex justify-center">
                    <span className="text-lg">
                      {d.decisions[item.key as keyof typeof d.decisions] ? item.icon : '·'}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            {t('seasonComparison.pattern')}
          </p>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl p-6 overflow-x-auto">
          <h2 className="text-lg text-gray-900 mb-4 font-bold">
            {t('seasonComparison.pattern')}
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 font-semibold text-gray-600"></th>
                {data.map(d => (
                  <th key={d.season} className="text-center py-2 font-semibold text-gray-600">S{d.season}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 font-medium">{t('seasonComparison.income')}</td>
                {data.map(d => (
                  <td key={d.season} className="text-center py-2 font-bold">₹{d.income/1000}k</td>
                ))}
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 font-medium">{t('seasonComparison.debt')}</td>
                {data.map(d => (
                  <td key={d.season} className="text-center py-2 font-bold">₹{d.debt/1000}k</td>
                ))}
              </tr>
              <tr>
                <td className="py-2 font-medium">{t('seasonComparison.stress')}</td>
                {data.map(d => (
                  <td key={d.season} className="text-center py-2 font-bold">{d.stress}%</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Share Report Button */}
        <button
          onClick={() => {
            if (onNavigate) return onNavigate('export');
            if (onBack) return onBack();
          }}
          className="w-full py-4 bg-green-500 text-white rounded-xl font-semibold"
        >
          📤 {t('export.shareWhatsApp')}
        </button>
      </div>
    </div>
  );
};

export default SeasonComparison;
