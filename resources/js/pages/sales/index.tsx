/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import salesRecord from '@/routes/sales-record';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ArrowUpRight, DollarSign, Percent, Store, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Penghasilan',
    href: salesRecord.index().url,
  },
];

export default function Index() {

  // Contoh data (Nanti data ini datang dari props Laravel)
  const [sales] = useState([
    { id: 1, product: 'Pakan Kucing 1kg', buy: 18000, sell: 25000, marketplace: 'Shopee', fee: 1250 },
    { id: 2, product: 'Botol Minum', buy: 15000, sell: 20000, marketplace: 'Lazada', fee: 1000 },
  ]);

  // Kalkulasi Total Dashboard
  const stats = useMemo(() => {
    const totalModal = sales.reduce((acc, curr) => acc + curr.buy, 0);
    const totalJual = sales.reduce((acc, curr) => acc + curr.sell, 0);
    const totalFee = sales.reduce((acc, curr) => acc + curr.fee, 0);
    const netProfit = totalJual - totalModal - totalFee;
    const margin = (netProfit / totalJual) * 100;

    return { totalModal, totalJual, netProfit, margin };
  }, [sales]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Analisa Penghasilan" />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">💰 Analisa Penghasilan</h2>
          <p className="text-muted-foreground">Pantau margin keuntungan di setiap marketplace.</p>
        </div>

        {/* Dashboard Ringkasan */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
              <DollarSign className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {stats.totalJual.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Profit Bersih</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Rp {stats.netProfit.toLocaleString('id-ID')}</div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" /> {stats.margin.toFixed(1)}% Margin
              </p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Potongan Admin</CardTitle>
              <Percent className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {sales.reduce((acc, curr) => acc + curr.fee, 0).toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Data Penjualan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detail Margin per Produk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground uppercase text-[10px] tracking-wider">
                    <th className="pb-3">Produk & Toko</th>
                    <th className="pb-3 text-right">Harga Beli</th>
                    <th className="pb-3 text-right">Harga Jual</th>
                    <th className="pb-3 text-right">Potongan</th>
                    <th className="pb-3 text-right text-green-600">Margin/Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sales.map((item) => {
                    const profitPerItem = item.sell - item.buy - item.fee;
                    // const marginPercent = (profitPerItem / item.sell) * 100;

                    return (
                      <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="py-4">
                          <div className="font-bold">{item.product}</div>
                          <div className="flex items-center text-[10px] text-muted-foreground mt-1">
                            <Store className="w-3 h-3 mr-1" /> {item.marketplace}
                          </div>
                        </td>
                        <td className="py-4 text-right">Rp {item.buy.toLocaleString('id-ID')}</td>
                        <td className="py-4 text-right font-medium">Rp {item.sell.toLocaleString('id-ID')}</td>
                        <td className="py-4 text-right text-red-500">- Rp {item.fee.toLocaleString('id-ID')}</td>
                        <td className="py-4 text-right">
                          <div className="font-bold text-green-600">Rp {profitPerItem.toLocaleString('id-ID')}</div>
                          {/* <Badge className="text-[9px] py-0 px-1 border-green-200 text-green-600">
                            {marginPercent.toFixed(1)}%
                          </Badge> */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
