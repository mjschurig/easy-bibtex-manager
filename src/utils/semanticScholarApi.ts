import { SemanticScholarSearchResponse, SemanticScholarDetailedPaper } from '../types/semanticScholar';
import { SEMANTIC_SCHOLAR_BASE_URL } from '../config/api';

// CORS Error Class for better error handling
class CORSError extends Error {
  constructor() {
    super();
    this.name = 'CORSError';
    this.message = `CORS Error: Unable to access Semantic Scholar API due to browser security restrictions.

To use Semantic Scholar features, you need to disable CORS in your browser:

🔧 RECOMMENDED SOLUTION:
Install the "Allow CORS" browser extension:
• Chrome: Search "Allow CORS" in Chrome Web Store
• Firefox: Search "CORS Everywhere" in Firefox Add-ons

📋 SETUP STEPS:
1. Install the extension
2. Click the extension icon in your browser toolbar
3. Enable CORS for this website
4. Refresh the page and try again

⚠️ SECURITY NOTE:
Only enable CORS for trusted websites. Disable the extension when not needed.

🔗 Alternative: Use the application offline by downloading the HTML file instead of using the web version.`;
  }
}

// Rate Limit Error Class
class RateLimitError extends Error {
  constructor(retryAfter?: string) {
    const retryMessage = retryAfter ? ` Please try again in ${retryAfter} seconds.` : ' Please wait a moment and try again.';
    super(`Rate limit exceeded for Semantic Scholar API.${retryMessage} Consider getting a free API key for higher limits at: https://www.semanticscholar.org/product/api`);
    this.name = 'RateLimitError';
  }
}

// Build direct API URL
const getApiUrl = (endpoint: string, params: URLSearchParams): string => {
  const url = `${SEMANTIC_SCHOLAR_BASE_URL}${endpoint}`;
  return params.toString() ? `${url}?${params}` : url;
};

// Fields for bulk search - only basic fields to minimize data and API calls
const SEARCH_FIELDS = [
  'paperId',
  'title',
  'authors',
  'year',
  'venue',
  'citationCount',
  'influentialCitationCount',
  'isOpenAccess',
  'fieldsOfStudy'
].join(',');

// Fields for detailed paper information - comprehensive data for import
const DETAIL_FIELDS = [
  'paperId',
  'corpusId',
  'externalIds',
  'url',
  'title',
  'abstract',
  'venue',
  'publicationVenue',
  'year',
  'referenceCount',
  'citationCount',
  'influentialCitationCount',
  'isOpenAccess',
  'openAccessPdf',
  'fieldsOfStudy',
  's2FieldsOfStudy',
  'publicationTypes',
  'publicationDate',
  'journal',
  'citationStyles',
  'authors',
  'tldr'
].join(',');

export class SemanticScholarApi {
  private static readonly TIMEOUT_MS = 15000; // 15 second timeout
  private static readonly MAX_RETRIES = 2; // Retry failed requests up to 2 times
  private static readonly RETRY_DELAY = 1000; // Wait 1 second between retries

  /**
   * Debug function to test a specific paper ID and log detailed information
   * Use this to test if the API endpoints are working correctly
   */
  static async debugPaperReferences(paperId: string): Promise<void> {
    
    try {
      // Test the raw API call first
      const testUrl = `${SEMANTIC_SCHOLAR_BASE_URL}/graph/v1/paper/${paperId}/references?limit=5&fields=paperId,title,authors,year`;
      
      const response = await fetch(testUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        return;
      }
      
      const data = await response.json();
      
      
    } catch (error) {
      console.error('Debug test failed:', error);
    }
  }

