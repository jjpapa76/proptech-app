'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 bg-red-900/50 border border-red-700 rounded text-center">
                    <h2 className="text-lg font-bold text-red-400 mb-2">오류가 발생했습니다.</h2>
                    <p className="text-sm text-gray-300">페이지를 새로고침하거나 관리자에게 문의하세요.</p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
