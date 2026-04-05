import Link from "next/link";
import {
  Shield, ShieldCheck, Lock, QrCode, Building2, GraduationCap,
  ArrowRight, CheckCircle2, Eye, BarChart3, FileCheck, RefreshCw,
  Zap, Award,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f7]">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#1c1917] px-4 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#a05c20]" />
              <span className="text-[#a05c20] text-xs font-semibold tracking-widest uppercase">
                Инфраструктурный слой доверия
              </span>
            </div>
            <h1 className="text-6xl sm:text-7xl font-black text-[#f0d4a0] leading-none tracking-tight mb-2">
              VERITAS
            </h1>
            <p className="text-stone-400 text-xs font-semibold tracking-[0.3em] uppercase mb-6">
              от лат. veritas — истина
            </p>
            <p className="text-stone-300 text-lg font-medium mb-3 leading-snug max-w-lg">
              Криптографически защищённая верификация дипломов, сертификатов и профессиональных лицензий
            </p>
            <p className="text-stone-500 text-sm leading-relaxed mb-8 max-w-md">
              Работодатель сканирует QR — за 3 секунды получает математически
              доказуемый результат. Без звонков в ВУЗ, без бюрократии, без регистрации.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 bg-[#a05c20] hover:bg-[#b8692a] text-white font-semibold px-6 py-3 text-sm transition-all duration-200 hover:shadow-[0_0_20px_rgba(160,92,32,0.4)] active:scale-[0.98]"
              >
                <GraduationCap className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Я студент — зарегистрироваться
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/register/university"
                className="group inline-flex items-center justify-center gap-2 border border-stone-600 text-stone-300 hover:border-[#a05c20] hover:text-[#f0d4a0] font-medium px-6 py-3 text-sm transition-all duration-200 active:scale-[0.98]"
              >
                <Building2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                Подключить организацию
              </Link>
            </div>
          </div>

          {/* Mock verify card */}
          <div className="hidden lg:block">
            <div className="bg-[#14532d] border border-white/10 overflow-hidden">
              {/* top bar */}
              <div className="bg-emerald-950 border-b border-white/10 px-5 py-3 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-white/70" strokeWidth={1.5} />
                <span className="text-white/80 font-black tracking-widest text-xs uppercase">VERITAS</span>
              </div>
              <div className="px-7 py-7">
                <div className="flex items-start gap-4 mb-6">
                  <ShieldCheck className="h-12 w-12 text-white/80 flex-shrink-0" strokeWidth={1.2} />
                  <div>
                    <p className="text-white font-black text-2xl tracking-tight leading-tight">ДИПЛОМ ПОДЛИННЫЙ</p>
                    <p className="text-white/40 text-xs mt-1">Проверено 05.04.2026, 14:32 МСК</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded text-white text-[11px] px-2 py-1 font-medium">
                      <CheckCircle2 className="h-3 w-3 text-green-300" />
                      Криптографическая подпись ВУЗа верна
                    </div>
                  </div>
                </div>

                {/* Recipient notice */}
                <div className="bg-white/5 border border-[#a05c20]/30 rounded px-3 py-2 flex items-center gap-2 mb-4">
                  <Eye className="h-3.5 w-3.5 text-[#a05c20] flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-white/40">Открыто персонально для</p>
                    <p className="text-white/80 text-xs font-semibold">Сбербанк HR</p>
                  </div>
                  <span className="ml-auto text-[10px] text-white/30">до 20 апр · 2/3 просм.</span>
                </div>

                <div className="bg-white/5 border border-white/10 divide-y divide-white/10">
                  {[
                    ["Выпускник", "Иванов Иван Иванович"],
                    ["ВУЗ", "МГТУ им. Баумана"],
                    ["Специальность", "Программная инженерия"],
                    ["Год выпуска", "2024"],
                    ["Рег. номер", "107704 3456789"],
                  ].map(([label, value]) => (
                    <div key={label} className="px-4 py-2 flex justify-between">
                      <span className="text-white/35 text-xs">{label}</span>
                      <span className="text-white/80 text-xs font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS ──────────────────────────────────────────────────────── */}
      <section className="bg-[#232020] border-b border-[#2a2622] px-4 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-700">
          {[
            { value: "500 000+", label: "поддельных дипломов продаётся в России ежегодно" },
            { value: "3 секунды", label: "полная верификация с криптографической проверкой подписи" },
            { value: "0 регистраций", label: "требуется от работодателя — просто сканируешь QR" },
          ].map((s) => (
            <div key={s.label} className="px-6 sm:px-8 py-4 sm:py-0 first:pt-0 last:pb-0 sm:first:pl-0 sm:last:pr-0">
              <p className="text-[#f0d4a0] text-3xl font-black leading-none">{s.value}</p>
              <p className="text-stone-500 text-xs mt-1.5 leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20 bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-px flex-1 bg-stone-200" />
            <h2 className="text-xs font-semibold tracking-widest uppercase text-stone-400">Как это работает</h2>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-stone-200">
            {[
              {
                icon: Building2, num: "01", title: "Загрузка",
                desc: "Организация вносит данные документа. Система вычисляет криптоотпечаток и подписывает его приватным ключом.",
              },
              {
                icon: Lock, num: "02", title: "Подпись",
                desc: "HMAC-подпись фиксирует содержимое документа. Любое изменение в базе данных мгновенно делает подпись недействительной.",
              },
              {
                icon: QrCode, num: "03", title: "QR-код",
                desc: "Студент создаёт персональную ссылку с ограничением по времени и просмотрам, скачивает QR для резюме.",
              },
              {
                icon: ShieldCheck, num: "04", title: "Верификация",
                desc: "Работодатель сканирует QR — браузер за 3 секунды показывает результат. Никакого приложения, никакой регистрации.",
              },
            ].map((step) => (
              <div key={step.num} className="group relative flex gap-4 p-5 sm:p-6 bg-white hover:z-10 transition-all duration-200 md:hover:-translate-y-1 md:hover:shadow-md cursor-default">
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#a05c20] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                <div>
                  <span className="text-[11px] font-black text-[#a05c20] tracking-widest block mb-2">{step.num}</span>
                  <step.icon className="h-6 w-6 text-[#1c1917] group-hover:scale-110 transition-transform duration-200" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-bold text-[#1c1917] text-sm mb-1.5">{step.title}</h3>
                  <p className="text-stone-500 text-xs leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DOCUMENT TYPES ───────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20 bg-[#faf9f7] border-b border-stone-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-8 bg-[#a05c20]" />
            <span className="text-[#a05c20] text-xs font-semibold tracking-widest uppercase">Универсальная платформа</span>
          </div>
          <h2 className="text-3xl font-black text-[#1c1917] leading-tight mb-3">
            Не только дипломы
          </h2>
          <p className="text-stone-500 text-sm leading-relaxed mb-10 max-w-lg">
            Одна инфраструктура доверия для любых образовательных документов.
            Та же криптографическая защита, те же QR-коды, тот же контроль доступа.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: GraduationCap,
                label: "Диплом",
                who: "ВУЗы",
                examples: "Государственные дипломы бакалавра, магистра, специалиста",
                accent: "bg-indigo-50 border-indigo-200 text-indigo-700",
                iconBg: "bg-indigo-100",
              },
              {
                icon: Award,
                label: "Сертификат",
                who: "Онлайн-школы, корпоративные центры",
                examples: "Skillbox, Нетология, Яндекс Практикум, внутреннее обучение",
                accent: "bg-amber-50 border-amber-200 text-amber-700",
                iconBg: "bg-amber-100",
              },
              {
                icon: FileCheck,
                label: "Профессиональная лицензия",
                who: "Профессиональные объединения",
                examples: "Медицинские допуски, юридические лицензии, допуски СРО",
                accent: "bg-emerald-50 border-emerald-200 text-emerald-700",
                iconBg: "bg-emerald-100",
              },
            ].map((t) => (
              <div key={t.label} className={`border rounded-xl p-5 ${t.accent}`}>
                <div className={`w-10 h-10 rounded-lg ${t.iconBg} flex items-center justify-center mb-3`}>
                  <t.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <p className="font-bold text-sm mb-0.5">{t.label}</p>
                <p className="text-xs font-medium opacity-70 mb-2">{t.who}</p>
                <p className="text-xs opacity-60 leading-relaxed">{t.examples}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KILLER FEATURES ──────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20 bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-px flex-1 bg-stone-200" />
            <h2 className="text-xs font-semibold tracking-widest uppercase text-stone-400">Ключевые возможности</h2>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-stone-200">
            {[
              {
                icon: Zap,
                title: "Live Revoke — мгновенный отзыв",
                desc: "ВУЗ отзывает диплом → все открытые страницы верификации краснеют в реальном времени, без перезагрузки. Студент не может «заморозить» страницу с действующим статусом — это физически невозможно.",
              },
              {
                icon: Eye,
                title: "Студент управляет доступом",
                desc: "Без персональной ссылки от студента — никаких данных. Ссылка создаётся с именем получателя, сроком действия и лимитом просмотров. Студент видит кто, когда и сколько раз проверял его документ.",
              },
              {
                icon: BarChart3,
                title: "Аналитика для организаций",
                desc: "ВУЗ видит, какие компании проверяют его выпускников, топ специальностей по спросу и график верификаций за 30 дней. Данные, которых раньше просто не существовало.",
              },
              {
                icon: RefreshCw,
                title: "Автоверификация через ЕГРЮЛ",
                desc: "При регистрации организации система сама проверяет ОГРН по алгоритму ФНС и ищет компанию в ЕГРЮЛ через DaData API. Администратор видит рекомендацию и нажимает одну кнопку.",
              },
              {
                icon: Lock,
                title: "Иммутабельный аудит-журнал",
                desc: "Таблица верификаций защищена PostgreSQL RULE — UPDATE и DELETE физически запрещены на уровне СУБД. История нетронута даже при компрометации приложения.",
              },
              {
                icon: ShieldCheck,
                title: "Архитектура готова к ГОСТ",
                desc: "Одна строка конфига переключает алгоритм с SHA-256/RSA на ГОСТ Р 34.10-2012 через КриптоПро CSP. Бизнес-логика не меняется. Соответствие требованиям ФСБ — без рефакторинга.",
              },
            ].map((f) => (
              <div key={f.title} className="group relative flex gap-4 bg-white px-6 py-6 hover:bg-stone-50 transition-colors duration-150 cursor-default">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#a05c20] scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />
                <div className="w-9 h-9 bg-[#1c1917] group-hover:bg-[#2a2622] flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-150">
                  <f.icon className="h-4 w-4 text-[#a05c20]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1c1917] mb-1">{f.title}</p>
                  <p className="text-xs text-stone-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR WHOM ─────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20 bg-[#faf9f7] border-b border-stone-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-px flex-1 bg-stone-200" />
            <h2 className="text-xs font-semibold tracking-widest uppercase text-stone-400">Для кого</h2>
            <div className="h-px flex-1 bg-stone-200" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: Building2,
                role: "Образовательная организация",
                points: [
                  "Загрузка дипломов и сертификатов",
                  "CSV-импорт для массовой загрузки",
                  "Отзыв документов в реальном времени",
                  "Аналитика: кто и когда проверял выпускников",
                  "Поддержка трёх типов документов",
                ],
                cta: "Подключить организацию",
                href: "/register/university",
              },
              {
                icon: GraduationCap,
                role: "Студент / выпускник",
                points: [
                  "Личный кабинет с историей проверок",
                  "TTL-ссылки с именем получателя",
                  "Контроль: кому, до когда, сколько раз",
                  "QR-код для скачивания в резюме",
                  "Мгновенное закрытие доступа",
                ],
                cta: "Зарегистрироваться",
                href: "/register",
              },
              {
                icon: ShieldCheck,
                role: "Работодатель / HR",
                points: [
                  "Проверка за 3 секунды по QR или ссылке",
                  "Без регистрации и приложений",
                  "API для интеграции с ATS",
                  "Каждая проверка фиксируется в журнале",
                  "Мгновенное обновление статуса при отзыве",
                ],
                cta: "Проверить документ",
                href: "/verify",
              },
            ].map((s) => (
              <div key={s.role} className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-[#1c1917] flex items-center justify-center mb-4">
                  <s.icon className="h-5 w-5 text-[#a05c20]" strokeWidth={1.5} />
                </div>
                <p className="font-bold text-[#1c1917] text-sm mb-4">{s.role}</p>
                <ul className="space-y-2 flex-1 mb-6">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-stone-500">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#a05c20] flex-shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
                <Link
                  href={s.href}
                  className="group inline-flex items-center justify-center gap-2 border border-[#a05c20] text-[#a05c20] hover:bg-[#a05c20] hover:text-white font-medium px-4 py-2.5 text-xs transition-all duration-200"
                >
                  {s.cta}
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEGAL STRIP ──────────────────────────────────────────────────── */}
      <section className="bg-[#232020] px-4 py-8 border-b border-[#2a2622]">
        <div className="max-w-6xl mx-auto">
          <p className="text-stone-500 text-xs text-center mb-4 uppercase tracking-wider font-semibold">Правовая основа</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { law: "ФЗ-273, ст. 60", desc: "Организации несут ответственность за подлинность выданных документов" },
              { law: "ТК РФ, ст. 65", desc: "Работодатель вправе проверить документ об образовании при найме" },
              { law: "ФЗ-152", desc: "Студент даёт явное согласие на передачу данных через TTL-ссылку" },
              { law: "ФЗ-63", desc: "Электронная подпись; в продакшне — ГОСТ Р 34.10-2012, сертифицирован ФСБ" },
            ].map((l) => (
              <div key={l.law} className="bg-white/5 border border-white/10 rounded-lg px-3 py-3">
                <p className="text-[#a05c20] text-xs font-black mb-1">{l.law}</p>
                <p className="text-stone-500 text-[11px] leading-relaxed">{l.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#1c1917] px-4 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center gap-2 justify-center mb-6">
            <div className="relative w-8 h-8">
              <Shield className="w-8 h-8 text-[#a05c20]" strokeWidth={1.5} />
              <span className="absolute inset-0 flex items-center justify-center text-[#f0d4a0] font-black text-sm">V</span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-[#f0d4a0] mb-3 tracking-tight leading-tight">
            Документ без VERITAS —<br />просто бумага
          </h2>
          <p className="text-stone-400 text-sm mb-2 max-w-md mx-auto leading-relaxed">
            Документ в VERITAS — цифровой актив с математическим доказательством подлинности.
          </p>
          <p className="text-stone-600 text-xs mb-10">
            Подайте заявку — администратор проверит данные организации через ЕГРЮЛ и активирует доступ.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register/university"
              className="group inline-flex items-center justify-center gap-2 bg-[#a05c20] hover:bg-[#b8692a] text-white font-semibold px-8 py-3.5 text-sm transition-all duration-200 hover:shadow-[0_0_24px_rgba(160,92,32,0.5)] active:scale-[0.98]"
            >
              Подключить организацию
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/verify"
              className="group inline-flex items-center justify-center gap-2 border border-stone-600 text-stone-400 hover:border-stone-400 hover:text-stone-200 font-medium px-8 py-3.5 text-sm transition-all duration-200"
            >
              Проверить документ
              <ShieldCheck className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="bg-[#111010] px-4 py-6 border-t border-[#2a2622]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5">
              <Shield className="w-5 h-5 text-[#a05c20]" strokeWidth={1.5} />
              <span className="absolute inset-0 flex items-center justify-center text-[#f0d4a0] font-black text-[9px]">V</span>
            </div>
            <span className="text-[#f0d4a0] font-black tracking-[0.2em] text-xs">VERITAS</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/verify" className="text-stone-600 hover:text-stone-400 text-xs transition-colors">Проверить документ</Link>
            <Link href="/register" className="text-stone-600 hover:text-stone-400 text-xs transition-colors">Для студентов</Link>
            <Link href="/register/university" className="text-stone-600 hover:text-stone-400 text-xs transition-colors">Для организаций</Link>
          </div>
          <p className="text-stone-700 text-xs">Разработано для Diasoft · 2026</p>
        </div>
      </footer>
    </div>
  );
}
