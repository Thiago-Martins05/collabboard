"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return (
          <this.props.fallback
            error={this.state.error!}
            resetError={this.resetError}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="rounded-2xl border bg-card/90 backdrop-blur-sm p-6 shadow-lg text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">
            Algo deu errado
          </h2>

          <p className="text-sm text-muted-foreground mb-6">
            Ocorreu um erro inesperado. Nossa equipe foi notificada e está
            trabalhando para resolver o problema.
          </p>

          {process.env.NODE_ENV === "development" && (
            <details className="mb-4 text-left">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                Detalhes do erro (desenvolvimento)
              </summary>
              <pre className="mt-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg overflow-auto">
                {error.message}
                {error.stack}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <Button
              onClick={resetError}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>

            <Button
              variant="outline"
              onClick={() => (window.location.href = "/dashboard")}
              className="flex-1"
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useErrorHandler() {
  return (error: Error, context?: Record<string, any>) => {
    Sentry.captureException(error, {
      contexts: context ? { custom: context } : undefined,
    });
  };
}
