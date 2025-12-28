import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Gagang Tas */}
            <path
                d="M13 12C13 8.13401 16.134 5 20 5C23.866 5 27 8.13401 27 12V14H13V12Z"
                stroke="currentColor"
                strokeWidth="2.5"
            />
            {/* Badan Tas */}
            <rect
                x="8" y="13" width="24" height="22" rx="3"
                fill="currentColor"
            />
            {/* Aksen Huruf 'A' kecil di tengah (Opsional) */}
            <path
                d="M17 28L20 21L23 28M18.5 25H21.5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}