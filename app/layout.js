import { AuthProvider } from '@/context/AuthContext';
import AntProvider from './AntProvider';
import './globals.css';

export const metadata = {
  title: 'CrazyCMO — Marketing Automation',
  description: 'AI-powered marketing automation dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,300&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AntProvider>
          <AuthProvider>{children}</AuthProvider>
        </AntProvider>
      </body>
    </html>
  );
}
