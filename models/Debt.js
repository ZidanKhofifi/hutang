const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
  namaPeminjam: {
    type: String,
    required: [true, 'Nama peminjam harus diisi'],
    trim: true
  },
  jumlah: {
    type: Number,
    required: [true, 'Jumlah utang harus diisi'],
    min: [0, 'Jumlah utang tidak boleh negatif']
  },
  keterangan: {
    type: String,
    default: '-'
  },
  status: {
    type: String,
    enum: ['Belum Lunas', 'Lunas'],
    default: 'Belum Lunas'
  },
  tanggalJatuhTempo: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Mengekspor model agar bisa digunakan di file lain
module.exports = mongoose.model('Debt', debtSchema);
