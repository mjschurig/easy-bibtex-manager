import React, { useState, useCallback, useRef } from 'react';
import { useBibTeX, FilterOptions, useFilteredEntries } from '../hooks/useBibTeX';
import { BibTeXEntry } from '../types/bibtex';
import { Header } from './Header';
import { TabNavigation } from './TabNavigation';
import { LiteratureView } from './LiteratureView';
import { AuthorsView } from './AuthorsView';
import { VariablesView } from './VariablesView';

export type TabType = 'literature' | 'authors' | 'variables';

export function BibTeXManager() {
  const { state, actions, allAuthors } = useBibTeX();
  const [activeTab, setActiveTab] = useState<TabType>('literature');
  const [activeEntryKey, setActiveEntryKey] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    searchText: '',
    authorFilter: '',
    sortBy: 'author',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filteredEntries = useFilteredEntries(state.processedEntries, filters);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        actions.loadFile(content, file.name);
      } catch (error) {
        alert(`Error parsing file: ${error}`);
      }
    };
    reader.onerror = () => {
      alert('Failed to read file.');
    };
    reader.readAsText(file);
  }, [actions]);

  const handleOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSaveFile = useCallback(async () => {
    if (!state.isLoaded) return;

    const bibtexString = actions.exportBibtex();
    const suggestedName = state.filename || 'bibliography.bib';

    // Try to use the File System Access API
    if ('showSaveFilePicker' in window) {
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName,
          types: [{
            description: 'BibTeX File',
            accept: { 'application/x-bibtex': ['.bib'] },
          }],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(bibtexString);
        await writable.close();
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('File System Access API failed:', err);
        } else {
          return;
        }
      }
    }

    // Fallback to download
    const blob = new Blob([bibtexString], { type: 'application/x-bibtex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.isLoaded, state.filename, actions]);

  const handleCreateEntry = useCallback(() => {
    const key = prompt('Enter citation key:');
    if (!key?.trim()) return;

    const newEntry: BibTeXEntry = {
      type: 'article',
      key: key.trim(),
      fields: {
        title: '',
        author: '',
        year: new Date().getFullYear().toString(),
      },
    };

    try {
      actions.addEntry(newEntry);
      setActiveEntryKey(key.trim());
      setActiveTab('literature');
    } catch (error) {
      alert(`Error creating entry: ${error}`);
    }
  }, [actions]);

  const handleUpdateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleSelectEntry = useCallback((key: string) => {
    setActiveEntryKey(key);
    setActiveTab('literature');
  }, []);

  const handleUpdateEntry = useCallback((key: string, updates: Partial<BibTeXEntry>) => {
    try {
      actions.updateEntry(key, updates);
      
      // Update activeEntryKey if the key changed
      if (updates.key && updates.key !== key) {
        setActiveEntryKey(updates.key);
      }
    } catch (error) {
      alert(`Error updating entry: ${error}`);
    }
  }, [actions]);

  const handleDeleteEntry = useCallback((key: string) => {
    const confirmed = confirm(`Are you sure you want to delete the entry "${key}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      actions.deleteEntry(key);
      if (activeEntryKey === key) {
        setActiveEntryKey(null);
      }
    } catch (error) {
      alert(`Error deleting entry: ${error}`);
    }
  }, [actions, activeEntryKey]);

  const handleUpdateStringVariable = useCallback((key: string, value: string) => {
    try {
      actions.updateStringVariable(key, value);
    } catch (error) {
      alert(`Error updating variable: ${error}`);
    }
  }, [actions]);

  return (
    <div className="bibtex-manager">
      <input
        ref={fileInputRef}
        type="file"
        accept=".bib"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      
      <Header
        filename={state.filename}
        isLoaded={state.isLoaded}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onCreateEntry={handleCreateEntry}
      />
      
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      {activeTab === 'literature' && (
        <LiteratureView
          entries={filteredEntries}
          allAuthors={allAuthors}
          filters={filters}
          activeEntryKey={activeEntryKey}
          stringVariables={state.stringVariables}
          onUpdateFilters={handleUpdateFilters}
          onSelectEntry={handleSelectEntry}
          onUpdateEntry={handleUpdateEntry}
          onDeleteEntry={handleDeleteEntry}
        />
      )}
      
      {activeTab === 'authors' && (
        <AuthorsView
          entries={state.processedEntries}
          allAuthors={allAuthors}
          onSelectEntry={handleSelectEntry}
        />
      )}
      
      {activeTab === 'variables' && (
        <VariablesView
          stringVariables={state.stringVariables}
          onUpdateVariable={handleUpdateStringVariable}
          onAddVariable={actions.addStringVariable}
          onDeleteVariable={actions.deleteStringVariable}
        />
      )}
    </div>
  );
} 