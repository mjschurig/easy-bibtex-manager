import { JaroWinkler } from 'string-metric';
import { SemanticScholarPaper } from '../types/semanticScholar';

/**
 * Sorts search results by title similarity to the original query using Jaro-Winkler algorithm
 * 
 * Why Jaro-Winkler?
 * - Excellent for proper nouns and titles
 * - Handles misspellings well
 * - Gives bonus to strings that match from the beginning (good for article titles)
 * - Performs better than Levenshtein for partial word matches
 * - Ideal for academic paper titles where word order matters but some words might be missing
 */

const jaroWinkler = new JaroWinkler();

/**
 * Calculate similarity between search query and paper title
 * @param query - Original search query
 * @param paper - Paper object with title
 * @returns Similarity score between 0 and 1 (1 = perfect match)
 */
export function calculateTitleSimilarity(query: string, paper: SemanticScholarPaper): number {
  if (!paper.title || !query.trim()) {
    return 0;
  }

  // Normalize both strings for better comparison
  const normalizedQuery = query.toLowerCase().trim();
  const normalizedTitle = paper.title.toLowerCase().trim();

  // Direct similarity
  const directSimilarity = jaroWinkler.similarity(normalizedQuery, normalizedTitle);

  // Also check if query terms appear in title (for cases where user searches for key terms)
  const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 2); // Ignore short words
  const titleWords = normalizedTitle.split(/\s+/);
  
  // Calculate word overlap bonus
  let wordOverlapScore = 0;
  if (queryWords.length > 0) {
    const matchingWords = queryWords.filter(queryWord => 
      titleWords.some(titleWord => 
        // Check for exact matches or high similarity for individual words
        titleWord.includes(queryWord) || jaroWinkler.similarity(queryWord, titleWord) > 0.8
      )
    );
    wordOverlapScore = matchingWords.length / queryWords.length;
  }

  // Combine direct similarity with word overlap (weighted average)
  // Give more weight to direct similarity, but boost scores when query words appear in title
  return (directSimilarity * 0.7) + (wordOverlapScore * 0.3);
}

/**
 * Sort papers by title similarity to search query (most similar first)
 * @param papers - Array of papers to sort
 * @param query - Original search query
 * @returns Sorted array of papers with similarity scores
 */
export function sortPapersByTitleSimilarity(
  papers: SemanticScholarPaper[], 
  query: string
): SemanticScholarPaper[] {
  if (!query.trim() || papers.length === 0) {
    return papers;
  }

  // Calculate similarity scores and sort
  const papersWithScores = papers.map(paper => ({
    paper,
    similarity: calculateTitleSimilarity(query, paper)
  }));

  // Sort by similarity (highest first), then by citation count as tiebreaker
  papersWithScores.sort((a, b) => {
    if (Math.abs(a.similarity - b.similarity) < 0.01) {
      // If similarity is very close, use citation count as tiebreaker
      return (b.paper.citationCount || 0) - (a.paper.citationCount || 0);
    }
    return b.similarity - a.similarity;
  });

  return papersWithScores.map(item => item.paper);
}

/**
 * Get similarity score for debugging/display purposes
 * @param query - Search query
 * @param paper - Paper to check
 * @returns Similarity score as percentage string
 */
export function getSimilarityScore(query: string, paper: SemanticScholarPaper): string {
  const score = calculateTitleSimilarity(query, paper);
  return `${Math.round(score * 100)}%`;
}
