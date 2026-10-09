import React from 'react';
import { HiOutlineRefresh, HiOutlineExclamationCircle } from 'react-icons/hi';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200/80 p-8 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
              <HiOutlineExclamationCircle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-stone-900">Something went wrong</h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              An unexpected error occurred while rendering this page:
            </p>
            <div className="bg-stone-50 rounded-xl p-3 text-left overflow-x-auto text-[11px] font-mono text-red-600 border border-stone-200/60 max-h-32">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8b6f4e] hover:bg-[#785e40] text-white text-xs font-semibold uppercase tracking-wider shadow-sm cursor-pointer transition-all"
            >
              <HiOutlineRefresh className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
