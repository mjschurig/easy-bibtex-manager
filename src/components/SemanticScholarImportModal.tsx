import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SemanticScholarPaper } from '../types/semanticScholar';
import { SemanticScholarApi } from '../utils/semanticScholarApi';
import { convertSemanticScholarToCSL, generateUniqueCitationKey } from '../utils/semanticScholarConverter';
import { sortPapersByTitleSimilarity, getSimilarityScore } from '../utils/searchSimilarity';
import { CSLEntry } from '../types/cslFieldMetadata';

interface SemanticScholarImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (entry: CSLEntry) => void;
  existingCitationKeys: Set<string>;
}

export function SemanticScholarImportModal({ 
  isOpen, 
  onClose, 
  onImport, 
  existingCitationKeys 
}: SemanticScholarImportModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SemanticScholarPaper[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<SemanticScholarPaper | null>(null);
  const [isImporting, setIsImporting] = useState(false);


  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
      setSelectedPaper(null);
      setIsSearching(false);
      setIsImporting(false);
      // Focus search input after modal animation
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle ESC key and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleSearch = useCallback(async (query?: string) => {
    const searchTerm = query || searchQuery;
    if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) {
      setError('Please enter a search query');
      return;
    }

    // No timeout handling needed since we removed debounced search

    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setSelectedPaper(null);

    try {
      // Limit to 10 results to reduce API usage
      const response = await SemanticScholarApi.searchPapers(searchTerm, 10);
      
      // Sort results by title similarity to search query
      const sortedResults = sortPapersByTitleSimilarity(response.data, searchTerm);
      setSearchResults(sortedResults);
      
      if (response.data.length === 0) {
        setError('No papers found for your search query. Try different keywords.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('Too many requests')) {
        setError('Rate limit reached. Please wait a few minutes before searching again. Semantic Scholar allows only 100 requests per 5 minutes.');
      } else {
        setError(`Search failed: ${errorMessage}`);
      }
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearch();
    }
  }, [handleSearch, isSearching]);

  // Note: Debounced search removed to minimize API calls - users must click search button

  const handleSearchClick = useCallback(() => {
    handleSearch();
  }, [handleSearch]);

  const handlePaperSelect = useCallback((paper: SemanticScholarPaper) => {
    setSelectedPaper(paper);
  }, []);

  const handleImport = useCallback(async () => {
    if (!selectedPaper) return;

    setIsImporting(true);
    setError(null);

    try {
      // Always fetch detailed data for import since search only returns basic fields
      let paperData: SemanticScholarPaper;
      
      try {
        paperData = await SemanticScholarApi.getPaperDetails(selectedPaper.paperId);
        console.log('Fetched detailed paper data for import');
      } catch (detailError) {
        // If detail fetch fails, proceed with search data
        console.warn('Could not fetch detailed paper info, using search data:', detailError);
        paperData = selectedPaper;
      }
      
      // Convert to CSL format with unique citation key
      const cslEntry = convertSemanticScholarToCSL(paperData);
      cslEntry.id = generateUniqueCitationKey(paperData, existingCitationKeys);
      
      // Import the entry
      onImport(cslEntry);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('Too many requests')) {
        setError('Rate limit reached. The paper has been imported with available data. You can edit it manually if needed.');
        // Still try to import with available data
        const cslEntry = convertSemanticScholarToCSL(selectedPaper);
        cslEntry.id = generateUniqueCitationKey(selectedPaper, existingCitationKeys);
        onImport(cslEntry);
        onClose();
      } else {
        setError(`Import failed: ${errorMessage}`);
      }
    } finally {
      setIsImporting(false);
    }
  }, [selectedPaper, existingCitationKeys, onImport, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex-none px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Import from Semantic Scholar</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="flex-none px-6 py-4 border-b border-gray-200">
          <div className="flex gap-3 mb-2">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search for papers by title, author, or keywords..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSearching}
            />
            <button
              onClick={handleSearchClick}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            ⚠️ Limited to 100 API requests per 5 minutes. Please search thoughtfully.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="px-6 py-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Search Results ({searchResults.length} papers found)
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  📊 Sorted by title relevance
                </span>
              </div>
              <div className="space-y-3">
                {searchResults.map((paper) => (
                  <div
                    key={paper.paperId}
                    onClick={() => handlePaperSelect(paper)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaper?.paperId === paper.paperId
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-medium text-gray-900 mb-1" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {paper.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {paper.authors?.map(author => author.name).join(', ') || 'Unknown authors'}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          {paper.year && (
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {paper.year}
                            </span>
                          )}
                          {paper.venue && (
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {paper.venue}
                            </span>
                          )}
                          {paper.externalIds?.DOI && (
                            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                              DOI
                            </span>
                          )}
                          {paper.citationCount !== undefined && (
                            <span className="px-2 py-1 bg-gray-100 rounded">
                              {paper.citationCount} citations
                            </span>
                          )}
                          {paper.isOpenAccess && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                              Open Access
                            </span>
                          )}
                          {/* Show similarity score in development mode */}
                          {process.env.NODE_ENV === 'development' && (
                            <span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded text-xs">
                              {getSimilarityScore(searchQuery, paper)} match
                            </span>
                          )}
                        </div>
                        {paper.abstract && (
                          <p className="text-sm text-gray-600 mt-2" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {paper.abstract}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.length === 0 && !isSearching && !error && (
            <div className="px-6 py-8 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Search for Papers</h3>
              <p className="text-gray-600">
                Enter keywords, paper title, or author name to find papers from Semantic Scholar.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-none px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Powered by <a 
                href="https://www.semanticscholar.org/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                Semantic Scholar
              </a>
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!selectedPaper || isImporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Full publication details (journal, volume, DOI, abstract, etc.) will be fetched during import"
              >
                {isImporting ? 'Importing...' : 'Import Selected Paper'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
