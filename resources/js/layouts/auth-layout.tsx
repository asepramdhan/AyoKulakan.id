import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { Toaster } from 'react-hot-toast';

export default function AuthLayout({
    children,
    title,
    description,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <AuthLayoutTemplate title={title} description={description} {...props}>
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
        </AuthLayoutTemplate>
    );
}
