import React from 'react'
import LivingNewsroom from './components/LivingNewsroom'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white p-8 font-mono overflow-auto">
          <h1 className="text-2xl text-red-500 mb-4">CRITICAL RENDER ERROR</h1>
          <p className="mb-4 text-lg">{this.state.error?.toString()}</p>
          <pre className="text-xs text-gray-400 bg-gray-900 p-4 rounded overflow-x-auto">
            {this.state.errorInfo?.componentStack}
          </pre>
          <button
            className="mt-6 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
            onClick={() => window.location.reload()}
          >
            RELOAD PAGE
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  React.useEffect(() => {
    console.log("🚀 App component mounted successfully");
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground relative">
        <div className="absolute top-0 left-0 p-1 text-[8px] text-gray-800 opacity-20 pointer-events-none">
          V1.0.1-DEPLOY-CHECK
        </div>
        <LivingNewsroom />
      </div>
    </ErrorBoundary>
  )
}

export default App
