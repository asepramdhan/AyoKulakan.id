/* eslint-disable @typescript-eslint/no-explicit-any */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import shopping from '@/routes/shopping';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronRight, HistoryIcon, Store, Calendar, Package, Copy, Loader2 } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Riwayat Belanja', href: shopping.history().url },
];

const formatSingkat = (dateString: string) => {
  const d = new Date(dateString);
  const hari = d.toLocaleDateString('id-ID', { weekday: 'long' });
  const tgl = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
  const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
  return `${hari}, ${tgl} ${jam}`;
};

export default function History({ lists }: { lists: any }) {
  const [allItems, setAllItems] = useState(lists.data);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync data saat pertama load
  useEffect(() => {
    if (lists.current_page === 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAllItems(lists.data);
    }
  }, [lists.data]);

  // Logic Pencarian (Client-side agar bisa baca Nama Hari/Tanggal)
  const filteredLists = useMemo(() => {
    if (!searchQuery) return allItems;

    const lowerQuery = searchQuery.toLowerCase();
    return allItems.filter((item: any) => {
      const title = item.title?.toLowerCase() || '';
      const storeName = item.store?.name?.toLowerCase() || '';
      const dateFull = formatSingkat(item.shopping_date).toLowerCase();

      return title.includes(lowerQuery) ||
        storeName.includes(lowerQuery) ||
        dateFull.includes(lowerQuery);
    });
  }, [searchQuery, allItems]);

  const loadMore = () => {
    if (loading || !lists.next_page_url) return;
    setLoading(true);

    router.get(lists.next_page_url, {}, {
      preserveState: true,
      preserveScroll: true,
      only: ['lists'],
      onSuccess: (page: any) => {
        setAllItems((prev: any) => [...prev, ...page.props.lists.data]);
        setLoading(false);
      },
      onError: () => setLoading(false)
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const currentScroll = window.innerHeight + document.documentElement.scrollTop;
      if (currentScroll + 150 >= scrollHeight) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lists.next_page_url, loading]);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title='Riwayat Belanja' />
      <div className="flex h-full flex-1 flex-col gap-4 p-4 pb-20">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-slate-500" />
            Riwayat Belanja
          </h2>
          <p className="text-sm text-muted-foreground">Daftar belanja yang telah diselesaikan.</p>
        </div>

        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2">
          <Input
            placeholder="Cari judul, toko, atau hari (ex: Senin)..."
            className="w-full border-slate-300 dark:border-slate-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredLists.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <HistoryIcon className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-slate-500 text-sm">Data tidak ditemukan.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredLists.map((list: any) => {
              const formattedPrice = new Intl.NumberFormat('id-ID', {
                style: 'currency', currency: 'IDR', maximumFractionDigits: 0
              }).format(list.total_price || 0);

              return (
                <Link key={list.id} href={shopping.check(list.id)} className="relative block">
                  <div className="absolute top-3 right-3 z-20">
                    <Link href={shopping.duplicate(list.id)}>
                      <Button variant="outline" size="icon" className="h-8 w-8 rounded-full bg-white dark:bg-slate-900 shadow-sm">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                  <Card className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-base capitalize leading-none">{list.title}</span>
                          <Badge className="h-5 text-[10px] bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400">Selesai</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                          <div className="flex items-center gap-1 capitalize"><Store className="w-3 h-3" />{list.store?.name}</div>
                          <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatSingkat(list.shopping_date)}</div>
                          <div className="flex items-center gap-1"><Package className="w-3 h-3" />{list.items_count} Item</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden xs:block">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</p>
                          <p className="font-bold text-blue-600 dark:text-blue-400 text-sm">{formattedPrice}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {loading && (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {!lists.next_page_url && allItems.length > 0 && !searchQuery && (
          <p className="text-center text-[11px] text-muted-foreground mt-4 italic">
            Semua riwayat telah dimuat.
          </p>
        )}
      </div>
    </AppLayout>
  );
}