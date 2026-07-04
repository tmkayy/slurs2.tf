import axios from 'axios';
import type { PlayerDetail, PlayerSummary } from '../types';

const client = axios.create({
    baseURL: 'http://localhost:5117/api',
});

export const getLeaderboard = () =>
    client.get<PlayerSummary[]>('/players').then(r=>r.data);

export const getPlayer = (steamId: string) =>
    client.get<PlayerDetail>(`/players/${steamId}`).then(r => r.data);

export const scanPlayer = (steamId: string) =>
    client.post(`/players/${steamId}/scan`).then(r => r.data);