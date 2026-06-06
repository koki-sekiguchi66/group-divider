import { useState } from 'react';
import { type Member, type DivResult, type DivOptions } from '../types';
import { divide } from '../core/divider';

export default function DivisionTab({ members }: { members: Member[] }) {
  const [tc, setTc] = useState(3);
  const [divMode, setDivMode] = useState<'random' | 'core'>('random');
  const [balG, setBalG] = useState(true);
  const [result, setResult] = useState<DivResult | null>(null);
  const [copied, setCopied] = useState(false);

  const present = members.filter(m => m.checkedIn);
  const canDivide = present.length >= tc;

  const executeDivide = () => {
    if (!canDivide) return;
    const opt: DivOptions = { useCore: divMode === 'core', balG };
    setResult({ teams: divide(present, tc, opt), ...opt });
    setCopied(false);
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
    <div className="pb-16 animate-fade-in">
      <h2 className="text-lg font-bold mb-3 text-gray-800">班分けの実行（担当者用）</h2>
      
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-bold text-gray-600">作る班の数</div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTc(Math.max(2, tc - 1))} className="w-9 h-9 bg-gray-100 rounded-lg text-lg font-bold">−</button>
            <span className="text-2xl font-black w-6 text-center">{tc}</span>
            <button onClick={() => setTc(Math.min(10, tc + 1))} className="w-9 h-9 bg-gray-100 rounded-lg text-lg font-bold">＋</button>
          </div>
        </div>

        <div className="text-sm font-bold text-gray-600 mb-2">分散モード</div>
        <div className="flex bg-gray-100 rounded-lg p-1 mb-5">
          <button onClick={() => setDivMode('random')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${divMode === 'random' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>🎲 ランダム</button>
          <button onClick={() => setDivMode('core')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${divMode === 'core' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>👑 幹部分散</button>
        </div>

        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
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

      <button onClick={executeDivide} disabled={!canDivide} className={`w-full py-3.5 rounded-xl font-bold text-white shadow-sm transition-all active:scale-[0.98] ${canDivide ? 'bg-emerald-600' : 'bg-gray-300'}`}>
        グループを生成する
      </button>

      {result && (
        <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200 animate-fade-in">
          <div className="space-y-3">
            {result.teams.map((team, i) => (
              <div key={i} className="bg-white border-2 border-emerald-50 rounded-xl p-4 shadow-sm">
                <div className="font-black text-emerald-700 mb-2">{i + 1}班 <span className="text-xs text-gray-400">({team.length}人)</span></div>
                <div className="flex flex-wrap gap-2">
                  {team.map(m => (
                    <span key={m.id} className="bg-gray-50 border border-gray-100 px-2 py-1 rounded text-sm font-bold text-gray-700">
                      {m.core && <span className="text-amber-500 mr-1">★</span>}{m.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={executeDivide} className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-sm">🔄 再シャッフル</button>
            <button onClick={copyForLine} className={`flex-1 font-bold py-3 rounded-xl text-white text-sm transition-all ${copied ? 'bg-emerald-500' : 'bg-gray-800'}`}>
              {copied ? '✅ コピー済み' : '📋 コピーして共有'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}