import express from 'express';
import { Request, Response } from 'express';
import prisma from './lib/prisma';

const app = express()
const port = 3000

app.use(express.json())

app.get('/', (req : Request, res : Response) => {
  res.send('Hello World!')
})

app.get('/history', async (req : Request, res : Response) => {
    try {
        const getData = await prisma.riwayatUpdateStok.findMany({
            select : {
                id : true,
                riwayatUpdate : {
                    select : {
                        barang : {
                            select : {
                                nama : true,
                                stok : true
                            }
                        },
                        tanggalUpdate : true,
                        keterangan : true,
                        jumlahUpdate : true,
                        penanggungJawab : {
                            select : {
                                nama : true
                            }
                        },
                        jumlahStokTerakhir : true
                    }
                }
            }
        })

        if (getData.length < 1) {
            return res.status(404).json({
                message : "Gagal mengambil data"
            })
        }

        return res.status(200).json({
            message : "Berhasil",
            data : getData
        })

    } catch (error) {
        console.error("Error : ", error)
        return res.status(500).json({
            message : "Internal server error"
        })
    }
})

app.get('/stock', async (req : Request, res : Response) => {
    try {

        const getData = await prisma.dataStockUpdate.findMany({
            select : {
                id : true,
                idBarang : true,
                barang : {
                    select : {
                        id : true,
                        nama : true,
                        stok : true,
                    }
                },
                jumlahUpdate : true,
                tanggalUpdate : true,
                keterangan : true,
                penanggungJawab : {
                    select : {
                        nama : true
                    }
                },
                jumlahStokTerakhir : true
            }
        })

        if(getData.length < 1) {
            return res.status(404).json({
                message : "Tidak bisa menemukan update stok"
            })
        }

        return res.status(200).json({
            message : "Berhasil",
            data : getData
        })
        
    } catch (error) {
        console.error("Error : ", error)
        return res.status(500).json({
            message : "Internal server error"
        })
    }
})

interface Barang {
    nama : string
    stok ? : number
    inputId : string
}

app.post('/input', async (req: Request, res : Response) => {
    try {
        
        const {nama, stok, inputId} : Barang = req.body;
        if(!nama) {
            return res.status(400).json({
                message : "Kolom nama barang harus diisi"
            })
        }

        await prisma.barang.create({
            data : {
                nama : nama,
                stok : stok,
                inputOlehId : inputId
            }
        })

        return res.status(200).json({
            message : "Berhasil input stok"
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            message : "Internal server error"
        })
    }
})

interface updateData{
    id : string
    jumlah : number
    keterangan : string
    penanggungJawabId : string
}

app.post('/update', async (req : Request, res : Response) => {
    try {
       
        const {id, jumlah, keterangan, penanggungJawabId} : updateData = req.body;

        if(!id || !jumlah || !keterangan || !penanggungJawabId) {
            return res.status(400).json({
                message : "Input salah"
            })
        }

        const jumlahToInt = Number(jumlah);

        let updateInc : number = 0
        let updateDec : number = 0

        if(keterangan === "PEMAKAIAN") {
            updateInc = jumlahToInt
        } else {
            updateDec = jumlahToInt
        }


        const findData = await prisma.barang.findUnique({
            where : {
                id : id
            }
        })

        if (!findData) {
            return res.status(404).json({
                message : "Tidak dapat menemukan jenis barang"
            })
        }

        const result = await prisma.$transaction(async (tx) => {
            tx.barang.update({
                where : {
                    id : id
                },
                data : {
                    stok : {
                        increment : updateInc,
                        decrement : updateDec
                    }
                }
            })

            const DataStokUpdate = tx.dataStockUpdate.update({
                where : {
                    id : id
                },
                data : {
                    jumlahUpdate : jumlah,
                    keterangan : keterangan,
                    penanggungJawabId : penanggungJawabId,
                    jumlahStokTerakhir : findData.stok,
                }
            })

            const riwayatUpdateStok = tx.riwayatUpdateStok.create({
                data : {
                    updateId : (await DataStokUpdate).id
                }
            })

            return riwayatUpdateStok
        })

        if(!result.id) {
            return res.status(400).json({
                message : "Update data gagal"
            })
        }

        return res.status(200).json({
            message : "Berhasil Update Data"
        })

    } catch (error) {
        console.error(`Error : ${error}`)
        return res.status(500).json({
            message : "Interal server error"
        })
    }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})