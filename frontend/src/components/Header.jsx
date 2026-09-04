import React from 'react';
import { Bot, RefreshCw, Settings, Zap, Play, Trophy, Users, Compass } from 'lucide-react';
import { DRAFT_STRATEGIES } from '../engine/auctionEngine.js';

export default function Header({ 
  mode, 
  setMode, 
  strategyKey,
  setStrategyKey,
  inflationIndex, 
  onReset, 
  onOpenSettings, 
  onOpenSleeperModal 
}) {
  const getInflationBadgeColor = (idx) => {
    if (idx > 1.1) return 'rgba(239, 68, 68, 0.2)'; // Red - Inflated market
    if (idx < 0.9) return 'rgba(16, 185, 129, 0.2)'; // Green - Deflated market / Bargains
    return 'rgba(59, 130, 246, 0.2)'; // Blue - Balanced
  };

  const getInflationTextColor = (idx) => {
    if (idx > 1.1) return '#f87171';
    if (idx < 0.9) return '#34d399';
    return '#60a5fa';
  };

  return (
    <header className="glass-card" style={{ borderRadius: '0 0 16px 16px', padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            padding: '0.6rem',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)'
          }}>
            <Bot size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AUCTION DRAFT BOT
            </h1>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>
              2026 VALUATION & STRATEGY ENGINE
            </span>
          </div>
        </div>

        {/* Draft Strategy Philosophy Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', padding: '0.35rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <Compass size={16} color="#fbbf24" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>DRAFT STRATEGY</span>
            <select
              value={strategyKey}
              onChange={(e) => setStrategyKey(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {Object.keys(DRAFT_STRATEGIES).map(key => (
                <option key={key} value={key} style={{ background: '#1e293b', color: '#fff' }}>
                  {DRAFT_STRATEGIES[key].name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Inflation Index Metric & Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '10px',
            backgroundColor: getInflationBadgeColor(inflationIndex),
            border: `1px solid ${getInflationTextColor(inflationIndex)}50`
          }}>
            <Zap size={16} color={getInflationTextColor(inflationIndex)} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>ROOM INFLATION</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: getInflationTextColor(inflationIndex), fontFamily: 'var(--font-mono)' }}>
                {(inflationIndex * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setMode('LIVE')}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'LIVE' ? 'var(--accent-blue)' : 'transparent',
                color: mode === 'LIVE' ? '#fff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Live Assistant
            </button>
            <button
              onClick={() => setMode('MOCK')}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                border: 'none',
                background: mode === 'MOCK' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'transparent',
                color: mode === 'MOCK' ? '#fff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <Play size={12} /> AI Mock Sim
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={onOpenSleeperModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#60a5fa',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Users size={14} /> Sleeper Sync
          </button>

          <button
            onClick={onOpenSettings}
            style={{
              padding: '0.45rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
            title="League Settings"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={onReset}
            style={{
              padding: '0.45rem',
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              cursor: 'pointer'
            }}
            title="Reset Draft State"
          >
            <RefreshCw size={18} />
          </button>
        </div>

      </div>
    </header>
  );
}
