import { TabType } from '../types/citationTypes';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <nav className="bg-white px-6 border-b border-gray-200 flex">
      <button
        className={`px-5 py-3 border-none bg-transparent cursor-pointer text-base border-b-4 mb-[-1px] transition-colors ${
          activeTab === 'literature' 
            ? 'border-b-blue-600 text-blue-600 font-medium' 
            : 'border-b-transparent text-gray-700 hover:text-gray-900'
        }`}
        onClick={() => onTabChange('literature')}
      >
        Literature
      </button>
      <button
        className={`px-5 py-3 border-none bg-transparent cursor-pointer text-base border-b-4 mb-[-1px] transition-colors ${
          activeTab === 'authors' 
            ? 'border-b-blue-600 text-blue-600 font-medium' 
            : 'border-b-transparent text-gray-700 hover:text-gray-900'
        }`}
        onClick={() => onTabChange('authors')}
      >
        Authors
      </button>
      <button
        className={`px-5 py-3 border-none bg-transparent cursor-pointer text-base border-b-4 mb-[-1px] transition-colors ${
          activeTab === 'variables' 
            ? 'border-b-blue-600 text-blue-600 font-medium' 
            : 'border-b-transparent text-gray-700 hover:text-gray-900'
        }`}
        onClick={() => onTabChange('variables')}
      >
        Variables
      </button>
    </nav>
  );
} 