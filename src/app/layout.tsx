import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "어린이집 휴가 관리",
  description: "교직원 휴가 신청, 승인, 잔여 연차를 관리하는 내부 업무앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
