/* eslint-disable @typescript-eslint/no-explicit-any */
import ShoppingListController from '@/actions/App/Http/Controllers/ShoppingListController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import shopping from '@/routes/shopping';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Circle, ArrowLeft } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Daftar Belanja',
    href: shopping.check(1).url,
  },
];

export default function CheckShopping({ shoppingList }: { shoppingList: any }) {

  const totalItem = shoppingList.items.length;
  const itemSelesai = shoppingList.items.filter((i: any) => i.is_bought).length;
  const progress = (itemSelesai / totalItem) * 100;

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Belanja: ${shoppingList.title}`} />
      <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
        <div className="flex justify-between">
          <Button variant="ghost" className="mb-2 cursor-pointer">
            <Link href={shopping.index().url} className="flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </Link>
          </Button>
        </div>

        <Card className="border-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                  {shoppingList.store.name}
                </p>
                <CardTitle className="text-xl capitalize">{shoppingList.title}</CardTitle>
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
              ? 'bg-green-50 border-green-200 opacity-60'
              : 'bg-white border-slate-100 shadow-sm'
              }`}>
              <div className="flex items-center gap-3">
                {item.is_bought ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-300" />
                )}
                <div>
                  <p className={`font-semibold ${item.is_bought ? 'line-through text-slate-500 capitalize text-start' : 'text-slate-800 capitalize text-start'}`}>
                    {item.product_name_snapshot}
                  </p>
                  <p className="text-xs text-slate-500 text-start">
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
          <div className="bg-green-600 text-white p-4 rounded-xl text-center font-bold shadow-lg animate-bounce">
            🎉 Semua Barang Terbeli!
          </div>
        )}
      </div>
    </AppLayout>
  );
}