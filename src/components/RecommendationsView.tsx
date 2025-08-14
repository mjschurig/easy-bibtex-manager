import React, { useState, useMemo, useCallback } from 'react';
import { 
  useCitationData, 
  useFilteredAndSortedEntries, 
  useSearch,
  useAuthors,
  useCitationActions
} from '../hooks/useCitation';
import { SemanticScholarApi } from '../utils/semanticScholarApi';
import { SemanticScholarPaper } from '../types/semanticScholar';
import { CitationsReferencesModal } from './CitationsReferencesModal';
import { AuthorFilter } from './AuthorFilter';
import { formatAuthors, getYear, getTitle } from '../utils/cslUtils';
import { getSemanticScholarIdFromEntry } from '../utils/semanticScholarConverter';

interface RecommendationsViewProps {
  onSelectEntry?: (entry: any) => void;
}

// Enhanced EntryCard with positive/negative buttons
interface RecommendationEntryCardProps {
  entry: any;
  isActive: boolean;
  isPositiveExample: boolean;
  isNegativeExample: boolean;
  onClick: () => void;
  onTogglePositive: () => void;
  onToggleNegative: () => void;
}

function RecommendationEntryCard({ 
  entry, 
  isActive, 
  isPositiveExample, 
  isNegativeExample, 
  onClick, 
  onTogglePositive, 
  onToggleNegative 
}: RecommendationEntryCardProps) {
  const { state } = useCitationData();
  const title = getTitle(entry) || 'No Title';
  const author = entry.author && entry.author.length > 0 
    ? formatAuthors(entry.author, state.variables) 
    : 'Unknown Author';
  const year = getYear(entry) || 'N/A';

  // Check if this entry can be used for recommendations
  const semanticScholarId = getSemanticScholarIdFromEntry(entry);
  const hasDOI = Boolean(entry.DOI);
  const canUseForRecommendations = Boolean(semanticScholarId || hasDOI);
  const disabledReason = !canUseForRecommendations 
    ? "Requires Semantic Scholar ID or DOI for recommendations" 
    : "";

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-md p-4 mb-4 cursor-pointer transition-all duration-200 hover:border-blue-600 hover:shadow-md ${
        isActive ? 'border-l-4 border-l-blue-600' : ''
      } ${isPositiveExample ? 'bg-green-50 border-green-300' : ''} ${isNegativeExample ? 'bg-red-50 border-red-300' : ''}`}
      onClick={onClick}
    >
      <div className="font-bold text-lg mb-2">{title}</div>
      <div className="text-sm text-gray-600">{author}</div>
      <div className="text-sm text-gray-600 mt-2 italic">
        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-sm">{entry.id}</span> – {year} – <em>@{entry.type}</em>
      </div>
      
      {/* Positive/Negative buttons */}
      <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
        {!canUseForRecommendations && (
          <div className="text-xs text-gray-500 py-1 px-2 bg-gray-50 rounded border">
            {disabledReason}
          </div>
        )}
        {canUseForRecommendations && (
          <>
            <button
              onClick={onTogglePositive}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                isPositiveExample 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
              }`}
              title="Mark as positive example"
            >
              + {isPositiveExample ? 'Positive' : 'Add'}
            </button>
            <button
              onClick={onToggleNegative}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                isNegativeExample 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
              }`}
              title="Mark as negative example"
            >
              − {isNegativeExample ? 'Negative' : 'Remove'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function RecommendationsView({ onSelectEntry }: RecommendationsViewProps) {
  const { state } = useCitationData();
  const { startEditingEntry } = useCitationActions();
  const { authors: allAuthors } = useAuthors();
  const filteredEntries = useFilteredAndSortedEntries();
  
  const { 
    searchText,
    authorFilter,
    setSearchText,
    setAuthorFilter 
  } = useSearch();
  
  // State for tracking positive/negative examples
  const [positiveExamples, setPositiveExamples] = useState<Set<string>>(new Set());
  const [negativeExamples, setNegativeExamples] = useState<Set<string>>(new Set());
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);
  const [recommendedPapers, setRecommendedPapers] = useState<SemanticScholarPaper[]>([]);

  // Check if we have at least one positive or negative example
  const hasExamples = positiveExamples.size > 0 || negativeExamples.size > 0;

  // Toggle positive example
  const togglePositiveExample = useCallback((entryId: string) => {
    // Find the entry to check if it can be used for recommendations
    const entry = filteredEntries.find(e => e.id === entryId);
    if (!entry) return;
    
    const semanticScholarId = getSemanticScholarIdFromEntry(entry);
    const hasDOI = Boolean(entry.DOI);
    if (!semanticScholarId && !hasDOI) return; // Don't allow if no S2 ID or DOI
    
    setPositiveExamples(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
        // Remove from negative if it was there
        setNegativeExamples(negPrev => {
          const newNegSet = new Set(negPrev);
          newNegSet.delete(entryId);
          return newNegSet;
        });
      }
      return newSet;
    });
  }, [filteredEntries]);

  // Toggle negative example
  const toggleNegativeExample = useCallback((entryId: string) => {
    // Find the entry to check if it can be used for recommendations
    const entry = filteredEntries.find(e => e.id === entryId);
    if (!entry) return;
    
    const semanticScholarId = getSemanticScholarIdFromEntry(entry);
    const hasDOI = Boolean(entry.DOI);
    if (!semanticScholarId && !hasDOI) return; // Don't allow if no S2 ID or DOI
    
    setNegativeExamples(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
        // Remove from positive if it was there
        setPositiveExamples(posPrev => {
          const newPosSet = new Set(posPrev);
          newPosSet.delete(entryId);
          return newPosSet;
        });
      }
      return newSet;
    });
  }, [filteredEntries]);

  // Clear all examples
  const clearAllExamples = useCallback(() => {
    setPositiveExamples(new Set());
    setNegativeExamples(new Set());
  }, []);

  // Get recommendations based on examples
  const getRecommendations = useCallback(async () => {
    if (!hasExamples) return;

    setIsLoadingRecommendations(true);
    setRecommendationError(null);

    try {
      // Convert bibliography IDs to Semantic Scholar IDs
      const positivePaperIds = Array.from(positiveExamples).map(entryId => {
        const entry = filteredEntries.find(e => e.id === entryId);
        if (entry) {
          const semanticScholarId = getSemanticScholarIdFromEntry(entry);
          return semanticScholarId || entryId; // Fallback to entry ID if no S2 ID
        }
        return entryId;
      });
      
      const negativePaperIds = Array.from(negativeExamples).map(entryId => {
        const entry = filteredEntries.find(e => e.id === entryId);
        if (entry) {
          const semanticScholarId = getSemanticScholarIdFromEntry(entry);
          return semanticScholarId || entryId; // Fallback to entry ID if no S2 ID
        }
        return entryId;
      });
      
      const response = await SemanticScholarApi.getRecommendationsFromExamples(
        positivePaperIds, 
        negativePaperIds
      );
      
      setRecommendedPapers(response.data);
      setShowRecommendationsModal(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setRecommendationError(`Failed to get recommendations: ${errorMessage}`);
    } finally {
      setIsLoadingRecommendations(false);
    }
  }, [positiveExamples, negativeExamples, hasExamples, filteredEntries]);

  const [selectedEntryKey, setSelectedEntryKey] = useState<string | null>(null);

  const handleEntrySelect = useCallback((id: string) => {
    setSelectedEntryKey(id);
    startEditingEntry(id);
    onSelectEntry?.(id);
  }, [startEditingEntry, onSelectEntry]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  }, [setSearchText]);

  const handleAuthorFilterChange = useCallback((value: string) => {
    setAuthorFilter(value);
  }, [setAuthorFilter]);

  const exampleCounts = useMemo(() => ({
    positive: positiveExamples.size,
    negative: negativeExamples.size
  }), [positiveExamples.size, negativeExamples.size]);

  return (
    <div className="flex flex-grow overflow-hidden">
      {/* Left panel - Entry list with recommendations controls */}
      <div className="flex-none w-96 border-r border-gray-200 overflow-y-auto bg-white">
        {/* Header with recommendations button and stats */}
        <div className="p-4 border-b border-gray-200 bg-purple-50">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Paper Examples</h3>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-600">
              <span className="inline-flex items-center gap-1">
                <span className="text-green-600 font-bold">+</span>
                {exampleCounts.positive}
              </span>
              <span className="mx-2">•</span>
              <span className="inline-flex items-center gap-1">
                <span className="text-red-600 font-bold">−</span>
                {exampleCounts.negative}
              </span>
            </div>
            {hasExamples && (
              <button
                onClick={clearAllExamples}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
              >
                Clear
              </button>
            )}
          </div>
          
          <button
            onClick={getRecommendations}
            disabled={!hasExamples || isLoadingRecommendations}
            className={`w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              hasExamples
                ? 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoadingRecommendations ? 'Loading...' : '🎯 Get Recommendations'}
          </button>
          
          {recommendationError && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
              {recommendationError}
            </div>
          )}
        </div>

        {/* Search and filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            {/* Search input */}
            <div>
              <input
                type="text"
                placeholder="Search entries..."
                value={searchText}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Author filter */}
            <AuthorFilter
              allAuthors={allAuthors}
              value={authorFilter}
              onChange={handleAuthorFilterChange}
            />
          </div>
        </div>

        {/* Entry list */}
        <div className="p-4 space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No entries found.</p>
              {(searchText || authorFilter) && (
                <p className="text-sm mt-2">Try adjusting your search or filters.</p>
              )}
            </div>
          ) : (
            filteredEntries.map(entry => (
              <RecommendationEntryCard
                key={entry.id}
                entry={entry}
                isActive={selectedEntryKey === entry.id}
                isPositiveExample={positiveExamples.has(entry.id)}
                isNegativeExample={negativeExamples.has(entry.id)}
                onClick={() => handleEntrySelect(entry.id)}
                onTogglePositive={() => togglePositiveExample(entry.id)}
                onToggleNegative={() => toggleNegativeExample(entry.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right panel - Examples display */}
      <div className="flex-grow flex flex-col overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-medium mb-6 text-gray-900">Selected Examples</h2>
          
          {!hasExamples ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg mb-2">No examples selected yet</p>
              <p className="text-sm">Use the + and − buttons to mark papers as examples</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Positive Examples */}
              {exampleCounts.positive > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-green-700 mb-3 flex items-center gap-2">
                    <span className="text-green-600 font-bold">+</span>
                    Positive Examples ({exampleCounts.positive})
                  </h3>
                  <div className="space-y-2">
                    {filteredEntries
                      .filter(entry => positiveExamples.has(entry.id))
                      .map(entry => (
                        <div key={entry.id} className="bg-green-50 border border-green-200 rounded p-3">
                          <div className="font-medium text-green-900">{getTitle(entry) || 'No Title'}</div>
                          <div className="text-sm text-green-700 mt-1">
                            {entry.author && entry.author.length > 0 
                              ? formatAuthors(entry.author, state.variables) 
                              : 'Unknown Author'} • {getYear(entry) || 'N/A'}
                          </div>
                          <div className="text-xs text-green-600 mt-1 font-mono">{entry.id}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Negative Examples */}
              {exampleCounts.negative > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-red-700 mb-3 flex items-center gap-2">
                    <span className="text-red-600 font-bold">−</span>
                    Negative Examples ({exampleCounts.negative})
                  </h3>
                  <div className="space-y-2">
                    {filteredEntries
                      .filter(entry => negativeExamples.has(entry.id))
                      .map(entry => (
                        <div key={entry.id} className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="font-medium text-red-900">{getTitle(entry) || 'No Title'}</div>
                          <div className="text-sm text-red-700 mt-1">
                            {entry.author && entry.author.length > 0 
                              ? formatAuthors(entry.author, state.variables) 
                              : 'Unknown Author'} • {getYear(entry) || 'N/A'}
                          </div>
                          <div className="text-xs text-red-600 mt-1 font-mono">{entry.id}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recommendations modal */}
      {showRecommendationsModal && (
        <CitationsReferencesModal
          isOpen={showRecommendationsModal}
          onClose={() => setShowRecommendationsModal(false)}
          paperId="recommendations-from-examples"
          paperTitle="Recommendations Based on Examples"
          type="recommendations"
          customPapers={recommendedPapers}
        />
      )}
    </div>
  );
}
