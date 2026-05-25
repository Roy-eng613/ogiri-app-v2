import SiteFooter from "@/components/SiteFooter";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col pt-12 px-4 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="text-sm hover:underline" style={{ color: "var(--accent-gold)" }}>
          &larr; トップページに戻る
        </Link>
      </div>
      
      <main className="flex-1 mb-16 prose prose-invert prose-gold max-w-none">
        <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: "var(--text-primary)" }}>利用規約</h1>
        
        <p className="mb-6 text-sm" style={{ color: "var(--text-secondary)" }}>
          制定日: 2026年5月24日
        </p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>第1条（適用）</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            本規約は、ユーザーと当サイトとの間のサービスの利用に関わる一切の関係に適用されるものとします。
            当サイトを利用することにより、ユーザーは本規約に同意したものとみなされます。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>第2条（禁止事項）</h2>
          <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>
            ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1" style={{ color: "var(--text-secondary)" }}>
            <li>法令または公序良俗に違反する行為</li>
            <li>犯罪行為に関連する行為</li>
            <li>当サイトのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
            <li>当サイトのサービスの運営を妨害するおそれのある行為</li>
            <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
            <li>他のユーザーに成りすます行為</li>
            <li>当サイトのサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
            <li>他人を誹謗中傷、差別する内容を投稿する行為</li>
            <li>その他、当サイトが不適切と判断する行為</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>第3条（本サービスの提供の停止等）</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            当サイトは、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
            当サイトは、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、理由を問わず一切の責任を負わないものとします。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>第4条（免責事項）</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            当サイトの債務不履行責任は、当サイトの故意または重過失によらない場合には免責されるものとします。
            当サイトは、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。
            また、AIが生成した回答（ボケ）は自動生成されるものであり、その内容の正確性、合法性、道徳性について当サイトは一切の保証を行いません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>第5条（サービス内容の変更等）</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            当サイトは、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>第6条（利用規約の変更）</h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            当サイトは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。
            なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
          </p>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
