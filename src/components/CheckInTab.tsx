import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { type Member } from '../types';
import { listContainer, listItem } from '../ui/anim';

interface Props { members: Member[]; setMembers: React.Dispatch<React.SetStateAction<Member[]>>; }

// 数値が変わるたびにスプリングでポップさせる小さなカウンター表示
function PopCount({ value, className }: { value: number; className: string }) {
  return (
    <div className={`relative ${className} overflow-hidden`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 24 }}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export default function CheckInTab({ members, setMembers }: Props) {
  if (members.length === 0) return <div className="text-center py-10 text-gray-400">登録タブでメンバーを準備してください</div>;

  const toggleCi = (id: string) => setMembers(members.map(m => m.id === id ? { ...m, checkedIn: !m.checkedIn } : m));
  const yes = members.filter(m => m.checkedIn);

  return (
    <div className="pb-16">
      <h2 className="text-lg font-bold mb-3 text-gray-800">出欠確認</h2>
      <div className="flex gap-2 mb-5">
        <div className="flex-1 glass-card rounded-2xl p-3 text-center">
          <PopCount value={yes.length} className="text-2xl font-black text-emerald-600" />
          <div className="text-[11px] font-bold text-gray-500 mt-1">来た ✅</div>
        </div>
        <div className="flex-1 glass-card rounded-2xl p-3 text-center">
          <PopCount value={members.length - yes.length} className="text-2xl font-black text-gray-400" />
          <div className="text-[11px] font-bold text-gray-500 mt-1">まだ ⬜️</div>
        </div>
        <div className="flex-1 glass-card rounded-2xl p-3 text-center">
          <PopCount value={members.length} className="text-2xl font-black text-gray-600" />
          <div className="text-[11px] font-bold text-gray-500 mt-1">全体</div>
        </div>
      </div>

      <div className="text-xs font-bold text-gray-500 mb-2 ml-1">タップで出欠を切替</div>
      <motion.div className="space-y-2" variants={listContainer} initial="hidden" animate="show">
        {members.map(m => (
          <motion.div
            key={m.id} variants={listItem} onClick={() => toggleCi(m.id)}
            whileTap={{ scale: 0.97 }}
            className={`cursor-pointer rounded-2xl p-3.5 flex justify-between items-center shadow-sm border-2 backdrop-blur-xl transition-colors ${m.checkedIn ? 'bg-emerald-300/30 border-emerald-400/70' : 'bg-white/50 border-white/50'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl w-6 text-center inline-flex justify-center">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={m.checkedIn ? 'on' : 'off'}
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 45 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    className="inline-block"
                  >
                    {m.checkedIn ? '✅' : '⬜️'}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="font-bold text-[15px]">{m.name}</span>
              {m.core && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">★</span>}
            </div>
            <span className={`text-xs font-bold ${m.checkedIn ? 'text-emerald-600' : 'text-gray-400'}`}>
              {m.checkedIn ? '到着' : '未着'}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* 出欠の一括操作ボタン群 */}
      <div className="flex gap-3 mt-8">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {if(window.confirm('全員を到着済みにしますか？')) setMembers(members.map(m=>({...m, checkedIn: true})))}}
          className="flex-1 bg-emerald-200/60 backdrop-blur-md border border-emerald-300/50 text-emerald-800 hover:bg-emerald-200/80 text-sm font-bold py-3 rounded-xl transition-colors shadow-sm"
        >
          ✅ 全員出席
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {if(window.confirm('全員を未到着に戻しますか？')) setMembers(members.map(m=>({...m, checkedIn: false})))}}
          className="flex-1 btn-glass hover:bg-white/70 text-sm font-bold py-3 rounded-xl transition-colors"
        >
          ⬜️ 全員リセット
        </motion.button>
      </div>
    </div>
  );
}