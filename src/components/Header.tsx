interface HeaderProps {
  filename: string | null;
  isLoaded: boolean;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onCreateEntry: () => void;
}

export function Header({ isLoaded, onOpenFile, onSaveFile, onCreateEntry }: HeaderProps) {
  return (
    <header>
      <h1>BibTeX Manager</h1>
      <div className="actions">
        <button onClick={onOpenFile}>Open .bib File</button>
        <button 
          className="primary" 
          onClick={onCreateEntry} 
          disabled={!isLoaded}
        >
          Create Entry
        </button>
        <button 
          className="primary" 
          onClick={onSaveFile} 
          disabled={!isLoaded}
        >
          Save
        </button>
      </div>
    </header>
  );
} 