import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SemanticScholarPaper } from '../types/semanticScholar';
import { SemanticScholarApi } from '../utils/semanticScholarApi';
import { JaroWinkler } from 'string-metric';

interface CitationsReferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  paperId: string;
  paperTitle: string;
  type: 'citations' | 'references';
}

export function CitationsReferencesModal({ 
  isOpen, 
  onClose, 
  paperId, 
  paperTitle, 
  type 
}: CitationsReferencesModalProps) {
  const [papers, setPapers] = useState<SemanticScholarPaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sorting and filtering state
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'similarity'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [authorFilter, setAuthorFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAuthorDropdown, setShowAuthorDropdown] = useState(false);
  
  const authorInputRef = useRef<HTMLInputElement>(null);
  const authorDropdownRef = useRef<HTMLDivElement>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize JaroWinkler instance for string similarity
  const jaroWinkler = useMemo(() => new JaroWinkler(), []);

  // String similarity function using JaroWinkler algorithm
  const calculateSimilarity = useCallback((query: string, paper: SemanticScholarPaper): number => {
    if (!query.trim()) return 0;
    
    const normalizedQuery = query.toLowerCase().trim();
    
    // Get searchable components
    const year = paper.year?.toString() || '';
    const title = paper.title || '';
    const authors = paper.authors?.map(author => author.name).join(' ') || '';
    
    // Create full searchable text
    const fullText = `${year} ${title} ${authors}`.toLowerCase().trim();
    
    if (!fullText) return 0;
    
    // Direct similarity with full text
    const directSimilarity = jaroWinkler.similarity(normalizedQuery, fullText);
    
    // Also check similarity with just the title (often most relevant)
    const titleSimilarity = title ? jaroWinkler.similarity(normalizedQuery, title.toLowerCase()) : 0;
    
    // Check for word overlap bonus (like in existing searchSimilarity.ts)
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 2);
    const textWords = fullText.split(/\s+/);
    
    let wordOverlapScore = 0;
    if (queryWords.length > 0) {
      const matchingWords = queryWords.filter(queryWord => 
        textWords.some(textWord => 
          textWord.includes(queryWord) || jaroWinkler.similarity(queryWord, textWord) > 0.8
        )
      );
      wordOverlapScore = matchingWords.length / queryWords.length;
    }
    
    // Weighted combination: title similarity gets highest weight, then full text, then word overlap
    return (titleSimilarity * 0.5) + (directSimilarity * 0.3) + (wordOverlapScore * 0.2);
  }, [jaroWinkler]);

  // Reset state when modal opens or type changes
  useEffect(() => {
    if (isOpen && paperId) {
      fetchPapers();
    } else {
      setPapers([]);
      setError(null);
    }
  }, [isOpen, paperId, type]);

  // Handle ESC key and click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
      
      // Close author dropdown if clicking outside
      if (authorDropdownRef.current && !authorDropdownRef.current.contains(e.target as Node) &&
          authorInputRef.current && !authorInputRef.current.contains(e.target as Node)) {
        setShowAuthorDropdown(false);
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

  const fetchPapers = useCallback(async () => {
    if (!paperId) return;

    setIsLoading(true);
    setError(null);
    setPapers([]);

    try {
      const response = type === 'citations' 
        ? await SemanticScholarApi.getPaperCitations(paperId)
        : await SemanticScholarApi.getPaperReferences(paperId);

      setPapers(response.data);

      if (response.data.length === 0) {
        setError(`No ${type} found for this paper.`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to fetch ${type}: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [paperId, type]);

  const handlePaperClick = useCallback((paper: SemanticScholarPaper) => {
    // Open paper in new tab if URL is available
    if (paper.url) {
      window.open(paper.url, '_blank');
    } else if (paper.externalIds?.DOI) {
      window.open(`https://doi.org/${paper.externalIds.DOI}`, '_blank');
    }
  }, []);

  // Get unique authors for filter dropdown
  const uniqueAuthors = useMemo(() => {
    const authorSet = new Set<string>();
    papers.forEach(paper => {
      paper.authors?.forEach(author => {
        if (author.name) {
          authorSet.add(author.name);
        }
      });
    });
    return Array.from(authorSet).sort();
  }, [papers]);

  // Filter and sort papers
  const filteredAndSortedPapers = useMemo(() => {
    let filtered = papers;

    // Apply author filter
    if (authorFilter) {
      filtered = papers.filter(paper => 
        paper.authors?.some(author => 
          author.name?.toLowerCase().includes(authorFilter.toLowerCase())
        )
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'similarity' && searchQuery) {
        // Sort by similarity to search query
        const similarityA = calculateSimilarity(searchQuery, a);
        const similarityB = calculateSimilarity(searchQuery, b);
        comparison = similarityB - similarityA; // Higher similarity first
      } else if (sortBy === 'title') {
        const titleA = a.title?.toLowerCase() || '';
        const titleB = b.title?.toLowerCase() || '';
        comparison = titleA.localeCompare(titleB);
      } else if (sortBy === 'year') {
        const yearA = a.year || 0;
        const yearB = b.year || 0;
        comparison = yearA - yearB;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // If search query is active and sort is not similarity, still show most similar first
    if (searchQuery && sortBy !== 'similarity') {
      sorted.sort((a, b) => {
        const similarityA = calculateSimilarity(searchQuery, a);
        const similarityB = calculateSimilarity(searchQuery, b);
        return similarityB - similarityA;
      });
    }

    return sorted;
  }, [papers, sortBy, sortOrder, authorFilter, searchQuery, calculateSimilarity]);

  // Reset filters when modal opens or papers change
  useEffect(() => {
    if (isOpen) {
      setSortBy('title');
      setSortOrder('asc');
      setAuthorFilter('');
      setSearchQuery('');
      setShowAuthorDropdown(false);
    }
  }, [isOpen, type]);

  // Auto-select similarity sort when search is active
  useEffect(() => {
    if (searchQuery && sortBy !== 'similarity') {
      setSortBy('similarity');
    } else if (!searchQuery && sortBy === 'similarity') {
      setSortBy('title');
    }
  }, [searchQuery, sortBy]);

  if (!isOpen) return null;

  const title = type === 'citations' ? 'Citations' : 'References';
  const description = type === 'citations' 
    ? 'Papers that cite this work'
    : 'Papers cited by this work';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex-none px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-900 mb-1">{title}</h2>
              <p className="text-sm text-gray-600 mb-2">{description}</p>
              <p className="text-sm text-gray-800 font-medium truncate" title={paperTitle}>
                📄 {paperTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600">Loading {type}...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {papers.length > 0 && (
            <div className="px-6 py-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {filteredAndSortedPapers.length} of {papers.length} {title}
                  {filteredAndSortedPapers.length !== papers.length && ' (filtered)'}
                </h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  📊 From Semantic Scholar
                </span>
              </div>

              {/* Search and Filtering Controls */}
              <div className="space-y-3 mb-4 p-3 bg-gray-50 rounded-lg border">
                {/* Search Input */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">🔍 Search:</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by year, title, or authors..."
                    className="flex-1 text-sm border border-gray-300 rounded px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                      title="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {/* Sort By */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'title' | 'year' | 'similarity')}
                      className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                    >
                      <option value="title">Title</option>
                      <option value="year">Year</option>
                      {searchQuery && <option value="similarity">Similarity</option>}
                    </select>
                  </div>

                  {/* Sort Order */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Order:</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                      className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                      disabled={sortBy === 'similarity'}
                    >
                      <option value="asc">
                        {sortBy === 'title' ? 'A-Z' : sortBy === 'year' ? 'Oldest First' : 'Best Match First'}
                      </option>
                      <option value="desc">
                        {sortBy === 'title' ? 'Z-A' : sortBy === 'year' ? 'Newest First' : 'Best Match First'}
                      </option>
                    </select>
                  </div>

                  {/* Author Filter Combobox */}
                  <div className="relative flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Filter by author:</label>
                    <div className="relative">
                      <input
                        ref={authorInputRef}
                        type="text"
                        value={authorFilter}
                        onChange={(e) => {
                          setAuthorFilter(e.target.value);
                          setShowAuthorDropdown(true);
                        }}
                        onFocus={() => setShowAuthorDropdown(true)}
                        placeholder="Type author name..."
                        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {authorFilter && (
                        <button
                          onClick={() => {
                            setAuthorFilter('');
                            setShowAuthorDropdown(false);
                          }}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                        >
                          ×
                        </button>
                      )}
                      
                      {showAuthorDropdown && uniqueAuthors.length > 0 && (
                        <div
                          ref={authorDropdownRef}
                          className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-white border border-gray-300 rounded shadow-lg z-10"
                        >
                          {uniqueAuthors
                            .filter(author => 
                              !authorFilter || author.toLowerCase().includes(authorFilter.toLowerCase())
                            )
                            .slice(0, 10)
                            .map(author => (
                              <button
                                key={author}
                                onClick={() => {
                                  setAuthorFilter(author);
                                  setShowAuthorDropdown(false);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                {author.length > 40 ? `${author.substring(0, 40)}...` : author}
                              </button>
                            ))
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  {(authorFilter || searchQuery || sortBy !== 'title' || sortOrder !== 'asc') && (
                    <button
                      onClick={() => {
                        setSortBy('title');
                        setSortOrder('asc');
                        setAuthorFilter('');
                        setSearchQuery('');
                        setShowAuthorDropdown(false);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {filteredAndSortedPapers.map((paper) => (
                  <div
                    key={paper.paperId}
                    onClick={() => handlePaperClick(paper)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors"
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
                          {paper.url && (
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                              🔗 Link
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isLoading && !error && papers.length === 0 && (
            <div className="px-6 py-8 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No {title} Found</h3>
              <p className="text-gray-600">
                This paper has no {type} in the Semantic Scholar database.
              </p>
            </div>
          )}

          {!isLoading && !error && papers.length > 0 && filteredAndSortedPapers.length === 0 && (
            <div className="px-6 py-8 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Results After Filtering</h3>
              <p className="text-gray-600">
                No {type} match your current filter criteria. Try adjusting the author filter.
              </p>
              <button
                onClick={() => {
                  setSortBy('title');
                  setSortOrder('asc');
                  setAuthorFilter('');
                }}
                className="mt-3 text-blue-600 hover:text-blue-800 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-none px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-500">
                Data from <a 
                  href="https://www.semanticscholar.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Semantic Scholar
                </a>
              </p>
              {papers.length > 0 && (
                <div className="text-xs text-gray-500">
                  {sortBy === 'title' ? '📝' : '📅'} Sorted by {sortBy} ({sortOrder === 'asc' ? 'ascending' : 'descending'})
                  {authorFilter && (
                    <span className="ml-2">
                      👤 Filtered by: <span className="font-medium">{authorFilter}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
