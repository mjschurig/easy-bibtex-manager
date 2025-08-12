interface HeaderProps {
  filename: string | null;
  isLoaded: boolean;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onCreateEntry: () => void;
  onImportFromSemanticScholar: () => void;
}

import { Dropdown } from './ui/Dropdown';

export function Header({ isLoaded, onOpenFile, onSaveFile, onCreateEntry, onImportFromSemanticScholar }: HeaderProps) {
  const newDropdownOptions = [
    {
      id: 'create-entry',
      label: 'Create Entry',
      onClick: onCreateEntry,
      disabled: !isLoaded
    },
    {
      id: 'import-semantic-scholar',
      label: 'Import from Semantic Scholar',
      onClick: onImportFromSemanticScholar,
      disabled: !isLoaded
    }
  ];

  return (
    <header className="bg-white px-6 py-4 border-b border-gray-200 shadow-sm flex justify-between items-center z-10">
      <h1 className="text-2xl font-semibold text-gray-900 m-0">BibTeX Manager</h1>
      <div className="flex gap-4 items-center">
        <button 
          className="px-4 py-2 text-base border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer"
          onClick={onOpenFile}
        >
          Open .bib File
        </button>
        <Dropdown
          trigger={
            <button 
              className={`px-4 py-2 text-base border border-blue-600 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              disabled={!isLoaded}
            >
              New
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          }
          options={newDropdownOptions}
          disabled={!isLoaded}
        />
        <button 
          className="px-4 py-2 text-base border border-blue-600 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onSaveFile} 
          disabled={!isLoaded}
        >
          Save
        </button>
      </div>
    </header>
  );
} 