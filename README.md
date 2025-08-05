# BibTeX Manager

A modern, single-file bibliography manager built with React and TypeScript that runs entirely in your web browser. Features advanced type safety, real-time validation, and a sophisticated context-driven architecture.

## 🎯 Overview

This is a complete bibliography management application that allows you to open, edit, filter, and save BibTeX files directly in your browser. Built with modern React patterns, TypeScript, and a comprehensive validation system, the entire application compiles to a single HTML file with no external dependencies.

### ✨ Key Features

- 📁 **Single HTML File** - No installation required, runs anywhere
- 🔍 **Advanced Filtering** - Real-time search by text, author, year range, type, and custom filters
- ✏️ **Smart Edit Modes** - Form-based editing with validation + raw BibTeX editing
- 🔗 **String Variables** - Full support for `@STRING` variables with dedicated management UI
- 👥 **Author-Centric View** - Browse entries by author with detailed statistics
- 💾 **Modern File Handling** - File System Access API with download fallback
- 🎨 **Responsive Design** - Works seamlessly on desktop and mobile devices
- ⚡ **Lightning Fast** - Instant loading, smooth interactions, optimized rendering
- 🛡️ **Type Safety** - Full TypeScript coverage with structured data types
- ✅ **Real-time Validation** - BibTeX-specific validation with immediate feedback
- 🧩 **Component Architecture** - Modern React patterns with context-driven state management

## 🚀 Quick Start

### For Users

