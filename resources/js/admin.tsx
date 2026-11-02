
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AdminApp from './admin/AdminApp';
import '../css/admin.css';

const rootElement = document.getElementById('admin-app');

if (rootElement) {
    createRoot(rootElement).render(
        <StrictMode>
            <AdminApp />
        </StrictMode>,
    );
}
