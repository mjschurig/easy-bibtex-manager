import React, { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import { 
  useCitationData, 
  useCitationActions, 
  useAuthors
} from '../hooks/useCitation';
import { Header } from './Header';
import { TabNavigation } from './TabNavigation';
import { LiteratureView } from './LiteratureView';
import { AuthorsView } from './AuthorsView';
import { VariablesView } from './VariablesView';
import { BibFileSelector } from './BibFileSelector';

import { EntryCreationModal } from './EntryCreationModal';


interface BibFile {
  name: string;
  content: string;
}

export function CitationManager() {
  const { state } = useCitationData();
  const { 
    loadFromBibTeX, 
    exportToBibTeX, 
    addEntry, 
    updateEntry, 
    deleteEntry,
    addVariable,
    updateVariable,
    deleteVariable,
    setCurrentTab,
    startEditingEntry
  } = useCitationActions();
  const { authors: allAuthors } = useAuthors();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [availableBibFiles, setAvailableBibFiles] = useState<BibFile[]>([]);
  const [showFileSelector, setShowFileSelector] = useState(false);

  const [showCreateEntryModal, setShowCreateEntryModal] = useState(false);

  // Create refs for stable access to context functions (prevents callback recreation)
  const updateEntryRef = useRef(updateEntry);
  const deleteEntryRef = useRef(deleteEntry);
  const addVariableRef = useRef(addVariable);
  const updateVariableRef = useRef(updateVariable);
  const deleteVariableRef = useRef(deleteVariable);
  
  // Update refs when functions change
  useEffect(() => {
    updateEntryRef.current = updateEntry;
    deleteEntryRef.current = deleteEntry;
    addVariableRef.current = addVariable;
    updateVariableRef.current = updateVariable;
    deleteVariableRef.current = deleteVariable;
  }, [updateEntry, deleteEntry, addVariable, updateVariable, deleteVariable]);

  // Memoize expensive computations to prevent recreation on every render
  const variablesArray = useMemo(() => 
    Object.entries(state.variables).map(([key, value]) => ({ key, value })),
    [state.variables]
  );

  // Show file selector on startup if no file is loaded
  useEffect(() => {
    if (!state.isLoaded) {
      setShowFileSelector(true);
    }
  }, [state.isLoaded]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        await loadFromBibTeX(content, file.name);
        setShowFileSelector(false); // Close the selector after successful load
        setAvailableBibFiles([]);
      } catch (error) {
        alert(`Error parsing file: ${error}`);
      }
    };
    reader.onerror = () => {
      alert('Failed to read file.');
    };
    reader.readAsText(file);
  }, [loadFromBibTeX]);

  const handleOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSaveFile = useCallback(async () => {
    if (!state.isLoaded) return;

    const bibtexString = exportToBibTeX();
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
  }, [state.isLoaded, state.filename, exportToBibTeX]);

  const handleCreateEntry = useCallback(() => {
    setShowCreateEntryModal(true);
  }, []);

  const handleCloseCreateEntryModal = useCallback(() => {
    setShowCreateEntryModal(false);
  }, []);

  const handleCreateNewEntry = useCallback((newEntry: any) => {
    console.log('Creating new entry:', newEntry);
    
    // Add the entry to state
    const entryId = addEntry(newEntry);
    console.log('Added entry with ID:', entryId);
    
    // Switch to literature tab and start editing the new entry
    setCurrentTab('literature');
    startEditingEntry(entryId);
    
    console.log('New entry created and opened for editing');
  }, [addEntry, setCurrentTab, startEditingEntry]);

  const handleSelectEntry = useCallback(() => {
    // In the new system, this would be handled by selection state
    // For now, we can focus on the literature tab
    setCurrentTab('literature');
  }, [setCurrentTab]);

  const handleUpdateEntry = useCallback(async (id: string, updates: any) => {
    try {
      await updateEntryRef.current(id, updates);
    } catch (error) {
      alert(`Error updating entry: ${error}`);
    }
  }, []);

  const handleDeleteEntry = useCallback((id: string) => {
    const confirmed = confirm(`Are you sure you want to delete the entry "${id}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      deleteEntryRef.current(id);
    } catch (error) {
      alert(`Error deleting entry: ${error}`);
    }
  }, []);

  const handleUpdateVariable = useCallback(async (key: string, value: string) => {
    try {
      await updateVariableRef.current(key, value);
    } catch (error) {
      alert(`Error updating variable: ${error}`);
    }
  }, []);

  const handleAddVariable = useCallback(async (key: string, value: string) => {
    try {
      await addVariableRef.current(key, value);
    } catch (error) {
      alert(`Error adding variable: ${error}`);
    }
  }, []);

  const handleDeleteVariable = useCallback((key: string) => {
    try {
      deleteVariableRef.current(key);
    } catch (error) {
      alert(`Error deleting variable: ${error}`);
    }
  }, []);

  const handleBibFileSelect = useCallback(async (file: BibFile) => {
    try {
      await loadFromBibTeX(file.content, file.name);
      setShowFileSelector(false);
      setAvailableBibFiles([]);
    } catch (error) {
      alert(`Error loading ${file.name}: ${error}`);
    }
  }, [loadFromBibTeX]);

  const handleBibFileSelectorCancel = useCallback(() => {
    setShowFileSelector(false);
    setAvailableBibFiles([]);
  }, []);



  return (
    <div className="flex flex-col h-screen">
      <input
        ref={fileInputRef}
        type="file"
        accept=".bib"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <Header
        filename={state.filename || null}
        isLoaded={state.isLoaded}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onCreateEntry={handleCreateEntry}
      />
      
      <TabNavigation
        activeTab={state.view.currentTab}
        onTabChange={setCurrentTab}
      />
      
      {state.view.currentTab === 'literature' && (
        <LiteratureView
          onSelectEntry={handleSelectEntry}
          onUpdateEntry={handleUpdateEntry}
          onDeleteEntry={handleDeleteEntry}
        />
      )}
      
      {state.view.currentTab === 'authors' && (
        <AuthorsView
          entries={state.cite.data}
          allAuthors={allAuthors}
          onSelectEntry={handleSelectEntry}
        />
      )}
      
      {state.view.currentTab === 'variables' && (
        <VariablesView
          variables={variablesArray}
          onUpdateVariable={handleUpdateVariable}
          onAddVariable={handleAddVariable}
          onDeleteVariable={handleDeleteVariable}
        />
      )}

      {showFileSelector && (
        <BibFileSelector
          files={availableBibFiles}
          onSelect={handleBibFileSelect}
          onCancel={handleBibFileSelectorCancel}
          onFileUpload={handleFileSelect}
        />
      )}



      <EntryCreationModal
        isOpen={showCreateEntryModal}
        onClose={handleCloseCreateEntryModal}
        onCreateEntry={handleCreateNewEntry}
      />
    </div>
  );
} 