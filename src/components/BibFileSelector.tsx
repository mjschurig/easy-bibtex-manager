

interface BibFile {
  name: string;
  content: string;
}

interface BibFileSelectorProps {
  files: BibFile[];
  onSelect: (file: BibFile) => void;
  onCancel: () => void;
}

export function BibFileSelector({ files, onSelect, onCancel }: BibFileSelectorProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Multiple BibTeX Files Found
          </h2>
          <p className="text-gray-600 mb-4">
            Found {files.length} BibTeX files. Please select which one to load:
          </p>
          
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, index) => (
              <button
                key={index}
                onClick={() => onSelect(file)}
                className="w-full text-left p-3 border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="font-medium text-gray-800">{file.name}</div>
                <div className="text-sm text-gray-500">
                  {(file.content.length / 1024).toFixed(1)} KB
                </div>
              </button>
            ))}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
