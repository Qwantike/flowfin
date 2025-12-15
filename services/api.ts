import { Transaction, Asset } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export const api = {
    auth: {
        login: async (email: string, password: string) => {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) throw new Error((await res.json()).message || 'Erreur login');
            return res.json();
        },
        register: async (email: string, password: string) => {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) throw new Error((await res.json()).message || 'Erreur inscription');
            return res.json();
        },
        changePassword: async (currentPassword: string, newPassword: string) => {
            const res = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ currentPassword, newPassword })
            });
            if (!res.ok) throw new Error((await res.json()).message || 'Erreur changement mot de passe');
            return res.json();
        }

    },
    transactions: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/transactions`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Erreur chargement transactions');
            const data = await res.json();
            // Defensive normalization: ensure amount is number and label defaults
            return data.map((t: any) => ({
                ...t,
                amount: t.amount !== undefined && t.amount !== null ? Number(t.amount) : 0,
                label: t.label || 'Perso'
            }));
        },
        add: async (transactions: Omit<Transaction, 'id'>[]) => {
            const res = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(transactions)
            });
            if (!res.ok) throw new Error('Erreur ajout transactions');
            return res.json();
        },
        delete: async (id: string) => {
            const res = await fetch(`${API_URL}/transactions/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Erreur suppression transaction');
            return res.json();
        }
    },
    assets: {
        getAll: async () => {
            const res = await fetch(`${API_URL}/assets`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Erreur chargement patrimoine');
            return res.json();
        },
        add: async (asset: Omit<Asset, 'id'>) => {
            const res = await fetch(`${API_URL}/assets`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(asset)
            });
            if (!res.ok) throw new Error('Erreur ajout actif');
            return res.json();
        },
        delete: async (id: string) => {
            const res = await fetch(`${API_URL}/assets/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Erreur suppression actif');
            return res.json();
        }
    },
    currentAccount: {
        get: async () => {
            const res = await fetch(`${API_URL}/current-account`, { headers: getHeaders() });
            if (!res.ok) throw new Error('Erreur chargement compte courant');
            return res.json();
        },
        manualUpdate: async (balance: number) => {
            const res = await fetch(`${API_URL}/current-account/manual`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ balance })
            });
            if (!res.ok) throw new Error('Erreur mise à jour manuelle');
            return res.json();
        },
        autoUpdate: async () => {
            const res = await fetch(`${API_URL}/current-account/auto`, {
                method: 'POST',
                headers: getHeaders()
            });
            if (!res.ok) throw new Error('Erreur mise à jour automatique');
            return res.json();
        }
    }
};
