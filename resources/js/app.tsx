import '../css/app.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import toast from 'react-hot-toast';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Event Listener untuk Toast Global
// --- LOGIC TOAST GLOBAL ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let loaderTimer: any;
let startTime: number;

// Style Dasar (Base Style) agar konsisten
const miniPillStyle = {
    borderRadius: '50px',
    fontSize: '11px',
    padding: '4px 12px',
    fontWeight: 'bold' as const,
    animation: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
};

router.on('start', (event) => {
    // CEK KONEKSI SAAT NAVIGASI
    if (!navigator.onLine) {
        event.preventDefault();
        showOfflineToast();
        return;
    }

    if (event.detail.visit.method === 'get') {
        startTime = Date.now();
        loaderTimer = setTimeout(() => {
            toast.loading('Memuat...', {
                id: 'global-loader',
                position: 'bottom-right',
                style: {
                    ...miniPillStyle,
                    border: '1px solid #EA580C',
                    color: '#EA580C',
                    background: '#FFFAEE',
                    boxShadow: '0 4px 10px rgba(234, 88, 12, 0.15)',
                },
                duration: Infinity,
            });
        }, 300);
    }
});

router.on('finish', () => {
    const duration = Date.now() - startTime;
    const minDuration = 800;

    const hideLoader = () => {
        clearTimeout(loaderTimer);
        toast.dismiss('global-loader');
    };

    if (duration < minDuration) {
        setTimeout(hideLoader, minDuration - duration);
    } else {
        hideLoader();
    }
});

// --- LOGIC KONEKSI INTERNET ---

const showOfflineToast = () => {
    toast.error('Offline - Periksa koneksi', {
        id: 'connection-status',
        duration: Infinity,
        position: 'bottom-right',
        style: {
            ...miniPillStyle,
            border: '1px solid #ef4444', // Merah Error
            color: '#ef4444',
            background: '#fef2f2',
            boxShadow: '0 4px 10px rgba(239, 68, 68, 0.15)',
        },
    });
};

const handleConnection = () => {
    if (navigator.onLine) {
        toast.success('Online', {
            id: 'connection-status',
            duration: 2000,
            position: 'bottom-right',
            style: {
                ...miniPillStyle,
                border: '1px solid #22c55e', // Hijau Sukses
                color: '#22c55e',
                background: '#f0fdf4',
                boxShadow: '0 4px 10px rgba(34, 197, 94, 0.15)',
            }
        });
    } else {
        showOfflineToast();
    }
};

// Listener Offline/Online
window.addEventListener('online', handleConnection);
window.addEventListener('offline', handleConnection);

// --- INISIALISASI INERTIA ---

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: false,
    // progress: {
    //     color: '#D7942D',
    // },
});

// This will set light / dark mode on load...
initializeTheme();
