import React, { useState } from 'react';
import { type Member, type Gender } from '../types';
import { encodeMembersToUrl } from '../utils/share';

interface Props { members: Member[]; setMembers: React.Dispatch<React.SetStateAction<Member[]>>; }

export default function RegTab({ members, setMembers }: Props) {
  // インライン編集用のState
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState<Gender>('male');
  const [editCore, setEditCore] = useState(false);

  // 手動追加用のState
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<Gender>('male');
  const [newCore, setNewCore] = useState(false);

  // CSVインポート処理
  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
      if (lines.length <= 1) return alert('データが見つかりません');
      
      const headers = lines[0].split(',');
      let nameIdx = headers.findIndex(h => h.includes('名前') || h.includes('氏名'));
      if(nameIdx === -1) nameIdx = 1; 
      
      const newMembers: Member[] = [];
      for(let i=1; i<lines.length; i++){
        const cols = lines[i].split(',');
        const name = cols[nameIdx] ? cols[nameIdx].replace(/^"|"$/g, '').trim() : '';
        if(name) {
          newMembers.push({ id: Math.random().toString(36).slice(2, 10), name, gender: 'male', core: false, checkedIn: false });
        }
      }
      setMembers([...members, ...newMembers]);
      alert(`${newMembers.length}名のメンバーをインポートしました。`);
    };
    reader.readAsText(file);
    e.target.value = ''; // フォームリセット
  };

  // 手動追加処理
  const handleAddManual = () => {
    if (!newName.trim()) return alert('名前を入力してください');
    const newMember: Member = {
      id: Math.random().toString(36).slice(2, 10),
      name: newName.trim(),
      gender: newGender,
      core: newCore,
      checkedIn: false
    };
    setMembers([...members, newMember]);
    setNewName(''); // 名前のみリセット（連続入力しやすくするため性別・幹部は保持）
    setNewCore(false);
  };

  // 編集開始・保存処理
  const startEdit = (m: Member) => { setEditingId(m.id); setEditName(m.name); setEditGender(m.gender); setEditCore(m.core); };
  const saveEdit = (id: string) => {
    if(!editName.trim()) return alert('名前を入力してください');
    setMembers(members.map(m => m.id === id ? { ...m, name: editName, gender: editGender, core: editCore } : m));
    setEditingId(null);
  };

  // LINE共有処理
  const copyShareLink = async () => {
    if (members.length === 0) return alert('共有するメンバーがいません');
    const url = encodeMembersToUrl(members);
    try {
      await navigator.clipboard.writeText(url);
      alert('共有URLをコピーしました！');
    } catch {
      prompt('以下のURLを共有すると登録済みメンバーが反映されます', url);
    }
  };

  return (
    <div className="pb-16 animate-fade-in">
      <h2 className="text-lg font-bold mb-3 text-gray-800">事前準備（主催者用）</h2>
      
      {/* 1. CSVインポートブロック */}
      <div className="bg-white rounded-xl p-4 mb-3 shadow-sm">
        <label className="block text-xs font-bold text-gray-500 mb-2">GoogleフォームのCSVから一括インポート</label>
        <input type="file" accept=".csv" onChange={handleCSV} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
      </div>

      {/* 2. 手動追加フォームブロック */}
      <div className="bg-white rounded-xl p-4 mb-5 shadow-sm border border-gray-100">
        <label className="block text-xs font-bold text-gray-500 mb-2">手動でメンバーを追加</label>
        <div className="space-y-2">
          <input 
            value={newName} 
            onChange={e => setNewName(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAddManual()}
            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" 
            placeholder="名前を入力"
          />
          <div className="flex gap-2">
            <select 
              value={newGender} 
              onChange={e => setNewGender(e.target.value as Gender)} 
              className="border border-gray-300 rounded-lg p-2.5 flex-1 text-sm bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">他</option>
            </select>
            <label className="flex items-center gap-1 font-bold text-amber-700 flex-1 justify-center bg-amber-50 rounded-lg text-sm cursor-pointer border border-amber-100 select-none hover:bg-amber-100 transition-colors">
              <input 
                type="checkbox" 
                checked={newCore} 
                onChange={e => setNewCore(e.target.checked)} 
                className="w-4 h-4 accent-amber-600 cursor-pointer"
              /> ★幹部
            </label>
          </div>
          <button 
            onClick={handleAddManual} 
            className="w-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold py-2.5 rounded-lg mt-1 transition-colors active:scale-[0.98]"
          >
            ＋ 追加する
          </button>
        </div>
      </div>

      {/* 3. メンバーリストヘッダー */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-bold text-gray-600">登録済みメンバー： {members.length}人</div>
        {members.length > 0 && (
          <button onClick={() => {if(window.confirm('全員削除しますか？')) setMembers([])}} className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded transition-colors">
            全員削除
          </button>
        )}
      </div>

      {/* 4. メンバーリスト本体 */}
      <div className="space-y-2">
        {members.length === 0 && <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">メンバーが登録されていません</div>}
        {members.map(m => (
          <div key={m.id} className="bg-white rounded-lg p-3 flex justify-between items-center shadow-sm border border-gray-100">
            {editingId === m.id ? (
              <div className="w-full space-y-2">
                <input value={editName} onChange={e=>setEditName(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="名前"/>
                <div className="flex gap-2">
                  <select value={editGender} onChange={e=>setEditGender(e.target.value as Gender)} className="border border-gray-300 rounded p-2 flex-1 text-sm bg-white">
                    <option value="male">男</option><option value="female">女</option><option value="other">他</option>
                  </select>
                  <label className="flex items-center gap-1 font-bold text-amber-700 flex-1 justify-center bg-amber-50 rounded text-sm cursor-pointer border border-amber-100">
                    <input type="checkbox" checked={editCore} onChange={e=>setEditCore(e.target.checked)} className="w-4 h-4 accent-amber-600 cursor-pointer"/> ★幹部
                  </label>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold py-1.5 rounded transition-colors">キャンセル</button>
                  <button onClick={() => saveEdit(m.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-1.5 rounded transition-colors">保存</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{m.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.gender==='male'?'bg-blue-100 text-blue-700':m.gender==='female'?'bg-pink-100 text-pink-700':'bg-gray-100 text-gray-600'}`}>{m.gender==='male'?'男':m.gender==='female'?'女':'他'}</span>
                  {m.core && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">★幹部</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>startEdit(m)} className="text-gray-500 hover:text-gray-700 text-xs font-bold bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors">編集</button>
                  <button onClick={()=>{if(window.confirm('削除しますか？')) setMembers(members.filter(x=>x.id!==m.id))}} className="text-red-400 hover:text-red-600 font-bold px-2 transition-colors">✕</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 5. 共有ボタン */}
      <div className="mt-8 text-center bg-emerald-50 p-4 border border-emerald-200 border-dashed rounded-xl">
        <button onClick={copyShareLink} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-sm active:scale-[0.98] transition-all">
          🔗 登録済みメンバーを共有
        </button>
      </div>
    </div>
  );
}