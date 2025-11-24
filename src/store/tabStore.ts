import { create } from 'zustand';

export type TabType = 'search' | 'transcription';

interface TabState {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isHydrated: boolean;
}

export const useTabStore = create<TabState>((set, get) => ({
  activeTab: 'search', // 기본값
  isHydrated: false,
  setActiveTab: (tab) => {
    set({ activeTab: tab });
    // localStorage에 저장 (클라이언트에서만)
    if (typeof window !== 'undefined') {
      localStorage.setItem('youtube-active-tab', tab);
    }
  },
}));

// 클라이언트에서만 localStorage에서 상태 복원
if (typeof window !== 'undefined') {
  const savedTab = localStorage.getItem('youtube-active-tab') as TabType;
  if (savedTab && ['search', 'transcription'].includes(savedTab)) {
    useTabStore.setState({ activeTab: savedTab, isHydrated: true });
  } else {
    useTabStore.setState({ isHydrated: true });
  }
} 