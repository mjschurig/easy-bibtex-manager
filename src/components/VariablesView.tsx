import React, { useState, useCallback } from 'react';
// Using simple interface for variables since Citation.js doesn't define them

interface Variable {
  key: string;
  value: string;
}

interface VariablesViewProps {
  variables: Variable[];
  onUpdateVariable: (key: string, value: string) => void;
  onAddVariable: (key: string, value: string) => void;
  onDeleteVariable: (key: string) => void;
}

export function VariablesView({ 
  variables, 
  onUpdateVariable, 
  onAddVariable, 
  onDeleteVariable 
}: VariablesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'key' | 'value'>('key');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const sortedVariables = useCallback(() => {
    const filteredVariables = searchTerm 
      ? variables.filter(variable => 
          variable.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
          variable.value.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : variables;
    
    return filteredVariables.sort((a, b) => {
      if (sortBy === 'value') {
        return a.value.localeCompare(b.value);
      }
      return a.key.localeCompare(b.key);
    });
  }, [variables, searchTerm, sortBy]);

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
    <div className="flex flex-col flex-grow overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex gap-4 items-center">
        <input
          type="search"
          placeholder="Search variables..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow px-2 py-2 border border-gray-300 rounded text-base"
        />
        <label htmlFor="sort-variables-select" className="text-sm font-medium text-gray-700">Sort by:</label>
        <select
          id="sort-variables-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'key' | 'value')}
          className="px-2 py-2 border border-gray-300 rounded text-base"
        >
          <option value="key">Key</option>
          <option value="value">Value</option>
        </select>
        <button 
          className="px-4 py-2 text-base border border-blue-600 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
          onClick={handleAddVariable}
        >
          Add Variable
        </button>
      </div>
      
      <div className="overflow-y-auto p-6">
        {sortedVariables().length === 0 ? (
          <div className="flex justify-center items-center text-gray-500 text-center p-8">
            <h2>
              {searchTerm ? 'No variables match your search.' : 'No string variables found.'}
            </h2>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 px-3 py-3 text-left bg-gray-50">Key</th>
                <th className="border border-gray-300 px-3 py-3 text-left bg-gray-50">Value</th>
                <th className="border border-gray-300 px-3 py-3 text-left bg-gray-50">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedVariables().map((variable) => (
                <tr key={variable.key} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-3">{variable.key}</td>
                  <td 
                    className="border border-gray-300 px-3 py-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleEditStart(variable.key, variable.value)}
                  >
                    {editingKey === variable.key ? (
                      <input
                        type="text"
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onBlur={handleEditSave}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="w-full px-1 py-1 border border-blue-600 rounded font-inherit text-inherit"
                      />
                    ) : (
                      variable.value
                    )}
                  </td>
                  <td className="border border-gray-300 px-3 py-3">
                    <button
                      onClick={() => handleEditStart(variable.key, variable.value)}
                      title="Edit value"
                      className="px-3 py-1 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer mr-2"
                    >
                      Edit
                    </button>
                    <button
                      className="px-3 py-1 text-sm border border-red-600 rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                      onClick={() => handleDeleteVariable(variable.key)}
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