  private static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.TIMEOUT_MS / 1000} seconds. The server may be experiencing high load.`);
      }
      throw error;
    }
  }

  private static async fetchWithRetry(url: string, options: RequestInit = {}): Promise<Response> {
    let lastError: Error;
    
    // Add default headers for Semantic Scholar API
    const fetchOptions: RequestInit = {
      ...options,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BibTeX Manager (https://github.com/mjschurig/easy-bibtex-manager)',
        ...options.headers
      }
    };
    
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, fetchOptions);
        
        // If we get a response, check if it's a server error that we should retry
        if (response.status >= 500 || response.status === 429) {
          if (attempt === this.MAX_RETRIES) {
            // Last attempt, return the response even if it's an error
            return response;
          }
          // Server error or rate limit, wait and retry
          await this.sleep(this.RETRY_DELAY * (attempt + 1)); // Exponential backoff
          continue;
        }
        
        // Success or client error (4xx) - return immediately
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Check for CORS errors first and throw specific error
        if (this.isCORSError(lastError)) {
          throw new CORSError();
        }
        
        if (attempt === this.MAX_RETRIES) {
          // Last attempt, throw the error
          throw lastError;
        }
        
        // Check if it's a timeout or network error that we should retry
        if (lastError.message.includes('timed out') || 
            lastError.message.includes('NetworkError') ||
            lastError.message.includes('Failed to fetch')) {
          await this.sleep(this.RETRY_DELAY * (attempt + 1)); // Exponential backoff
          continue;
        }
        
        // Other errors, don't retry
        throw lastError;
      }
    }
    
    throw lastError!;
  }

  private static isCORSError(error: Error): boolean {
    // Detect CORS errors by common patterns
    return (
      error.name === 'TypeError' && (
        error.message.includes('CORS') ||
        error.message.includes('cross-origin') ||
        error.message.includes('Access-Control-Allow-Origin') ||
        error.message.includes('Failed to fetch') ||
        error.message.toLowerCase().includes('network error')
      )
    ) || (
      // Firefox specific CORS error patterns
      error.message.includes('NetworkError') ||
      error.message.includes('CORS request did not succeed')
    );
  }

  static async searchPapers(query: string, limit: number = 20, offset: number = 0): Promise<SemanticScholarSearchResponse> {
    const params = new URLSearchParams({
      query: query.trim(),
      limit: limit.toString(),
      offset: offset.toString(),
      fields: SEARCH_FIELDS
    });

    try {
      const url = getApiUrl('/graph/v1/paper/search/bulk', params);
      
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new RateLimitError(retryAfter || undefined);
        }
        
        throw new Error(`Search failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      return response.json();
    } catch (error) {
      // CORSError and RateLimitError are already thrown by fetchWithRetry
      if (error instanceof CORSError || error instanceof RateLimitError) {
        throw error;
      }
      throw error;
    }
  }

  static async getPaperDetails(paperId: string): Promise<SemanticScholarDetailedPaper> {
    // Ensure paper ID is properly encoded for URL
    const encodedPaperId = encodeURIComponent(paperId);
    
    const params = new URLSearchParams({
      fields: DETAIL_FIELDS
    });

    const url = getApiUrl(`/graph/v1/paper/${encodedPaperId}`, params);
    const response = await this.fetchWithRetry(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(retryAfter || undefined);
      }
      throw new Error(`Failed to fetch paper details: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Attempts to fetch paper details using bibliography ID with DOI fallback
   * This supports the workflow where Semantic Scholar paperId is used as bibId
   * @param bibId The bibliography ID (should be a Semantic Scholar paperId)
   * @param doi Optional DOI for fallback if bibId lookup fails
   * @returns Promise with paper details or throws descriptive error
   */
  static async getPaperDetailsByBibId(bibId: string, doi?: string): Promise<SemanticScholarDetailedPaper> {
    try {
      // First attempt: Use the bibId directly as a Semantic Scholar paper ID
      return await this.getPaperDetails(bibId);
    } catch (firstError) {
      console.warn(`Failed to fetch paper using bibId "${bibId}":`, firstError);
      
      // Second attempt: Try with DOI if available
      if (doi) {
        try {
          const doiPaperId = `DOI:${doi}`;
          return await this.getPaperDetails(doiPaperId);
        } catch (doiError) {
          console.warn(`Failed to fetch paper using DOI "${doi}":`, doiError);
          
          // Both attempts failed - provide comprehensive error message
          const errorMessage = [
            `Unable to fetch paper details for bibliography entry "${bibId}".`,
            `Attempted methods:`,
            `1. Direct paper ID lookup failed: ${firstError instanceof Error ? firstError.message : 'Unknown error'}`,
            doi ? `2. DOI lookup (${doi}) failed: ${doiError instanceof Error ? doiError.message : 'Unknown error'}` : `2. No DOI available for fallback lookup`,
            ``,
            `Please ensure:`,
            `- The bibliography ID corresponds to a valid Semantic Scholar paper ID`,
            doi ? `- The DOI "${doi}" is correct and the paper exists in Semantic Scholar` : `- The paper has a valid DOI that can be used for lookup`,
            `- You have internet connectivity and CORS is properly configured`,
            ``,
            `Supported ID formats: paperId, CorpusId:123, DOI:10.xxx, ARXIV:xxxx, etc.`
          ].join('\n');
          
          throw new Error(errorMessage);
        }
      } else {
        // No DOI available for fallback
        const errorMessage = [
          `Unable to fetch paper details for bibliography entry "${bibId}".`,
          `Primary lookup failed: ${firstError instanceof Error ? firstError.message : 'Unknown error'}`,
          `No DOI available for fallback lookup.`,
          ``,
          `Please ensure:`,
          `- The bibliography ID corresponds to a valid Semantic Scholar paper ID`,
          `- The paper entry includes a valid DOI for fallback lookups`,
          `- You have internet connectivity and CORS is properly configured`,
          ``,
          `Supported ID formats: paperId, CorpusId:123, DOI:10.xxx, ARXIV:xxxx, etc.`
        ].join('\n');
        
        throw new Error(errorMessage);
      }
    }
  }

  static async searchPapersByTitle(title: string): Promise<SemanticScholarSearchResponse> {
    // Search specifically by title for more precise results
    const query = `title:"${title}"`;
    return this.searchPapers(query, 10);
  }

  static async searchPapersByAuthor(authorName: string): Promise<SemanticScholarSearchResponse> {
    // Search specifically by author
    const query = `author:"${authorName}"`;
    return this.searchPapers(query, 20);
  }

  static async getPaperCitations(paperId: string, limit: number = 1000): Promise<SemanticScholarSearchResponse> {
    // Ensure paper ID is properly encoded for URL
    const encodedPaperId = encodeURIComponent(paperId);
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      fields: SEARCH_FIELDS,
      offset: '0'
    });

    const url = getApiUrl(`/graph/v1/paper/${encodedPaperId}/citations`, params);
    
    const response = await this.fetchWithRetry(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Citations API Error:', errorText);
      console.error('Citations URL that failed:', url);
      console.error('Response status:', response.status, response.statusText);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(retryAfter || undefined);
      }
      
      throw new Error(`Failed to fetch citations: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    
    
    
    // Citations API returns { data: [{ citingPaper: {...} }] }
    // Transform to match search response format
    return {
      total: data.total || data.data?.length || 0,
      offset: data.offset || 0,
      data: data.data?.map((item: any) => item.citingPaper).filter(Boolean) || []
    };
  }

  static async getPaperReferences(paperId: string, limit: number = 1000): Promise<SemanticScholarSearchResponse> {
    // Ensure paper ID is properly encoded for URL
    const encodedPaperId = encodeURIComponent(paperId);
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      fields: SEARCH_FIELDS,
      offset: '0'
    });

    const url = getApiUrl(`/graph/v1/paper/${encodedPaperId}/references`, params);
    
    const response = await this.fetchWithRetry(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('References API Error:', errorText);
      console.error('References URL that failed:', url);
      console.error('Response status:', response.status, response.statusText);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(retryAfter || undefined);
      }
      
      throw new Error(`Failed to fetch references: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    
    
    
    // References API returns { data: [{ citedPaper: {...} }] }
    // Transform to match search response format
    return {
      total: data.total || data.data?.length || 0,
      offset: data.offset || 0,
      data: data.data?.map((item: any) => item.citedPaper).filter(Boolean) || []
    };
  }

  static async getPaperRecommendations(paperId: string, limit: number = 100): Promise<SemanticScholarSearchResponse> {
    // Ensure paper ID is properly encoded for URL
    const encodedPaperId = encodeURIComponent(paperId);
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      fields: SEARCH_FIELDS
    });

    const url = getApiUrl(`/recommendations/v1/papers/forpaper/${encodedPaperId}`, params);
    

    const response = await this.fetchWithRetry(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Recommendations API Error:', errorText);
      console.error('Recommendations URL that failed:', url);
      console.error('Response status:', response.status, response.statusText);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(retryAfter || undefined);
      }
      
      throw new Error(`Failed to fetch recommendations: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    
    
    
    // Recommendations API returns { recommendedPapers: [...] }
    // Transform to match search response format
    return {
      total: data.recommendedPapers?.length || 0,
      offset: 0,
      data: data.recommendedPapers || []
    };
  }

  static async getRecommendationsFromExamples(
    positivePaperIds: string[], 
    negativePaperIds: string[] = [], 
    limit: number = 100
  ): Promise<SemanticScholarSearchResponse> {
    const params = new URLSearchParams({
      fields: SEARCH_FIELDS
    });

    const url = getApiUrl(`/recommendations/v1/papers`, params);
    
    const requestBody = {
      positivePaperIds,
      negativePaperIds,
      limit
    };
    
    
    
    const response = await this.fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Recommendations POST API Error:', errorText);
      console.error('Recommendations POST URL that failed:', url);
      console.error('Request body:', requestBody);
      console.error('Response status:', response.status, response.statusText);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new RateLimitError(retryAfter || undefined);
      }
      
      throw new Error(`Failed to fetch recommendations from examples: ${response.status} ${response.statusText}. ${errorText}`);
    }

    const data = await response.json();
    
    
    
    // Recommendations API returns { recommendedPapers: [...] }
    // Transform to match search response format
    return {
      total: data.recommendedPapers?.length || 0,
      offset: 0,
      data: data.recommendedPapers || []
    };
  }
}
