
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="py-6">
          {children}
        </main>
      </div>
    </div>
  );
}