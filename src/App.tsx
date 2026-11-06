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

const pantryData: StockData[] = [
  {
    no: 1,
    namaBarang: "Tisu wastafel Lt 1",
    jumlahStok: 14,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "Lokasi Lt 1",
    penanggungJawab: "-",
    jumlahStokTerakhir: 14,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 2,
    namaBarang: "Tisu wastafel Lt 2",
    jumlahStok: 16,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "Lokasi Lt 2",
    penanggungJawab: "-",
    jumlahStokTerakhir: 16,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 3,
    namaBarang: "Tisu toilet Lt 1",
    jumlahStok: 29,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "Lokasi Lt 1",
    penanggungJawab: "-",
    jumlahStokTerakhir: 29,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 4,
    namaBarang: "Tisu toilet Lt 2",
    jumlahStok: 8,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "Lokasi Lt 2",
    penanggungJawab: "-",
    jumlahStokTerakhir: 8,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 5,
    namaBarang: "Gula",
    jumlahStok: 3,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 3,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 6,
    namaBarang: "Jahe manis",
    jumlahStok: 5,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 5,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 7,
    namaBarang: "Jahe tawar",
    jumlahStok: 2,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 2,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 8,
    namaBarang: "Teh",
    jumlahStok: 13,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 13,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 9,
    namaBarang: "Liquid elektrik (obat nyamuk)",
    jumlahStok: 5,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 5,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 10,
    namaBarang: "Galon",
    jumlahStok: 16,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 16,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 11,
    namaBarang: "Detergen",
    jumlahStok: 3,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 3,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 12,
    namaBarang: "Spon Cuci",
    jumlahStok: 3,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 3,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 13,
    namaBarang: "Bayclin",
    jumlahStok: 2,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 2,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 14,
    namaBarang: "Bagus fresh",
    jumlahStok: 3,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "Ruang Executive/VIP",
    penanggungJawab: "-",
    jumlahStokTerakhir: 3,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 15,
    namaBarang: "Vixal",
    jumlahStok: 1,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 1,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 16,
    namaBarang: "Eco enzim",
    jumlahStok: 1,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 1,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 17,
    namaBarang: "Sabun cuci piring",
    jumlahStok: 1,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 1,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 18,
    namaBarang: "Kamper",
    jumlahStok: 7,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 7,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 19,
    namaBarang: "Bagus lemari",
    jumlahStok: 5,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 5,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 20,
    namaBarang: "Trika",
    jumlahStok: 1,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 1,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 21,
    namaBarang: "Karbol",
    jumlahStok: 1,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 1,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 22,
    namaBarang: "Handwash",
    jumlahStok: 1,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "-",
    penanggungJawab: "-",
    jumlahStokTerakhir: 1,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 23,
    namaBarang: "Molto",
    jumlahStok: 0,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "Kosong / Mau Habis",
    penanggungJawab: "-",
    jumlahStokTerakhir: 0,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 24,
    namaBarang: "Baygon semprot",
    jumlahStok: 0,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "Kosong / Mau Habis",
    penanggungJawab: "-",
    jumlahStokTerakhir: 0,
    tanggalUpdateTerakhir: "2026-11-06",
  },
  {
    no: 25,
    namaBarang: "Cream massage",
    jumlahStok: 0,
    jumlahPemakaianPenambahan: 0,
    tanggalUpdate: "2026-11-06",
    keterangan: "Kosong / Mau Habis",
    penanggungJawab: "-",
    jumlahStokTerakhir: 0,
    tanggalUpdateTerakhir: "2026-11-06",
  },
];

