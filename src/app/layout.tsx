import ThemeRegistry from "@/components/ThemeRegistry";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YouTube Top - 전자정부 프레임워크",
  description: "전자정부 프레임워크 기반 YouTube Top 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Bootstrap CSS */}
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
          rel="stylesheet"
          integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM"
          crossOrigin="anonymous"
        />
        {/* 전자정부 프레임워크 스타일 */}
        <link
          href="https://www.egovframe.go.kr/home/css/egovframework.css"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <ThemeRegistry>
          {/* 전자정부 프레임워크 헤더 */}
          <header className="egov-header">
            <div className="container">
              <div className="row">
                <div className="col-md-12">
                  <h1 className="egov-title">YouTube Top</h1>
                </div>
              </div>
            </div>
          </header>
          
          <main className="egov-main">
            {children}
          </main>
          
          {/* 전자정부 프레임워크 푸터 */}
          <footer className="egov-footer">
            <div className="container">
              <div className="row">
                <div className="col-md-12">
                  <p>&copy; 2024 YouTube Top. 전자정부 프레임워크 기반</p>
                </div>
              </div>
            </div>
          </footer>
        </ThemeRegistry>
        
        {/* jQuery */}
        <Script
          src="https://code.jquery.com/jquery-3.7.1.min.js"
          integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo="
          crossOrigin="anonymous"
        />
        {/* Bootstrap JS */}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz"
          crossOrigin="anonymous"
        />
      </body>
    </html>
  );
}
