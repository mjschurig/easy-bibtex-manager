import { BibTeXEntry } from '../types/bibtex';

interface EntryCardProps {
  entry: BibTeXEntry;
  isActive: boolean;
  onClick: () => void;
}

export function EntryCard({ entry, isActive, onClick }: EntryCardProps) {
  const title = entry.processedFields?.title || 'No Title';
  const author = entry.processedFields?.author || 'Unknown Author';
  const year = entry.processedFields?.year || 'N/A';

  return (
    <div 
      className={`entry-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="title">{title}</div>
      <div className="author">{author}</div>
      <div className="meta">
        <span className="key">{entry.key}</span> – {year} – <em>@{entry.type}</em>
      </div>
    </div>
  );
} 