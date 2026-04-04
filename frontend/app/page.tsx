import Link from "next/link";
import { Shield, ShieldCheck, Lock, QrCode, Building2, GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f7]">
      <Navbar />

      {/* HERO */}
      <section className="bg-[#1c1917] px-4 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px w-8 bg-[#a05c20]" />
              <span className="text-[#a05c20] text-xs font-semibold tracking-widest uppercase">
                Платформа верификации документов
              </span>
            </div>
            <h1 className="text-5xl font-black text-[#f0d4a0] leading-none tracking-tight mb-5">
              VERITAS
            </h1>
            <p className="text-stone-300 text-lg font-medium mb-3 leading-snug">
              Криптографически защищённая проверка подлинности дипломов
            </p>
            <p className="text-stone-500 text-sm leading-relaxed mb-8 max-w-md">
              Работодатель сканирует QR-код и за 3 секунды получает математически
              доказуемый результат. Без звонков в ВУЗ, без бюрократии, без регистрации.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register"
                className="group inline-flex items-center justify-center gap-2 bg-[#a05c20] hover:bg-[#b8692a] text-white font-semibold px-6 py-3 text-sm transition-all duration-200 hover:shadow-[0_0_20px_rgba(160,92,32,0.4)] active:scale-[0.98]">
                <GraduationCap className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                Я студент — зарегистрироваться
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link href="/register/university"
                className="group inline-flex items-center justify-center gap-2 border border-stone-600 text-stone-300 hover:border-[#a05c20] hover:text-[#f0d4a0] font-medium px-6 py-3 text-sm transition-all duration-200 active:scale-[0.98]">
                <Building2 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                Подключить учебное заведение
              </Link>
            </div>
          </div>

          {/* Mock verify screen */}
          <div className="hidden lg:block">
            <div className="bg-[#14532d] p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="h-10 w-10 text-white/80" strokeWidth={1.2} />
                <div>
                  <p className="text-white font-black text-xl tracking-tight">ДИПЛОМ ПОДЛИННЫЙ</p>
                  <p className="text-white/50 text-xs">Проверено 04.04.2026, 14:32 МСК</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 divide-y divide-white/10">
                {[
                  ["Выпускник", "Иванов Иван Иванович"],
                  ["ВУЗ", "МГТУ им. Баумана"],
                  ["Специальность", "Программная инженерия"],
                  ["Год окончания", "2023"],
                ].map(([label, value]) => (
                  <div key={label} className="px-4 py-2 flex justify-between">
                    <span className="text-white/40 text-xs">{label}</span>
                    <span className="text-white text-xs font-semibold">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-green-300/80 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Криптографическая подпись ВУЗа верна
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS */}
      <section className="bg-[#232020] border-b border-[#2a2622] px-4 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stone-700">
          {[
            { value: "500 000", unit: "дипломов", label: "поддельных документов ежегодно в России" },
            { value: "< 3 сек", unit: "", label: "время полной верификации с криптопроверкой" },
            { value: "0", unit: "регистраций", label: "требуется от работодателя для проверки" },
          ].map((s) => (
            <div key={s.label} className="px-6 sm:px-8 py-4 sm:py-0 first:pt-0 last:pb-0 sm:first:pl-0 sm:last:pr-0">
              <p className="text-[#f0d4a0] text-3xl font-black leading-none">
                {s.value}
                {s.unit && <span className="text-[#a05c20] text-lg ml-1">{s.unit}</span>}
              </p>
              <p className="text-stone-500 text-xs mt-1.5 leading-relaxed">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="px-4 py-16 bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-px flex-1 bg-stone-200" />
            <h2 className="text-xs font-semibold tracking-widest uppercase text-stone-400">Принцип работы</h2>
            <div className="h-px flex-1 bg-stone-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-stone-200">
            {[
              { icon: Building2, num: "01", title: "Загрузка", desc: "Оператор ВУЗа вносит данные диплома. Система создаёт канонический хэш." },
              { icon: Lock, num: "02", title: "Подпись", desc: "HMAC-подпись приватным ключом. Любое изменение данных разрушает подпись." },
              { icon: QrCode, num: "03", title: "QR-код", desc: "Студент создаёт временную ссылку и скачивает QR для резюме или портфолио." },
              { icon: ShieldCheck, num: "04", title: "Верификация", desc: "Работодатель сканирует QR — браузер мгновенно показывает результат." },
            ].map((step) => (
              <div key={step.num} className="group relative flex gap-4 p-5 sm:p-6 hover:border-[#a05c20] hover:z-10 transition-all duration-200 md:hover:-translate-y-1 md:hover:shadow-md bg-white cursor-default">
                <div>
                  <span className="text-[11px] font-black text-[#a05c20] tracking-widest block mb-2 transition-opacity duration-200">{step.num}</span>
                  <step.icon className="h-6 w-6 text-[#1c1917] transition-transform duration-200 group-hover:scale-110" strokeWidth={1.5} />
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

      {/* SECURITY */}
      <section className="px-4 py-16 bg-[#faf9f7]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <div className="flex items-center gap-2 mb-5">
              <div className="h-px w-8 bg-[#a05c20]" />
              <span className="text-[#a05c20] text-xs font-semibold tracking-widest uppercase">Безопасность</span>
            </div>
            <h2 className="text-3xl font-black text-[#1c1917] leading-tight mb-5">Архитектура<br />доверия</h2>
            <p className="text-stone-500 text-sm leading-relaxed">
              Каждое решение в системе направлено на создание непрерывной цепи доверия —
              от оператора ВУЗа до работодателя. Никакой посредник не может подделать результат.
            </p>
          </div>
          <div className="space-y-0 border border-stone-200 bg-white divide-y divide-stone-200">
            {[
              { icon: Lock, title: "HMAC-подпись на каждый диплом", desc: "Изменение любого поля в базе данных разрушает подпись — мошенничество обнаруживается мгновенно." },
              { icon: ShieldCheck, title: "Иммутабельный журнал проверок", desc: "PostgreSQL RULE запрещает UPDATE/DELETE в таблице логов. История верификаций нетронута." },
              { icon: QrCode, title: "TTL-ссылки под контролем студента", desc: "Выпускник сам решает, кому и на сколько дать доступ к своему диплому." },
              { icon: Building2, title: "Двухэтапный онбординг ВУЗов", desc: "Каждый ВУЗ проверяется администратором платформы до получения доступа." },
            ].map((f) => (
              <div key={f.title} className="group flex gap-4 px-5 py-4 hover:bg-stone-50 transition-colors duration-150 relative">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#a05c20] scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />
                <div className="w-8 h-8 bg-[#1c1917] group-hover:bg-[#2a2622] flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-150">
                  <f.icon className="h-4 w-4 text-[#a05c20]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1c1917] mb-0.5">{f.title}</p>
                  <p className="text-xs text-stone-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1c1917] px-4 py-14">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-black text-[#f0d4a0] mb-3 tracking-tight">Готовы подключить ваш ВУЗ?</h2>
          <p className="text-stone-400 text-sm mb-8 max-w-md mx-auto">
            Подайте заявку — администратор платформы проверит данные и активирует доступ.
          </p>
          <Link href="/register/university"
            className="group inline-flex items-center gap-2 bg-[#a05c20] hover:bg-[#b8692a] text-white font-semibold px-8 py-3.5 text-sm transition-all duration-200 hover:shadow-[0_0_24px_rgba(160,92,32,0.5)] active:scale-[0.98]">
            Подать заявку
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#111010] px-4 py-6 border-t border-[#2a2622]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5">
              <Shield className="w-5 h-5 text-[#a05c20]" strokeWidth={1.5} />
              <span className="absolute inset-0 flex items-center justify-center text-[#f0d4a0] font-black text-[9px]">V</span>
            </div>
            <span className="text-[#f0d4a0] font-black tracking-[0.2em] text-xs">VERITAS</span>
          </div>
          <p className="text-stone-600 text-xs">Разработано для Diasoft · 2026</p>
        </div>
      </footer>
    </div>
  );
}
