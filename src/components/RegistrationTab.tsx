import React, { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { type Member, type Gender } from '../types';
import { encodeMembersToUrl } from '../utils/share';

interface Props { members: Member[]; setMembers: React.Dispatch<React.SetStateAction<Member[]>>; }

const GENDER_ORDER: Gender[] = ['male', 'female', 'other'];
const genderLabel = (g: Gender) => g === 'male' ? '男' : g === 'female' ? '女' : '他';
const genderClass = (g: Gender) =>
  g === 'male' ? 'bg-blue-100 text-blue-700' : g === 'female' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-600';

// ラジオボタン用コンポーネント（propsのみに依存するためモジュールスコープに配置）
function GenderRadios({ current, onChange }: { current: Gender, onChange: (gender: Gender) => void }) {
  return (
    <div className="flex gap-3">
      {GENDER_ORDER.map(gender => (
        <label key={gender} className="flex items-center gap-1 cursor-pointer text-sm font-bold text-gray-600">
          <input type="radio" checked={current === gender} onChange={() => onChange(gender)} className="w-4 h-4 accent-emerald-600"/>
          {genderLabel(gender)}
        </label>
      ))}
    </div>
  );
}

export default function RegTab({ members, setMembers }: Props) {
  // 名前のインライン編集用のState（名前をタップすると編集開始）
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // タグ編集パネルを開いているメンバー
  const [tagPanelId, setTagPanelId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');

  // 手動追加用のState
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<Gender>('male');
  const [newCore, setNewCore] = useState(false);

  // 複数選択削除用のState
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 登録済みメンバー全体で使われているタグの一覧
  const allTags = Array.from(new Set(members.flatMap(m => m.tags ?? []))).sort();

  const updateMember = (id: string, patch: Partial<Member>) =>
    setMembers(members.map(m => m.id === id ? { ...m, ...patch } : m));

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
            checkedIn: false,
            tags: []
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
      checkedIn: false,
      tags: []
    };
    setMembers([...members, newMember]);
    setNewName(''); // 名前のみリセット（連続入力しやすくするため性別・幹部は保持）
    setNewCore(false);
  };

  // 名前のインライン編集
  const startEditName = (m: Member) => { setEditingId(m.id); setEditName(m.name); };
  const commitEditName = (id: string) => {
    const trimmed = editName.trim();
    if (trimmed) updateMember(id, { name: trimmed });
    setEditingId(null);
  };

  // ワンタップ切り替え
  const cycleGender = (m: Member) =>
    updateMember(m.id, { gender: GENDER_ORDER[(GENDER_ORDER.indexOf(m.gender) + 1) % GENDER_ORDER.length] });
  const toggleCore = (m: Member) => updateMember(m.id, { core: !m.core });
  const toggleTag = (m: Member, tag: string) => {
    const current = m.tags ?? [];
    updateMember(m.id, { tags: current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag] });
  };
  const addNewTag = (m: Member) => {
    const tag = newTag.trim();
    if (!tag) return;
    if (!(m.tags ?? []).includes(tag)) updateMember(m.id, { tags: [...(m.tags ?? []), tag] });
    setNewTag('');
  };

  // 個別削除処理
  const deleteMember = (m: Member) => {
    if (!window.confirm(`${m.name}さんを削除しますか？`)) return;
    setMembers(members.filter(mem => mem.id !== m.id));
    if (editingId === m.id) setEditingId(null);
    if (tagPanelId === m.id) setTagPanelId(null);
  };

  // 複数選択削除処理
  const startSelectMode = () => { setSelectMode(true); setSelectedIds(new Set()); setEditingId(null); setTagPanelId(null); };
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

      {!selectMode && members.length > 0 && (
        <div className="text-[10px] text-gray-500 mb-2">名前をタップで編集／性別・タグをタップで切り替え</div>
      )}

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
          {members.map(m => {
            const tags = m.tags ?? [];
            return (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                className={`glass-card rounded-2xl p-3 ${selectMode ? 'cursor-pointer' : ''}`}
                onClick={selectMode ? () => toggleSelect(m.id) : undefined}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    {selectMode && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(m.id)}
                        onChange={() => toggleSelect(m.id)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 accent-red-600 shrink-0"
                      />
                    )}

                    {/* 名前：タップでインライン編集 */}
                    {editingId === m.id && !selectMode ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={() => commitEditName(m.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitEditName(m.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="glass-input px-2 py-1 text-sm font-bold w-32"
                      />
                    ) : (
                      <button
                        onClick={() => !selectMode && startEditName(m)}
                        className="font-bold text-left px-1 -mx-1 rounded hover:bg-white/60 transition-colors"
                      >
                        {m.name}
                      </button>
                    )}

                    {/* 性別：タップで 男→女→他 と切り替え */}
                    <button
                      onClick={() => !selectMode && cycleGender(m)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${genderClass(m.gender)}`}
                    >
                      {genderLabel(m.gender)}
                    </button>

                    {/* 幹部：タップでON/OFF */}
                    <button
                      onClick={() => !selectMode && toggleCore(m)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold border transition-colors ${m.core ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-transparent text-gray-400 border-gray-300 border-dashed'}`}
                    >
                      ★幹部
                    </button>

                    {/* 付与済みタグ：タップで外す */}
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => !selectMode && toggleTag(m, tag)}
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-violet-100 text-violet-700 border border-violet-200"
                      >
                        {tag}
                      </button>
                    ))}

                    {!selectMode && (
                      <button
                        onClick={() => setTagPanelId(tagPanelId === m.id ? null : m.id)}
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold text-gray-500 border border-gray-300 border-dashed hover:bg-white/60 transition-colors"
                      >
                        ＋タグ
                      </button>
                    )}
                  </div>

                  {!selectMode && (
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => deleteMember(m)} className="shrink-0 text-red-600 bg-red-100/60 backdrop-blur-sm border border-red-200/50 text-xs font-bold px-3 py-1.5 rounded-lg">削除</motion.button>
                  )}
                </div>

                {/* タグ編集パネル */}
                {tagPanelId === m.id && !selectMode && (
                  <div className="mt-3 pt-3 border-t border-white/60 space-y-2">
                    {allTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {allTags.map(tag => {
                          const on = tags.includes(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => toggleTag(m, tag)}
                              className={`text-[10px] px-2 py-1 rounded-full font-bold border transition-colors ${on ? 'bg-violet-500 text-white border-violet-500' : 'bg-white/60 text-gray-600 border-gray-200'}`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        value={newTag}
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addNewTag(m); }}
                        placeholder="新しいタグ（例：肉奉行）"
                        className="glass-input px-2 py-1.5 text-xs flex-1"
                      />
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => addNewTag(m)} className="btn-primary text-xs font-bold px-3 py-1.5 rounded-lg shrink-0">追加</motion.button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
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
