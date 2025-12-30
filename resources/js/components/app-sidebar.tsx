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
import { History, LayoutGrid, Package2Icon, ShoppingBag, ShoppingCart, Store } from 'lucide-react';
import AppLogo from './app-logo';
import shopping from '@/routes/shopping';
import products from '@/routes/products';
import stores from '@/routes/stores';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Daftar Belanja',
        href: shopping.index(),
        icon: ShoppingBag,
    },
    {
        title: 'Sedang Berjalan',
        href: shopping.active(),
        icon: ShoppingCart,
    },
    {
        title: 'Riwayat',
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
                                <AppLogo />
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
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
