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
                className: "group",
                style: {
                    // --- WARNA LOADING (Vibrant Orange dengan Glass Effect) ---
                    '--normal-bg': 'rgba(234, 88, 12, 83%)', // Orange-600 dengan sedikit transparansi
                    '--normal-text': '#ffffff',
                    // '--normal-border': '#EA580C',
                    '--normal-border': 'rgba(234, 88, 12, 85%)',

                    // --- WARNA SUKSES (Solid & Clean) ---
                    '--success-bg': '#EA580C',
                    '--success-text': '#ffffff',
                    '--success-border': '#EA580C',

                    // --- WARNA ERROR ---
                    '--error-bg': '#ef4444',
                    '--error-text': '#ffffff',
                    '--error-border': '#ef4444',

                    display: 'flex',
                    justifyContent: 'center',
                    textAlign: 'center',
                    backdropFilter: 'blur(8px)', // Membuat efek blur di belakang toast
                    boxShadow: '0 20px 25px -5px rgba(234, 88, 12, 20%)', // Shadow berwarna orange lembut
                    borderRadius: '12px',
                    padding: '12px 24px',
                    fontWeight: '600',
                } as React.CSSProperties,
            }}
        />
    </AppLayoutTemplate>
);
