/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import shopping from '@/routes/shopping';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Clock, ChevronRight, ShoppingCart, Pencil, Wallet, Share2, Printer } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Sedang Berjalan', href: shopping.active().url }];
const today = new Date().toISOString().split('T')[0];

const formatSingkat = (dateString: string) => {
  const d = new Date(dateString);
  const hari = d.toLocaleDateString('id-ID', { weekday: 'long' });
  const tgl = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  return `${hari}, ${tgl} ${jam}`;
};

// --- FUNGSI EXPORT ---
const shareToWhatsApp = (list: any) => {
  const line = "----------------------------------";
  const title = `*🛒 DAFTAR BELANJA: ${list.title.toUpperCase()}*`;
  const store = `📍 *Toko:* ${list.store?.name || 'Bebas'}`;
  const toTitleCase = (str: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Perbaikan: Cek berbagai kemungkinan nama field (product_name atau name)
  const itemsText = list.items?.length > 0
    ? list.items.map((item: any, i: number) => {
      const status = item.is_bought ? '✅' : '';
      const rawName = item.product_name || item.name || item.product_name_snapshot || 'Produk Tanpa Nama';
      const itemName = toTitleCase(rawName);
      const qty = item.quantity || 0;
      const unit = item.unit || 'pcs';

      return `${i + 1}. *${itemName}* (${qty} ${unit}) ${status}`;
    }).join('\n')
    : "_Daftar item kosong_";

  const total = `*TOTAL ESTIMASI: Rp ${Number(list.total_estimated_price).toLocaleString('id-ID')}*`;
  const footer = "Dikirim via *AyoKulakan.PortoKu.id*";

  const fullMessage = `${title}\n${line}\n${store}\n\n${itemsText}\n\n${line}\n${total}\n\n${footer}`;

  window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(fullMessage), "_blank");
};

export default function ActiveLists({ lists }: { lists: any[] }) {
  const grandTotal = lists.reduce((acc, curr) => acc + Number(curr.total_estimated_price || 0), 0);

  return (
    <>
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title='Sedang Berjalan' />
        <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">

          {/* Header & Grand Total */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold dark:text-slate-100">Daftar Belanja Aktif</h2>
                <p className="text-sm text-muted-foreground">{lists.length} Daftar belanja yang sedang berjalan</p>
              </div>
            </div>

            {lists.length > 0 && (
              <Card className="bg-orange-600 text-white border-none shadow-lg md:min-w-[250px]">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-orange-100">Total Anggaran</p>
                    <div className="text-xl font-black text-white">Rp {grandTotal.toLocaleString('id-ID')}</div>
                  </div>
                  <Wallet className="w-8 h-8 opacity-40" />
                </CardContent>
              </Card>
            )}
          </div>

          {lists.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-300 cursor-pointer"
                onClick={() => {
                  // Memastikan UI selesai render sebelum print
                  setTimeout(() => {
                    window.print();
                  }, 100);
                }}
              >
                <Printer className="w-5 h-5" />
                Print Semua Daftar Belanja
              </div>
            </div>
          )}

          {lists.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed">
              <p className="text-slate-400">Belum ada daftar belanja aktif.</p>
              <Link
                href={shopping.index().url}
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-500 mt-2"
              >
                Buat Daftar Belanja
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {lists.map((list) => {
                const progress = (list.completed_items_count / list.items_count) * 100;
                const isToday = list.shopping_date.startsWith(today);

                return (
                  <div key={list.id} className="relative group bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">

                    {/* Bagian Atas: Bisa diklik untuk ke halaman Cek List */}
                    <Link href={shopping.check(list.id).url} className="block p-5 pb-2">
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1">
                          <div className="flex gap-2">
                            <span className="text-[9px] font-bold uppercase text-orange-700 bg-orange-100 dark:bg-orange-900/50 dark:text-orange-400 px-2 py-0.5 rounded">{list.store?.name}</span>
                            {isToday && <span className="text-[9px] font-bold uppercase text-blue-700 bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded">Hari Ini</span>}
                          </div>
                          <h3 className="font-bold text-lg dark:text-slate-100 capitalize">{list.title}</h3>
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]"><Clock className="w-3 h-3" /> {formatSingkat(list.shopping_date)}</div>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-4">
                        <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </Link>

                    {/* Bagian Bawah: Tombol Aksi (Diletakkan di luar Link agar tidak bentrok) */}
                    <div className="px-5 py-4 flex items-center justify-between border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="text-sm font-black dark:text-white">
                        <span className="text-[9px] text-slate-400 block font-normal uppercase">Estimasi</span>
                        Rp {Number(list.total_estimated_price || 0).toLocaleString('id-ID')}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full h-8 w-8 hover:bg-orange-100 hover:text-orange-600 dark:border-slate-700 cursor-pointer"
                          onClick={(e) => { e.preventDefault(); shareToWhatsApp(list); }}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>

                        <Link href={shopping.edit(list.id)}>
                          <Button variant="outline" size="icon" className="rounded-full h-8 w-8 hover:bg-slate-100 hover:text-slate-600 dark:border-slate-700 cursor-pointer">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppLayout>

      {/* TEMPLATE KHUSUS PRINT (PDF) */}
      <div id="print-area" className="hidden print:block bg-white text-black p-4">
        {/* Header Laporan */}
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase text-black">Daftar Belanja AyoKulakan</h1>
          <p className="text-sm text-black">URL: ayokulakan.id</p>
          <p className="text-xs text-slate-500 mt-1 italic">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
        </div>

        {/* Looping setiap list belanja aktif */}
        {lists.map((list: any) => (
          <div key={list.id} className="mb-10 break-inside-avoid">
            <div className="flex justify-between items-end mb-2 border-b border-slate-300 pb-1">
              <div>
                <h2 className="text-lg font-bold uppercase">{list.title}</h2>
                <p className="text-sm">Toko: <strong>{list.store?.name || 'Bebas'}</strong></p>
              </div>
              <p className="text-sm text-right">{new Date(list.shopping_date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            {/* Tabel Barang */}
            <table className="w-full border-collapse mt-4">
              <thead>
                <tr className="border-b-2 border-black text-left text-sm">
                  <th className="py-2 w-10">No</th>
                  <th className="py-2">Nama Barang</th>
                  <th className="py-2 w-24">Jumlah</th>
                  <th className="py-2 text-right w-32">Harga Satuan</th>
                </tr>
              </thead>
              <tbody>
                {list.items?.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-200 text-sm">
                    <td className="py-2">{idx + 1}</td>
                    <td className="py-2">{item.product_name || item.name || item.product_name_snapshot || 'Produk Tanpa Nama'}</td>
                    <td className="py-2">{item.quantity} {item.unit || 'pcs'}</td>
                    <td className="py-2 text-right">Rp {Number(item.price || 0).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Ringkasan Per List */}
            <div className="flex justify-end mt-4">
              <div className="text-right">
                <p className="text-xs uppercase text-slate-500">Total Estimasi Daftar Ini:</p>
                <p className="text-lg font-bold">Rp {Number(list.total_estimated_price).toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Footer PDF */}
        <div className="mt-12 pt-4 border-t border-dashed border-slate-400 text-center">
          <p className="text-sm font-bold">Total Seluruh Anggaran: Rp {grandTotal.toLocaleString('id-ID')}</p>
          <p className="text-[10px] mt-4 text-slate-400">Terima kasih telah menggunakan AyoKulakan.id</p>
        </div>
      </div>
    </>
  );
}