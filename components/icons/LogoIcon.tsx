
import React from 'react';

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 9.65991V4.5C8 4.22386 8.22386 4 8.5 4H14.5C14.7761 4 15 4.22386 15 4.5V9.65991C15 9.80993 14.9398 9.95304 14.8344 10.0573L12.3344 12.5312C12.1524 12.7118 11.8476 12.7118 11.6656 12.5312L9.16565 10.0573C9.06021 9.95304 9 9.80993 9 9.65991" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 14.3401V19.5C15 19.7761 14.7761 20 14.5 20H8.5C8.22386 20 8 19.7761 8 19.5V14.3401C8 14.1901 8.06021 14.047 8.16565 13.9427L10.6656 11.4688C10.8476 11.2882 11.1524 11.2882 11.3344 11.4688L13.8344 13.9427C13.9398 14.047 14 14.1901 14 14.3401" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export default LogoIcon;
