import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import prisma from './lib/prisma'

const port = Number(process.env.PORT) || 3000

// ─────────────────────────────────────────────
// Konstanta cookie
// ─────────────────────────────────────────────
const COOKIE_NAME = 'userId'
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60 // 7 hari (detik)

// ─────────────────────────────────────────────
// Auth plugin: derive user dari cookie + guard
// Meniru middleware `requireUser` di Express
// ─────────────────────────────────────────────
const auth = new Elysia({ name: 'auth' })
  .derive(async ({ cookie }) => {
    const userId = cookie[COOKIE_NAME]?.value as string | undefined
    let user: { id: string; nama: string } | null = null

    if (userId) {
      const found = await prisma.user.findUnique({ where: { id: userId } })
      if (found) user = { id: found.id, nama: found.nama }
    }
    return { user, userId }
  })
  .onBeforeHandle(({ user, userId, status, cookie }) => {
    if (!userId) {
      return status(401, { message: 'Silakan login dulu' })
    }
    if (!user) {
      cookie[COOKIE_NAME]?.remove()
      return status(401, { message: 'Sesi tidak valid, login ulang' })
    }
  })

// ─────────────────────────────────────────────
// Route yang butuh auth
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Route yang butuh auth
// derive di-inline agar tipenya ter-propagate
// ─────────────────────────────────────────────
const protectedRoutes = new Elysia()
  .derive(
    async ({
      cookie,
    }): Promise<{
      user: { id: string; nama: string } | null
      userId: string | undefined
    }> => {
      const userId = cookie[COOKIE_NAME]?.value as string | undefined
      let user: { id: string; nama: string } | null = null

      if (userId) {
        const found = await prisma.user.findUnique({ where: { id: userId } })
        if (found) user = { id: found.id, nama: found.nama }
      }

      return { user, userId }
    }
  )
  .onBeforeHandle(({ user, userId, status, cookie }) => {
    if (!userId) {
      return status(401, { message: 'Silakan login dulu' })
    }
    if (!user) {
      cookie[COOKIE_NAME]?.remove()
      return status(401, { message: 'Sesi tidak valid, login ulang' })
    }
  })

  // POST /input ───────────────────────────────
  .post('/input', async ({ body, user, status }) => {
    try {
      const { nama, stok } = body as { nama: string; stok?: number }
      const userId = user!.id

      if (!nama) return status(400, { message: 'Nama barang wajib diisi' })

      const stokAwal = stok ?? 0
      if (!Number.isInteger(stokAwal) || stokAwal < 0) {
        return status(400, { message: 'Stok harus bilangan bulat >= 0' })
      }

      await prisma.$transaction(async (tx) => {
        const barang = await tx.barang.create({
          data: { nama, stok: stokAwal, inputOlehId: userId }
        })
        if (stokAwal > 0) {
          await tx.stockMovement.create({
            data: {
              idBarang: barang.id,
              tipe: 'INISIALISASI',
              jumlah: stokAwal,
              stokSebelum: 0,
              stokSesudah: stokAwal,
              penanggungJawabId: userId
            }
          })
        }
      })

      return status(200, { message: 'Berhasil input barang' })
    } catch (error) {
      console.error('Error /input:', error)
      return status(500, { message: 'Internal server error' })
    }
  })

  // POST /update ──────────────────────────────
  .post('/update', async ({ body, user, status }) => {
    try {
      const { id, jumlah, keterangan } = body as {
        id: string
        jumlah: number
        keterangan: string
      }
      const userId = user!.id

      if (!id || !jumlah || !keterangan) {
        return status(400, { message: 'Input tidak lengkap' })
      }
      if (keterangan !== 'PEMAKAIAN' && keterangan !== 'RESTOCK') {
        return status(400, {
          message: "Keterangan harus 'PEMAKAIAN' atau 'RESTOCK'"
        })
      }

      const jumlahInt = Number(jumlah)
      if (!Number.isInteger(jumlahInt) || jumlahInt <= 0) {
        return status(400, { message: 'Jumlah harus bilangan bulat > 0' })
      }

      const signedAmount =
        keterangan === 'PEMAKAIAN' ? -jumlahInt : jumlahInt

      const barang = await prisma.barang.findUnique({ where: { id } })
      if (!barang) return status(404, { message: 'Barang tidak ditemukan' })

      const stokSebelum = barang.stok
      const stokSesudah = stokSebelum + signedAmount

      if (stokSesudah < 0) {
        return status(400, {
          message: `Stok tidak cukup. Stok saat ini: ${stokSebelum}, diminta: ${jumlahInt}`
        })
      }

      await prisma.$transaction(async (tx) => {
        await tx.barang.update({
          where: { id },
          data: { stok: stokSesudah }
        })
        await tx.stockMovement.create({
          data: {
            idBarang: id,
            tipe: keterangan as 'PEMAKAIAN' | 'RESTOCK',
            jumlah: jumlahInt,
            stokSebelum,
            stokSesudah,
            penanggungJawabId: userId
          }
        })
      })

      return status(200, {
        message: 'Berhasil update stok',
        data: { stokSebelum, stokSesudah }
      })
    } catch (error) {
      console.error('Error /update:', error)
      return status(500, { message: 'Internal server error' })
    }
  })
