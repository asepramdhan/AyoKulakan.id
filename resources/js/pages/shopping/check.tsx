/* eslint-disable @typescript-eslint/no-explicit-any */
import ShoppingListController from '@/actions/App/Http/Controllers/ShoppingListController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import shopping from '@/routes/shopping';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, Circle, ArrowLeft } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Daftar Belanja',
    href: shopping.check(1).url,
  },
];

export default function CheckShopping({ shoppingList, otherLists = [] }: { shoppingList: any, otherLists?: any[] }) {

  // Fungsi untuk cek apakah sebuah tanggal adalah hari ini
  const checkIsToday = (dateString: string) => {
    const today = new Date();
    const targetDate = new Date(dateString);

    return (
      today.getDate() === targetDate.getDate() &&
      today.getMonth() === targetDate.getMonth() &&
      today.getFullYear() === targetDate.getFullYear()
    );
  };

  // Cek untuk daftar yang sedang dibuka
  const isMainListToday = checkIsToday(shoppingList.shopping_date);

  const totalItem = shoppingList.items.length;
  const itemSelesai = shoppingList.items.filter((i: any) => i.is_bought).length;
  const progress = (itemSelesai / totalItem) * 100;

  // --- LOGIKA KALKULASI HARGA (Sama seperti di Riwayat) ---
  const totalEstimatedPrice = shoppingList.items.reduce((acc: number, item: any) => acc + Number(item.subtotal), 0);
  const totalBoughtPrice = shoppingList.items
    .filter((item: any) => item.is_bought)
    .reduce((acc: number, item: any) => acc + Number(item.subtotal), 0);
  const sisaAnggaran = totalEstimatedPrice - totalBoughtPrice;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Belanja: ${shoppingList.title}`} />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex justify-end gap-2">
          <Link
            preserveScroll
            href={shopping.active()}
            className="group cursor-pointer flex items-center gap-2 text-sm text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Kembali ke Daftar Belanja</span>
          </Link>
          <Link
            preserveScroll
            href={shopping.history()}
            className="group cursor-pointer flex items-center gap-2 text-sm text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all rounded-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium">History Daftar Belanja</span>
          </Link>
        </div>

        <Card className="border-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                  {shoppingList.store.name}
                </p>
                <CardTitle className="text-xl capitalize">{shoppingList.title}</CardTitle>
                {isMainListToday && (
                  <span className="bg-orange-100 text-orange-600 dark:bg-orange-800 dark:text-orange-100 text-[9px] px-1.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-600 font-bold shrink-0">
                    Hari Ini
                  </span>
                )}
                <p className="text-[10px] md:text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <span className="font-medium">Jadwal:</span>
                  {new Date(shoppingList.shopping_date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {/* --- TAMPILAN TOTAL SEPERTI DI RIWAYAT --- */}
              <div className="text-right">
                <div className="text-sm font-semibold">
                  <span className="text-green-600" title="Sudah dibeli">
                    Rp {totalBoughtPrice.toLocaleString('id-ID')}
                  </span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-slate-500" title="Total estimasi">
                    {totalEstimatedPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                {progress < 100 ? (
                  <p className="text-[10px] text-amber-600 font-medium">
                    Sisa: Rp {sisaAnggaran.toLocaleString('id-ID')} lagi
                  </p>
                ) : (
                  <p className="text-[10px] text-green-600 font-medium flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Lunas / Selesai
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs mt-2 text-right font-medium">
              {itemSelesai} dari {totalItem} barang terbeli
            </p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {shoppingList.items.map((item: any) => (
            <Link href={ShoppingListController.toggleItem(item.id)} key={item.id} preserveScroll className={`w-full flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${item.is_bought
              ? 'bg-green-50 border-green-200 opacity-60 dark:bg-green-800 dark:border-green-700'
              : 'bg-white border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-700'
              }`}>
              <div className="flex items-center gap-3">
                {item.is_bought ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                )}
                <div>
                  <p className={`font-semibold ${item.is_bought ? 'line-through text-slate-500 dark:text-slate-400 capitalize text-start' : 'text-slate-800 dark:text-slate-200 capitalize text-start'}`}>
                    {item.product_name_snapshot}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-start">
                    {item.quantity} pcs x Rp {Number(item.price_per_unit).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">
                  Rp {Number(item.subtotal).toLocaleString('id-ID')}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {progress === 100 && (
          <div className="bg-green-600 text-white dark:bg-green-800 p-4 rounded-xl text-center font-bold shadow-lg animate-bounce">
            🎉 Semua Barang Terbeli!
          </div>
        )}

        {/* --- TAMBAHAN: DAFTAR BELANJA BERJALAN LAINNYA --- */}
        {otherLists.length > 0 && (
          <div className="mt-8 space-y-3 pb-10">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">
              Daftar Belanja Berjalan
            </h3>
            <div className="flex flex-col gap-2">
              {otherLists
                .filter((l: any) => l.id !== shoppingList.id) // Jangan tampilkan daftar yang sedang dibuka
                .map((list: any) => {
                  // CEK APAKAH LIST INI HARI INI
                  const isThisListToday = checkIsToday(list.shopping_date);

                  // Gunakan OR 0 agar tidak Error jika data null/undefined
                  const hargaTerbeli = Number(list.total_bought_price || 0);
                  const hargaEstimasi = Number(list.total_estimated_price || 0);
                  const sisa = hargaEstimasi - hargaTerbeli;

                  return (
                    <Link
                      key={list.id}
                      href={shopping.check(list.id).url}
                      className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 transition-colors border border-transparent hover:border-slate-300"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">
                          {list.store?.name}
                        </span>
                        <span className="font-semibold text-sm capitalize">
                          {list.title}
                          {isThisListToday && (
                            <span className="ml-2 bg-orange-100 text-orange-600 dark:bg-orange-800 dark:text-orange-100 text-[9px] px-1.5 py-0.5 rounded-full border border-orange-200 dark:border-orange-600">
                              Hari Ini
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(list.shopping_date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short'
                          })}
                        </span>
                      </div>
                      {/* Tampilan Harga & Progress ala Riwayat */}
                      <div className="text-right flex flex-col justify-center">
                        <div className="text-[11px] font-bold">
                          <span className="text-green-600">
                            Rp {hargaTerbeli.toLocaleString('id-ID')}
                          </span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-slate-500">
                            {hargaEstimasi.toLocaleString('id-ID')}
                          </span>
                        </div>

                        {list.status !== 'completed' ? (
                          <span className="text-[9px] text-amber-600 font-medium">
                            Sisa: {sisa.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="text-[9px] text-green-600 font-medium flex items-center justify-end gap-0.5">
                            <CheckCircle2 className="w-2 h-2" /> Lunas
                          </span>
                        )}

                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          <span className="text-[9px] text-muted-foreground font-medium">
                            {list.completed_items_count}/{list.items_count} Item
                          </span>
                          {/* Progress bar mini */}
                          <div className="w-12 bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${list.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`}
                              style={{ width: `${(list.completed_items_count / list.items_count) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}