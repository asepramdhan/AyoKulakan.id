// import { Toaster } from '@/components/ui/sonner';
import { Toaster } from 'react-hot-toast';
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
            toastOptions={{
                style: {
                    border: '1px solid #EA580C',
                    borderRadius: '50px',
                    color: '#EA580C',
                },
                iconTheme: {
                    primary: '#EA580C',
                    secondary: '#FFFAEE',
                },
            }}
        />
    </AppLayoutTemplate>
);
