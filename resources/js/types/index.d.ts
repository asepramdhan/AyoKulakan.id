import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Product {
    id: number;
    name: string;
    last_price: number;
    category?: string;
}

export interface ShoppingItem {
    id?: number;
    product_id: number;
    product_name_snapshot: string;
    quantity: number;
    price_per_unit: number;
    subtotal: number;
    is_bought: boolean;
}

export interface ShoppingList {
    id: number;
    title: string;
    shopping_date: string;
    store_id: number;
    items: ShoppingItem[];
    total_estimated_price: number;
}
