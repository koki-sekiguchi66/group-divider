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
  const [showToast, setShowToast] = useState(false);

  // ラジオボタン用コンポーネント
  const GenderRadios = ({ current, onChange }: { current: Gender, onChange: (gender: Gender) => void }) => (
    <div className="flex gap-3">
      {(['male', 'female', 'other'] as Gender[]).map(gender => (
        <label key={gender} className="flex items-center gap-1 cursor-pointer text-sm font-bold text-gray-600">
          <input type="radio" checked={current === gender} onChange={() => onChange(gender)} className="w-4 h-4 accent-emerald-600"/>
          {gender === 'male' ? '男' : gender === 'female' ? '女' : '他'}
        </label>
      ))}
    </div>
  );

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
      
      // ① 「名前」列のインデックスを特定（見つからなければデフォルトで2列目とする）
      let nameIdx = headers.findIndex(h => h.includes('名前') || h.includes('氏名'));
      if(nameIdx === -1) nameIdx = 1; 

      // ② 「性別」列のインデックスを特定
      let genderIdx = headers.findIndex(h => h.includes('性別'));
      
      const newMembers: Member[] = [];
      for(let i = 1; i < lines.length; i++){
        const cols = lines[i].split(',');
        
        // 名前の抽出
        const name = cols[nameIdx] ? cols[nameIdx].replace(/^"|"$/g, '').trim() : '';
        
        // ③ 性別の抽出と内部型への変換
        let mappedGender: Gender = 'male'; // デフォルト値
        if (genderIdx !== -1 && cols[genderIdx]) {
          // 不要な空白やクォーテーションを削除
          const rawGender = cols[genderIdx].replace(/^"|"$/g, '').trim();
          
          // 「女性」「女」などの文字列が含まれていれば female に変換
          if (rawGender.includes('女')) {
            mappedGender = 'female';
          } else if (rawGender.includes('男')) {
            mappedGender = 'male';
          } else {
            mappedGender = 'other';
          }
        }

        // 名前が存在する場合のみメンバーとして追加
        if(name) {
          newMembers.push({ 
            id: Math.random().toString(36).slice(2, 10), 
            name, 
            gender: mappedGender, // 変換した性別を適用
            core: false, 
            checkedIn: false 
          });
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

  // 登録済みメンバーの共有処理
  const copyShareLink = async () => {
    if (members.length === 0) return alert('共有するメンバーがいません');
    const url = encodeMembersToUrl(members);
    await navigator.clipboard.writeText(url);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="pb-16 animate-fade-in relative">
      {/* CSVインポートブロック */}
      <div className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
        <label className="block text-xs font-bold text-gray-500 mb-2">GoogleフォームのCSVから一括インポート</label>
        <input type="file" accept=".csv" onChange={handleCSV} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
      </div>

      {/* 手動追加フォームブロック */}
      <div className="bg-white rounded-xl p-4 mb-5 shadow-sm border border-gray-100">
        <label className="block text-xs font-bold text-gray-500 mb-3">手動でメンバーを追加</label>
        <div className="space-y-3">
          <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm" placeholder="名前を入力" />
          <GenderRadios current={newGender} onChange={setNewGender} />
          <label className="flex items-center gap-2 font-bold text-amber-700 bg-amber-50 p-2 rounded-lg text-sm cursor-pointer border border-amber-100">
            <input type="checkbox" checked={newCore} onChange={e => setNewCore(e.target.checked)} className="w-4 h-4 accent-amber-600"/> ★幹部フラグ
          </label>
          <button onClick={handleAddManual} className="w-full bg-gray-800 text-white text-sm font-bold py-2.5 rounded-lg">＋ 追加する</button>
        </div>
      </div>

      {/* メンバーリストヘッダー */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-bold text-gray-600">登録済み： {members.length}人</div>
        {members.length > 0 && <button onClick={() => {if(window.confirm('全員削除しますか？')) setMembers([])}} className="text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1.5 rounded">全員削除</button>}
      </div>

      {/* メンバーリスト本体 */}
      <div className="space-y-2">
        {members.map(m => (
          <div key={m.id} className="bg-white rounded-lg p-3 flex justify-between items-center shadow-sm border border-gray-100">
            {editingId === m.id ? (
              <div className="w-full space-y-3">
                <input value={editName} onChange={e=>setEditName(e.target.value)} className="w-full border rounded p-2 text-sm" />
                <GenderRadios current={editGender} onChange={setEditGender} />
                <label className="flex items-center gap-1 font-bold text-amber-700 text-sm cursor-pointer">
                  <input type="checkbox" checked={editCore} onChange={e=>setEditCore(e.target.checked)} className="w-4 h-4 accent-emerald-600"/> ★幹部
                </label>
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-100 text-sm font-bold py-1.5 rounded">戻る</button>
                  <button onClick={() => saveEdit(m.id)} className="flex-1 bg-emerald-600 text-white text-sm font-bold py-1.5 rounded">保存</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{m.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.gender==='male'?'bg-blue-100 text-blue-700':m.gender==='female'?'bg-pink-100 text-pink-700':'bg-gray-100 text-gray-600'}`}>
                    {m.gender==='male'?'男':m.gender==='female'?'女':'他'}
                  </span>
                  {m.core && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">★幹部</span>}
                </div>
                <button onClick={()=>startEdit(m)} className="text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded">編集</button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 共有ボタン */}
      <div className="mt-8 text-center bg-emerald-50 p-4 border border-emerald-200 border-dashed rounded-xl">
        <button onClick={copyShareLink} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg shadow-sm">
          🔗 URLをコピーして登録済みメンバーを共有
        </button>
      </div>

      {/* 共有時のカスタムトースト通知 */}
      {showToast && (
        <div className="fixed top-20 right-4 z-50 w-full max-w-xs bg-emerald-600 text-white p-5 rounded-2xl shadow-2xl animate-fade-in-up text-center">
          <div className="text-xl font-black mb-1">共有URLをコピーしました！</div>
          <div className="text-sm font-bold opacity-90">URLにアクセスすると登録済みメンバーが反映されます</div>
        </div>
      )}
    </div>
  );
}