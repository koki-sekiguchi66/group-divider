import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { type Member, type DivResult, type DivOptions } from '../types';
import { divide } from '../core/divider';
import { resultContainer, teamCard, chipContainer, chip } from '../ui/anim';

export default function DivisionTab({ members }: { members: Member[] }) {
  const [tc, setTc] = useState(3);
  const [divMode, setDivMode] = useState<'random' | 'core'>('random');
  const [balG, setBalG] = useState(true);
  const [result, setResult] = useState<DivResult | null>(null);
  const [copied, setCopied] = useState(false);
  // 再シャッフルのたびに増やし、結果ブロックを再マウントして「配り直し」演出を再生する
  const [runId, setRunId] = useState(0);

  const present = members.filter(m => m.checkedIn);
  const canDivide = present.length >= tc;

  const executeDivide = () => {
    if (!canDivide) return;
    const opt: DivOptions = { useCore: divMode === 'core', balG };
    setResult({ teams: divide(present, tc, opt), ...opt });
    setCopied(false);
    setRunId(n => n + 1);
  };

  const copyForLine = async () => {
    if (!result) return;
    const txt = result.teams.map((t, i) => `【${i + 1}班】(${t.length}人)\n${t.map(m => m.name).join('\n')}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(txt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { alert('コピー失敗'); }
  };

  return (
    <div className="pb-16">
      <h2 className="text-lg font-bold mb-3 text-gray-800">グループ分け</h2>

      <div className="glass-card rounded-2xl p-4 shadow-sm mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold text-gray-600">作る班の数</div>
          <div className="flex items-center gap-3">
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setTc(Math.max(2, tc - 1))} className="w-9 h-9 glass-tile rounded-xl text-lg font-bold text-gray-700">−</motion.button>
            <span className="text-2xl font-black w-6 text-center overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={tc}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="inline-block"
                >
                  {tc}
                </motion.span>
              </AnimatePresence>
            </span>
            <motion.button whileTap={{ scale: 0.88 }} onClick={() => setTc(Math.min(10, tc + 1))} className="w-9 h-9 glass-tile rounded-xl text-lg font-bold text-gray-700">＋</motion.button>
          </div>
        </div>

        <div className="text-sm font-bold text-gray-600 mb-2">分散モード</div>
        <div className="flex bg-white/40 backdrop-blur-md border border-white/50 rounded-xl p-1 mb-5">
          <button onClick={() => setDivMode('random')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${divMode === 'random' ? 'bg-white/90 text-emerald-600 shadow-sm' : 'text-gray-500'}`}>🎲 全員ランダム</button>
          <button onClick={() => setDivMode('core')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${divMode === 'core' ? 'bg-white/90 text-emerald-600 shadow-sm' : 'text-gray-500'}`}>👑 幹部を分散</button>
        </div>

        <div className="flex justify-between items-center glass-tile p-3 rounded-xl">
          <div>
            <div className="font-bold text-sm text-gray-700">⚖️ 男女均等</div>
            <div className="text-[10px] text-gray-500">男女を各班に均等に配置</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={balG} onChange={e => setBalG(e.target.checked)} className="sr-only peer"/>
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>

      <motion.button
        whileTap={canDivide ? { scale: 0.97 } : undefined}
        onClick={executeDivide}
        disabled={!canDivide}
        className={`w-full py-3.5 rounded-xl font-bold transition-all ${canDivide ? 'btn-primary' : 'bg-gray-300/70 text-white cursor-not-allowed'}`}
      >
        グループを生成する
      </motion.button>

      {result && (
        <div className="mt-8 pt-6 border-t-2 border-dashed border-white/60">
          <motion.div
            key={runId}
            variants={resultContainer}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {result.teams.map((team, i) => (
              <motion.div key={i} variants={teamCard} className="glass-card rounded-2xl p-4">
                <div className="font-black text-emerald-700 mb-2">{i + 1}班 <span className="text-xs text-gray-400">({team.length}人)</span></div>
                <motion.div variants={chipContainer} className="flex flex-wrap gap-2">
                  {team.map(m => (
                    <motion.span key={m.id} variants={chip} className="glass-tile px-2.5 py-1 rounded-lg text-sm font-bold text-gray-700">
                      {m.core && <span className="text-amber-500 mr-1">★</span>}{m.name}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
          <div className="flex gap-2 mt-4">
            <motion.button whileTap={{ scale: 0.96 }} onClick={executeDivide} className="flex-1 btn-glass font-bold py-3 rounded-xl text-sm">🔄 再シャッフル</motion.button>
            <motion.button whileTap={{ scale: 0.96 }} onClick={copyForLine} className={`flex-1 font-bold py-3 rounded-xl text-white text-sm transition-colors ${copied ? 'btn-primary' : 'btn-dark'}`}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={copied ? 'done' : 'copy'}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="inline-block"
                >
                  {copied ? '✅ コピー済み' : '📋 コピーして共有'}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}