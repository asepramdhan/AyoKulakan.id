/* eslint-disable @typescript-eslint/no-explicit-any */
import AppLayout from '@/layouts/app-layout';
import shopping from '@/routes/shopping';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Clock, ChevronRight, ShoppingCart } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Sedang Berjalan',
    href: shopping.active().url,
  },
];

export default function ActiveLists({ lists }: { lists: any[] }) {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title='Sedang Berjalan' />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingCart className="w-6 h-6 text-orange-500" />
          <h2 className="text-2xl font-bold">Daftar Belanja Aktif</h2>
        </div>

        {lists.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-dashed">
            <p className="text-slate-400 dark:text-slate-500">Tidak ada belanjaan yang sedang berjalan.</p>
            <Link href={shopping.index()} className="text-blue-600 dark:text-blue-400 font-medium mt-2 block">Buat daftar baru</Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {lists.map((list) => {
              const progress = (list.completed_items_count / list.items_count) * 100;
              return (
                <Link
                  key={list.id}
                  href={shopping.check(list.id).url}
                  className="group bg-white dark:bg-slate-900 border rounded-xl p-4 hover:border-orange-500 transition-all shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                        {list.store?.name}
                      </span>
                      <h3 className="font-bold text-lg mt-1 group-hover:text-orange-600 transition-colors capitalize">{list.title}</h3>
                      <div className="flex items-center gap-2 text-slate-400 text-xs mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(list.shopping_date).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Progress Barang</span>
                      <span>{list.completed_items_count} / {list.items_count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between items-end pt-2">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Estimasi</div>
                      <div className="font-bold text-slate-700 dark:text-slate-200">
                        Rp {Number(list.total_estimated_price || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}