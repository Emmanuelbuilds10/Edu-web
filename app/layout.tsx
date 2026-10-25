import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { ToastProvider } from "@/components/providers/toaster-provider";
import { ConfettiProvider } from "@/components/providers/confetti-provider";
import { AppAuthProvider } from "@/components/providers/app-auth-provider";
import { UploadModeProvider } from "@/components/providers/upload-mode-provider";
import { RouteProgress } from "@/components/providers/route-progress";
import { auth } from "@/lib/auth";
export const metadata: Metadata = {
  title: "Sabiplex | Learn without limits",
  description: "A modern learning platform for ambitious people.",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = auth();

  return (
    <AppAuthProvider userId={userId ?? null}>
      <UploadModeProvider mode={process.env.UPLOADTHING_SECRET ? "uploadthing" : "local"}>
        <html lang="en">
          <body className="min-h-screen">
            <noscript>
              <style>{".reveal{opacity:1;transform:none}"}</style>
            </noscript>
            <Suspense fallback={null}>
              <RouteProgress />
            </Suspense>
            <ToastProvider />
            <ConfettiProvider />
            {children}
          </body>
        </html>
      </UploadModeProvider>
    </AppAuthProvider>
  );
}
