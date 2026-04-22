import type { Metadata } from "next";
import { Inter, Fira_Code, Fira_Sans } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc/client";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});
const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
});
const firaSans = Fira_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-fira-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Green Academy — Learn, Teach, Grow",
    template: "%s | Green Academy",
  },
  description:
    "A modern Learning Management System. Discover courses, track progress, and earn certificates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${firaCode.variable} ${firaSans.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <TRPCProvider>
            {children}
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              toastOptions={{
                style: {
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(12px)",
                  fontSize: "13px",
                  fontWeight: 500,
                },
                className: "shadow-xl",
              }}
            />
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

