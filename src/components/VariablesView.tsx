import { useState, useMemo } from 'react';
import { StringVariables } from '../types/bibtex';

interface VariablesViewProps {
  stringVariables: StringVariables;
  onUpdateVariable: (key: string, value: string) => void;
  onAddVariable: (key: string, value: string) => void;
  onDeleteVariable: (key: string) => void;
}

export function VariablesView({ 
  stringVariables, 
  onUpdateVariable, 
  onAddVariable, 
  onDeleteVariable 
}: VariablesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'key' | 'value'>('key');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const sortedVariables = useMemo(() => {
    const allVariables = Object.entries(stringVariables);
    const filteredVariables = searchTerm 
      ? allVariables.filter(([key, value]) => 
          key.toLowerCase().includes(searchTerm.toLowerCase()) || 
          value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : allVariables;
    
    return filteredVariables.sort((a, b) => {
      const [keyA, valueA] = a;
      const [keyB, valueB] = b;
      if (sortBy === 'value') {
        return valueA.localeCompare(valueB);
      }
      return keyA.localeCompare(keyB);
    });
  }, [stringVariables, searchTerm, sortBy]);

  const handleEditStart = (key: string, value: string) => {
    setEditingKey(key);
    setEditingValue(value);
  };

  const handleEditSave = () => {
    if (editingKey && editingValue.trim()) {
      onUpdateVariable(editingKey, editingValue);
    }
    setEditingKey(null);
    setEditingValue('');
  };

  const handleEditCancel = () => {
    setEditingKey(null);
    setEditingValue('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleEditSave();
    } else if (event.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleAddVariable = () => {
    const key = prompt('Enter variable key:');
    if (!key?.trim()) return;
    
    const value = prompt('Enter variable value:');
    if (!value?.trim()) return;

    try {
      onAddVariable(key.trim(), value.trim());
    } catch (error) {
      alert(`Error adding variable: ${error}`);
    }
  };

  const handleDeleteVariable = (key: string) => {
    const confirmed = confirm(`Are you sure you want to delete the variable "${key}"?`);
    if (confirmed) {
      onDeleteVariable(key);
    }
  };

  return (
    <div className="tab-content active">
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search variables..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <label htmlFor="sort-variables-select">Sort by:</label>
        <select
          id="sort-variables-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'key' | 'value')}
        >
          <option value="key">Key</option>
          <option value="value">Value</option>
        </select>
        <button className="primary" onClick={handleAddVariable}>
          Add Variable
        </button>
      </div>
      
      <div className="variables-list-container">
        {sortedVariables.length === 0 ? (
          <div className="editor-placeholder">
            <h2>
              {searchTerm ? 'No variables match your search.' : 'No string variables found.'}
            </h2>
          </div>
        ) : (
          <table className="variables-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedVariables.map(([key, value]) => (
                <tr key={key} className="variable-row">
                  <td className="variable-key">{key}</td>
                  <td 
                    className="variable-value variable-cell-editable"
                    onClick={() => handleEditStart(key, value)}
                  >
                    {editingKey === key ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={handleEditSave}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '0.25rem',
                          border: '1px solid var(--primary-color)',
                          borderRadius: '3px',
                          fontFamily: 'inherit',
                          fontSize: 'inherit'
                        }}
                      />
                    ) : (
                      value
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleEditStart(key, value)}
                      title="Edit value"
                      style={{ marginRight: '0.5rem' }}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteVariable(key)}
                      title="Delete variable"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 