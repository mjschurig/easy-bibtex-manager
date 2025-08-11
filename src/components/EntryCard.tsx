import { formatAuthors, getYear, getTitle } from '../utils/cslUtils';
import { useCitationData } from '../hooks/useCitation';

interface EntryCardProps {
  entry: any; // CSL-JSON entry
  isActive: boolean;
  onClick: () => void;
}

export function EntryCard({ entry, isActive, onClick }: EntryCardProps) {
  const { state } = useCitationData();
  const title = getTitle(entry) || 'No Title';
  const author = entry.author && entry.author.length > 0 
    ? formatAuthors(entry.author, state.variables) 
    : 'Unknown Author';
  const year = getYear(entry) || 'N/A';

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-md p-4 mb-4 cursor-pointer transition-all duration-200 hover:border-blue-600 hover:shadow-md ${
        isActive ? 'border-l-4 border-l-blue-600' : ''
      }`}
      onClick={onClick}
    >
      <div className="font-bold text-lg mb-2">{title}</div>
      <div className="text-sm text-gray-600">{author}</div>
      <div className="text-sm text-gray-600 mt-2 italic">
        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-sm">{entry.id}</span> – {year} – <em>@{entry.type}</em>
      </div>
    </div>
  );
} 