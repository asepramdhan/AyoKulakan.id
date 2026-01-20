import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { BadgeDollarSign, Box, History, LayoutGrid, Package2Icon, PieChart, ShoppingBag, ShoppingCart, Store } from 'lucide-react';
import shopping from '@/routes/shopping';
import products from '@/routes/products';
import stores from '@/routes/stores';
import analysis from '@/routes/analysis';
import salesRecord from '@/routes/sales-record';
import AppLogoIcon from './app-logo-icon';
import supplies from '@/routes/supplies';
// import marketplace from '@/routes/marketplace';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Buat Daftar Belanja',
        href: shopping.index(),
        icon: ShoppingBag,
    },
    {
        title: 'Daftar Belanja Aktif',
        href: shopping.active(),
        icon: ShoppingCart,
    },
    {
        title: 'Riwayat Belanja',
        href: shopping.history(),
        icon: History,
    },
];

const managementNavItems: NavItem[] = [
    // {
    //     title: 'Marketplace',
    //     href: marketplace.index(),
    //     icon: ClipboardList,
    //     badge: 'development',
    // },
    {
        title: 'Operasional',
        href: supplies.index(),
        icon: Box,
    },
    {
        title: 'Master Produk',
        href: products.index(),
        icon: Package2Icon,
    },
    {
        title: 'Kelola Toko',
        href: stores.index(),
        icon: Store,
    },
];

const premiumNavItems: NavItem[] = [
    {
        title: 'Penghasilan',
        href: salesRecord.index(),
        icon: BadgeDollarSign,
    },
    {
        title: 'Analisa Margin',
        href: analysis.margin.index(),
        icon: PieChart,
    },
];

export function AppSidebar() {
    // Ambil status sidebar (expanded atau collapsed)
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            {/* logo sebelumnya <Link href={dashboard()} prefetch><AppLogo /></Link> */}
                            <a href='/dashboard'>
                                <div className="flex items-center gap-3">
                                    {/* Kotak Logo: Ukuran berubah berdasarkan isCollapsed */}
                                    <div className={`
                                        flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 shadow-lg shadow-gray/10 dark:shadow-none transition-all duration-300
                                        ${isCollapsed ? 'h-8 w-8' : 'h-10 w-10'}
                                    `}>
                                        <AppLogoIcon className={`text-orange-600 transition-all duration-300 ${isCollapsed ? 'w-6 h-6' : 'w-8 h-8'}`} />
                                    </div>

                                    {/* Teks Logo: Hilang otomatis saat collapsed dikelola oleh SidebarMenuButton, 
                                        tapi kita bungkus agar transisinya halus */}
                                    {!isCollapsed && (
                                        <div className="flex flex-col overflow-hidden transition-all duration-300">
                                            <span className="text-2xl font-black tracking-tighter leading-none text-orange-600">
                                                ayokulakan<span className="text-gray-900 dark:text-white">.id</span>
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 leading-none mt-1 whitespace-nowrap">
                                                Smart Seller Tools
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
                    <SidebarMenu>
                        <NavMain items={mainNavItems} />
                    </SidebarMenu>
                    <SidebarGroupLabel>Kelola</SidebarGroupLabel>
                    <SidebarMenu>
                        <NavMain items={managementNavItems} />
                    </SidebarMenu>
                    <SidebarGroupLabel>Fitur Premium
                        <span className="ml-auto flex h-4 items-center justify-center rounded bg-indigo-100 px-1 text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                            beta
                        </span>
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        <NavMain items={premiumNavItems} />
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
