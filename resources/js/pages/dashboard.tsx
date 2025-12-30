/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import shopping from '@/routes/shopping';
import stores from '@/routes/stores';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays, CalendarRange, CalendarSync, History, LucidePackage2, Package, PlusCircle, ShoppingCart, Store } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard({ stats }: { stats: any }) {
    // Ambil data dari props stats
    const { summary, most_active_store, top_products, per_store } = stats;
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <h2 className="text-3xl font-bold tracking-tight">Ringkasan Bulan Ini</h2>

                {/* Barisan Widget Pengeluaran Berkala */}
                <div className="grid gap-4 md:grid-cols-3">
                    {/* Hari Ini */}
                    <Card className="bg-blue-600 text-white border-none shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-100">Hari Ini</CardTitle>
                            <CalendarDays className="w-4 h-4 text-blue-100" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rp {Number(summary.daily).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                            <p className="text-[10px] text-blue-200 mt-1 italic">Pengeluaran hari ini</p>
                        </CardContent>
                    </Card>

                    {/* Minggu Ini */}
                    <Card className="bg-indigo-600 text-white border-none shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-indigo-100">Minggu Ini</CardTitle>
                            <CalendarRange className="w-4 h-4 text-indigo-100" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rp {Number(summary.weekly).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                            <p className="text-[10px] text-indigo-200 mt-1 italic">Total 7 hari terakhir</p>
                        </CardContent>
                    </Card>

                    {/* Bulan Ini */}
                    <Card className="bg-orange-600 text-white border-none shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-orange-100">Bulan Ini</CardTitle>
                            <CalendarSync className="w-4 h-4 text-orange-100" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rp {Number(summary.monthly).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                            <p className="text-[10px] text-orange-200 mt-1 italic">Akumulasi bulan berjalan</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Barisan Info Toko & Produk */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Toko Teraktif</CardTitle>
                            <Store className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {most_active_store ? (
                                <>
                                    <div className="text-xl font-bold capitalize">{most_active_store?.name || '-'}</div>
                                    <p className="text-xs text-muted-foreground">{most_active_store?.shopping_lists_count || 0} kali transaksi</p>
                                </>
                            ) : (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Store className="w-6 h-6 text-slate-400" />
                                        </EmptyMedia>
                                        <EmptyTitle className="text-slate-400">Tidak ada toko aktif</EmptyTitle>
                                    </EmptyHeader>
                                </Empty>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Top Produk</CardTitle>
                            <Package className="w-4 h-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {top_products.length > 0 ? (
                                <>
                                    <div className="text-xl font-bold truncate capitalize">{top_products[0]?.product_name_snapshot || '-'}</div>
                                    <p className="text-xs text-muted-foreground">Paling sering dibeli</p>
                                </>
                            ) : (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Package className="w-6 h-6 text-slate-400" />
                                        </EmptyMedia>
                                        <EmptyTitle className="text-slate-400">Tidak ada top produk</EmptyTitle>
                                    </EmptyHeader>
                                </Empty>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tabel Detail Bawah */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Pengeluaran Per Toko (Bulan Ini)</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {per_store.length === 0 && <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <CalendarSync className="w-6 h-6 text-slate-400" />
                                    </EmptyMedia>
                                    <EmptyTitle className="text-slate-400">Tidak ada pengeluaran</EmptyTitle>
                                </EmptyHeader>
                            </Empty>
                            }
                            {per_store.map((s: any) => (
                                <div key={s.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                                    <span className="text-sm font-medium capitalize">{s.name}</span>
                                    <span className="font-bold text-sm">Rp {Number(s.pengeluaran || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 })}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-lg">Top 5 Barang</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {top_products.length === 0 && <Empty>
                                <EmptyHeader>
                                    <EmptyMedia variant="icon">
                                        <LucidePackage2 className="w-6 h-6 text-slate-400" />
                                    </EmptyMedia>
                                    <EmptyTitle className="text-slate-400">Tidak ada top 5 produk</EmptyTitle>
                                </EmptyHeader>
                            </Empty>
                            }
                            {top_products.map((p: any, i: number) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-800 dark:text-orange-500 text-[10px] font-bold">{i + 1}</div>
                                    <span className="text-sm flex-1 truncate capitalize">{p.product_name_snapshot}</span>
                                    <span className="text-xs text-muted-foreground">{p.total_bought}x</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                <h3 className="text-2xl font-bold tracking-tight">Pintasan</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {/* Pintasan 1: Buat Daftar Baru */}
                    <Link
                        href={shopping.index()}
                        className="flex flex-col items-center p-4 bg-green-50 border border-green-100 rounded-2xl hover:bg-green-100 dark:hover:bg-green-800 dark:bg-green-900 dark:border-green-800 transition-all group"
                    >
                        <div className="w-12 h-12 bg-green-600 text-white dark:bg-green-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <PlusCircle className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold text-green-900 dark:text-green-50">Buat Daftar</span>
                    </Link>

                    {/* Pintasan 2: Cek Belanjaan Aktif */}
                    <Link
                        href={shopping.active()}
                        className="flex flex-col items-center p-4 bg-orange-50 border border-orange-100 rounded-2xl hover:bg-orange-100 dark:hover:bg-orange-800 dark:bg-orange-900 dark:border-orange-800 transition-all group"
                    >
                        <div className="w-12 h-12 bg-orange-500 text-white dark:bg-orange-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold text-orange-900 dark:text-orange-50">Sedang Belanja</span>
                    </Link>

                    {/* Pintasan 3: Kelola Toko */}
                    <Link
                        href={stores.index()}
                        className="flex flex-col items-center p-4 bg-blue-50 border border-blue-100 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-800 dark:bg-blue-900 dark:border-blue-800 transition-all group"
                    >
                        <div className="w-12 h-12 bg-blue-600 text-white dark:bg-blue-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Store className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-50">Kelola Toko</span>
                    </Link>

                    {/* Pintasan 4: Riwayat */}
                    <Link
                        href={shopping.history()}
                        className="flex flex-col items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 dark:bg-slate-900 dark:border-slate-800 transition-all group"
                    >
                        <div className="w-12 h-12 bg-slate-600 text-white dark:bg-slate-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <History className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">Riwayat</span>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
