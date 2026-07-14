import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/AuthContext';
import ClientLayoutWrapper from './ClientLayoutWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI GitHub Project Analyzer & Deployment Readiness Checker',
  description: 'A smart technical mentor evaluating GitHub repository structures, README quality, deployment profiles, and generating optimization suggestions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-text min-h-screen flex flex-col">
        <AuthProvider>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
