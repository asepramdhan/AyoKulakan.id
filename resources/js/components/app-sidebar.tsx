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
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { BadgeDollarSign, History, LayoutGrid, Package2Icon, PieChart, ShoppingBag, ShoppingCart, Store } from 'lucide-react';
import AppLogo from './app-logo';
import shopping from '@/routes/shopping';
import products from '@/routes/products';
import stores from '@/routes/stores';
import analysis from '@/routes/analysis';
import salesRecord from '@/routes/sales-record';
import AppLogoIcon from './app-logo-icon';

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
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            {/* <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link> */}
                            <a href='/dashboard'>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 shadow-lg shadow-gray/10 dark:shadow-none">
                                        <AppLogoIcon className="w-7 h-7 text-orange-600" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-md sm:text-xl font-black tracking-tighter leading-none text-orange-600">
                                            ayokulakan<span className="text-gray-900 dark:text-white">.id</span>
                                        </span>
                                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 leading-none mt-1">
                                            Smart Seller Tools
                                        </span>
                                    </div>
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
                        <span className="text-xs text-muted-foreground ml-1 italic">(Beta)</span>
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
