import { BibTeXEntry, StringVariables, ParsedBibTeX } from '../types/bibtex';

interface BlockResult {
  content: string;
  endIndex: number;
}

interface ParseFieldResult {
  key: string;
  value: string;
}

interface ParseValueResult {
  value: string;
  length: number;
}

export function parseBibtex(text: string): ParsedBibTeX {
  const entries: BibTeXEntry[] = [];
  const strings: StringVariables = {};

  const cleanText = text.replace(/\r\n/g, '\n').replace(/%.*$/gm, '');

  let cursor = 0;
  while (cursor < cleanText.length) {
    const atIndex = cleanText.indexOf('@', cursor);
    if (atIndex === -1) break;

    const typeMatch = cleanText.substring(atIndex + 1).match(/^(\w+)/);
    if (!typeMatch) {
      cursor = atIndex + 1;
      continue;
    }

    const type = typeMatch[1].toLowerCase();
    const blockStart = atIndex + 1 + typeMatch[0].length;
    
    const block = findBlock(cleanText, blockStart);
    if (!block) {
      cursor = blockStart;
      continue;
    }
    
    let content = block.content;
    cursor = block.endIndex;

    try {
      if (type === 'string' || type === 'preamble') {
        const { key, value } = parseField(content);
        if (key && value) {
          strings[key.toLowerCase()] = value;
        }
        continue;
      }
      if (type === 'comment') {
        continue;
      }

      const keyMatch = content.match(/^\s*([^,]+)\s*,/);
      if (!keyMatch) continue;

      const key = keyMatch[1].trim();
      const fieldsText = content.substring(keyMatch[0].length);

      const entry: BibTeXEntry = {
        type,
        key,
        fields: parseFields(fieldsText)
      };
      entries.push(entry);

    } catch (e) {
      // Skip malformed entries
    }
  }
  return { entries, strings };
}

function findBlock(text: string, startIndex: number): BlockResult | null {
  let openBraceIndex = text.indexOf('{', startIndex);
  let openParenIndex = text.indexOf('(', startIndex);
  let openChar: string, closeChar: string, start: number;

  if (openParenIndex !== -1 && (openParenIndex < openBraceIndex || openBraceIndex === -1)) {
    openChar = '(';
    closeChar = ')';
    start = openParenIndex;
  } else if (openBraceIndex !== -1) {
    openChar = '{';
    closeChar = '}';
    start = openBraceIndex;
  } else {
    return null;
  }

  let balance = 1;
  for (let i = start + 1; i < text.length; i++) {
    if (text[i] === openChar) balance++;
    else if (text[i] === closeChar) balance--;
    if (balance === 0) {
      return {
        content: text.substring(start + 1, i),
        endIndex: i + 1
      };
    }
  }
  return null;
}

function parseFields(fieldsText: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let cursor = 0;
  while (cursor < fieldsText.length) {
    const nextFieldMatch = fieldsText.substring(cursor).match(/^\s*(\w+)\s*=/);
    if (!nextFieldMatch) break;

    const key = nextFieldMatch[1].toLowerCase();
    cursor += nextFieldMatch.index! + nextFieldMatch[0].length;

    const { value, length } = parseValue(fieldsText.substring(cursor));
    fields[key] = value;
    cursor += length;

    const commaMatch = fieldsText.substring(cursor).match(/^\s*,/);
    if (commaMatch) {
      cursor += commaMatch[0].length;
    }
  }
  return fields;
}

function parseField(fieldText: string): ParseFieldResult {
  const match = fieldText.match(/^\s*(\w+)\s*=\s*([\s\S]+)/);
  if (!match) return { key: '', value: '' };
  const key = match[1];
  const { value } = parseValue(match[2]);
  return { key, value };
}

function parseValue(text: string): ParseValueResult {
  const startChar = text.match(/^\s*/)![0];
  const trimmedText = text.trim();
  let value = '';
  let consumedLength = 0;

  if (trimmedText.includes('#')) {
    const match = trimmedText.match(/^([^,]+)/);
    value = match ? match[0].trim() : '';
    consumedLength = value.length;
  } else if (trimmedText.startsWith('{')) {
    let balance = 1;
    for (let i = 1; i < trimmedText.length; i++) {
      if (trimmedText[i] === '{') balance++;
      else if (trimmedText[i] === '}') balance--;
      if (balance === 0) {
        value = trimmedText.substring(1, i).trim();
        consumedLength = i + 1;
        break;
      }
    }
  } else if (trimmedText.startsWith('"')) {
    for (let i = 1; i < trimmedText.length; i++) {
      if (trimmedText[i] === '"' && trimmedText[i-1] !== '\\') {
        value = trimmedText.substring(1, i).trim();
        consumedLength = i + 1;
        break;
      }
    }
  } else {
    const match = trimmedText.match(/^([^,]+)/);
    value = match ? match[0].trim() : '';
    consumedLength = value.length;
  }

  return { value: value.replace(/\s\s+/g, ' '), length: startChar.length + consumedLength };
}

