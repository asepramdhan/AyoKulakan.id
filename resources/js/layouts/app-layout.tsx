import { Toaster } from '@/components/ui/sonner';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
        <Toaster
            richColors
            position="top-center"
            toastOptions={{
                className: "group", // Tetap bawa class group
                style: {
                    // Kita override variabel warna sonner di sini
                    // Ini akan membuat toast sukses berwarna Orange khas ayokulakan
                    '--success-bg': '#EA580C',
                    '--success-text': '#ffffff',
                    '--success-border': '#EA580C',

                    // Emerald Green yang modern dan bersih
                    // '--success-bg': '#10b981',
                    // '--success-text': '#ffffff',
                    // '--success-border': '#10b981',

                    // Atau Forest Green (lebih gelap, lebih profesional)
                    // '--success-bg': '#059669',
                    // '--success-text': '#ffffff',
                    // '--success-border': '#059669',

                    // Warna untuk Error
                    '--error-bg': '#ef4444',
                    '--error-text': '#ffffff',
                    '--error-border': '#ef4444',

                    display: 'flex',
                    justifyContent: 'center',
                    textAlign: 'center',
                } as React.CSSProperties,
            }}
        />
    </AppLayoutTemplate>
);
