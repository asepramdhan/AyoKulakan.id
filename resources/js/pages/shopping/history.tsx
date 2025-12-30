/* eslint-disable @typescript-eslint/no-explicit-any */
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import shopping from '@/routes/shopping';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight, HistoryIcon, Store, Calendar, Package } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Riwayat Belanja',
    href: shopping.history().url,
  },
];

export default function History({ lists }: { lists: any[] }) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title='Riwayat Belanja' />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
            Riwayat Belanja
          </h2>
          <p className="text-sm text-muted-foreground">Daftar belanja yang telah Anda selesaikan.</p>
        </div>

        {lists.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <HistoryIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-slate-500 dark:text-slate-400">Belum ada riwayat belanja.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {lists.map((list) => {
              const formattedDate = new Date(list.shopping_date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              });

              const formattedPrice = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                maximumFractionDigits: 0
              }).format(list.total_price || 0);

              return (
                <Link key={list.id} href={shopping.check(list.id)}>
                  <Card className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg capitalize">{list.title}</span>
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-700 dark:hover:bg-green-700 dark:text-green-50">Selesai</Badge>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Store className="w-3.5 h-3.5" />
                            <span className="capitalize">{list.store?.name || 'Toko tidak diketahui'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formattedDate}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />
                            <span>{list.items_count} Barang</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-muted-foreground">Total Pengeluaran</p>
                          <p className="font-bold text-blue-600 dark:text-blue-400">
                            {formattedPrice}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}