// ─────────────────────────────────────────────
// Aplikasi utama
// ─────────────────────────────────────────────
const app = new Elysia()
  .use(cors({ origin: true, credentials: true }))

  // GET / ─────────────────────────────────────
  .get('/', () => 'Hello World!')

  // GET /stock ────────────────────────────────
  .get('/stock', async ({ status }) => {
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

      const data = barangs.map((b) => {
        const last = b.movements[0]
        return {
          id: b.id,
          nama: b.nama,
          stok: b.stok,
          updateTerakhir: last
            ? {
                tipe: last.tipe,
                jumlah: last.jumlah,
                stokSebelum: last.stokSebelum,
                stokSesudah: last.stokSesudah,
                tanggal: last.tanggal,
                penanggungJawab: last.penanggungJawab.nama
              }
            : null
        }
      })

      return status(200, { message: 'Berhasil', data })
    } catch (error) {
      console.error('Error /stock:', error)
      return status(500, { message: 'Internal server error' })
    }
  })

  // GET /history ──────────────────────────────
  .get('/history', async ({ status }) => {
    try {
      const data = await prisma.stockMovement.findMany({
        orderBy: { tanggal: 'desc' },
        include: {
          barang: { select: { nama: true, stok: true } },
          penanggungJawab: { select: { nama: true } }
        }
      })

      return status(200, {
        message: data.length < 1 ? 'Belum ada data' : 'Berhasil',
        data
      })
    } catch (error) {
      console.error('Error /history:', error)
      return status(500, { message: 'Internal server error' })
    }
  })

  // GET /stock/:id/history ────────────────────
  .get('/stock/:id/history', async ({ params: { id }, status }) => {
    try {
      if (!id) return status(400, { message: 'ID barang wajib diisi' })

      const barang = await prisma.barang.findUnique({ where: { id } })
      if (!barang)
        return status(404, { message: 'Barang tidak ditemukan' })

      const movements = await prisma.stockMovement.findMany({
        where: { idBarang: id },
        orderBy: { tanggal: 'desc' },
        include: { penanggungJawab: { select: { nama: true } } }
      })

      return status(200, {
        message: 'Berhasil',
        data: {
          barang: { id: barang.id, nama: barang.nama, stok: barang.stok },
          movements
        }
      })
    } catch (error) {
      console.error('Error /stock/:id/history:', error)
      return status(500, { message: 'Internal server error' })
    }
  })

  // POST /users ───────────────────────────────
  .post('/users', async ({ body, status }) => {
    try {
      const { nama } = body as { nama: string }

      if (!nama || typeof nama !== 'string' || nama.trim() === '') {
        return status(400, { message: 'Nama wajib diisi' })
      }
      const trimmedNama = nama.trim()

      const existing = await prisma.user.findFirst({
        where: { nama: trimmedNama }
      })
      if (existing) {
        return status(409, {
          message: 'User dengan nama tersebut sudah ada',
          data: { id: existing.id, nama: existing.nama }
        })
      }

      const user = await prisma.user.create({ data: { nama: trimmedNama } })

      return status(201, {
        message: 'User berhasil dibuat',
        data: { id: user.id, nama: user.nama }
      })
    } catch (error) {
      console.error('Error /users:', error)
      return status(500, { message: 'Internal server error' })
    }
  })

  // POST /login ───────────────────────────────
  .post('/login', async ({ body, cookie, status }) => {
    try {
      const { nama } = body as { nama: string }

      if (!nama || typeof nama !== 'string' || nama.trim() === '') {
        return status(400, { message: 'Nama wajib diisi' })
      }

      const trimmedNama = nama.trim()

      const user = await prisma.user.findFirst({
        where: { nama: trimmedNama }
      })
      if (!user) {
        return status(401, {
          message: 'Nama tidak terdaftar. Hubungi admin untuk didaftarkan.'
        })
      }

      const c = cookie[COOKIE_NAME]
      c.value = user.id
      c.httpOnly = true
      c.sameSite = 'lax'
      c.secure = false
      c.path = '/'
      c.maxAge = COOKIE_MAX_AGE_SECONDS

      return status(200, {
        message: 'Login berhasil',
        data: { id: user.id, nama: user.nama }
      })
    } catch (error) {
      console.error('Error /login:', error)
      return status(500, { message: 'Internal server error' })
    }
  })

  // GET /me ───────────────────────────────────
  .get('/me', async ({ cookie, status }) => {
    try {
      const userId = cookie[COOKIE_NAME]?.value as string | undefined
      if (!userId) return status(401, { message: 'Belum login' })

      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) {
        cookie[COOKIE_NAME]?.remove()
        return status(401, {
          message: 'Sesi tidak valid, silakan login ulang'
        })
      }

      return status(200, { data: { id: user.id, nama: user.nama } })
    } catch (error) {
      console.error('Error /me:', error)
      return status(500, { message: 'Internal server error' })
    }
  })

  // POST /logout ──────────────────────────────
  .post('/logout', ({ cookie }) => {
    cookie[COOKIE_NAME]?.remove()
    return { message: 'Logout berhasil' }
  })

  // Routes yang butuh auth ────────────────────
  .use(protectedRoutes)

  // Fallback 404 ──────────────────────────────
  .onError(({ code, status }) => {
    if (code === 'NOT_FOUND') {
      return status(404, { message: 'Endpoint tidak ditemukan' })
    }
  })

// ─────────────────────────────────────────────
// Start server (skip saat di Vercel)
// ─────────────────────────────────────────────
if (!process.env.VERCEL) {
  app.listen(port)
  console.log(`🦊 Elysia listening on port ${port}`)
}

export default app