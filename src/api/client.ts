// src/api/client.ts
const BASE = '/api'  // melalui Vite proxy

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',  // tetap sertakan untuk jaga-jaga
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Request gagal')
  return data
}

// ── Auth ──
export const login = (nama: string) =>
  request<{ data: { id: string; nama: string } }>('/login', {
    method: 'POST',
    body: JSON.stringify({ nama }),
  })

export const getMe = () => request<{ data: { id: string; nama: string } }>('/me')

export const logout = () =>
  request<{ message: string }>('/logout', { method: 'POST' })

// ── Stock ──
export interface StockItem {
  id: string
  nama: string
  stok: number
  updateTerakhir: {
    tipe: string
    jumlah: number
    stokSebelum: number
    stokSesudah: number
    tanggal: string
    penanggungJawab: string
  } | null
}

export const getStock = () =>
  request<{ data: StockItem[] }>('/stock').then(r => r.data)

export const getHistory = (idBarang: string) =>
  request<{ data: { barang: { id: string; nama: string; stok: number }; movements: any[] } }>(
    `/stock/${idBarang}/history`
  ).then(r => r.data)

export const updateStock = (payload: {
  id: string
  jumlah: number
  keterangan: 'PEMAKAIAN' | 'RESTOCK'
}) =>
  request<{ data: { stokSebelum: number; stokSesudah: number } }>('/update', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const inputBarang = (payload: { nama: string; stok?: number }) =>
  request<{ message: string }>('/input', {
    method: 'POST',
    body: JSON.stringify(payload),
  })