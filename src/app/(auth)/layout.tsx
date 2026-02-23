export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#080A12',
        color: '#F8FAFC',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif',
      }}
    >
      {children}
    </div>
  );
}
