import { useState, useEffect } from 'react';
import { Toaster } from 'sonner'
import { motion } from 'motion/react';
import RegistrationTab from './components/RegistrationTab';
import CheckInTab from './components/CheckInTab';
import DivisionTab from './components/DivisionTab';
import { type Member } from './types';
import { decodeMembersFromUrl } from './utils/share';

const STORAGE_KEY = 'group-divider-v4';

type TabId = 'registration' | 'checkin' | 'division';
const TABS: { id: TabId; label: string }[] = [
  { id: 'registration', label: '👤 登録' },
  { id: 'checkin', label: '✅ 受付' },
  { id: 'division', label: '🎯 班分け' },
];

export default function App() {
  const [tab, setTab] = useState<TabId>('registration');
  // 初期メンバーは URL（共有リンク）→ localStorage の順で一度だけ読み込む
  const [members, setMembers] = useState<Member[]>(() => {
    const urlData = decodeMembersFromUrl();
    if (urlData) return urlData;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved) as Member[]; } catch (e) { console.error(e); }
    }
    return [];
  });

  // URL から取り込んだ場合のみ、取り込み後に URL を掃除する（保存は下の永続化 effect が担う）
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('data')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // members の変更を localStorage に永続化
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }, [members]);

  return (
    <div className="relative min-h-screen text-gray-900 font-sans selection:bg-emerald-200">
      {/* 背景：固定のソフトグラデ + ぼかしブロブ（すりガラスが屈折する光源） */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-emerald-50 via-sky-50 to-violet-100">
        <motion.div
          className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-emerald-300/50 blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-sky-300/50 blur-3xl"
          animate={{ x: [0, -35, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-16 left-1/4 h-72 w-72 rounded-full bg-violet-300/40 blur-3xl"
          animate={{ x: [0, 25, 0], y: [0, -25, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <Toaster position="top-right" richColors />

      <header className="sticky top-0 z-20 border-b border-white/40 bg-white/60 p-4 text-center backdrop-blur-xl">
        <h1 className="text-lg font-black tracking-[0.3em] text-emerald-700">GROUP DIVIDER</h1>
      </header>

      <nav className="sticky top-[60px] z-10 flex border-b border-white/40 bg-white/45 backdrop-blur-xl">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`relative flex-1 py-3 text-sm font-bold transition-colors ${tab === t.id ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-500'}`}>
            {t.label}
            {tab === t.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute left-0 right-0 bottom-0 h-0.5 bg-emerald-500"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
          </button>
        ))}
      </nav>

      <main className="max-w-md mx-auto p-4 pt-6">
        {/* 
          タブ切り替え時にコンポーネントを破棄（アンマウント）させず、
          CSSの display: none (hidden) で隠すことで班分け結果や入力途中の状態を完全に維持
        */}
        <div className={tab === 'registration' ? 'block' : 'hidden'}>
          <RegistrationTab members={members} setMembers={setMembers} />
        </div>
        <div className={tab === 'checkin' ? 'block' : 'hidden'}>
          <CheckInTab members={members} setMembers={setMembers} />
        </div>
        <div className={tab === 'division' ? 'block' : 'hidden'}>
          <DivisionTab members={members} />
        </div>
      </main>
    </div>
  );
}