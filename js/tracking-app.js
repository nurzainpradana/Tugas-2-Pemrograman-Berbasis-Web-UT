
/*
 * APLIKASI TRACKING DELIVERY ORDER SITTA
 * File: js/tracking-app.js
 *
 * Fungsi:
 * 1. Menampilkan data tracking DO.
 * 2. Membuat Delivery Order baru.
 * 3. Menampilkan detail paket dan harga.
 * 4. Melakukan validasi formulir.
 * 5. Menampilkan pesan kesalahan per field.
 * 6. Menggunakan computed property, methods, dan watchers.
 */

// Mengubah tanggal menjadi format YYYY-MM-DD berdasarkan waktu lokal.
function tanggalLokal() {
    var tanggal = new Date();
    var tahun = tanggal.getFullYear();
    var bulan = String(tanggal.getMonth() + 1).padStart(2, "0");
    var hari = String(tanggal.getDate()).padStart(2, "0");

    return tahun + "-" + bulan + "-" + hari;
}

var app = new Vue({
    // Menentukan elemen HTML yang dikelola oleh Vue.js.
    el: "#app",

    // ==================================================
    // 1. DATA
    // ==================================================
    data: function () {
        // Mengambil data tracking dari dummy data.
        var trackingAwal = dataBahanAjar.tracking;

        // Mengubah objek tracking menjadi array agar mudah ditampilkan.
        var daftarAwal = Object.keys(trackingAwal).map(function (nomor) {
            var item = trackingAwal[nomor];

            return {
                nomor: nomor,
                nim: item.nim,
                nama: item.nama,
                status: item.status || "Dalam Perjalanan",
                ekspedisi: item.ekspedisi || "JNE Regular",
                tanggalKirim: item.tanggalKirim,
                kodePaket: item.paket,
                total: item.total,

                // Menyalin riwayat perjalanan.
                perjalanan: (item.perjalanan || []).map(function (p) {
                    return Object.assign({}, p);
                })
            };
        });

        return {
            // Daftar pilihan UT-Daerah.
            upbjjList: dataBahanAjar.upbjjList.slice(),

            // Daftar ekspedisi yang tersedia.
            ekspedisiList: [
                { kode: "JREG", nama: "JNE Regular" },
                { kode: "JEXP", nama: "JNE Express" }
            ],

            // Menyalin daftar paket bahan ajar.
            paketList: dataBahanAjar.paket.map(function (item) {
                return Object.assign({}, item);
            }),

            // Menyalin daftar stok bahan ajar.
            stokList: dataBahanAjar.stok.map(function (item) {
                return Object.assign({}, item);
            }),

            // Daftar seluruh Delivery Order.
            daftarDO: daftarAwal,

            // Nomor DO yang sedang ditampilkan.
            nomorTerpilih: daftarAwal.length
                ? daftarAwal[0].nomor
                : "",

            // Mengatur visibilitas formulir.
            formTerbuka: false,

            // Penanda bahwa pengguna sudah mencoba submit.
            formSubmitted: false,

            // Pesan kesalahan umum dan notifikasi sukses.
            pesanError: "",
            pesanSukses: "",

            // Objek formulir input.
            form: {},

            // Tanggal lokal hari ini.
            tanggalHariIni: tanggalLokal()
        };
    },

    // ==================================================
    // 2. COMPUTED PROPERTY
    // ==================================================
    computed: {

        // Mencari paket yang dipilih berdasarkan kode paket.
        paketTerpilih: function () {
            return this.paketList.find(function (paket) {
                return paket.kode === this.form.kodePaket;
            }, this) || null;
        },

        // Menghitung total nilai seluruh Delivery Order.
        totalNilaiDO: function () {
            return this.daftarDO.reduce(function (total, item) {
                return total + Number(item.total || 0);
            }, 0);
        },

        // Mengambil detail DO yang sedang dipilih.
        doTerpilih: function () {
            return this.daftarDO.find(function (item) {
                return item.nomor === this.nomorTerpilih;
            }, this) || null;
        },

        // Menghasilkan nomor DO berikutnya secara otomatis.
        nomorDOBaru: function () {
            var tahun = new Date().getFullYear();
            var nomorTerbesar = 0;

            this.daftarDO.forEach(function (item) {
                var cocok = item.nomor.match(/^DO(\d{4})-(\d+)$/);

                if (cocok && Number(cocok[1]) === tahun) {
                    nomorTerbesar = Math.max(
                        nomorTerbesar,
                        Number(cocok[2])
                    );
                }
            });

            return "DO" + tahun + "-" +
                String(nomorTerbesar + 1).padStart(3, "0");
        },

        /*
         * Menghasilkan pesan validasi setiap field.
         * Pesan ditampilkan setelah submit atau ketika
         * pengguna sudah mengisi nilai yang tidak valid.
         */
        errors: function () {
            var error = {};
            var form = this.form;
            var tampilkanError = this.formSubmitted;

            // Validasi NIM.
            if (
                tampilkanError ||
                (form.nim && form.nim.length > 0)
            ) {
                if (!/^[0-9]{8,15}$/.test(form.nim || "")) {
                    error.nim = "NIM harus terdiri dari 8–15 digit angka.";
                }
            }

            // Validasi nama mahasiswa.
            if (
                tampilkanError ||
                (form.nama && form.nama.length > 0)
            ) {
                if ((form.nama || "").trim().length < 2) {
                    error.nama = "Nama minimal 2 karakter.";
                }
            }

            // Validasi ekspedisi.
            if (tampilkanError && !form.ekspedisi) {
                error.ekspedisi = "Silakan pilih ekspedisi.";
            }

            // Validasi paket bahan ajar.
            if (tampilkanError && !form.kodePaket) {
                error.kodePaket = "Silakan pilih paket bahan ajar.";
            }

            // Validasi tanggal kirim.
            if (
                tampilkanError ||
                (form.tanggalKirim && form.tanggalKirim.length > 0)
            ) {
                if (!form.tanggalKirim) {
                    error.tanggalKirim = "Tanggal kirim wajib diisi.";
                } else if (
                    !/^\d{4}-\d{2}-\d{2}$/.test(form.tanggalKirim) ||
                    form.tanggalKirim > this.tanggalHariIni
                ) {
                    error.tanggalKirim =
                        "Tanggal kirim tidak boleh melewati hari ini.";
                }
            }

            return error;
        }
    },

    // ==================================================
    // 3. WATCHERS
    // ==================================================
    watch: {

        /*
         * Watcher 1:
         * Memantau perubahan paket yang dipilih.
         * Harga akan menyesuaikan paket secara otomatis.
         */
        "form.kodePaket": function (kodeBaru) {
            var paket = this.paketList.find(function (item) {
                return item.kode === kodeBaru;
            });

            this.form.total = paket ? paket.harga : 0;
        },

        /*
         * Watcher 2:
         * Memantau saat formulir dibuka.
         * Data formulir dikosongkan sebelum input baru.
         */
        formTerbuka: function (terbuka) {
            if (terbuka) {
                this.resetForm();
            }
        },

        /*
         * Watcher 3:
         * Menghapus notifikasi sukses setelah 3,5 detik.
         */
        pesanSukses: function (nilai) {
            if (nilai) {
                var self = this;

                setTimeout(function () {
                    self.pesanSukses = "";
                }, 3500);
            }
        }
    },

    // ==================================================
    // 4. METHODS
    // ==================================================
    methods: {

        // Mengosongkan formulir dan mengatur tanggal awal.
        resetForm: function () {
            this.form = {
                nim: "",
                nama: "",
                ekspedisi: "",
                kodePaket: "",
                tanggalKirim: this.tanggalHariIni,
                total: 0
            };

            this.formSubmitted = false;
            this.pesanError = "";
        },

        // Membuka formulir untuk membuat DO baru.
        bukaForm: function () {
            this.formTerbuka = true;
        },

        // Menutup formulir.
        tutupForm: function () {
            this.formTerbuka = false;
            this.formSubmitted = false;
            this.pesanError = "";
        },

        // Membuat Delivery Order baru setelah validasi berhasil.
        buatDO: function () {
            // Mengaktifkan tampilan pesan validasi per field.
            this.formSubmitted = true;
            this.pesanError = "";

            // Menghentikan proses jika masih ada kesalahan.
            if (Object.keys(this.errors).length > 0) {
                this.pesanError =
                    "Periksa kembali formulir. Masih ada data yang belum valid.";
                return;
            }

            // Memastikan paket benar-benar tersedia.
            var paket = this.paketTerpilih;

            if (!paket) {
                this.pesanError = "Paket bahan ajar tidak ditemukan.";
                return;
            }

            // Mengambil nomor DO berikutnya.
            var nomor = this.nomorDOBaru;

            // Mencari nama ekspedisi dari pilihan pengguna.
            var ekspedisi = this.ekspedisiList.find(function (item) {
                return item.kode === this.form.ekspedisi;
            }, this);

            // Membentuk objek DO baru.
            var baru = {
                nomor: nomor,
                nim: this.form.nim,
                nama: this.form.nama.trim(),

                // Menyimpan nama ekspedisi agar mudah dibaca.
                ekspedisi: ekspedisi ? ekspedisi.nama : this.form.ekspedisi,

                tanggalKirim: this.form.tanggalKirim,
                kodePaket: paket.kode,
                total: paket.harga,
                status: "Diproses",

                // Riwayat awal ketika DO dibuat.
                perjalanan: [
                    {
                        waktu: new Date().toLocaleString("sv-SE"),
                        keterangan:
                            "Delivery Order dibuat dan menunggu proses pengiriman."
                    }
                ]
            };

            // Menambahkan DO baru ke awal daftar.
            this.daftarDO.unshift(baru);

            // Langsung menampilkan DO yang baru dibuat.
            this.nomorTerpilih = nomor;

            // Menutup formulir.
            this.formTerbuka = false;
            this.formSubmitted = false;
            this.pesanError = "";

            // Menampilkan notifikasi sukses.
            this.pesanSukses =
                "Delivery Order " + nomor + " berhasil dibuat.";
        },

        // Memilih DO yang akan dilihat detailnya.
        pilihDO: function (nomor) {
            this.nomorTerpilih = nomor;
        },

        // Mengambil daftar isi paket berdasarkan kode paket.
        isiPaket: function (kodePaket) {
            var paket = this.paketList.find(function (item) {
                return item.kode === kodePaket;
            });

            return paket ? paket.isi : [];
        },

        // Mengambil nama paket berdasarkan kode paket.
        namaPaket: function (kodePaket) {
            var paket = this.paketList.find(function (item) {
                return item.kode === kodePaket;
            });

            return paket ? paket.nama : kodePaket;
        },

        // Mengambil judul bahan ajar berdasarkan kode.
        judulBahanAjar: function (kode) {
            var item = this.stokList.find(function (stok) {
                return stok.kode === kode;
            });

            return item
                ? item.judul
                : "Judul tidak tersedia di dummy data";
        },

        // Mengubah angka menjadi format Rupiah.
        formatRupiah: function (nilai) {
            return new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0
            }).format(nilai || 0);
        }
    },

    // ==================================================
    // 5. CREATED LIFECYCLE
    // ==================================================
    // Menyiapkan formulir ketika instance Vue dibuat.
    created: function () {
        this.resetForm();
    }
});
