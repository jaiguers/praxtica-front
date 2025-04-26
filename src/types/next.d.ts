declare module 'next' {
  export interface RouteContext {
    params: Promise<Record<string, string>>;
  }

  export interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams?: Record<string, string | string[] | undefined>;
  }

  export interface LayoutProps {
    children?: React.ReactNode;
    params?: Record<string, string>;
  }
} 