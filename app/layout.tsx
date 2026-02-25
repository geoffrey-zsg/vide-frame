import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeFrame - 草图即刻化境引擎",
  description: "将手绘草图或自然语言描述实时转换为可交互的前端 UI 页面",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
