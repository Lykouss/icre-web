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
    <html lang="pt-BR">
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