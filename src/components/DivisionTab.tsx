import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { type Member, type DivResult, type DivOptions, type FixedGroup } from '../types';
import { divide } from '../core/divider';
import { resultContainer, teamCard, chipContainer, chip } from '../ui/anim';

export default function DivisionTab({ members }: { members: Member[] }) {
  const [tc, setTc] = useState(3);
  const [divMode, setDivMode] = useState<'random' | 'core'>('random');
  const [balG, setBalG] = useState(true);
  const [fixedGroups, setFixedGroups] = useState<FixedGroup[]>([]);
  const [picking, setPicking] = useState(false);
  const [pickIds, setPickIds] = useState<string[]>([]);
  const [result, setResult] = useState<DivResult | null>(null);
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  // 再シャッフルのたびに増やし、結果ブロックを再マウントして「配り直し」演出を再生する
  const [runId, setRunId] = useState(0);

  const present = members.filter(m => m.checkedIn);
  const canDivide = present.length >= tc;

  // メンバーが削除された場合に備え、現存するメンバーだけの固定グループを表示・利用する（2人未満は無効扱い）
  const activeFixedGroups = fixedGroups
    .map(g => ({ ...g, memberIds: g.memberIds.filter(id => members.some(m => m.id === id)) }))
    .filter(g => g.memberIds.length >= 2);

  const groupedIds = new Set(activeFixedGroups.flatMap(g => g.memberIds));
  const selectableMembers = present.filter(m => !groupedIds.has(m.id));

  const startPicking = () => { setPicking(true); setPickIds([]); };
  const cancelPicking = () => { setPicking(false); setPickIds([]); };
  const togglePick = (id: string) => {
    setPickIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const confirmGroup = () => {
    if (pickIds.length < 2) return;
    setFixedGroups(prev => [...prev, { id: Math.random().toString(36).slice(2, 10), memberIds: pickIds }]);
    setPicking(false);
    setPickIds([]);
  };
  const removeGroup = (id: string) => setFixedGroups(prev => prev.filter(g => g.id !== id));

  const executeDivide = () => {
    if (!canDivide) return;
    const opt: DivOptions = { useCore: divMode === 'core', balG, fixedGroups: activeFixedGroups.map(g => g.memberIds) };
    setResult({ teams: divide(present, tc, opt), useCore: opt.useCore, balG: opt.balG });
    setLockedIds(new Set(groupedIds));
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

      {/* 固定メンバーグループ設定 */}
      <div className="glass-card rounded-2xl p-4 shadow-sm mb-4">
        <div className="text-sm font-bold text-gray-600">🔒 固定メンバー（任意）</div>
        <div className="text-[10px] text-gray-500 mb-3">選んだメンバー同士は必ず同じ班になります。人数によっては班の人数に差が出ることがあります。</div>

        {activeFixedGroups.length > 0 && (
          <div className="space-y-2 mb-3">
            <AnimatePresence initial={false}>
              {activeFixedGroups.map((g, gi) => (
                <motion.div
                  key={g.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  className="glass-tile p-2.5 rounded-xl flex justify-between items-start gap-2"
                >
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold text-violet-500">固定{gi + 1}</span>
                    {g.memberIds.map(id => {
                      const mem = members.find(m => m.id === id);
                      const isPresent = present.some(m => m.id === id);
                      return (
                        <span key={id} className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPresent ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-400 line-through'}`}>
                          {mem?.name ?? '?'}
                        </span>
                      );
                    })}
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => removeGroup(g.id)} className="text-[10px] font-bold text-red-500 shrink-0 px-2 py-1">解除</motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {picking ? (
          <div className="glass-tile p-3 rounded-xl">
            <div className="text-xs font-bold text-gray-500 mb-2">同じ班にするメンバーを選択（2人以上）</div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectableMembers.length === 0 && <div className="text-xs text-gray-400">選択できるメンバーがいません</div>}
              {selectableMembers.map(m => {
                const selected = pickIds.includes(m.id);
                return (
                  <motion.button
                    key={m.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => togglePick(m.id)}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors ${selected ? 'bg-violet-500 text-white border-violet-500' : 'bg-white/60 text-gray-600 border-gray-200'}`}
                  >
                    {m.name}
                  </motion.button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.96 }} onClick={cancelPicking} className="flex-1 btn-glass text-xs font-bold py-2 rounded-lg">キャンセル</motion.button>
              <motion.button
                whileTap={pickIds.length >= 2 ? { scale: 0.96 } : undefined}
                onClick={confirmGroup}
                disabled={pickIds.length < 2}
                className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${pickIds.length < 2 ? 'bg-gray-300/70 text-white cursor-not-allowed' : 'btn-primary'}`}
              >
                この内容で固定する
              </motion.button>
            </div>
          </div>
        ) : (
          <motion.button whileTap={{ scale: 0.97 }} onClick={startPicking} className="w-full btn-glass text-xs font-bold py-2.5 rounded-lg">＋ 固定グループを追加</motion.button>
        )}
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
                      {lockedIds.has(m.id) && <span className="text-violet-500 mr-1">🔒</span>}
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
