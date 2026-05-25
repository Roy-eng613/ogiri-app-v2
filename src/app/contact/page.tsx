import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col pt-12 px-4 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="text-sm hover:underline" style={{ color: "var(--accent-gold)" }}>
          &larr; トップページに戻る
        </Link>
      </div>
      
      <main className="flex-1 mb-16 flex flex-col items-center justify-center text-center">
        <div className="mb-6 text-4xl">✉️</div>
        <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>お問い合わせ</h1>
        
        <p className="mb-8 text-sm leading-relaxed max-w-md" style={{ color: "var(--text-secondary)" }}>
          当サイトに関するご質問、不具合の報告、その他のお問い合わせは、以下のGoogleフォームよりお願いいたします。
        </p>

        <a 
          href="https://docs.google.com/forms/d/e/1FAIpQLSfxaNjJ8StQqzr9FbNc58JOZ2gPNcAKa-skkviJTnX66IIxBg/viewform?usp=header"
          target="_blank"
          rel="noopener noreferrer"
          className="post-btn"
          style={{
            background: "linear-gradient(135deg, rgba(201,160,74,0.8), rgba(184,134,11,0.8))",
            color: "#000",
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            fontWeight: "bold",
            display: "inline-block"
          }}
        >
          Googleフォームを開く
        </a>
      </main>

      <SiteFooter />
    </div>
  );
}
