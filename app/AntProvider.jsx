'use client';
import { ConfigProvider, theme, App } from 'antd';

export default function AntProvider({ children }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#00b894',
          colorSuccess: '#00b894',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          colorInfo: '#3b82f6',
          borderRadius: 8,
          fontFamily: "'DM Sans', sans-serif",
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          colorBorder: '#e2e5eb',
          colorText: '#1a1d23',
          colorTextSecondary: '#7c8291',
          colorBgLayout: '#f5f6fa',
        },
        components: {
          Button: { controlHeight: 36, fontSize: 13 },
          Tag: { fontSize: 11 },
          Card: { padding: 16 },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
