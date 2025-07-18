import { TabType } from './BibTeXManager';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="tab-nav">
      <button
        className={`tab-btn ${activeTab === 'literature' ? 'active' : ''}`}
        onClick={() => onTabChange('literature')}
      >
        Literature
      </button>
      <button
        className={`tab-btn ${activeTab === 'authors' ? 'active' : ''}`}
        onClick={() => onTabChange('authors')}
      >
        Authors
      </button>
      <button
        className={`tab-btn ${activeTab === 'variables' ? 'active' : ''}`}
        onClick={() => onTabChange('variables')}
      >
        Variables
      </button>
    </nav>
  );
} 