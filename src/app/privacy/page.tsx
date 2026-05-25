import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col pt-12 px-4 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="text-sm hover:underline" style={{ color: "var(--accent-gold)" }}>
          &larr; トップページに戻る
        </Link>
      </div>
      
      <main className="flex-1 mb-16 prose prose-invert prose-gold max-w-none">
        <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: "var(--text-primary)" }}>プライバシーポリシー</h1>
        
        <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          制定日: 2026年5月24日
        </p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>1. 個人情報の収集について</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            当サイトでは、X（旧Twitter）を用いたログイン機能等において、お名前、アイコン画像、ユーザーIDなどの情報を取得する場合があります。
            これらの情報はサービスの提供（ユーザーの識別やアイコンの表示など）に必要な範囲でのみ利用いたします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>2. Cookie（クッキー）の利用について</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            当サイトは、ユーザーの利便性向上、アクセス解析、および広告の配信のためにCookieを使用しています。
            Cookieは、ユーザーがサイトを訪れた際に、そのユーザーのコンピュータ内に記録されますが、記録される情報にはユーザー名やメールアドレスなど、個人を特定するものは一切含まれません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>3. アクセス解析ツールについて</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            当サイトでは、Googleによるアクセス解析ツール「Google Analytics」を利用しています。
            このGoogle Analyticsはトラフィックデータの収集のためにCookieを使用しています。
            このトラフィックデータは匿名で収集されており、個人を特定するものではありません。
            この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>4. 広告の配信について</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            当サイトは、第三者配信の広告サービス（Google AdSense等）の利用を予定・導入しております。
            広告配信事業者は、ユーザーの興味に応じた商品やサービスの広告を表示するため、当サイトや他サイトへのアクセスに関する情報 『Cookie』（氏名、住所、メール アドレス、電話番号は含まれません）を使用することがあります。
            またGoogleアドセンスに関して、このプロセスの詳細やこのような情報が広告配信事業者に使用されないようにする方法については、Googleのポリシーと規約をご覧ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>5. 免責事項</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            当サイトのコンテンツ・情報につきまして、可能な限り正確な情報を掲載するよう努めておりますが、誤情報が入り込んだり、情報が古くなっていることもございます。
            当サイトに掲載された内容によって生じた損害等の一切の責任を負いかねますのでご了承ください。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>6. プライバシーポリシーの変更について</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            当サイトは、個人情報に関して適用される日本の法令を遵守するとともに、本ポリシーの内容を適宜見直しその改善に努めます。
            修正された最新のプライバシーポリシーは常に本ページにて開示されます。
          </p>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
