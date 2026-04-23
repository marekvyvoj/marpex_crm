import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-xl font-bold text-red-600 mb-2">Nastala chyba</h1>
            <p className="text-gray-500 text-sm mb-4">{this.state.error.message}</p>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.href = "/";
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              Späť na dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
