import { createRoot } from "react-dom/client";
import React from "react";
import App from "./App";
import "./index.css";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    try {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: info.componentStack,
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(() => {});
    } catch (e) {}
  }
  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error ? this.state.error.message : 'Unknown error';
      return React.createElement('div', {
        style: { padding: '40px', textAlign: 'center' as const, color: '#fff', background: '#1a1a2e', minHeight: '100vh', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' }
      },
        React.createElement('h1', { style: { fontSize: '24px', marginBottom: '16px' } }, 'Something went wrong'),
        React.createElement('p', { style: { color: '#999', marginBottom: '12px', maxWidth: '400px' } }, 'Please try refreshing the page. If the issue persists, clear your browser cache.'),
        React.createElement('p', { style: { color: '#666', fontSize: '12px', marginBottom: '20px', maxWidth: '400px', wordBreak: 'break-all' as const } }, errMsg),
        React.createElement('button', {
          onClick: () => window.location.reload(),
          style: { padding: '12px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' }
        }, 'Refresh Page')
      );
    }
    return this.props.children;
  }
}

window.addEventListener('error', function(e) {
  try {
    fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error ? e.error.stack : null,
        url: window.location.href,
        userAgent: navigator.userAgent,
        type: 'uncaught'
      })
    }).catch(function() {});
  } catch (ex) {}
});

window.addEventListener('unhandledrejection', function(e) {
  try {
    var reason = e.reason;
    fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: reason ? (reason.message || String(reason)) : 'Unknown rejection',
        stack: reason ? reason.stack : null,
        url: window.location.href,
        userAgent: navigator.userAgent,
        type: 'unhandledrejection'
      })
    }).catch(function() {});
  } catch (ex) {}
});

createRoot(document.getElementById("root")!).render(
  React.createElement(ErrorBoundary, null, React.createElement(App))
);
