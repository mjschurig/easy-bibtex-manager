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
import { RecommendationsView } from './RecommendationsView';
import { BibFileSelector } from './BibFileSelector';

import { EntryCreationModal } from './EntryCreationModal';
import { SemanticScholarImportModal } from './SemanticScholarImportModal';


interface BibFile {
  name: string;
  content: string;
  type?: 'bib' | 'json';
}

export function CitationManager() {
  const { state } = useCitationData();
  const { 
    loadFromCSLJSON,
    saveToCSLJSON,
    importFromBibTeX, 
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
  const [showSemanticScholarModal, setShowSemanticScholarModal] = useState(false);

  // Create refs for stable access to context functions (prevents callback recreation)
  const updateEntryRef = useRef(updateEntry);
  const deleteEntryRef = useRef(deleteEntry);
  const addVariableRef = useRef(addVariable);
  const updateVariableRef = useRef(updateVariable);
  const deleteVariableRef = useRef(deleteVariable);
  
  // Update refs when functions change (but since functions are memoized with empty deps, this should be stable)
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

  // Get existing citation keys for duplicate prevention
  const existingCitationKeys = useMemo(() => {
    const keys = new Set<string>();
    if (state.cite?.data) {
      state.cite.data.forEach((entry: any) => {
        if (entry.id) {
          keys.add(entry.id);
        }
      });
    }
    return keys;
  }, [state.cite?.data]);

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
        // Auto-detect file type
        const isJsonFile = file.name.toLowerCase().endsWith('.json') || 
                          (content.trim().startsWith('[') || content.trim().startsWith('{'));
        
        if (isJsonFile) {
          // Load as CSL-JSON
          await loadFromCSLJSON(content, file.name);
        } else {
          // Load as BibTeX (import)
          await importFromBibTeX(content, file.name);
        }
        
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
  }, [loadFromCSLJSON, importFromBibTeX]);

  const handleOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSaveFile = useCallback(async () => {
    console.log('handleSaveFile', state.isLoaded);
    if (!state.isLoaded) return;

    const cslJsonString = saveToCSLJSON();
    const suggestedName = state.filename?.replace(/\.(bib|json)$/, '.json') || 'bibliography.json';

    // Try to use the File System Access API
    if ('showSaveFilePicker' in window) {
      console.log('showSaveFilePicker', 'showSaveFilePicker' in window);
      try {
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName,
          types: [{
            description: 'CSL-JSON File',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(cslJsonString);
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
    const blob = new Blob([cslJsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.isLoaded, state.filename, saveToCSLJSON]);

  const handleExportToBibTeX = useCallback(async () => {
    if (!state.isLoaded) return;

    const bibtexString = exportToBibTeX();
    const suggestedName = state.filename?.replace(/\.(json|bib)$/, '.bib') || 'bibliography.bib';

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

  const handleImportFromSemanticScholar = useCallback(() => {
    setShowSemanticScholarModal(true);
  }, []);

  const handleCloseCreateEntryModal = useCallback(() => {
    setShowCreateEntryModal(false);
  }, []);

  const handleCloseSemanticScholarModal = useCallback(() => {
    setShowSemanticScholarModal(false);
  }, []);

  const handleCreateNewEntry = useCallback((newEntry: any) => {
    
    // Add the entry to state
    const entryId = addEntry(newEntry);
    
    // Switch to literature tab and start editing the new entry
    setCurrentTab('literature');
    startEditingEntry(entryId);
  }, [addEntry, setCurrentTab, startEditingEntry]);

  const handleImportEntry = useCallback((importedEntry: any) => { 
    // Add the entry to state
    const entryId = addEntry(importedEntry);
    // Switch to literature tab and start editing the new entry
    setCurrentTab('literature');
    startEditingEntry(entryId);    
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
      // Auto-detect file type or use the type from discovery
      const isJsonFile = file.type === 'json' || file.name.toLowerCase().endsWith('.json');
      
      if (isJsonFile) {
        // Load as CSL-JSON
        await loadFromCSLJSON(file.content, file.name);
      } else {
        // Import as BibTeX
        await importFromBibTeX(file.content, file.name);
      }
      
      setShowFileSelector(false);
      setAvailableBibFiles([]);
    } catch (error) {
      alert(`Error loading ${file.name}: ${error}`);
    }
  }, [loadFromCSLJSON, importFromBibTeX]);

  const handleBibFileSelectorCancel = useCallback(() => {
    setShowFileSelector(false);
    setAvailableBibFiles([]);
  }, []);

  const handleCreateNewBib = useCallback(async () => {
    try {
      // Create an empty CSL-JSON file
      await loadFromCSLJSON('[]', 'new-bibliography.json');
      setShowFileSelector(false);
      setAvailableBibFiles([]);
    } catch (error) {
      alert(`Error creating new bibliography: ${error}`);
    }
  }, [loadFromCSLJSON]);



  return (
    <div className="flex flex-col h-screen">
      <input
        ref={fileInputRef}
        type="file"
        accept=".bib,.json"
        className="hidden"
        onChange={handleFileSelect}
      />
      
      <Header
        filename={state.filename || null}
        isLoaded={state.isLoaded}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onExportToBibTeX={handleExportToBibTeX}
        onCreateEntry={handleCreateEntry}
        onImportFromSemanticScholar={handleImportFromSemanticScholar}
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

      {state.view.currentTab === 'recommendations' && (
        <RecommendationsView
          onSelectEntry={handleSelectEntry}
        />
      )}

      {showFileSelector && (
        <BibFileSelector
          files={availableBibFiles}
          onSelect={handleBibFileSelect}
          onCancel={handleBibFileSelectorCancel}
          onFileUpload={handleFileSelect}
          onCreateNew={handleCreateNewBib}
        />
      )}



      <EntryCreationModal
        isOpen={showCreateEntryModal}
        onClose={handleCloseCreateEntryModal}
        onCreateEntry={handleCreateNewEntry}
      />

      <SemanticScholarImportModal
        isOpen={showSemanticScholarModal}
        onClose={handleCloseSemanticScholarModal}
        onImport={handleImportEntry}
        existingCitationKeys={existingCitationKeys}
      />
    </div>
  );
} 