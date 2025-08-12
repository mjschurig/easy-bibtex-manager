

interface BibFile {
  name: string;
  content: string;
}

interface BibFileSelectorProps {
  files?: BibFile[];
  onSelect: (file: BibFile) => void;
  onCancel: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BibFileSelector({ files, onSelect, onCancel, onFileUpload }: BibFileSelectorProps) {
  const hasFiles = files && files.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {hasFiles ? 'Multiple BibTeX Files Found' : 'Open BibTeX File'}
          </h2>
          
          {hasFiles ? (
            <>
              <p className="text-gray-600 mb-4">
                Found {files.length} BibTeX files. Please select which one to load:
              </p>
              
              <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
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
              
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-3">Or choose a different file:</p>
                <input
                  type="file"
                  accept=".bib,.bibtex"
                  onChange={onFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Please select a BibTeX (.bib) file to get started with managing your bibliography.
              </p>
              
              <input
                type="file"
                accept=".bib,.bibtex"
                onChange={onFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {hasFiles ? 'Cancel' : 'Skip for now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