1. Download the latest `index.html` from the [releases](https://github.com/your-username/bibtex-manager/releases)
2. Open the file in any modern web browser
3. Click "Open File" to load your `.bib` file
4. Start managing your bibliography with advanced features!

### For Developers

```bash
# Clone the repository
git clone https://github.com/your-username/bibtex-manager.git
cd bibtex-manager

# Install dependencies
npm install

# Start development server
npm run dev

# Build single-file application
npm run build
```

## 🛠️ Technology Stack

- **Frontend:** React 18 with TypeScript and modern hooks patterns
- **State Management:** Custom React Context with useReducer for centralized state
- **Validation:** Valibot for schema-based real-time validation
- **Build Tool:** Vite with single-file plugin
- **Styling:** Modern CSS with variables and responsive design
- **Type System:** Comprehensive TypeScript interfaces with structured BibTeX types
- **Output:** Single 172KB HTML file (54KB gzipped)

## 📋 Features

### Core BibTeX Support
- ✅ Complete BibTeX parser supporting all entry types with structured data
- ✅ `@STRING` variable definitions with real-time substitution
- ✅ Cross-reference (`crossref`) resolution and validation
- ✅ Advanced author parsing with structured Author objects
- ✅ Page range parsing with structured page objects
- ✅ Comment handling and comprehensive syntax validation
- ✅ Export back to valid BibTeX format preserving structure

### Advanced Data Management
- ✅ **Structured Types** - Move beyond `Record<string, string>` to proper BibTeX data structures
- ✅ **Author Objects** - Structured author data with first names, last names, and variable references
- ✅ **Page Objects** - Proper page range handling with from/to structure
- ✅ **Field Metadata** - Comprehensive field definitions with validation rules and UI hints
- ✅ **Type Safety** - Full TypeScript coverage eliminating runtime type errors

### File Operations
- ✅ **Native File Access** - Direct saving with File System Access API
- ✅ **Download Fallback** - Traditional download for older browsers
- ✅ **Error Handling** - Clear error messages for file issues with recovery suggestions
- ✅ **Large File Support** - Handles bibliographies with 1000+ entries efficiently

### Entry Management
- ✅ **Smart Entry Display** - Clean, organized list with proper author and page formatting
- ✅ **Advanced Form Editing** - Specialized input components for authors, pages, and other fields
- ✅ **Real-time Validation** - BibTeX-specific validation with immediate error feedback
- ✅ **Raw Editing** - Direct BibTeX text editing for power users
- ✅ **CRUD Operations** - Create, read, update, delete with proper state management
- ✅ **Field-specific Validation** - Each field type has appropriate validation rules

### Search & Filtering
- ✅ **Multi-field Search** - Search across all fields (title, author, journal, etc.)
- ✅ **Author Filter** - Autocomplete filter with variable name support
- ✅ **Advanced Filtering** - Year range, entry type, and custom filters
- ✅ **Multiple Sort Options** - Sort by author, year, type, title, or citation key
- ✅ **Real-time Results** - Instant filtering as you type with debounced performance

### State Management
- ✅ **Centralized Context** - Single BibTeXContext managing all application state
- ✅ **Selection System** - Multi-type selection (entries, variables, authors)
- ✅ **Filter State** - Comprehensive filtering with persistent UI state
- ✅ **Form State** - Advanced form management with validation state
- ✅ **View State** - Tab management, sorting, and display mode persistence

### Advanced Features
- ✅ **String Variables** - Dedicated UI for managing `@STRING` definitions with usage tracking
- ✅ **Author Statistics** - Publication counts and collaboration insights
- ✅ **Multiple Views** - Literature, Authors, and Variables tabs with specialized interfaces
- ✅ **Keyboard Navigation** - Full keyboard accessibility with proper focus management
- ✅ **Specialized UI Components** - AuthorInputField and PagesInputField with real-time validation

## 🏗️ Architecture

### Modern React Architecture
The application uses a sophisticated React architecture with:

- **Context-driven State Management** - Single BibTeXContext with useReducer
- **Custom Hooks** - Specialized hooks for filtering, validation, and selection
- **Specialized Components** - Field-specific input components with validation
- **Type-safe Actions** - All state mutations through typed action creators

### Component Structure
```
src/
├── components/
│   ├── BibTeXManager.tsx           # Main application container
│   ├── Header.tsx                  # File operations and navigation
│   ├── TabNavigation.tsx           # Tab switching interface
│   ├── LiteratureView.tsx          # Entry list with advanced filtering
│   ├── EntryCard.tsx               # Individual entry display (updated for new types)
│   ├── EntryEditor.tsx             # Advanced form editing with validation
│   ├── AuthorFilter.tsx            # Author autocomplete filter
│   ├── AuthorsView.tsx             # Author-centric browsing
│   ├── VariablesView.tsx           # String variable management
│   └── ui/
│       ├── AuthorInputField.tsx    # Specialized author input with validation
│       └── PagesInputField.tsx     # Specialized page input with validation
├── contexts/
│   └── BibTeXContext.tsx           # Central state management context
├── hooks/
│   └── useBibTeX.ts                # Main hook and convenience hooks
├── schemas/
│   └── bibtexSchemas.ts            # Valibot validation schemas
├── types/
│   ├── bibtexV2.ts                 # Modern structured BibTeX types
│   └── bibtex.ts                   # Legacy types (deprecated)
├── utils/
│   ├── bibtexParser.ts             # BibTeX parsing and serialization
│   └── authorParser.ts             # Author string parsing and formatting
└── index.css                       # Global styles
```

### State Management Evolution
The application has evolved from simple state management to a comprehensive context system:

- **BibTeXContext** - Centralized state with useReducer for complex state transitions
- **Structured Data** - Move from `Record<string, string>` to proper TypeScript interfaces
- **Real-time Validation** - Valibot schemas with field-specific validation
- **UI State Integration** - Selection, filters, view state, and form state in single context
- **Performance Optimization** - Proper memoization and optimized re-renders

### Type System
```typescript
// Modern structured types
interface BibTeXEntry {
  key: string;
  type: BibTeXType;
  title?: string;
  author: Author[];        // Structured author objects
  editor: Author[];
  pages: pages[];          // Structured page ranges
  year?: string;
  // ... other fields with proper types
}

interface Author {
  variableName?: string;   // Reference to @STRING variable
  firstNames: string[];
  lastName: string;
  lastNameFirst?: boolean;
  bibtexName?: string;
}

interface pages {
  from: number;
  to?: number;            // Optional for single pages
}
```

## 📖 Usage Guide

### Opening Files
1. Click the "Open File" button or use the file input
2. Select your `.bib` file from your computer
3. The application will parse and display your entries with full validation

### Viewing Entries
- **Literature Tab** - Browse all entries with advanced filtering and sorting
- **Authors Tab** - See entries organized by author with statistics
- **Variables Tab** - Manage `@STRING` variable definitions with usage tracking

### Advanced Editing
1. Click on any entry to open the sophisticated editor
2. **Form Mode** - Use specialized input fields with real-time validation
   - Author fields with autocomplete and variable support
   - Page fields with range validation
   - Field-specific validation with immediate feedback
3. **Raw Mode** - Direct BibTeX text editing for power users
4. Save changes with comprehensive validation

### Filtering and Searching
- **Search Box** - Type to search across all fields with highlighting
- **Author Filter** - Click the author dropdown for autocomplete with variable support
- **Advanced Filters** - Year range, entry type, and custom filters
- **Sort Options** - Multiple sorting criteria with persistent state

### Variable Management
- **Variables Tab** - Dedicated interface for `@STRING` variables
- **Usage Tracking** - See where each variable is used
- **Real-time Updates** - Changes immediately reflected in entries

## 🔧 Development

### Project Setup
```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production (creates single HTML file)
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Run tests
npm test
```

### Architecture Principles
- **Type Safety First** - Full TypeScript coverage with no `any` types
- **Context-driven State** - Single source of truth with proper state management
- **Component Specialization** - Field-specific components with validation
- **Real-time Validation** - Immediate feedback with schema-based validation
- **Performance Optimization** - Proper memoization and optimized rendering

### Adding Features
1. **New Components** - Add to `src/components/` with proper TypeScript interfaces
2. **State Updates** - Add actions to BibTeXContext reducer
3. **Type Definitions** - Update `src/types/bibtexV2.ts`
4. **Validation** - Add schemas to `src/schemas/bibtexSchemas.ts`
5. **Utilities** - Add to `src/utils/` with proper error handling

## 🎨 Styling

The application uses modern CSS with:
- **CSS Variables** - Easy theming and consistency
- **Flexbox & Grid** - Advanced responsive layouts
- **Mobile-First** - Progressive enhancement design
- **Accessibility** - Proper focus states, ARIA labels, and keyboard navigation
- **Component Styling** - Scoped styles with consistent patterns

Key design principles:
- Clean, minimal interface with modern aesthetics
- Consistent spacing and typography system
- Intuitive navigation with clear visual hierarchy
- Fast, responsive interactions with smooth animations
- Accessibility-first design

## 📊 Performance

- **Bundle Size:** 172KB total (54KB gzipped)
- **Load Time:** Instant after initial download
- **Memory Usage:** Optimized React rendering with proper memoization
- **File Support:** Tested with 1000+ entry bibliographies
- **Validation Performance:** Real-time validation without UI lag
- **Search Performance:** Instant filtering with debounced optimization

## 🔒 Validation System

The application includes a comprehensive validation system:

- **Schema-based Validation** - Valibot schemas for all data types
- **Field-specific Rules** - Custom validation for each BibTeX field
- **Real-time Feedback** - Immediate validation as you type
- **Error Display** - Clear error messages with correction suggestions
- **Cross-validation** - Checks for unique keys, valid cross-references

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the architecture patterns
4. Ensure tests pass and build completes
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines
- Use TypeScript for all new code with proper interfaces
- Follow the context-driven architecture patterns
- Add proper validation schemas for new fields
- Include comprehensive error handling
- Test with various BibTeX files and edge cases
- Maintain single-file build capability
- Follow accessibility best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Validation powered by [Valibot](https://valibot.dev/)
- Bundled with [Vite](https://vitejs.dev/) and [vite-plugin-singlefile](https://github.com/richardtallent/vite-plugin-singlefile)
- Inspired by the need for a modern, type-safe, portable bibliography manager

## 📞 Support

If you encounter any issues or have questions:
1. Check the [Issues](https://github.com/your-username/bibtex-manager/issues) page
2. Create a new issue with a detailed description
3. Include your browser version, error messages, and sample BibTeX data if relevant

---

**Made with ❤️ for researchers and academics who need a powerful, modern bibliography manager with type safety and real-time validation.**