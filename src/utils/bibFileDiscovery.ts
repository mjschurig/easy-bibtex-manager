interface BibFile {
  name: string;
  content: string;
}

// Common .bib filename patterns to try
const COMMON_BIB_NAMES = [
  'bibliography.bib',
  'references.bib',
  'refs.bib',
  'main.bib',
  'paper.bib',
  'thesis.bib',
  'dissertation.bib',
  'citations.bib',
  'sources.bib',
  'lit.bib',
  'library.bib',
  'collection.bib',
  'sample.bib'
];

/**
 * Checks if the current page is running on file:// protocol
 */
function isFileProtocol(): boolean {
  return window.location.protocol === 'file:';
}

/**
 * Attempts to discover .bib files in the same directory as the current page
 * by trying common filename patterns.
 * Note: This only works when served over HTTP/HTTPS, not file:// protocol
 */
export async function discoverBibFiles(): Promise<BibFile[]> {
  const foundFiles: BibFile[] = [];
  
  // Check if running on file:// protocol
  if (isFileProtocol()) {
    console.log('Running on file:// protocol - auto-discovery not supported. Please serve over HTTP or use "Open File" button.');
    return foundFiles;
  }
  
  // Get the base URL (directory) of the current page
  const baseUrl = window.location.href.split('/').slice(0, -1).join('/');
  
  console.log(`Attempting to discover .bib files at: ${baseUrl}`);
  
  // Try each common filename
  const promises = COMMON_BIB_NAMES.map(async (filename) => {
    try {
      const url = `${baseUrl}/${filename}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const content = await response.text();
        
        // Basic validation: check if it looks like a BibTeX file
        if (isValidBibTeXContent(content)) {
          console.log(`Found valid .bib file: ${filename}`);
          return { name: filename, content };
        }
      }
    } catch (error) {
      // Silently ignore fetch errors (file not found, etc.)
    }
    
    return null;
  });
  
  const results = await Promise.allSettled(promises);
  
  // Collect successful results
  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value) {
      foundFiles.push(result.value);
    }
  });
  
  return foundFiles;
}

/**
 * Basic validation to check if content looks like BibTeX format
 */
function isValidBibTeXContent(content: string): boolean {
  const trimmed = content.trim();
  
  // Must have some content
  if (trimmed.length < 10) return false;
  
  // Should contain BibTeX entry patterns
  const bibEntryPattern = /@\w+\s*\{/i;
  const hasEntries = bibEntryPattern.test(trimmed);
  
  // Should have balanced braces (basic check)
  const openBraces = (trimmed.match(/\{/g) || []).length;
  const closeBraces = (trimmed.match(/\}/g) || []).length;
  const reasonablyBalanced = Math.abs(openBraces - closeBraces) <= openBraces * 0.1;
  
  return hasEntries && reasonablyBalanced;
}

/**
 * Attempts to discover custom .bib files by trying additional patterns
 * based on the current HTML filename
 * Note: This only works when served over HTTP/HTTPS, not file:// protocol
 */
export async function discoverCustomBibFiles(): Promise<BibFile[]> {
  const foundFiles: BibFile[] = [];
  
  // Check if running on file:// protocol
  if (isFileProtocol()) {
    return foundFiles;
  }
  
  // Get current page filename without extension
  const currentUrl = window.location.href;
  const filename = currentUrl.split('/').pop() || '';
  const baseName = filename.replace(/\.[^/.]+$/, ''); // Remove extension
  
  if (baseName && baseName !== 'index') {
    const customNames = [
      `${baseName}.bib`,
      `${baseName}_refs.bib`,
      `${baseName}_bibliography.bib`
    ];
    
    const baseUrl = currentUrl.split('/').slice(0, -1).join('/');
    
    const promises = customNames.map(async (bibFilename) => {
      try {
        const url = `${baseUrl}/${bibFilename}`;
        const response = await fetch(url);
        
        if (response.ok) {
          const content = await response.text();
          
          if (isValidBibTeXContent(content)) {
            console.log(`Found custom .bib file: ${bibFilename}`);
            return { name: bibFilename, content };
          }
        }
      } catch (error) {
        // Silently ignore errors
      }
      
      return null;
    });
    
    const results = await Promise.allSettled(promises);
    
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        foundFiles.push(result.value);
      }
    });
  }
  
  return foundFiles;
}

/**
 * Main function to discover all available .bib files
 */
export async function findAllBibFiles(): Promise<BibFile[]> {
  const [commonFiles, customFiles] = await Promise.all([
    discoverBibFiles(),
    discoverCustomBibFiles()
  ]);


  
  // Combine and deduplicate by filename
  const allFiles = [...commonFiles, ...customFiles];

  console.log('allFiles', allFiles);
  
  const uniqueFiles = allFiles.filter((file, index, arr) => 
    arr.findIndex(f => f.name === file.name) === index
  );
  
  return uniqueFiles;
}