export function processEntries(entries: BibTeXEntry[], strings: StringVariables): BibTeXEntry[] {
  const processed = JSON.parse(JSON.stringify(entries)) as BibTeXEntry[];
  const entryMap = new Map(processed.map(e => [e.key.toLowerCase(), e]));

  const monthStrings = {
    jan: "January", feb: "February", mar: "March", apr: "April",
    may: "May", jun: "June", jul: "July", aug: "August",
    sep: "September", oct: "October", nov: "November", dec: "December"
  };
  const allStrings = { ...strings, ...monthStrings };

  for (const entry of processed) {
    entry.processedFields = {};
    for (const fieldKey in entry.fields) {
      entry.processedFields[fieldKey] = resolveFieldValue(entry.fields[fieldKey], allStrings);
    }

    if (entry.fields.author && !entry.authorsAreCanonical) {
      entry.authors = parseAuthors(entry.processedFields.author, entry.fields.author, strings);
    } else if (!entry.fields.author) {
      entry.authors = [];
    }
  }

  for (const entry of processed) {
    if (entry.fields.crossref) {
      const targetKey = entry.fields.crossref.toLowerCase();
      const targetEntry = entryMap.get(targetKey);

      if (targetEntry) {
        for (const fieldKey in targetEntry.fields) {
          if (!entry.fields.hasOwnProperty(fieldKey)) {
            entry.fields[fieldKey] = targetEntry.fields[fieldKey];
            entry.processedFields![fieldKey] = resolveFieldValue(targetEntry.fields[fieldKey], allStrings);
          }
        }
      }
    }
  }

  return processed;
}

function resolveFieldValue(value: string, strings: StringVariables): string {
  if (value.includes('#')) {
    const parts = value.split('#').map(part => part.trim());
    return parts.map(part => {
      const cleanedPart = part.replace(/"/g, '').toLowerCase();
      return strings[cleanedPart] || part.replace(/"/g, '');
    }).join('');
  }
  
  const lowerValue = value.toLowerCase();
  if (strings.hasOwnProperty(lowerValue)) {
    return strings[lowerValue];
  }

  return value;
}

export function parseAuthors(authorField: string, rawAuthorField: string | null = null, stringVariables: StringVariables = {}): string[] {
  if (!authorField) return [];
  const authors: string[] = [];
  
  if (rawAuthorField && rawAuthorField.includes('#')) {
    const parts = rawAuthorField.split('#');
    
    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart || trimmedPart === '"and"' || trimmedPart === '" and "') continue;
      
      const cleanPart = trimmedPart.replace(/^"(.*)"$/, '$1');
      
      if (stringVariables.hasOwnProperty(trimmedPart)) {
        authors.push(trimmedPart);
      } else if (cleanPart && cleanPart !== 'and' && cleanPart !== ' and ') {
        authors.push(normalizeAuthorName(cleanPart));
      }
    }
    
    return authors;
  }
  
  const authorParts = authorField.split(/ and /i);

  for (const trimmedPart of authorParts) {
    const cleanPart = trimmedPart.trim();
    if (!cleanPart) continue;

    if (stringVariables.hasOwnProperty(cleanPart)) {
      authors.push(cleanPart);
      continue;
    }

    authors.push(normalizeAuthorName(cleanPart));
  }
  
  return authors;
}

export function normalizeAuthorName(name: string): string {
  const trimmedName = name.trim();
  
  if (trimmedName.startsWith('{') && trimmedName.endsWith('}')) {
    return trimmedName.substring(1, trimmedName.length - 1);
  } else if (trimmedName.includes(',')) {
    const nameParts = trimmedName.split(',').map(p => p.trim());
    const lastName = nameParts[0];
    const firstName = nameParts.slice(1).join(', ');
    return `${lastName}, ${firstName}`;
  } else {
    const nameParts = trimmedName.split(/\s+/);
    const lastName = nameParts.pop()!;
    const firstName = nameParts.join(' ');
    return firstName ? `${lastName}, ${firstName}` : lastName;
  }
}

export function serializeBibtex(entries: BibTeXEntry[], strings: StringVariables): string {
  let bibtexString = '';

  for (const key in strings) {
    bibtexString += `@string{${key} = "${strings[key]}"}\n\n`;
  }

  entries.forEach(entry => {
    bibtexString += `@${entry.type}{${entry.key},\n`;
    const fieldKeys = Object.keys(entry.fields);
    fieldKeys.forEach((key, index) => {
      if (key.toLowerCase() === 'author' && entry.authors && entry.authors.length > 0) {
        let hasVariables = false;
        const authorParts = entry.authors.map(author => {
          if (strings.hasOwnProperty(author)) {
            hasVariables = true;
            return author;
          }
          return `"${author.replace(/"/g, '\\"')}"`;
        });

        if (hasVariables) {
          const authorField = `  author = ${authorParts.join(' # " and " # ')}`;
          bibtexString += authorField;
        } else {
          const simpleAuthorField = `  author = {${entry.authors.join(' and ')}}`;
          bibtexString += simpleAuthorField;
        }
      } else {
        const value = entry.fields[key];
        bibtexString += `  ${key} = {${value}}`;
      }

      if (index < fieldKeys.length - 1) {
        bibtexString += ',';
      }
      bibtexString += '\n';
    });
    bibtexString += '}\n\n';
  });

  return bibtexString;
} 