const mockHistoryData: StockHistoryLog[] = [
  {
    id: 101,
    no: 1,
    namaBarang: "Tisu toilet Lt 1",
    tanggal: "2026-11-06 08:15",
    keterangan: "Pemakaian rutin toilet Lt 1 (Sesi Pagi)",
    jumlah: -2,
    penanggungJawab: "Budi",
    stokSetelahUpdate: 29,
    stokSebelumUpdate: 31,
  },
  {
    id: 102,
    no: 2,
    namaBarang: "Galon",
    tanggal: "2026-11-06 09:00",
    keterangan: "Restock galon dari vendor",
    jumlah: 10,
    penanggungJawab: "Eko",
    stokSetelahUpdate: 17,
    stokSebelumUpdate: 7,
  },
  {
    id: 103,
    no: 3,
    namaBarang: "Tisu wastafel Lt 2",
    tanggal: "2026-11-06 10:30",
    keterangan: "Refill dispenser wastafel Lt 2",
    jumlah: -1,
    penanggungJawab: "Siti",
    stokSetelahUpdate: 16,
    stokSebelumUpdate: 17,
  },
  {
    id: 104,
    no: 4,
    namaBarang: "Molto",
    tanggal: "2026-11-06 11:10",
    keterangan: "Pemakaian sachet terakhir (Stok Habis)",
    jumlah: -1,
    penanggungJawab: "Siti",
    stokSetelahUpdate: 0,
    stokSebelumUpdate: 1,
  },
  {
    id: 105,
    no: 5,
    namaBarang: "Tisu toilet Lt 1",
    tanggal: "2026-11-06 14:45",
    keterangan: "Ganti roll tambahan toilet Lt 1",
    jumlah: -1,
    penanggungJawab: "Budi",
    stokSetelahUpdate: 28,
    stokSebelumUpdate: 29,
  },
  {
    id: 106,
    no: 6,
    namaBarang: "Galon",
    tanggal: "2026-11-06 15:20",
    keterangan: "Pasang dispenser Lt 1",
    jumlah: -1,
    penanggungJawab: "Eko",
    stokSetelahUpdate: 16,
    stokSebelumUpdate: 17,
  },
  {
    id: 107,
    no: 7,
    namaBarang: "Teh",
    tanggal: "2026-11-05 16:00",
    keterangan: "Pemakaian untuk rapat sore",
    jumlah: -2,
    penanggungJawab: "Budi",
    stokSetelahUpdate: 13,
    stokSebelumUpdate: 15,
  },
];

const mockLowStockData: LowStockData[] = [
  {
    no: 1,
    namaBarang: "Molto",
    jumlahStok: 0,
    tanggalPemakaianTerakhir: "2026-11-06",
  },
  {
    no: 2,
    namaBarang: "Baygon semprot",
    jumlahStok: 0,
    tanggalPemakaianTerakhir: "2026-11-06",
  },
  {
    no: 3,
    namaBarang: "Cream massage",
    jumlahStok: 0,
    tanggalPemakaianTerakhir: "2026-11-06",
  },
  {
    no: 4,
    namaBarang: "Vixal",
    jumlahStok: 1,
    tanggalPemakaianTerakhir: "2026-11-05",
  },
  {
    no: 5,
    namaBarang: "Eco enzim",
    jumlahStok: 1,
    tanggalPemakaianTerakhir: "2026-11-04",
  },
  {
    no: 6,
    namaBarang: "Sabun cuci piring",
    jumlahStok: 1,
    tanggalPemakaianTerakhir: "2026-11-06",
  },
  {
    no: 7,
    namaBarang: "Trika",
    jumlahStok: 1,
    tanggalPemakaianTerakhir: "2026-11-03",
  },
  {
    no: 8,
    namaBarang: "Karbol",
    jumlahStok: 1,
    tanggalPemakaianTerakhir: "2026-11-05",
  },
  {
    no: 9,
    namaBarang: "Handwash",
    jumlahStok: 1,
    tanggalPemakaianTerakhir: "2026-11-06",
  },
  {
    no: 10,
    namaBarang: "Jahe tawar",
    jumlahStok: 2,
    tanggalPemakaianTerakhir: "2026-11-06",
  },
  {
    no: 11,
    namaBarang: "Bayclin",
    jumlahStok: 2,
    tanggalPemakaianTerakhir: "2026-11-02",
  },
];

function App() {
  const itemNames = pantryData.map((item) => item.namaBarang);

  const handleStockUpdateSubmit = (data: StockUpdatePayload) => {
    console.log("Payload dikirim ke backend:", data);
    alert(
      `Update Stok Berhasil:\nBarang: ${data.namaBarang}\nTipe: ${data.keterangan}\nJumlah: ${data.jumlahUpdate}`,
    );
  };

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
      </section>

      <hr className="divider" />

      <main style={{ padding: "24px" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/stok" replace />} />
          <Route
            path="/stok"
            element={
              <section className="data-section">
                <h2 className="title-data-stok">Data Stok Pantry</h2>
                <StockTable data={pantryData} />
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
                <StockHistoryTable data={mockHistoryData} />
              </section>
            }
          />
          <Route
            path="/stok-habis"
            element={
              <section className="lowstock-data">
                <h2>Daftar Stok Habis & Menipis</h2>
                <LowStockTable data={mockLowStockData} />
              </section>
            }
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
