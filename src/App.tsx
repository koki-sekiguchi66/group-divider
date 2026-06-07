import { useState, useEffect } from 'react';
import { Toaster } from 'sonner'
import RegistrationTab from './components/RegistrationTab';
import CheckInTab from './components/CheckInTab';
import DivisionTab from './components/DivisionTab';
import { type Member } from './types';
import { decodeMembersFromUrl } from './utils/share';

const STORAGE_KEY = 'group-divider-v4';

export default function App() {
  const [tab, setTab] = useState<'registration' | 'checkin' | 'division'>('registration');
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const urlData = decodeMembersFromUrl();
    if (urlData) {
      setMembers(urlData);
      setTab('registration'); 
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try { setMembers(JSON.parse(saved)); } catch (e) { console.error(e); }
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  }, [members, isLoaded]);

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 font-sans selection:bg-emerald-200">
      <Toaster position="top-right" richColors />
      <header className="bg-emerald-600 text-white p-4 text-center sticky top-0 z-20 shadow">
        <h1 className="text-lg font-black tracking-widest">GROUP DIVIDER</h1>
      </header>

      <nav className="flex bg-white shadow-sm border-b sticky top-[60px] z-10">
        {[
          { id: 'registration', label: '👤 登録' },
          { id: 'checkin', label: '✅ 受付' },
          { id: 'division', label: '🎯 班分け' }
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${tab === t.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-400 hover:bg-gray-50'}`}>
            {t.label}
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