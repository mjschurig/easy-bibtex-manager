import * as v from 'valibot';
import { CSL_ENTRY_TYPES } from '../types/cslFieldMetadata';

// Citation key validation
const citationKeySchema = v.pipe(
  v.string(),
  v.minLength(1, 'Citation key is required'),
  v.regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, 'Citation key must start with a letter and contain only letters, numbers, underscores, and hyphens')
);

// DOI validation
const doiSchema = v.optional(v.pipe(
  v.string(),
  v.regex(/^10\..+/, 'DOI must start with "10."')
));

// CSL Author schema
const cslAuthorSchema = v.object({
  given: v.optional(v.string()),
  family: v.optional(v.string()),
  literal: v.optional(v.string())
});

const authorsArraySchema = v.array(cslAuthorSchema);

// CSL Date schema
const cslDateSchema = v.object({
  'date-parts': v.optional(v.array(v.array(v.number()))),
  literal: v.optional(v.string())
});

// Main CSL entry schema
export const cslEntrySchema = v.object({
  id: citationKeySchema,
  type: v.picklist(CSL_ENTRY_TYPES),
  title: v.optional(v.string()),
  author: v.optional(authorsArraySchema, []),
  editor: v.optional(authorsArraySchema, []),
  issued: v.optional(cslDateSchema),
  'container-title': v.optional(v.string()),
  volume: v.optional(v.string()),
  issue: v.optional(v.string()),
  page: v.optional(v.string()),
  publisher: v.optional(v.string()),
  'publisher-place': v.optional(v.string()),
  DOI: v.optional(doiSchema),
  note: v.optional(v.string()),
  abstract: v.optional(v.string()),
  chapter: v.optional(v.string()),
  edition: v.optional(v.string()),
  'collection-title': v.optional(v.string()),
  school: v.optional(v.string()),
  institution: v.optional(v.string()),
  organization: v.optional(v.string()),
  URL: v.optional(v.string())
});

// Citation collection schema
export const citationCollectionSchema = v.object({
  entries: v.array(cslEntrySchema),
  variables: v.record(v.string(), v.string())
});

// Validation result interface
export interface ValidationResult {
  success: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

// Helper functions
function validateUniqueKey(key: string, existingKeys: string[], currentKey?: string): boolean {
  return currentKey === key || !existingKeys.includes(key);
}

// Main validation function for CSL entries
export function validateCSLEntry(entry: unknown, existingKeys: string[] = []): ValidationResult {
  try {
    v.parse(cslEntrySchema, entry);

    const errors: Array<{field: string; message: string; code: string}> = [];
    const typedEntry = entry as any;

    // Additional custom validations
    if (!validateUniqueKey(typedEntry.id, existingKeys, typedEntry.id)) {
      errors.push({
        field: 'id',
        message: 'Citation ID must be unique',
        code: 'DUPLICATE_ID'
      });
    }

    return {
      success: errors.length === 0,
      errors
    };

  } catch (error) {
    const vError = error as v.ValiError<any>;
    const errors = vError.issues?.map((issue: any) => ({
      field: issue.path?.[0]?.key as string || 'unknown',
      message: issue.message,
      code: issue.type?.toUpperCase() || 'VALIDATION_ERROR'
    })) || [{
      field: 'unknown',
      message: 'Validation failed',
      code: 'VALIDATION_ERROR'
    }];

    return {
      success: false,
      errors
    };
  }
}

export function validateCitationCollection(collection: unknown): ValidationResult {
  try {
    v.parse(citationCollectionSchema, collection);
    
    const errors: Array<{field: string; message: string; code: string}> = [];
    const typedCollection = collection as any;

    // Check for duplicate entry IDs
    const entryIds = typedCollection.entries.map((entry: any) => entry.id);
    const duplicateIds = entryIds.filter((id: string, index: number) => 
      entryIds.indexOf(id) !== index
    );
    
    for (const id of duplicateIds) {
      errors.push({
        field: 'entries',
        message: `Duplicate entry ID: ${id}`,
        code: 'DUPLICATE_ENTRY_ID'
      });
    }

    return {
      success: errors.length === 0,
      errors
    };

  } catch (error) {
    const vError = error as v.ValiError<any>;
    const errors = vError.issues?.map((issue: any) => ({
      field: issue.path?.[0]?.key as string || 'unknown',
      message: issue.message,
      code: issue.type?.toUpperCase() || 'VALIDATION_ERROR'
    })) || [{
      field: 'unknown',
      message: 'Validation failed',
      code: 'VALIDATION_ERROR'
    }];

    return {
      success: false,
      errors
    };
  }
} 