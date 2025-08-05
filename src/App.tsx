import { CitationProvider } from './contexts/CitationContext';
import { CitationManager } from './components/CitationManager'

function App() {
  return (
    <CitationProvider>
      <div className="h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
        <CitationManager />
      </div>
    </CitationProvider>
  )
}

export default App
