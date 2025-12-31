require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true })); // Agar bisa membaca data dari form HTML


// Middleware agar server bisa membaca JSON
app.use(express.json());

// Koneksi ke MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Berhasil terhubung ke MongoDB Atlas'))
  .catch((err) => console.error('❌ Gagal koneksi database:', err));


const Debt = require('./models/Debt'); // Import model

// Route untuk menambah utang baru
app.post('/api/utang', async (req, res) => {
  try {
    const { namaPeminjam, jumlah, keterangan, tanggalJatuhTempo } = req.body;

    const utangBaru = new Debt({
      namaPeminjam,
      jumlah,
      keterangan,
      tanggalJatuhTempo
    });

    const simpanUtang = await utangBaru.save();
    res.status(201).json({
      pesan: "Catatan utang berhasil ditambahkan!",
      data: simpanUtang
    });
  } catch (err) {
    res.status(400).json({
      pesan: "Gagal menambah utang",
      error: err.message
    });
  }
});

// Route untuk mengambil semua daftar utang
app.get('/api/utang', async (req, res) => {
  try {
    const daftarUtang = await Debt.find().sort({ createdAt: -1 }); // Mengambil semua & urutkan dari yang terbaru
    res.status(200).json({
      pesan: "Daftar utang berhasil diambil",
      jumlahData: daftarUtang.length,
      data: daftarUtang
    });
  } catch (err) {
    res.status(500).json({
      pesan: "Gagal mengambil data",
      error: err.message
    });
  }
});

// Route untuk mengubah status utang menjadi Lunas
app.patch('/api/utang/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateUtang = await Debt.findByIdAndUpdate(
      id, 
      { status: 'Lunas' }, 
      { new: true } // Agar mengembalikan data yang sudah diperbarui
    );

    if (!updateUtang) return res.status(404).json({ pesan: "Data tidak ditemukan" });

    res.status(200).json({
      pesan: "Status utang berhasil diperbarui!",
      data: updateUtang
    });
  } catch (err) {
    res.status(400).json({ pesan: "Gagal memperbarui data", error: err.message });
  }
});

// Route untuk menghapus catatan utang
app.delete('/api/utang/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const hapusUtang = await Debt.findByIdAndDelete(id);

    if (!hapusUtang) return res.status(404).json({ pesan: "Data tidak ditemukan" });

    res.status(200).json({ pesan: "Catatan utang telah dihapus" });
  } catch (err) {
    res.status(400).json({ pesan: "Gagal menghapus data", error: err.message });
  }
});

// Render halaman utama
app.get('/', async (req, res) => {
    const { cari } = req.query;
    let query = {};

    // Jika ada input pencarian, filter berdasarkan nama (case-insensitive)
    if (cari) {
        query.namaPeminjam = { $regex: cari, $options: 'i' };
    }

    const daftarUtang = await Debt.find(query).sort({ createdAt: -1 });
    const totalUtang = daftarUtang
        .filter(u => u.status === 'Belum Lunas')
        .reduce((sum, item) => sum + item.jumlah, 0);

    res.render('index', { daftarUtang, totalUtang });
});



// Proses tambah utang dari form
app.post('/add', async (req, res) => {
    try {
        await Debt.create(req.body);
        res.redirect('/');
    } catch (err) {
        // Jika ada error validasi, ambil pesannya
        const daftarUtang = await Debt.find().sort({ createdAt: -1 });
        const totalUtang = daftarUtang
            .filter(u => u.status === 'Belum Lunas')
            .reduce((sum, item) => sum + item.jumlah, 0);

        res.render('index', { 
            daftarUtang, 
            totalUtang, 
            error: err.message // Kirim pesan error ke EJS
        });
    }
});


// Proses update status lewat tombol di tampilan
app.post('/update/:id', async (req, res) => {
    await Debt.findByIdAndUpdate(req.params.id, { status: 'Lunas' });
    res.redirect('/');
});

// Proses hapus data dari tampilan
app.post('/delete/:id', async (req, res) => {
    try {
        await Debt.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (err) {
        res.send("Gagal menghapus data");
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});
