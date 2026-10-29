var app = new Vue({
  el: "#app",
  data: function () {
    return {
      upbjjList: dataBahanAjar.upbjjList.slice(),
      kategoriList: dataBahanAjar.kategoriList.slice(),
      stok: dataBahanAjar.stok.map(function (item) { return Object.assign({}, item); }),
      filterUpbjj: "",
      filterKategori: "",
      hanyaPerluReorder: false,
      hanyaKosong: false,
      sortBy: "judul",
      tampilkanForm: false,
      modeForm: "tambah",
      pesanError: "",
      pesanSukses: "",
      form: {},
      kodeEdit: null
    };
  },
  computed: {
    kategoriTersedia: function () {
      var self = this;
      return this.kategoriList.filter(function (kategori) {
        return self.stok.some(function (item) {
          return item.upbjj === self.filterUpbjj && item.kategori === kategori;
        });
      });
    },
    stokTampil: function () {
      var self = this;
      var hasil = this.stok.filter(function (item) {
        var cocokUpbjj = !self.filterUpbjj || item.upbjj === self.filterUpbjj;
        var cocokKategori = !self.filterKategori || item.kategori === self.filterKategori;
        var cocokReorder = !self.hanyaPerluReorder || item.qty < item.safety;
        var cocokKosong = !self.hanyaKosong || item.qty === 0;
        return cocokUpbjj && cocokKategori && cocokReorder && cocokKosong;
      });
      return hasil.slice().sort(function (a, b) {
        if (self.sortBy === "qty-asc") return a.qty - b.qty;
        if (self.sortBy === "qty-desc") return b.qty - a.qty;
        if (self.sortBy === "harga-asc") return a.harga - b.harga;
        if (self.sortBy === "harga-desc") return b.harga - a.harga;
        return a.judul.localeCompare(b.judul, "id");
      });
    },
    jumlahAman: function () {
      return this.stok.filter(function (item) { return item.qty > 0 && item.qty >= item.safety; }).length;
    },
    jumlahMenipis: function () {
      return this.stok.filter(function (item) { return item.qty > 0 && item.qty < item.safety; }).length;
    },
    jumlahKosong: function () {
      return this.stok.filter(function (item) { return item.qty === 0; }).length;
    }
  },
  watch: {
    filterUpbjj: function () {
      this.filterKategori = "";
    },
    hanyaKosong: function (nilai) {
      if (nilai) this.hanyaPerluReorder = true;
    },
    pesanSukses: function (nilai) {
      if (nilai) {
        var self = this;
        setTimeout(function () { self.pesanSukses = ""; }, 3500);
      }
    }
  },
  methods: {
    statusStok: function (item) {
      if (item.qty === 0) return "Kosong";
      if (item.qty < item.safety) return "Menipis";
      return "Aman";
    },
    kelasStatus: function (item) {
      if (item.qty === 0) return "status-danger";
      if (item.qty < item.safety) return "status-warning";
      return "status-safe";
    },
    simbolStatus: function (item) {
      if (item.qty === 0) return "●";
      if (item.qty < item.safety) return "▲";
      return "✓";
    },
    resetFilter: function () {
      this.filterUpbjj = "";
      this.filterKategori = "";
      this.hanyaPerluReorder = false;
      this.hanyaKosong = false;
      this.sortBy = "judul";
    },
    formKosong: function () {
      return { kode: "", judul: "", kategori: "", upbjj: "", lokasiRak: "", harga: 0, qty: 0, safety: 0, catatanHTML: "" };
    },
    bukaFormTambah: function () {
      this.modeForm = "tambah";
      this.form = this.formKosong();
      this.pesanError = "";
      this.tampilkanForm = true;
      this.$nextTick(function () {
        this.$refs.inputKode.focus();
    });
    },
    bukaFormEdit: function (item) {
      this.modeForm = "edit";
      this.kodeEdit = item.kode;
      this.form = Object.assign({}, item);
      this.pesanError = "";
      this.tampilkanForm = true;
    },
    tutupForm: function () {
      this.tampilkanForm = false;
      this.pesanError = "";
    },
    simpanStok: function () {
      var kode = this.form.kode.trim().toUpperCase();
      if (!kode || !this.form.judul.trim() || !this.form.kategori || !this.form.upbjj || !this.form.lokasiRak.trim()) {
        this.pesanError = "Kode, judul, kategori, UT-Daerah, dan lokasi rak wajib diisi.";
        return;
      }
      if (!Number.isFinite(Number(this.form.harga)) || Number(this.form.harga) < 0 ||
          !Number.isInteger(Number(this.form.qty)) || Number(this.form.qty) < 0 ||
          !Number.isInteger(Number(this.form.safety)) || Number(this.form.safety) < 0) {
        this.pesanError = "Harga harus bernilai 0 atau lebih. Qty dan safety harus bilangan bulat 0 atau lebih.";
        return;
      }
      if (this.modeForm === "tambah" && this.stok.some(function (item) { return item.kode.toUpperCase() === kode; })) {
        this.pesanError = "Kode mata kuliah sudah ada. Gunakan kode yang berbeda.";
        return;
      }
      var data = Object.assign({}, this.form, { kode: kode, harga: Number(this.form.harga), qty: Number(this.form.qty), safety: Number(this.form.safety) });
      if (this.modeForm === "edit") {
        var index = this.stok.findIndex(function (item) { return item.kode === this.kodeEdit; }, this);
        if (index !== -1) this.$set(this.stok, index, data);
        this.pesanSukses = "Perubahan stok " + kode + " berhasil disimpan.";
      } else {
        this.stok.push(data);
        this.pesanSukses = "Bahan ajar " + kode + " berhasil ditambahkan.";
      }
      this.tampilkanForm = false;
      this.pesanError = "";
    }
  }
});
