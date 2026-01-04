/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react'; // Tambahkan ini
import {
    CheckCircle2,
    Calculator,
    TrendingUp,
    LayoutDashboard,
    ArrowRight,
    PieChart,
    Wallet,
    Target,
    Menu, // Icon Hamburger
    X // Icon Close
} from 'lucide-react';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State untuk menu mobile

    return (
        <>
            <Head title="ayokulakan.id - Software Analisa Profit & Biaya Admin Marketplace">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
            </Head>

            <div className="min-h-screen bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC] font-['Instrument_Sans']">
                {/* Announcement Bar */}
                <div className="bg-orange-600 px-4 py-2 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white">
                    🔥 Solusi UMKM Online No. 1 untuk Pantau Profit Real-Time
                </div>

                {/* Navbar */}
                <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md dark:border-[#1e1e1e] dark:bg-[#0a0a0a]/80">
                    <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 lg:px-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 shadow-lg shadow-gray/10 dark:shadow-none">
                                <AppLogoIcon className="w-8 h-8 text-orange-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl sm:text-2xl font-black tracking-tighter leading-none text-orange-600">
                                    ayokulakan<span className="text-gray-900 dark:text-white">.id</span>
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 leading-none mt-1">
                                    Smart Seller Tools
                                </span>
                            </div>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
                            <a href="#fitur" className="hover:text-orange-600 transition">Fitur</a>
                            <a href="#statistik" className="hover:text-orange-600 transition">Statistik</a>
                            <a href="#faq" className="hover:text-orange-600 transition">FAQ</a>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Desktop Actions */}
                            <div className="hidden sm:flex items-center gap-3">
                                {auth.user ? (
                                    <Link href={dashboard()} className="flex items-center gap-2 rounded-full bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 dark:bg-white dark:text-black">
                                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link href={login()} className="text-sm font-bold hover:text-orange-600 transition">Masuk</Link>
                                        {canRegister && (
                                            <Link href={register()} className="group flex items-center gap-2 rounded-full bg-orange-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-orange-700 shadow-md">
                                                Daftar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 md:hidden text-gray-600 dark:text-gray-300"
                            >
                                {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                            </button>
                        </div>
                    </nav>

                    {/* Mobile Menu Dropdown */}
                    {isMenuOpen && (
                        <div className="md:hidden border-t border-gray-100 dark:border-[#1e1e1e] bg-white dark:bg-[#0a0a0a] p-6 space-y-6 shadow-xl animate-in slide-in-from-top duration-300">
                            <div className="flex flex-col gap-4 text-lg font-bold">
                                <a href="#fitur" onClick={() => setIsMenuOpen(false)} className="hover:text-orange-600 transition">Fitur</a>
                                <a href="#statistik" onClick={() => setIsMenuOpen(false)} className="hover:text-orange-600 transition">Statistik</a>
                                <a href="#faq" onClick={() => setIsMenuOpen(false)} className="hover:text-orange-600 transition">FAQ</a>
                            </div>
                            <hr className="border-gray-100 dark:border-[#1e1e1e]" />
                            <div className="flex flex-col gap-4">
                                {auth.user ? (
                                    <Link href={dashboard()} className="flex items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-sm font-bold text-white dark:bg-white dark:text-black">
                                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                                    </Link>
                                ) : (
                                    <>
                                        <Link href={login()} className="text-center text-sm font-bold py-2">Masuk</Link>
                                        {canRegister && (
                                            <Link href={register()} className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-sm font-bold text-white shadow-lg">
                                                Daftar Sekarang <ArrowRight className="w-4 h-4" />
                                            </Link>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                <main>
                    {/* Hero Section */}
                    <section className="relative px-6 pt-16 pb-20 text-center lg:px-8 lg:pt-32">
                        <div className="mx-auto max-w-4xl">
                            <h1 className="text-4xl font-black leading-[1.1] tracking-tight sm:text-7xl">
                                Kendalikan <span className="text-orange-600">Profit</span> Tokomu, Bukan Sekadar Omzet.
                            </h1>
                            <p className="mt-8 text-lg sm:text-xl leading-relaxed text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                                ayokulakan.id membantu ribuan seller marketplace menghitung biaya admin, promo, ongkir, dan biaya iklan secara presisi. <span className="font-bold">Satu Dashboard, Semua Marketplace.</span>
                            </p>
                            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link href={register()} className="w-full sm:w-auto rounded-2xl bg-orange-600 px-10 py-5 text-xl font-black text-white shadow-2xl shadow-orange-200 transition hover:bg-orange-700 hover:-translate-y-1">
                                    Coba Gratis Selamanya
                                </Link>
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" /> Tanpa Kartu Kredit
                                </div>
                            </div>
                        </div>

                        {/* App Preview Mockup */}
                        <div className="mt-12 sm:mt-20 mx-auto max-w-6xl rounded-[1.5rem] sm:rounded-[2rem] border-4 sm:border-8 border-gray-900/5 bg-gray-900/5 p-2 sm:p-4 dark:bg-white/5">
                            <div className="rounded-[1.2rem] sm:rounded-[1.5rem] bg-white shadow-2xl dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700">
                                {/* Browser Header */}
                                <div className="bg-gray-50 dark:bg-gray-900 border-b p-3 sm:p-4 flex items-center justify-between">
                                    <div className="flex gap-1.5 sm:gap-2">
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400" />
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400" />
                                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400" />
                                    </div>
                                    <div className="text-[10px] sm:text-xs font-bold text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-100 dark:border-gray-700">
                                        app.ayokulakan.id/dashboard
                                    </div>
                                    <div className="w-10" /> {/* Spacer */}
                                </div>

                                {/* Dashboard Content */}
                                <div className="p-4 sm:p-8">
                                    {/* Top Cards */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 mb-6">
                                        <div className="p-3 sm:p-5 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                                            <p className="text-[10px] sm:text-xs font-bold text-orange-600 uppercase tracking-wider">Total Profit</p>
                                            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white mt-1">Rp 12.4M</p>
                                            <span className="text-[10px] text-green-600 font-bold">↑ 12% vs bln lalu</span>
                                        </div>
                                        <div className="p-3 sm:p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                                            <p className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider">Biaya Admin</p>
                                            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white mt-1">Rp 1.2M</p>
                                            <span className="text-[10px] text-gray-500 font-bold">6 Marketplace</span>
                                        </div>
                                        <div className="col-span-2 sm:col-span-1 p-3 sm:p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                                            <p className="text-[10px] sm:text-xs font-bold text-purple-600 uppercase tracking-wider">Biaya Iklan</p>
                                            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white mt-1">Rp 3.5M</p>
                                            <span className="text-[10px] text-red-500 font-bold">ROAS 4.2x</span>
                                        </div>
                                    </div>

                                    {/* Visual Graph Placeholder */}
                                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
                                        <div className="flex items-center justify-between mb-8">
                                            <h4 className="text-sm sm:text-base font-black italic">Sales Performance</h4>
                                            <div className="flex gap-2">
                                                <div className="h-2 w-8 sm:w-12 bg-orange-500 rounded-full" />
                                                <div className="h-2 w-8 sm:w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                            </div>
                                        </div>
                                        {/* Simulated Wave/Chart */}
                                        <div className="relative h-32 sm:h-48 flex items-end gap-1 sm:gap-2">
                                            {[40, 70, 45, 90, 65, 80, 50, 95, 70, 100, 85, 90].map((h, i) => (
                                                <div
                                                    key={i}
                                                    style={{ height: `${h}%` }}
                                                    className={`flex-1 rounded-t-lg bg-gradient-to-t from-orange-500/80 to-orange-400 transition-all hover:to-orange-300 ${i > 6 ? 'hidden sm:block' : ''}`}
                                                />
                                            ))}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            <span>Jan</span>
                                            <span>Mar</span>
                                            <span>Mei</span>
                                            <span className="hidden sm:inline">Jul</span>
                                            <span className="hidden sm:inline">Sep</span>
                                            <span>Des</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Stats Section */}
                    <section id="statistik" className="py-20 bg-white dark:bg-[#0a0a0a]">
                        <div className="mx-auto max-w-7xl px-6 lg:px-8">
                            <div className="grid grid-cols-1 gap-y-12 text-center lg:grid-cols-3">
                                <div className="flex flex-col gap-y-4">
                                    <dt className="text-sm leading-7 text-gray-600 dark:text-gray-400">Total Transaksi Terhitung</dt>
                                    <dd className="text-4xl sm:text-5xl font-black tracking-tight text-orange-600 font-mono">1.2M+</dd>
                                </div>
                                <div className="flex flex-col gap-y-4">
                                    <dt className="text-sm leading-7 text-gray-600 dark:text-gray-400">Seller Aktif</dt>
                                    <dd className="text-4xl sm:text-5xl font-black tracking-tight text-orange-600 font-mono">15,000+</dd>
                                </div>
                                <div className="flex flex-col gap-y-4">
                                    <dt className="text-sm leading-7 text-gray-600 dark:text-gray-400">Rata-rata Profit Naik</dt>
                                    <dd className="text-4xl sm:text-5xl font-black tracking-tight text-orange-600 font-mono">24%</dd>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Features Detailed */}
                    <section id="fitur" className="py-20">
                        <div className="mx-auto max-w-7xl px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <h2 className="text-base font-bold text-orange-600 uppercase tracking-widest leading-7">Fitur Andalan</h2>
                                <p className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Semua yang Anda butuhkan untuk <br className="hidden sm:block" /> scale up bisnis online.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                                <FeatureCard
                                    icon={<Calculator className="w-8 h-8 text-blue-600" />}
                                    title="Auto-Admin Calculator"
                                    desc="Update otomatis skema biaya admin Shopee, Tokopedia, Lazada, dan TikTok Shop."
                                />
                                <FeatureCard
                                    icon={<Target className="w-8 h-8 text-red-600" />}
                                    title="Ad-Spend Tracker"
                                    desc="Pantau biaya iklan harian (FB Ads/Platform) langsung di laporan laba rugi."
                                />
                                <FeatureCard
                                    icon={<Wallet className="w-8 h-8 text-green-600" />}
                                    title="HPP & Stock Tracking"
                                    desc="Manajemen modal produk yang rapi untuk akurasi margin keuntungan."
                                />
                                <FeatureCard
                                    icon={<PieChart className="w-8 h-8 text-purple-600" />}
                                    title="Laporan Bulanan"
                                    desc="Satu klik untuk melihat performa tokomu per bulan tanpa ribet buka Excel."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Comparison */}
                    <section className="py-24 bg-gray-900 text-white dark:bg-[#111110]">
                        <div className="mx-auto max-w-7xl px-6 lg:px-8 grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl sm:text-4xl font-black mb-8 leading-tight">Berhenti Menebak, <br />Mulai Menghitung.</h2>
                                <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                                    Banyak seller merasa omzetnya ratusan juta, tapi saat cek rekening saldo tidak bertambah. Itu karena kebocoran pada biaya admin dan iklan yang tidak tercatat.
                                </p>
                                <ul className="space-y-4">
                                    {["Multi-store support", "Real-time Profit/Loss", "Auto-calculate Marketplace Fee", "Mobile & Desktop Optimized"].map((t) => (
                                        <li key={t} className="flex items-center gap-3">
                                            <CheckCircle2 className="text-orange-500 w-6 h-6" />
                                            <span className="font-bold">{t}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-gradient-to-br from-orange-500 to-red-600 p-8 sm:p-12 rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl relative">
                                {/* Badge Akurasi */}
                                <div className="absolute -top-6 -right-2 sm:-right-6 bg-white text-black p-4 rounded-2xl shadow-xl rotate-12 font-black text-sm sm:text-base">
                                    99% Akurat!
                                </div>

                                <h3 className="text-2xl sm:text-3xl font-black mb-4">Gak Punya Waktu Rekap?</h3>

                                <p className="text-white/80 leading-relaxed italic text-sm sm:text-base">
                                    "Dulu saya butuh 4 jam tiap minggu buat rekap Excel. Pakai ayokulakan.id, input cuma 5 menit, laporan langsung jadi!"
                                </p>

                                <div className="mt-8 flex items-center gap-4">
                                    {/* Initials Avatar (BS - Budi Santoso) */}
                                    <div className="relative">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center shadow-lg backdrop-blur-sm">
                                            <span className="text-white font-black text-lg sm:text-xl tracking-tighter">BS</span>
                                        </div>
                                        {/* Status Online/Verify Badge */}
                                        <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-orange-500 flex items-center justify-center">
                                            <CheckCircle2 className="w-2 h-2 text-white" />
                                        </div>
                                    </div>

                                    <div>
                                        <p className="font-bold tracking-tight text-lg leading-none text-white">Budi Santoso</p>
                                        <p className="text-[10px] sm:text-xs text-orange-200 uppercase font-bold tracking-[0.1em] mt-1.5">
                                            Top Seller Shopee & TikTok Shop
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* FAQ Section */}
                    <section id="faq" className="py-24 max-w-3xl mx-auto px-6">
                        <h2 className="text-3xl font-black text-center mb-12 uppercase tracking-tighter">Pertanyaan Populer</h2>
                        <div className="space-y-4">
                            <FAQItem question="Apakah data saya aman?" answer="Data Anda dienkripsi secara end-to-end. Kami tidak membagikan data penjualan Anda kepada pihak ketiga manapun." />
                            <FAQItem question="Marketplace apa saja yang didukung?" answer="Saat ini kami mendukung Shopee, Tokopedia, TikTok Shop, Lazada, dan juga penjualan Offline." />
                            <FAQItem question="Apakah benar-benar gratis?" answer="Ya, fitur dasar kami gratis selamanya. Fitur advanced tersedia bagi Anda yang ingin scale up lebih cepat." />
                        </div>
                    </section>

                    {/* Final CTA */}
                    <section className="py-12 sm:py-24 text-center">
                        <div className="mx-auto max-w-4xl px-4 sm:px-6">
                            {/* Mengurangi rounded dan padding di mobile (p-8 vs p-20) */}
                            <div className="rounded-[2rem] sm:rounded-[3rem] bg-orange-600 p-8 sm:p-20 text-white shadow-2xl shadow-orange-200/50 dark:shadow-none relative overflow-hidden">

                                {/* Dekorasi halus agar tidak kaku */}
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

                                <div className="relative z-10">
                                    {/* Font size disesuaikan: text-3xl di mobile, text-6xl di desktop */}
                                    <h2 className="text-3xl sm:text-6xl font-black mb-6 sm:mb-8 leading-[1.1] tracking-tighter">
                                        Siap Jadi Seller <br className="hidden sm:block" /> yang Cerdas?
                                    </h2>

                                    <p className="mb-8 text-orange-100 text-sm sm:text-lg font-medium max-w-md mx-auto leading-relaxed">
                                        Gabung dengan 15,000+ seller lainnya dan mulai pantau profit tokomu secara real-time.
                                    </p>

                                    <Link
                                        href={register()}
                                        className="inline-flex items-center justify-center w-full sm:w-auto rounded-xl sm:rounded-2xl bg-white px-8 py-4 sm:px-12 sm:py-5 text-lg sm:text-xl font-black text-orange-600 shadow-xl transition-all hover:bg-orange-50 active:scale-95"
                                    >
                                        Daftar Sekarang Gratis
                                    </Link>

                                    <div className="mt-6 flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-orange-200">
                                        <CheckCircle2 className="w-4 h-4" /> Tanpa biaya langganan di awal
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="py-12 px-6 border-t border-gray-100 dark:border-[#1e1e1e] text-center md:flex md:justify-between md:items-center max-w-7xl mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-4 md:mb-0 text-orange-600">
                        <TrendingUp className="w-5 h-5" />
                        <span className="font-black text-xl tracking-tighter">ayokulakan.id</span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">
                        © 2026 PT. Ayo Kulakan Digital Indonesia.
                    </p>
                </footer>
            </div>
        </>
    );
}

// Sub-components Tetap Sama
function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="group p-8 rounded-[2rem] bg-white border border-gray-100 shadow-sm transition hover:shadow-xl hover:-translate-y-2 dark:bg-[#161615] dark:border-white/5">
            <div className="mb-6 inline-block p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-black mb-3 tracking-tight">{title}</h3>
            <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
        </div>
    );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    return (
        <details className="group border border-gray-100 dark:border-white/5 rounded-2xl p-6 bg-white dark:bg-[#161615] [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex items-center justify-between cursor-pointer">
                <h3 className="text-lg font-bold tracking-tight">{question}</h3>
                <span className="text-orange-600 transition group-open:rotate-180">
                    <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
            </summary>
            <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{answer}</p>
        </details>
    );
}