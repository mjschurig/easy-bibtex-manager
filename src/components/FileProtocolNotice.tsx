interface FileProtocolNoticeProps {
  onDismiss: () => void;
}

export function FileProtocolNotice({ onDismiss }: FileProtocolNoticeProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="ml-3 text-lg font-semibold text-gray-800">
              Auto-Discovery Not Available
            </h2>
          </div>
          
          <div className="mb-4 text-gray-600 space-y-2">
            <p>
              You're opening this file directly in your browser (file:// protocol). 
              Auto-discovery of .bib files is not supported in this mode due to browser security restrictions.
            </p>
            
            <p>
              <strong>To enable auto-discovery:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Serve the file over HTTP (e.g., using a local web server)</li>
              <li>Or use the "Open File" button to manually select your .bib file</li>
            </ul>
            
            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
              <strong>Quick server setup:</strong><br/>
              <code className="bg-gray-200 px-1 rounded">python3 -m http.server 8080</code><br/>
              Then open: <code className="bg-gray-200 px-1 rounded">http://localhost:8080</code>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={onDismiss}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

