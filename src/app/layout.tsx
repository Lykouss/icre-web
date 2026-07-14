import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { MaintenanceProvider } from '@/features/core/components/MaintenanceProvider';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#2563EB",
};

export const metadata: Metadata = {
  title: "ICRE | Igreja de Cristo Rocha Eterna",
  description: "Portal de Membros e Gestão Eclesiástica",
  manifest: "/manifest.json", // Link para o manifesto PWA
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            let theme = localStorage.getItem('public-theme');
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else if (theme === 'light') {
              document.documentElement.classList.remove('dark');
            } else {
              // fallback if no localStorage, though we also use cookies
              // we can rely on nextjs rendering the cookie theme or just do nothing here 
              // wait, the server actually doesn't render it. So we rely on cookie or system.
              if (document.cookie.includes('public-theme=dark')) {
                 document.documentElement.classList.add('dark');
              }
            }
          } catch (e) {}
        `}} />
      </head>
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        {/* Limpa service workers residuais do PWA antigo que causam reload loops */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              for (var r of registrations) {
                if (r.active && r.active.scriptURL && !r.active.scriptURL.includes('firebase-messaging-sw')) {
                  r.unregister();
                }
              }
            });
            if ('caches' in window) {
              caches.keys().then(function(names) {
                for (var name of names) {
                  if (name.startsWith('workbox-') || name === 'start-url' || name.startsWith('static-') || name === 'next-data' || name === 'next-image' || name === 'others' || name === 'apis') {
                    caches.delete(name);
                  }
                }
              });
            }
          }
        `}} />
        <MaintenanceProvider>
          {children}
        </MaintenanceProvider>
      </body>
    </html>
  );
}