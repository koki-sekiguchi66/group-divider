import React, { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { type Member, type Gender } from '../types';
import { encodeMembersToUrl } from '../utils/share';

interface Props { members: Member[]; setMembers: React.Dispatch<React.SetStateAction<Member[]>>; }

// ラジオボタン用コンポーネント（propsのみに依存するためモジュールスコープに配置）
function GenderRadios({ current, onChange }: { current: Gender, onChange: (gender: Gender) => void }) {
  return (
    <div className="flex gap-3">
      {(['male', 'female', 'other'] as Gender[]).map(gender => (
        <label key={gender} className="flex items-center gap-1 cursor-pointer text-sm font-bold text-gray-600">
          <input type="radio" checked={current === gender} onChange={() => onChange(gender)} className="w-4 h-4 accent-emerald-600"/>
          {gender === 'male' ? '男' : gender === 'female' ? '女' : '他'}
        </label>
      ))}
    </div>
  );
}

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

  // 複数選択削除用のState
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      const genderIdx = headers.findIndex(h => h.includes('性別'));
      
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

  // 個別削除処理
  const deleteMember = (m: Member) => {
    if (!window.confirm(`${m.name}さんを削除しますか？`)) return;
    setMembers(members.filter(mem => mem.id !== m.id));
    if (editingId === m.id) setEditingId(null);
  };

  // 複数選択削除処理
  const startSelectMode = () => { setSelectMode(true); setSelectedIds(new Set()); setEditingId(null); };
  const cancelSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds(prev => prev.size === members.length ? new Set() : new Set(members.map(m => m.id)));
  };
  const deleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`選択した${selectedIds.size}人を削除しますか？`)) return;
    setMembers(members.filter(m => !selectedIds.has(m.id)));
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  // 登録済みメンバーの共有処理
  const copyShareLink = async () => {
    if (members.length === 0) return alert('共有するメンバーがいません');
    const url = encodeMembersToUrl(members);
    await navigator.clipboard.writeText(url);
    toast.success('共有URLをコピーしました！', {
      description: 'URLにアクセスすると登録済みメンバーが反映されます',
    });
  };

  return (
    <div className="pb-16 relative">
      {/* CSVインポートブロック */}
      <div className="glass-card rounded-2xl p-4 mb-3">
        <label className="block text-xs font-bold text-gray-500 mb-2">GoogleフォームのCSVから一括インポート</label>
        <input 
          type="file" 
          // 複数のMIMEタイプと拡張子を明示的に指定
          accept=".csv, text/csv, application/vnd.ms-excel, application/csv" 
          onChange={handleCSV} 
          className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
        />
      </div>

      {/* 手動追加フォームブロック */}
      <div className="glass-card rounded-2xl p-4 mb-5">
        <label className="block text-xs font-bold text-gray-500 mb-3">手動でメンバーを追加</label>
        <div className="space-y-3">
          <input value={newName} onChange={e => setNewName(e.target.value)} className="glass-input p-2.5 text-sm" placeholder="名前を入力" />
          <GenderRadios current={newGender} onChange={setNewGender} />
          <label className="flex items-center gap-2 font-bold text-amber-700 bg-amber-100/50 backdrop-blur-sm p-2 rounded-xl text-sm cursor-pointer border border-amber-200/60">
            <input type="checkbox" checked={newCore} onChange={e => setNewCore(e.target.checked)} className="w-4 h-4 accent-amber-600"/> ★幹部フラグ
          </label>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleAddManual} className="w-full btn-dark text-sm font-bold py-2.5 rounded-xl">＋ 追加する</motion.button>
        </div>
      </div>

      {/* メンバーリストヘッダー */}
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-bold text-gray-600">登録済み： {members.length}人</div>
        {members.length > 0 && (
          selectMode
            ? <motion.button whileTap={{ scale: 0.95 }} onClick={cancelSelectMode} className="text-xs font-bold text-gray-600 glass-tile px-2.5 py-1.5 rounded-lg">キャンセル</motion.button>
            : <motion.button whileTap={{ scale: 0.95 }} onClick={startSelectMode} className="text-xs font-bold text-red-600 bg-red-100/60 backdrop-blur-sm border border-red-200/50 px-2.5 py-1.5 rounded-lg">選択して削除</motion.button>
        )}
      </div>

      {/* 選択削除ツールバー */}
      {selectMode && (
        <div className="glass-tile rounded-xl p-3 mb-2 flex justify-between items-center">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer">
            <input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === members.length} onChange={toggleSelectAll} className="w-4 h-4 accent-red-600"/>
            全選択（{selectedIds.size}/{members.length}）
          </label>
          <motion.button
            whileTap={selectedIds.size > 0 ? { scale: 0.95 } : undefined}
            onClick={deleteSelected}
            disabled={selectedIds.size === 0}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${selectedIds.size > 0 ? 'text-white bg-red-600' : 'bg-gray-300/70 text-white cursor-not-allowed'}`}
          >
            選択した{selectedIds.size}人を削除
          </motion.button>
        </div>
      )}

      {/* メンバーリスト本体 */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {members.map(m => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -24, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className={`glass-card rounded-2xl p-3 flex justify-between items-center ${selectMode ? 'cursor-pointer' : ''}`}
              onClick={selectMode ? () => toggleSelect(m.id) : undefined}
            >
              {editingId === m.id ? (
                <div className="w-full space-y-3">
                  <input value={editName} onChange={e=>setEditName(e.target.value)} className="glass-input p-2 text-sm" />
                  <GenderRadios current={editGender} onChange={setEditGender} />
                  <label className="flex items-center gap-1 font-bold text-amber-700 text-sm cursor-pointer">
                    <input type="checkbox" checked={editCore} onChange={e=>setEditCore(e.target.checked)} className="w-4 h-4 accent-emerald-600"/> ★幹部
                  </label>
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => setEditingId(null)} className="flex-1 btn-glass text-sm font-bold py-1.5 rounded-lg">戻る</motion.button>
                    <motion.button whileTap={{ scale: 0.96 }} onClick={() => saveEdit(m.id)} className="flex-1 btn-primary text-sm font-bold py-1.5 rounded-lg">保存</motion.button>
                  </div>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => deleteMember(m)} className="w-full text-xs font-bold text-red-600 bg-red-100/60 backdrop-blur-sm border border-red-200/50 py-1.5 rounded-lg">削除する</motion.button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {selectMode && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(m.id)}
                        onChange={() => toggleSelect(m.id)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 accent-red-600"
                      />
                    )}
                    <span className="font-bold">{m.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${m.gender==='male'?'bg-blue-100 text-blue-700':m.gender==='female'?'bg-pink-100 text-pink-700':'bg-gray-100 text-gray-600'}`}>
                      {m.gender==='male'?'男':m.gender==='female'?'女':'他'}
                    </span>
                    {m.core && <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-700">★幹部</span>}
                  </div>
                  {!selectMode && (
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={()=>startEdit(m)} className="glass-tile text-gray-600 text-xs font-bold px-3 py-1.5 rounded-lg">編集</motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={()=>deleteMember(m)} className="text-red-600 bg-red-100/60 backdrop-blur-sm border border-red-200/50 text-xs font-bold px-3 py-1.5 rounded-lg">削除</motion.button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 共有ボタン */}
      <div className="mt-8 text-center bg-white/40 backdrop-blur-md p-4 border border-white/50 rounded-2xl">
        <motion.button whileTap={{ scale: 0.97 }} onClick={copyShareLink} className="w-full btn-primary font-bold py-3 rounded-xl">
          🔗 URLをコピーして登録済みメンバーを共有
        </motion.button>
      </div>
      
    </div>
  );
}