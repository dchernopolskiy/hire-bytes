import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg">
            Something went wrong. Please try refreshing the page.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}