import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import "./App.css";
import { StockTable, type StockData } from "./components/Table";
import { StockHistoryTable, type StockHistoryLog } from "./components/History";
import { LowStockTable, type LowStockData } from "./components/LowStock";
import { UpdateStockForm, type StockUpdatePayload } from "./components/Update";

// ─────────────────────────────────────────────
// API layer (via Vite proxy: /api → localhost:3000)
// ─────────────────────────────────────────────
const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request gagal");
  return data;
}

interface User {
  id: string;
  nama: string;
}

interface StockMovement {
  id: string;
  tipe: string;
  jumlah: number;
  stokSebelum: number;
  stokSesudah: number;
  tanggal: string;
  penanggungJawab: { nama: string };
  barang?: { nama: string; stok: number };
}

interface StockItem {
  id: string;
  nama: string;
  stok: number;
  updateTerakhir: {
    tipe: string;
    jumlah: number;
    stokSebelum: number;
    stokSesudah: number;
    tanggal: string;
    penanggungJawab: string;
  } | null;
}

const api = {
  getMe: () => request<{ data: User }>("/me"),
  login: (nama: string) =>
    request<{ data: User }>("/login", {
      method: "POST",
      body: JSON.stringify({ nama }),
    }),
  logout: () => request<{ message: string }>("/logout", { method: "POST" }),
  getStock: () => request<{ data: StockItem[] }>("/stock").then((r) => r.data),
  getAllHistory: () =>
    request<{ data: StockMovement[] }>("/history").then((r) => r.data),
  updateStock: (payload: {
    id: string;
    jumlah: number;
    keterangan: "PEMAKAIAN" | "RESTOCK";
  }) =>
    request<{ data: { stokSebelum: number; stokSesudah: number } }>("/update", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// Ambang batas stok dianggap "menipis"
const LOW_STOCK_THRESHOLD = 3;

// ─────────────────────────────────────────────
// Adapters: API model → tipe komponen tabel
// ─────────────────────────────────────────────
function toStockData(items: StockItem[]): StockData[] {
  return items.map((it, i) => ({
    no: i + 1,
    namaBarang: it.nama,
    jumlahStok: it.stok,
    jumlahPemakaianPenambahan: it.updateTerakhir?.jumlah ?? 0,
    tanggalUpdate: it.updateTerakhir?.tanggal?.slice(0, 10) ?? "-",
    keterangan: it.updateTerakhir?.tipe ?? "-",
    penanggungJawab: it.updateTerakhir?.penanggungJawab ?? "-",
    jumlahStokTerakhir: it.updateTerakhir?.stokSesudah ?? it.stok,
    tanggalUpdateTerakhir: it.updateTerakhir?.tanggal?.slice(0, 10) ?? "-",
  }));
}

function toLowStockData(items: StockItem[]): LowStockData[] {
  return items
    .filter((it) => it.stok <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stok - b.stok)
    .map((it, i) => ({
      no: i + 1,
      namaBarang: it.nama,
      jumlahStok: it.stok,
      tanggalPemakaianTerakhir: it.updateTerakhir?.tanggal?.slice(0, 10) ?? "-",
    }));
}

function toHistoryLogs(movements: StockMovement[]): StockHistoryLog[] {
  return movements.map((m, i) => ({
    id: i + 1,
    no: i + 1,
    namaBarang: m.barang?.nama ?? "-",
    tanggal: m.tanggal,
    keterangan: m.tipe,
    jumlah: m.tipe === "PEMAKAIAN" ? -m.jumlah : m.jumlah,
    penanggungJawab: m.penanggungJawab?.nama ?? "-",
    stokSetelahUpdate: m.stokSesudah,
    stokSebelumUpdate: m.stokSebelum,
  }));
}

// ─────────────────────────────────────────────
// Login form
// ─────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: (u: User) => void }) {
  const [nama, setNama] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErr("Nama wajib diisi");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const r = await api.login(nama.trim());
      onLogin(r.data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "80px auto",
        padding: 24,
        border: "1px solid #ddd",
        borderRadius: 8,
      }}
    >
      <h2 style={{ marginBottom: 16 }}>Login Stok Pantry</h2>
      <form
        onSubmit={submit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <label>
          Nama kamu
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Masukkan nama"
            style={{ width: "100%", padding: 8, marginTop: 4 }}
            autoFocus
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 16px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Memuat..." : "Masuk"}
        </button>
        {err && <p style={{ color: "red", margin: 0 }}>{err}</p>}
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [historyLogs, setHistoryLogs] = useState<StockHistoryLog[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Cek sesi saat mount (cookie 7 hari)
  useEffect(() => {
    api
      .getMe()
      .then((r) => setUser(r.data))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  // 2. Ambil data stok + history saat user login
  useEffect(() => {
    if (user) refreshAll();
  }, [user]);

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [stocks, histories] = await Promise.all([
        api.getStock(),
        api.getAllHistory(),
      ]);
      setStockItems(stocks);
      setHistoryLogs(toHistoryLogs(histories));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout().catch(() => {});
    setUser(null);
    setStockItems([]);
    setHistoryLogs([]);
  };

  // 3. Submit form update stok
  const handleStockUpdateSubmit = async (data: StockUpdatePayload) => {
    const barang = stockItems.find((s) => s.nama === data.namaBarang);
    if (!barang) {
      alert("Barang tidak ditemukan");
      return;
    }

    // Normalisasi label form ke format backend
    const keterangan: "PEMAKAIAN" | "RESTOCK" = data.keterangan
      .toLowerCase()
      .includes("pakai")
      ? "PEMAKAIAN"
      : "RESTOCK";

    try {
      await api.updateStock({
        id: barang.id,
        jumlah: data.jumlahUpdate,
        keterangan,
      });
      await refreshAll();
      alert(
        `Update Stok Berhasil:\nBarang: ${data.namaBarang}\nTipe: ${keterangan}\nJumlah: ${data.jumlahUpdate}`,
      );
    } catch (e: any) {
      alert(`Gagal update: ${e.message}`);
    }
  };

  // ── Render guards ──
  if (!authChecked) return <p style={{ padding: 24 }}>Memuat...</p>;
  if (!user) return <LoginForm onLogin={setUser} />;

  const itemNames = stockItems.map((i) => i.nama);
  const stockTableData = toStockData(stockItems);
  const lowStockData = toLowStockData(stockItems);

  return (
    <BrowserRouter>
      <section className="navigation-section">
        <nav className="nav-link">
          <NavLink
            to="/stok"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            Data Stok Pantry
          </NavLink>
          <NavLink
            to="/update"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            Update Stok
          </NavLink>
          <NavLink
            to="/riwayat"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            Riwayat Penggunaan
          </NavLink>
          <NavLink
            to="/stok-habis"
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            Stok Pantry Habis/Kosong
          </NavLink>
        </nav>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginLeft: "auto",
          }}
        >
          <span style={{ fontSize: 14 }}>
            Login sebagai: <strong>{user.nama}</strong>
          </span>
          <button
            onClick={handleLogout}
            style={{ padding: "6px 12px", cursor: "pointer" }}
          >
            Logout
          </button>
        </div>
      </section>

      <hr className="divider" />

      <main style={{ padding: "24px" }}>
        {loading && <p style={{ marginBottom: 12 }}>Memuat data...</p>}
        <Routes>
          <Route path="/" element={<Navigate to="/stok" replace />} />
          <Route
            path="/stok"
            element={
              <section className="data-section">
                <h2 className="title-data-stok">Data Stok Pantry</h2>
                <StockTable data={stockTableData} />
              </section>
            }
          />
          <Route
            path="/update"
            element={
              <section className="update-section">
                <h2 style={{ marginBottom: "24px" }}>
                  Form Update Stok Pantry
                </h2>
                <UpdateStockForm
                  itemList={itemNames}
                  onSubmit={handleStockUpdateSubmit}
                />
              </section>
            }
          />
          <Route
            path="/riwayat"
            element={
              <section className="history-data">
                <h2>Riwayat Penggunaan Stok Pantry</h2>
                <StockHistoryTable data={historyLogs} />
              </section>
            }
          />
          <Route
            path="/stok-habis"
            element={
              <section className="lowstock-data">
                <h2>Daftar Stok Habis & Menipis</h2>
                <LowStockTable data={lowStockData} />
              </section>
            }
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;