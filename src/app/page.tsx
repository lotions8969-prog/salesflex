import Link from "next/link";
import { BarChart3, Settings, ClipboardList, LayoutDashboard, ArrowRight, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-10">
      {/* ヒーローセクション */}
      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 text-white p-4 rounded-2xl">
            <BarChart3 className="h-10 w-10" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          SalesFlex
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          営業特化型タレントマネジメントシステム
        </p>
        <p className="text-gray-500 max-w-2xl mx-auto">
          エンジニアが不要。現場のマネージャーが追いたい指標を
          <strong className="text-blue-600">自由に設定・変更</strong>できる、
          柔軟なKPI管理システムです。
        </p>
      </div>

      {/* 特徴 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-yellow-500" />
          <h2 className="font-bold text-gray-900">最大の特徴：動的カスタムフィールド</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-blue-600 font-semibold mb-1">① 指標を自由に定義</div>
            <p className="text-gray-600">「商談化率（数値）」「ヒアリング力（5段階）」など、追いたい指標をUIから追加</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-green-600 font-semibold mb-1">② 自動でフォーム生成</div>
            <p className="text-gray-600">定義に基づいて入力フォームが自動生成。コード変更不要</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-purple-600 font-semibold mb-1">③ 動的ダッシュボード</div>
            <p className="text-gray-600">5段階評価→レーダーチャート、数値→進捗ボードに自動で振り分け</p>
          </div>
        </div>
      </div>

      {/* ナビゲーションカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/dashboard"
          className="group block p-6 bg-white rounded-xl border hover:border-blue-300 hover:shadow-md transition-all"
        >
          <LayoutDashboard className="h-8 w-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-gray-900 mb-1">ダッシュボード</h3>
          <p className="text-sm text-gray-500 mb-3">
            レーダーチャートと進捗ボードでチームの状況を把握
          </p>
          <span className="text-blue-600 text-sm flex items-center gap-1">
            開く <ArrowRight className="h-3 w-3" />
          </span>
        </Link>

        <Link
          href="/input"
          className="group block p-6 bg-white rounded-xl border hover:border-green-300 hover:shadow-md transition-all"
        >
          <ClipboardList className="h-8 w-8 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-gray-900 mb-1">データ入力</h3>
          <p className="text-sm text-gray-500 mb-3">
            定義された指標に基づいて自動生成される入力フォーム
          </p>
          <span className="text-green-600 text-sm flex items-center gap-1">
            開く <ArrowRight className="h-3 w-3" />
          </span>
        </Link>

        <Link
          href="/settings"
          className="group block p-6 bg-white rounded-xl border hover:border-purple-300 hover:shadow-md transition-all"
        >
          <Settings className="h-8 w-8 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-gray-900 mb-1">指標設定</h3>
          <p className="text-sm text-gray-500 mb-3">
            管理者がKPIやスキル項目を自由に追加・編集
          </p>
          <span className="text-purple-600 text-sm flex items-center gap-1">
            開く <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      </div>

      {/* データモデル説明 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-gray-900 mb-4">データ設計：柔軟性の仕組み</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { label: "MetricDefinition", desc: "指標の定義（名前・型・カテゴリ・表示設定）", color: "bg-blue-50 border-blue-200" },
            { label: "MetricValue", desc: "実際のデータ（数値/評価/テキスト）", color: "bg-green-50 border-green-200" },
            { label: "User", desc: "メンバー情報", color: "bg-gray-50 border-gray-200" },
            { label: "Team", desc: "チームごとの指標切り替え", color: "bg-purple-50 border-purple-200" },
          ].map((m) => (
            <div key={m.label} className={`rounded-lg border p-3 ${m.color}`}>
              <div className="font-mono font-semibold text-gray-700 mb-1">{m.label}</div>
              <p className="text-gray-500">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
