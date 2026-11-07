import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import prisma from './lib/prisma';

const app = express()
const port = process.env.PORT || 3000

// ─────────────────────────────────────────────
// Konstanta cookie
// ─────────────────────────────────────────────
const COOKIE_NAME = 'userId'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000   // 7 hari (ms)

// ─────────────────────────────────────────────
// Middleware global
// ─────────────────────────────────────────────
app.use(express.json())
app.use(cookieParser())

// ─────────────────────────────────────────────
// Middleware: requireUser
// ─────────────────────────────────────────────
interface AuthedRequest extends Request {
    user?: { id: string; nama: string }
}

async function requireUser(req: AuthedRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.cookies?.[COOKIE_NAME]
        if (!userId) {
            return res.status(401).json({ message: "Silakan login dulu" })
        }

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
            res.clearCookie(COOKIE_NAME, { path: '/' })
            return res.status(401).json({ message: "Sesi tidak valid, login ulang" })
        }

        req.user = { id: user.id, nama: user.nama }
        next()
    } catch (error) {
        console.error("Error requireUser:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}

// ─────────────────────────────────────────────
// GET /
// ─────────────────────────────────────────────
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})

// ─────────────────────────────────────────────
// GET /stock — "satu view paling update" per barang
// Dipakai user untuk memilih mana yang mau diupdate
// ─────────────────────────────────────────────
app.get('/stock', async (req: Request, res: Response) => {
    try {
        const barangs = await prisma.barang.findMany({
            orderBy: { nama: 'asc' },
            include: {
                movements: {
                    orderBy: { tanggal: 'desc' },
                    take: 1,
                    include: {
                        penanggungJawab: { select: { nama: true } }
                    }
                }
            }
        })

        const data = barangs.map(b => {
            const last = b.movements[0]
            return {
                id: b.id,
                nama: b.nama,
                stok: b.stok,
                updateTerakhir: last ? {
                    tipe: last.tipe,
                    jumlah: last.jumlah,
                    stokSebelum: last.stokSebelum,
                    stokSesudah: last.stokSesudah,
                    tanggal: last.tanggal,
                    penanggungJawab: last.penanggungJawab.nama,
                } : null
            }
        })

        return res.status(200).json({ message: "Berhasil", data })

    } catch (error) {
        console.error("Error /stock:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
})

// ─────────────────────────────────────────────
// GET /history — semua pergerakan (global), terbaru dulu
// ─────────────────────────────────────────────
app.get('/history', async (req: Request, res: Response) => {
    try {
        const data = await prisma.stockMovement.findMany({
            orderBy: { tanggal: 'desc' },
            include: {
                barang: { select: { nama: true, stok: true } },
                penanggungJawab: { select: { nama: true } }
            }
        })

        return res.status(200).json({
            message: data.length < 1 ? "Belum ada data" : "Berhasil",
            data
        })

    } catch (error) {
        console.error("Error /history:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
})

// ─────────────────────────────────────────────
// GET /stock/:id/history — history per barang
// ─────────────────────────────────────────────
app.get('/stock/:id/history', async (req: Request, res: Response) => {
    try {
        const { id } = req.params as { id: string }

        if (!id) {
            return res.status(400).json({ message: "ID barang wajib diisi" })
        }

        const barang = await prisma.barang.findUnique({ where: { id } })
        if (!barang) return res.status(404).json({ message: "Barang tidak ditemukan" })

        const movements = await prisma.stockMovement.findMany({
            where: { idBarang: id },
            orderBy: { tanggal: 'desc' },
            include: { penanggungJawab: { select: { nama: true } } }
        })

        return res.status(200).json({
            message: "Berhasil",
            data: {
                barang: { id: barang.id, nama: barang.nama, stok: barang.stok },
                movements
            }
        })

    } catch (error) {
        console.error("Error /stock/:id/history:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
})

// ─────────────────────────────────────────────
// POST /input — buat barang baru + catat movement INISIALISASI
// User diambil dari cookie (requireUser)
// ─────────────────────────────────────────────
interface BarangInput {
    nama: string
    stok?: number
}

app.post('/input', requireUser, async (req: AuthedRequest, res: Response) => {
    try {
        const { nama, stok }: BarangInput = req.body
        const userId = req.user!.id

        if (!nama) return res.status(400).json({ message: "Nama barang wajib diisi" })

        const stokAwal = stok ?? 0
        if (!Number.isInteger(stokAwal) || stokAwal < 0) {
            return res.status(400).json({ message: "Stok harus bilangan bulat >= 0" })
        }

        await prisma.$transaction(async (tx) => {
            const barang = await tx.barang.create({
                data: { nama, stok: stokAwal, inputOlehId: userId }
            })

            // Kalau stok awal > 0, catat sebagai movement INISIALISASI
            if (stokAwal > 0) {
                await tx.stockMovement.create({
                    data: {
                        idBarang: barang.id,
                        tipe: "INISIALISASI",
                        jumlah: stokAwal,
                        stokSebelum: 0,
                        stokSesudah: stokAwal,
                        penanggungJawabId: userId,
                    }
                })
            }
        })

        return res.status(200).json({ message: "Berhasil input barang" })

    } catch (error) {
        console.error("Error /input:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
})

// ─────────────────────────────────────────────
// POST /update
// User diambil dari cookie (requireUser)
// ─────────────────────────────────────────────
interface UpdateInput {
    id: string                  // id Barang
    jumlah: number
    keterangan: string          // "PEMAKAIAN" | "RESTOCK"
}

app.post('/update', requireUser, async (req: AuthedRequest, res: Response) => {
    try {
        const { id, jumlah, keterangan }: UpdateInput = req.body
        const userId = req.user!.id

        // ── Validasi ──
        if (!id || !jumlah || !keterangan) {
            return res.status(400).json({ message: "Input tidak lengkap" })
        }
        if (keterangan !== "PEMAKAIAN" && keterangan !== "RESTOCK") {
            return res.status(400).json({ message: "Keterangan harus 'PEMAKAIAN' atau 'RESTOCK'" })
        }

        const jumlahInt = Number(jumlah)
        if (!Number.isInteger(jumlahInt) || jumlahInt <= 0) {
            return res.status(400).json({ message: "Jumlah harus bilangan bulat > 0" })
        }

        // ── Tentukan arah ──
        const signedAmount = keterangan === "PEMAKAIAN" ? -jumlahInt : jumlahInt

        // ── Ambil state saat ini ──
        const barang = await prisma.barang.findUnique({ where: { id } })
        if (!barang) return res.status(404).json({ message: "Barang tidak ditemukan" })

        const stokSebelum = barang.stok
        const stokSesudah = stokSebelum + signedAmount

        if (stokSesudah < 0) {
            return res.status(400).json({
                message: `Stok tidak cukup. Stok saat ini: ${stokSebelum}, diminta: ${jumlahInt}`
            })
        }

        // ── Transaksi: 2 operasi atomik ──
        await prisma.$transaction(async (tx) => {
            await tx.barang.update({
                where: { id },
                data: { stok: stokSesudah }
            })

            await tx.stockMovement.create({
                data: {
                    idBarang: id,
                    tipe: keterangan,
                    jumlah: jumlahInt,
                    stokSebelum,
                    stokSesudah,
                    penanggungJawabId: userId,
                }
            })
        })

        return res.status(200).json({
            message: "Berhasil update stok",
            data: { stokSebelum, stokSesudah }
        })

    } catch (error) {
        console.error("Error /update:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
})

// ─────────────────────────────────────────────
// POST /login
// ─────────────────────────────────────────────
app.post('/login', async (req: Request, res: Response) => {
    try {
        const { nama } = req.body

        if (!nama || typeof nama !== 'string' || nama.trim() === '') {
            return res.status(400).json({ message: "Nama wajib diisi" })
        }

        const trimmedNama = nama.trim()

        // findFirst karena `nama` di schema tidak @unique
        let user = await prisma.user.findFirst({ where: { nama: trimmedNama } })
        if (!user) {
            user = await prisma.user.create({ data: { nama: trimmedNama } })
        }

        res.cookie(COOKIE_NAME, user.id, {
            maxAge: COOKIE_MAX_AGE,
            httpOnly: true,
            sameSite: 'lax',
            secure: false,     // ganti true jika pakai HTTPS
            path: '/',
        })

        return res.status(200).json({
            message: "Login berhasil",
            data: { id: user.id, nama: user.nama }
        })

    } catch (error) {
        console.error("Error /login:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
})

// ─────────────────────────────────────────────
// GET /me — cek sesi aktif
// ─────────────────────────────────────────────
app.get('/me', async (req: Request, res: Response) => {
    try {
        const userId = req.cookies?.[COOKIE_NAME]
        if (!userId) {
            return res.status(401).json({ message: "Belum login" })
        }

        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) {
            res.clearCookie(COOKIE_NAME, { path: '/' })
            return res.status(401).json({ message: "Sesi tidak valid, silakan login ulang" })
        }

        return res.status(200).json({ data: { id: user.id, nama: user.nama } })

    } catch (error) {
        console.error("Error /me:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
})

// ─────────────────────────────────────────────
// POST /logout
// ─────────────────────────────────────────────
app.post('/logout', (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { path: '/' })
    return res.status(200).json({ message: "Logout berhasil" })
})

// ─────────────────────────────────────────────
// Fallback 404
// ─────────────────────────────────────────────
app.use((req: Request, res: Response) => {
    res.status(404).json({ message: "Endpoint tidak ditemukan" })
})

// ─────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────
app.listen(port, () => {
    console.log(`Server listening on port ${port}`)
})