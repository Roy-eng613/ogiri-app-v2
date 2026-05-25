import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="py-8 text-center" style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "auto" }}>
      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        ⛩️ 大喜利が世界を救う · AI大喜利SNS プロトタイプ β版
        <span className="mx-2">·</span>
        笑いで世界平和を実現しよう
      </p>
      
      <div className="flex flex-wrap justify-center gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
        <Link href="/terms" className="hover:underline transition-colors hover:text-white">
          利用規約
        </Link>
        <Link href="/privacy" className="hover:underline transition-colors hover:text-white">
          プライバシーポリシー
        </Link>
        <Link href="/contact" className="hover:underline transition-colors hover:text-white">
          お問い合わせ
        </Link>
      </div>
    </footer>
  );
}
