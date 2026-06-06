import React from 'react';
import { type Member } from '../types';

interface Props { members: Member[]; setMembers: React.Dispatch<React.SetStateAction<Member[]>>; }

export default function CheckInTab({ members, setMembers }: Props) {
  if (members.length === 0) return <div className="text-center py-10 text-gray-400">登録タブでメンバーを準備してください</div>;

  const toggleCi = (id: string) => setMembers(members.map(m => m.id === id ? { ...m, checkedIn: !m.checkedIn } : m));
  const yes = members.filter(m => m.checkedIn);
  
  return (
    <div className="pb-16 animate-fade-in">
      <h2 className="text-lg font-bold mb-3 text-gray-800">出欠確認</h2>
      <div className="flex gap-2 mb-5">
        <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm border border-emerald-100">
          <div className="text-2xl font-black text-emerald-600">{yes.length}</div>
          <div className="text-[11px] font-bold text-gray-500 mt-1">来た ✅</div>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm">
          <div className="text-2xl font-black text-gray-400">{members.length - yes.length}</div>
          <div className="text-[11px] font-bold text-gray-500 mt-1">まだ ⬜️</div>
        </div>
        <div className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm bg-gray-50">
          <div className="text-2xl font-black text-gray-600">{members.length}</div>
          <div className="text-[11px] font-bold text-gray-500 mt-1">全体</div>
        </div>
      </div>

      <div className="text-xs font-bold text-gray-500 mb-2 ml-1">タップで出欠を切替</div>
      <div className="space-y-2">
        {members.map(m => (
          <div 
            key={m.id} onClick={() => toggleCi(m.id)}
            className={`cursor-pointer rounded-xl p-3.5 flex justify-between items-center shadow-sm border-2 transition-all active:scale-[0.98] ${m.checkedIn ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-transparent'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{m.checkedIn ? '✅' : '⬜️'}</span>
              <span className="font-bold text-[15px]">{m.name}</span>
              {m.core && <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">★</span>}
            </div>
            <span className={`text-xs font-bold ${m.checkedIn ? 'text-emerald-600' : 'text-gray-400'}`}>
              {m.checkedIn ? '到着' : '未着'}
            </span>
          </div>
        ))}
      </div>

      {/* 出欠の一括操作ボタン群 */}
      <div className="flex gap-3 mt-8">
        <button 
          onClick={() => {if(window.confirm('全員を到着済みにしますか？')) setMembers(members.map(m=>({...m, checkedIn: true})))}} 
          className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-sm font-bold py-3 rounded-xl transition-colors shadow-sm"
        >
          ✅ 全員出席
        </button>
        <button 
          onClick={() => {if(window.confirm('全員を未到着に戻しますか？')) setMembers(members.map(m=>({...m, checkedIn: false})))}} 
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-600 text-sm font-bold py-3 rounded-xl transition-colors shadow-sm"
        >
          ⬜️ 全員リセット
        </button>
      </div>
    </div>
  );
}