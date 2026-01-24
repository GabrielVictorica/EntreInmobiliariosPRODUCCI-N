import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: null };

    constructor(props: ErrorBoundaryProps) {
        super(props);
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error(">>> [CRITICAL] ErrorBoundary caught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full items-center justify-center bg-[#E0D8CC] flex-col p-8 text-center">
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-red-100 max-w-lg">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={40} strokeWidth={2} />
                        </div>
                        <h1 className="text-3xl font-black text-[#364649] mb-4 uppercase">Algo salió mal</h1>
                        <p className="text-slate-500 mb-8 font-medium">La aplicación encontró un error inesperado. Hemos sido notificados y estamos trabajando en ello.</p>
                        {this.state.error && (
                            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 w-full text-left overflow-auto max-h-40">
                                <p className="text-xs font-mono text-red-800 break-all">{this.state.error.toString()}</p>
                                {this.state.error.stack && <p className="text-[10px] font-mono text-red-600 mt-2 whitespace-pre-wrap">{this.state.error.stack.split('\n')[0]}</p>}
                            </div>
                        )}
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-[#364649] text-white font-black py-4 rounded-2xl hover:bg-[#242f31] transition-all shadow-lg shadow-black/10"
                        >
                            RECARGAR APLICACIÓN
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
