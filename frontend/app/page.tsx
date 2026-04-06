import Link from "next/link";
import {
  Shield, ShieldCheck, Lock, QrCode, Building2, GraduationCap,
  ArrowRight, CheckCircle2, Eye, BarChart3, FileCheck,
  Zap, Award, Hash, Blocks, type LucideIcon,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0c0b0a]">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0c0b0a] px-4 sm:px-8 pt-20 pb-28 sm:pt-28 sm:pb-36">
        {/* Dot grid background */}
        <div className="hero-dot-grid absolute inset-0 pointer-events-none opacity-40" aria-hidden />
        {/* Ambient glow */}
        <div
          className="absolute top-0 right-[20%] w-[700px] h-[500px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(160,92,32,0.09) 0%, transparent 70%)" }}
          aria-hidden
        />

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-16 items-center">
          {/* ── Left column ─────────────────────────── */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 border border-[#a05c20]/25 bg-[#a05c20]/8 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a05c20] animate-pulse" />
              <span className="text-[#a05c20] text-[11px] font-semibold tracking-[0.18em] uppercase">
                Инфраструктурный слой доверия
              </span>
            </div>

            {/* Wordmark */}
            <h1
              className="font-black text-[#f0d4a0] leading-none mb-1.5"
              style={{ fontSize: "clamp(72px, 11vw, 112px)", letterSpacing: "-0.045em" }}
            >
              VERITAS
            </h1>
            <p className="text-[#a05c20]/60 text-[11px] font-medium tracking-[0.45em] uppercase mb-9">
              от лат. veritas — истина
            </p>

            {/* Divider */}
            <div className="w-20 h-px bg-gradient-to-r from-[#a05c20] to-transparent mb-9" />

            {/* Headline */}
            <p className="text-stone-100 text-[1.35rem] font-semibold leading-[1.4] mb-4 max-w-xl">
              Криптографически защищённая<br className="hidden sm:block" />
              верификация дипломов и сертификатов
            </p>
            <p className="text-stone-500 text-base leading-relaxed mb-10 max-w-md">
              Работодатель сканирует QR — за 3 секунды получает математически
              доказуемый результат. Без звонков в ВУЗ, без регистрации.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2.5 bg-[#a05c20] hover:bg-[#b8692a] text-white font-semibold px-7 py-3.5 text-sm transition-all duration-200 hover:shadow-[0_0_36px_rgba(160,92,32,0.45)] active:scale-[0.98]"
              >
                <GraduationCap className="h-4 w-4" />
                Я выпускник — регистрация
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              <Link
                href="/register/issuer"
                className="group inline-flex items-center justify-center gap-2.5 border border-[#2a2622] hover:border-[#a05c20]/50 text-stone-400 hover:text-stone-200 font-medium px-7 py-3.5 text-sm transition-all duration-200"
              >
                <Building2 className="h-4 w-4" />
                Подключить организацию
              </Link>
            </div>

            {/* Tech chips */}
            <div className="flex flex-wrap gap-2">
              {[
                "HMAC-SHA256",
                "AES-256-GCM",
                "152-ФЗ",
                "Blockchain anchor",
                "PostgreSQL RULE",
                "Redis TTL",
              ].map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[#252220] text-stone-600 text-[10px] font-mono tracking-wide"
                >
                  <span className="w-1 h-1 rounded-full bg-[#a05c20]/50" />
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {/* ── Right column — browser mockup ────────── */}
          <div className="hidden lg:block float-card">
            <div className="relative">
              {/* Glow halo */}
              <div
                className="absolute -inset-6 pointer-events-none"
                style={{ background: "radial-gradient(ellipse, rgba(52,211,153,0.07) 0%, transparent 65%)" }}
                aria-hidden
              />

              {/* Browser chrome */}
              <div className="relative border border-white/[0.08] overflow-hidden shadow-2xl" style={{ borderRadius: "14px" }}>
                {/* Title bar */}
                <div className="bg-[#181614] border-b border-white/[0.07] px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f56]/80" />
                    <span className="w-3 h-3 rounded-full bg-[#ffbd2e]/80" />
                    <span className="w-3 h-3 rounded-full bg-[#27c93f]/80" />
                  </div>
                  <div className="flex-1 bg-[#0e0d0c] border border-white/[0.06] rounded-md px-3 py-1.5 flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3 text-emerald-400 flex-shrink-0" strokeWidth={2} />
                    <span className="text-stone-500 text-[11px] font-mono tracking-wide truncate">
                      veritas.app/v/f8e213a4b7c9d2e1…
                    </span>
                  </div>
                </div>

                {/* Verification screen */}
                <div className="relative overflow-hidden bg-[#051a0e]">
                  {/* Animated scan line */}
                  <div
                    className="scan-line absolute inset-x-0 top-0 h-px pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(74,222,128,0.55), transparent)" }}
                    aria-hidden
                  />

                  <div className="px-7 py-7">
                    {/* Status */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center">
                          <ShieldCheck className="w-7 h-7 text-emerald-400" strokeWidth={1.5} />
                        </div>
                        <div
                          className="glow-pulse absolute -inset-1.5 rounded-full border border-emerald-500/20 pointer-events-none"
                          aria-hidden
                        />
                      </div>
                      <div>
                        <p className="text-white font-black text-[22px] leading-none tracking-tight mb-1">
                          ПОДЛИННЫЙ
                        </p>
                        <p className="text-emerald-400/50 text-[11px] font-mono">05.04.2026 14:32 UTC+3</p>
                      </div>
                    </div>

                    {/* Checks */}
                    <div className="space-y-2 mb-5">
                      {[
                        "Криптографическая подпись ВУЗа верна",
                        "Хэш совпадает с блокчейн-записью",
                        "Документ активен, не отозван",
                      ].map((line) => (
                        <div key={line} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" strokeWidth={2} />
                          <span className="text-white/65 text-xs">{line}</span>
                        </div>
                      ))}
                    </div>

                    {/* Share notice */}
                    <div className="flex items-center gap-2.5 border border-[#a05c20]/25 bg-[#a05c20]/8 rounded-lg px-3 py-2.5 mb-4">
                      <Eye className="h-3.5 w-3.5 text-[#a05c20] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-white/35">Открыто персонально для</p>
                        <p className="text-white/75 text-xs font-semibold">Сбербанк HR</p>
                      </div>
                      <span className="text-[10px] text-white/25 flex-shrink-0">2/3 · до 20 апр</span>
                    </div>

                    {/* Data rows */}
                    <div className="overflow-hidden border border-white/[0.06] divide-y divide-white/[0.05]" style={{ borderRadius: "8px" }}>
                      {[
                        ["Выпускник", "Иванов Иван Иванович"],
                        ["Организация", "МГТУ им. Баумана"],
                        ["Специальность", "Программная инженерия"],
                        ["Год выпуска", "2024"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between items-center px-4 py-2.5 bg-white/[0.025]">
                          <span className="text-white/30 text-xs">{k}</span>
                          <span className="text-white/75 text-xs font-semibold">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Terminal hash strip */}
                <div className="bg-[#0c0b0a] border-t border-white/[0.06] px-4 py-3 font-mono">
                  <div className="space-y-1">
                    {[
                      ["data_hash", "f8e213a4b7c9d2e1f0a3b8c5…", "text-stone-600"],
                      ["on-chain  ", "✓ anchored · Sepolia #7,458,291", "text-emerald-600/80"],
                      ["signature ", "HMAC OK · 1.2ms", "text-stone-600"],
                    ].map(([k, v, vc]) => (
                      <div key={k} className="flex gap-3 text-[11px] leading-5">
                        <span className="text-[#a05c20]/60 w-24 flex-shrink-0">{k}</span>
                        <span className={vc as string}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating speed badge */}
              <div
                className="absolute -top-5 -right-5 bg-[#181614] border border-[#2a2622] px-4 py-2.5 shadow-2xl"
                style={{ borderRadius: "12px" }}
              >
                <p className="text-[10px] text-stone-600 mb-0.5">Время ответа</p>
                <p className="text-[#f0d4a0] font-black leading-none" style={{ fontSize: "22px", letterSpacing: "-0.03em" }}>
                  1.2<span className="text-xs font-normal text-stone-600 ml-0.5">с</span>
                </p>
              </div>

              {/* Floating blockchain badge */}
              <div
                className="absolute -bottom-4 -left-5 bg-[#181614] border border-emerald-900/40 px-3.5 py-2.5 shadow-2xl"
                style={{ borderRadius: "12px" }}
              >
                <p className="text-[10px] text-stone-600 mb-0.5">Блокчейн</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-emerald-400 text-xs font-semibold">anchored</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS BAR ──────────────────────────────────────────────────── */}
      <section className="bg-[#111010] border-y border-[#1c1a18] px-4 sm:px-8 py-10 sm:py-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#1c1a18]">
          {[
            {
              val: "500 000+",
              label: "поддельных дипломов\nежегодно в России",
              note: "по данным исследований рынка труда",
            },
            {
              val: "< 2 сек",
              label: "полная верификация\nс проверкой подписи",
              note: "Redis-кэш + HMAC + blockchain check",
            },
            {
              val: "0",
              label: "регистраций нужно\nработодателю",
              note: "открыть ссылку или отсканировать QR",
            },
          ].map((s) => (
            <div
              key={s.val}
              className="px-6 sm:px-10 py-6 sm:py-0 first:pl-0 last:pr-0 first:pt-0 last:pb-0 sm:first:pt-0 sm:last:pb-0"
            >
              <p
                className="text-[#f0d4a0] font-black leading-none mb-2"
                style={{ fontSize: "clamp(38px, 5vw, 54px)", letterSpacing: "-0.035em" }}
              >
                {s.val}
              </p>
              <p className="text-stone-300 text-sm font-medium mb-1.5 leading-snug whitespace-pre-line">
                {s.label}
              </p>
              <p className="text-stone-600 text-xs font-mono">{s.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="bg-[#faf9f7] px-4 sm:px-8 py-20 sm:py-28 border-b border-stone-200">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-[#a05c20]" />
              <span className="text-[#a05c20] text-[11px] font-semibold tracking-[0.2em] uppercase">
                Протокол верификации
              </span>
            </div>
            <h2
              className="text-[#1c1917] font-black tracking-tight"
              style={{ fontSize: "clamp(30px, 5vw, 44px)", letterSpacing: "-0.03em" }}
            >
              Как работает VERITAS
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "01",
                icon: Building2,
                title: "Загрузка документа",
                desc: "Организация вносит данные. Система вычисляет HMAC-хэш и записывает его в блокчейн.",
              },
              {
                n: "02",
                icon: Lock,
                title: "Криптоподпись",
                desc: "Цифровая подпись фиксирует содержимое. Любое изменение данных делает подпись недействительной.",
              },
              {
                n: "03",
                icon: QrCode,
                title: "Контроль доступа",
                desc: "Студент создаёт TTL-ссылку: кому, до когда, сколько просмотров. Скачивает QR для резюме.",
              },
              {
                n: "04",
                icon: ShieldCheck,
                title: "Мгновенная проверка",
                desc: "Работодатель сканирует QR. Подпись, статус и блокчейн проверяются за секунды.",
              },
            ].map((step, i) => (
              <div key={step.n} className="relative group border-b lg:border-b-0 lg:border-r border-stone-200 last:border-0 p-7 hover:bg-white transition-colors duration-150">
                {/* Bottom accent on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#a05c20] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
                {/* Step connector (desktop) */}
                {i < 3 && (
                  <div className="hidden lg:block absolute top-[2.75rem] left-[calc(50%+1.75rem)] right-0 h-px bg-stone-200" aria-hidden />
                )}
                {/* Number circle */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full border-2 border-stone-200 group-hover:border-[#a05c20] transition-colors flex items-center justify-center bg-white flex-shrink-0">
                    <span className="text-xs font-black text-[#1c1917]">{step.n}</span>
                  </div>
                  <step.icon
                    className="h-5 w-5 text-stone-300 group-hover:text-[#a05c20] transition-colors duration-200"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="font-bold text-[#1c1917] text-sm mb-2">{step.title}</h3>
                <p className="text-stone-500 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES ───────────────────────────────────────────────── */}
      <section className="bg-[#0c0b0a] px-4 sm:px-8 py-20 sm:py-28 border-b border-[#1a1916]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-[#a05c20]" />
              <span className="text-[#a05c20] text-[11px] font-semibold tracking-[0.2em] uppercase">
                Возможности
              </span>
            </div>
            <h2
              className="text-[#f0d4a0] font-black tracking-tight"
              style={{ fontSize: "clamp(30px, 5vw, 44px)", letterSpacing: "-0.03em" }}
            >
              Что делает VERITAS уникальным
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1a1916]">
            {/* ──────── LARGE: Live Revoke ──────── */}
            <div className="group relative bg-[#0c0b0a] p-8 lg:col-span-2 overflow-hidden hover:bg-[#0f0e0d] transition-colors duration-200">
              <div
                className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(90deg, transparent, rgba(160,92,32,0.5), transparent)" }}
                aria-hidden
              />
              <div
                className="absolute -right-12 -bottom-12 w-64 h-64 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(160,92,32,0.07) 0%, transparent 65%)" }}
                aria-hidden
              />
              <div className="w-10 h-10 bg-[#a05c20]/10 border border-[#a05c20]/20 flex items-center justify-center mb-6" style={{ borderRadius: "10px" }}>
                <Zap className="h-5 w-5 text-[#a05c20]" strokeWidth={1.5} />
              </div>
              <h3 className="text-white font-black text-xl mb-3 tracking-tight">
                Live Revoke — мгновенный отзыв
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-8 max-w-lg">
                ВУЗ нажимает «Отозвать» → все открытые страницы краснеют в реальном времени без перезагрузки. Студент физически не может показать живую страницу с «Подлинный» после отзыва.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex-1 bg-emerald-950/50 border border-emerald-800/30 rounded-xl px-5 py-3.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-emerald-400 text-xs font-bold tracking-wide">АКТИВЕН</span>
                  </div>
                  <p className="text-emerald-900/80 text-[11px]">Страница верификации открыта</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <ArrowRight className="h-4 w-4 text-stone-700" />
                  <span className="text-stone-700 text-xs font-mono">≈6с</span>
                </div>
                <div className="flex-1 bg-red-950/40 border border-red-800/25 rounded-xl px-5 py-3.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-red-400 text-xs font-bold tracking-wide">ОТОЗВАН</span>
                  </div>
                  <p className="text-red-950/60 text-[11px]">Redis флаг · кэш сброшен</p>
                </div>
              </div>
            </div>

            {/* ──────── SMALL: Privacy ──────── */}
            <FeatureCard icon={Eye} title="Студент управляет доступом">
              Без персональной ссылки — никаких данных. TTL, лимит просмотров,
              имя получателя. Полный журнал: кто и когда смотрел.
            </FeatureCard>

            {/* ──────── SMALL: Analytics ──────── */}
            <FeatureCard icon={BarChart3} title="Аналитика для организаций">
              Какие компании проверяют выпускников, топ специальностей по спросу,
              динамика за 30 дней. Данных, которых раньше не существовало.
            </FeatureCard>

            {/* ──────── SMALL: Crypto ──────── */}
            <FeatureCard icon={Hash} title="Математически непробиваемо">
              HMAC-подпись делает подделку математически невозможной. Даже
              прямой доступ к БД не поможет — подпись станет недействительной.
            </FeatureCard>

            {/* ──────── LARGE: Audit ──────── */}
            <div className="group relative bg-[#0c0b0a] p-8 lg:col-span-2 overflow-hidden hover:bg-[#0f0e0d] transition-colors duration-200">
              <div
                className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: "linear-gradient(90deg, transparent, rgba(160,92,32,0.5), transparent)" }}
                aria-hidden
              />
              <div
                className="absolute -left-12 -bottom-12 w-64 h-64 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(160,92,32,0.06) 0%, transparent 65%)" }}
                aria-hidden
              />
              <div className="w-10 h-10 bg-[#a05c20]/10 border border-[#a05c20]/20 flex items-center justify-center mb-6" style={{ borderRadius: "10px" }}>
                <Lock className="h-5 w-5 text-[#a05c20]" strokeWidth={1.5} />
              </div>
              <h3 className="text-white font-black text-xl mb-3 tracking-tight">
                Нетронутый аудит-журнал
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-7 max-w-lg">
                Таблица верификаций защищена PostgreSQL RULE на уровне СУБД — изменить
                или удалить запись невозможно даже при полной компрометации приложения.
                Это не программное ограничение — это физический барьер в базе данных.
              </p>
              <div className="bg-[#0f0e0d] border border-[#1e1c1a] rounded-xl px-5 py-4 font-mono text-xs leading-6 overflow-x-auto">
                <span className="text-stone-700 select-none">-- verification_logs (immutable by design)&#10;</span>
                <div>
                  <span className="text-[#a05c20]">CREATE RULE </span>
                  <span className="text-[#c8895a]">no_update </span>
                  <span className="text-stone-600">AS ON UPDATE TO </span>
                  <span className="text-[#f0d4a0]">verification_logs </span>
                  <span className="text-stone-600">DO INSTEAD NOTHING;</span>
                </div>
                <div>
                  <span className="text-[#a05c20]">CREATE RULE </span>
                  <span className="text-[#c8895a]">no_delete </span>
                  <span className="text-stone-600">AS ON DELETE TO </span>
                  <span className="text-[#f0d4a0]">verification_logs </span>
                  <span className="text-stone-600">DO INSTEAD NOTHING;</span>
                </div>
              </div>
            </div>

            {/* ──────── SMALL: Blockchain ──────── */}
            <FeatureCard icon={Blocks} title="Blockchain-анкоринг">
              Хэш каждого документа записывается в смарт-контракт на Ethereum Sepolia.
              Верификация без доверия к платформе.
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* ── DOCUMENT TYPES ───────────────────────────────────────────────── */}
      <section className="bg-[#faf9f7] px-4 sm:px-8 py-20 sm:py-28 border-b border-stone-200">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-[#a05c20]" />
              <span className="text-[#a05c20] text-[11px] font-semibold tracking-[0.2em] uppercase">
                Охват платформы
              </span>
            </div>
            <h2
              className="text-[#1c1917] font-black tracking-tight mb-3"
              style={{ fontSize: "clamp(28px, 5vw, 44px)", letterSpacing: "-0.03em" }}
            >
              Не только дипломы
            </h2>
            <p className="text-stone-500 text-base max-w-md">
              Одна инфраструктура доверия для любых образовательных документов
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: GraduationCap,
                label: "Диплом о высшем образовании",
                who: "ВУЗы с государственной аккредитацией",
                examples: "Бакалавр, магистр, специалист, кандидат наук",
                gradient: "from-indigo-500/8",
                border: "border-indigo-200/60",
                iconClass: "bg-indigo-50 text-indigo-600 border-indigo-100",
              },
              {
                icon: Award,
                label: "Сертификат",
                who: "Онлайн-школы, корпоративные центры",
                examples: "Skillbox, Нетология, Яндекс Практикум, внутреннее обучение",
                gradient: "from-amber-500/8",
                border: "border-amber-200/60",
                iconClass: "bg-amber-50 text-amber-600 border-amber-100",
              },
              {
                icon: FileCheck,
                label: "Профессиональная лицензия",
                who: "Профессиональные объединения, СРО",
                examples: "Медицинские допуски, юридические лицензии, допуски СРО",
                gradient: "from-emerald-500/8",
                border: "border-emerald-200/60",
                iconClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
              },
            ].map((t) => (
              <div
                key={t.label}
                className={`relative rounded-2xl border ${t.border} bg-white p-7 overflow-hidden`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${t.gradient} to-transparent pointer-events-none`}
                  aria-hidden
                />
                <div
                  className={`relative w-10 h-10 rounded-xl border ${t.iconClass} flex items-center justify-center mb-5`}
                >
                  <t.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <p className="relative font-black text-[#1c1917] text-base mb-1.5">{t.label}</p>
                <p className="relative text-xs text-stone-400 font-medium mb-3">{t.who}</p>
                <p className="relative text-xs text-stone-400 leading-relaxed">{t.examples}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR WHOM ─────────────────────────────────────────────────────── */}
      <section className="bg-white px-4 sm:px-8 py-20 sm:py-28 border-b border-stone-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-16">
            <div className="h-px flex-1 bg-stone-200" />
            <span className="text-stone-400 text-xs font-semibold tracking-[0.2em] uppercase">Для кого</span>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: Building2,
                role: "Образовательная организация",
                desc: "Цифровое подтверждение каждого выданного документа. Аналитика рынка труда ваших выпускников.",
                points: [
                  "CSV-импорт для массовой загрузки",
                  "Мгновенный отзыв документов",
                  "Аналитика верификаций по работодателям",
                  "Диплом / сертификат / лицензия",
                ],
                cta: "Подключить организацию",
                href: "/register/issuer",
                dark: true,
              },
              {
                icon: GraduationCap,
                role: "Студент / выпускник",
                desc: "Ваш диплом — цифровой актив. Контролируйте кто, когда и сколько раз видит ваши данные.",
                points: [
                  "Персональные TTL-ссылки",
                  "Журнал: кто и когда проверял",
                  "QR-код для резюме",
                  "Мгновенный отзыв доступа",
                ],
                cta: "Зарегистрироваться",
                href: "/register",
                dark: false,
              },
              {
                icon: ShieldCheck,
                role: "Работодатель / HR",
                desc: "Верификация за 3 секунды без регистрации. API для интеграции с ATS и HR-системами.",
                points: [
                  "QR или ссылка — без приложений",
                  "API для HR-систем (Bearer-ключ)",
                  "Каждая проверка фиксируется",
                  "Мгновенное обновление при отзыве",
                ],
                cta: "Проверить документ",
                href: "/verify",
                dark: false,
              },
            ].map((s) => (
              <div
                key={s.role}
                className={`rounded-2xl p-7 flex flex-col border ${
                  s.dark ? "bg-[#1c1917] border-[#2a2622]" : "bg-[#faf9f7] border-stone-200"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 ${
                    s.dark ? "bg-[#252220]" : "bg-white border border-stone-200"
                  }`}
                >
                  <s.icon
                    className={`h-5 w-5 ${s.dark ? "text-[#a05c20]" : "text-[#1c1917]"}`}
                    strokeWidth={1.5}
                  />
                </div>
                <p className={`font-black text-sm mb-2 ${s.dark ? "text-[#f0d4a0]" : "text-[#1c1917]"}`}>
                  {s.role}
                </p>
                <p className={`text-xs leading-relaxed mb-5 ${s.dark ? "text-stone-400" : "text-stone-500"}`}>
                  {s.desc}
                </p>
                <ul className="space-y-2 flex-1 mb-7">
                  {s.points.map((p) => (
                    <li
                      key={p}
                      className={`flex items-start gap-2 text-xs ${
                        s.dark ? "text-stone-400" : "text-stone-500"
                      }`}
                    >
                      <CheckCircle2
                        className={`h-3.5 w-3.5 flex-shrink-0 mt-0.5 ${
                          s.dark ? "text-[#a05c20]" : "text-stone-400"
                        }`}
                      />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href={s.href}
                  className={`group inline-flex items-center justify-center gap-2 font-semibold px-4 py-2.5 text-xs transition-all duration-200 border ${
                    s.dark
                      ? "bg-[#a05c20] border-[#a05c20] text-white hover:bg-[#b8692a] hover:shadow-[0_0_24px_rgba(160,92,32,0.35)]"
                      : "border-[#1c1917] text-[#1c1917] hover:bg-[#1c1917] hover:text-[#f0d4a0]"
                  }`}
                >
                  {s.cta}
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEGAL STRIP ──────────────────────────────────────────────────── */}
      <section className="bg-[#111010] px-4 sm:px-8 py-10 border-b border-[#1c1a18]">
        <div className="max-w-7xl mx-auto">
          <p className="text-stone-700 text-[10px] text-center mb-5 uppercase tracking-[0.2em] font-semibold">
            Правовая основа
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                law: "ФЗ-273, ст. 60",
                desc: "Организации несут ответственность за подлинность выданных документов",
              },
              {
                law: "ТК РФ, ст. 65",
                desc: "Работодатель вправе проверить документ об образовании при трудоустройстве",
              },
              {
                law: "ФЗ-152",
                desc: "Студент даёт явное согласие через TTL-ссылку — строгое соответствие требованиям к ПДн",
              },
              {
                law: "ФЗ-63",
                desc: "Электронная подпись обеспечивает юридически значимое подтверждение подлинности",
              },
            ].map((l) => (
              <div
                key={l.law}
                className="bg-white/[0.025] border border-white/[0.05] rounded-xl px-4 py-3.5"
              >
                <p className="text-[#a05c20] text-xs font-black mb-1.5">{l.law}</p>
                <p className="text-stone-500 text-[11px] leading-relaxed">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0c0b0a] px-4 sm:px-8 py-24 sm:py-36">
        <div className="hero-dot-grid absolute inset-0 pointer-events-none opacity-30" aria-hidden />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(160,92,32,0.1) 0%, transparent 65%)" }}
          aria-hidden
        />

        <div className="relative max-w-3xl mx-auto text-center">
          <div
            className="inline-flex items-center justify-center w-16 h-16 border border-[#a05c20]/25 bg-[#a05c20]/8 mb-10"
            style={{ borderRadius: "16px" }}
          >
            <Shield className="w-8 h-8 text-[#a05c20]" strokeWidth={1.2} />
          </div>

          <h2
            className="text-[#f0d4a0] font-black leading-none tracking-tight mb-7"
            style={{ fontSize: "clamp(34px, 6vw, 58px)", letterSpacing: "-0.04em" }}
          >
            Документ без VERITAS —<br />просто бумага
          </h2>
          <p className="text-stone-400 text-lg leading-relaxed mb-3 max-w-xl mx-auto">
            Документ в VERITAS — цифровой актив с математическим доказательством подлинности.
          </p>
          <p className="text-stone-600 text-sm mb-14">
            Заявки рассматриваются с проверкой ОГРН по реестру ФНС/ЕГРЮЛ.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register/issuer"
              className="group inline-flex items-center justify-center gap-2.5 bg-[#a05c20] hover:bg-[#b8692a] text-white font-semibold px-9 py-4 text-sm transition-all duration-200 hover:shadow-[0_0_48px_rgba(160,92,32,0.45)] active:scale-[0.98]"
            >
              Подключить организацию
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link
              href="/verify"
              className="group inline-flex items-center justify-center gap-2.5 border border-[#252220] hover:border-stone-600 text-stone-400 hover:text-stone-200 font-medium px-9 py-4 text-sm transition-all duration-200"
            >
              Проверить документ
              <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#080807] px-4 sm:px-8 py-6 border-t border-[#161412]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative w-6 h-6 flex-shrink-0">
              <Shield className="w-6 h-6 text-[#a05c20]" strokeWidth={1.5} />
              <span className="absolute inset-0 flex items-center justify-center text-[#f0d4a0] font-black text-[10px]">
                V
              </span>
            </div>
            <span className="text-[#f0d4a0] font-black tracking-[0.2em] text-sm">VERITAS</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/verify" className="text-stone-700 hover:text-stone-400 text-xs transition-colors">
              Проверить документ
            </Link>
            <Link href="/register" className="text-stone-700 hover:text-stone-400 text-xs transition-colors">
              Для студентов
            </Link>
            <Link href="/register/issuer" className="text-stone-700 hover:text-stone-400 text-xs transition-colors">
              Для организаций
            </Link>
          </div>
          <p className="text-stone-700 text-xs">Разработано для Diasoft · 2026</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Bento small card ──────────────────────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative bg-[#0c0b0a] p-8 overflow-hidden hover:bg-[#0f0e0d] transition-colors duration-200">
      <div
        className="absolute top-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "linear-gradient(90deg, transparent, rgba(160,92,32,0.5), transparent)" }}
        aria-hidden
      />
      <div
        className="w-10 h-10 bg-[#a05c20]/10 border border-[#a05c20]/20 flex items-center justify-center mb-6"
        style={{ borderRadius: "10px" }}
      >
        <Icon className="h-5 w-5 text-[#a05c20]" strokeWidth={1.5} />
      </div>
      <h3 className="text-white font-bold text-base mb-2.5">{title}</h3>
      <p className="text-stone-500 text-sm leading-relaxed">{children}</p>
    </div>
  );
}
