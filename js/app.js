const ALLOWED_ROOMS = {
    "Deluxe Room": 800000,
    "Suite Room": 1500000,
    "Family Room": 1200000
};

function normalizeRoom(candidate){
    if(!candidate || !Object.prototype.hasOwnProperty.call(ALLOWED_ROOMS, candidate.nama)){
        return null;
    }

    const price = ALLOWED_ROOMS[candidate.nama];

    if(Number(candidate.harga) !== price){
        return null;
    }

    return {
        nama: candidate.nama,
        harga: price,
        img: candidate.img || ""
    };
}

function safeJsonParse(value){
    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
}

function getRoomFromUrl(){
    const params = new URLSearchParams(location.search);

    if(!params.has("nama") || !params.has("harga") || !params.has("img")){
        return null;
    }

    return {
        nama: params.get("nama"),
        harga: Number(params.get("harga")),
        img: params.get("img")
    };
}

const room = normalizeRoom(getRoomFromUrl())
    || normalizeRoom(safeJsonParse(localStorage.getItem("booking")))
    || normalizeRoom(safeJsonParse(localStorage.getItem("room")));

if(room){
    localStorage.setItem("booking", JSON.stringify(room));
    localStorage.setItem("room", JSON.stringify(room));
}

const bookingForm = document.getElementById("bookingForm");
const bookingFormNotice = document.getElementById("bookingFormNotice");
const checkin = document.getElementById("checkin");
const checkout = document.getElementById("checkout");
const guestName = document.getElementById("guestName");
const guestEmail = document.getElementById("guestEmail");
const guestPhone = document.getElementById("guestPhone");
const guestCount = document.getElementById("guestCount");
const roomCount = document.getElementById("roomCount");
const paymentMethod = document.getElementById("paymentMethod");
const bookingMessage = document.getElementById("bookingMessage");
const lama = document.getElementById("lama");
const total = document.getElementById("total");
const bookingButton = document.getElementById("bookingButton");
const bookingSummary = document.getElementById("bookingSummary");
const bookingResult = document.getElementById("bookingResult");
const refreshMyBookings = document.getElementById("refreshMyBookings");
const myBookingsMessage = document.getElementById("myBookingsMessage");
const myBookingList = document.getElementById("myBookingList");
const lookupEmail = document.getElementById("lookupEmail");
const lookupCode = document.getElementById("lookupCode");
let totalHarga = 0;

document.getElementById("room").innerText = room
    ? room.nama + " - " + formatRupiah(room.harga)
    : "Belum ada kamar dipilih untuk booking baru.";

if(!room){
    bookingForm.classList.add("hidden");
    bookingButton.classList.add("hidden");
    bookingFormNotice.textContent = "Untuk membuat booking baru, pilih kamar dari halaman Akomodasi. Untuk mengecek pesanan lama, masukkan email dan kode booking di bagian Cek Pesanan Saya.";
    bookingFormNotice.classList.remove("hidden");
}

const today = new Date().toISOString().split("T")[0];
checkin.min = today;
checkout.min = today;

function formatRupiah(value){
    return "Rp " + Number(value).toLocaleString("id-ID");
}

function clampNumber(value, min, max){
    const number = Number(value);

    if(!Number.isFinite(number)){
        return min;
    }

    return Math.min(Math.max(number, min), max);
}

function validGuestEmail(value){
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function validGuestPhone(value){
    return /^[0-9+()\-\s]{8,20}$/.test(value);
}

function makeBookingCode(){
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();
    return "HTL-" + Date.now().toString().slice(-6) + "-" + random;
}

function escapeHtml(value){
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function makeSummaryItem(label, value){
    const wrapper = document.createElement("div");
    wrapper.className = "rounded bg-white p-3";
    wrapper.innerHTML = `
        <dt class="text-xs font-semibold uppercase text-gray-500">${label}</dt>
        <dd class="mt-1 font-medium text-gray-900"></dd>
    `;
    wrapper.querySelector("dd").textContent = value || "-";
    return wrapper;
}

function updateSummary(){
    const nightsValue = lama.value || "-";
    const messageValue = bookingMessage.value.trim() || "Tidak ada pesan khusus";

    bookingSummary.replaceChildren(
        makeSummaryItem("Kamar", room ? room.nama : "-"),
        makeSummaryItem("Harga per malam", room ? formatRupiah(room.harga) : "-"),
        makeSummaryItem("Nama", guestName.value.trim()),
        makeSummaryItem("Email", guestEmail.value.trim().toLowerCase()),
        makeSummaryItem("Nomor HP", guestPhone.value.trim()),
        makeSummaryItem("Metode pembayaran", paymentMethod.value),
        makeSummaryItem("Check-in", checkin.value),
        makeSummaryItem("Check-out", checkout.value),
        makeSummaryItem("Jumlah tamu", guestCount.value + " tamu"),
        makeSummaryItem("Jumlah kamar", roomCount.value + " kamar"),
        makeSummaryItem("Lama menginap", nightsValue),
        makeSummaryItem("Total", total.value),
        makeSummaryItem("Pesan", messageValue)
    );
}

function showBookingResult(data){
    bookingResult.classList.remove("hidden");
    lookupEmail.value = data.userEmail;
    lookupCode.value = data.bookingCode;
    bookingResult.innerHTML = `
        <h3 class="text-base font-bold">Booking berhasil disimpan</h3>
        <p class="mt-1">Simpan kode booking ini untuk pengecekan di hotel.</p>
        <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <p><strong>Kode:</strong> ${escapeHtml(data.bookingCode)}</p>
            <p><strong>Status:</strong> ${escapeHtml(data.status)}</p>
            <p><strong>Nama:</strong> ${escapeHtml(data.userName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(data.userEmail)}</p>
            <p><strong>No. HP:</strong> ${escapeHtml(data.userPhone)}</p>
            <p><strong>Kamar:</strong> ${escapeHtml(data.room)}</p>
            <p><strong>Jumlah tamu:</strong> ${escapeHtml(data.guests)}</p>
            <p><strong>Jumlah kamar:</strong> ${escapeHtml(data.rooms)}</p>
            <p><strong>Check-in:</strong> ${escapeHtml(data.checkin)}</p>
            <p><strong>Check-out:</strong> ${escapeHtml(data.checkout)}</p>
            <p><strong>Lama:</strong> ${escapeHtml(data.nights)} malam</p>
            <p><strong>Total:</strong> ${escapeHtml(formatRupiah(data.total))}</p>
            <p class="sm:col-span-2"><strong>Pembayaran:</strong> ${escapeHtml(data.paymentMethod)}</p>
            <p class="sm:col-span-2"><strong>Pesan:</strong> ${escapeHtml(data.message || "Tidak ada pesan khusus")}</p>
        </div>
    `;
}

function getAuthErrorMessage(error){
    if(error && error.code === "auth/admin-restricted-operation"){
        return "Login tamu belum diaktifkan. Aktifkan provider Anonymous di Firebase Authentication.";
    }

    return error.message;
}

function getBookingErrorMessage(error){
    if(error && error.code === "permission-denied"){
        return "Akses database ditolak. Deploy ulang firestore.rules atau pastikan Anonymous Authentication aktif di Firebase.";
    }

    return error.message;
}

function hitung(){
    if(!room){
        updateSummary();
        return;
    }

    let ci = new Date(checkin.value);
    let co = new Date(checkout.value);
    let jumlahKamar = clampNumber(roomCount.value, 1, 5);
    roomCount.value = jumlahKamar;

    let hari = (co - ci)/(1000*60*60*24);

    if(hari <= 0 || hari > 30){
        lama.value = "";
        total.value = "";
        totalHarga = 0;
        updateSummary();
        return;
    }

    lama.value = hari + " malam";
    totalHarga = hari * room.harga * jumlahKamar;
    total.value = formatRupiah(totalHarga);
    updateSummary();
}

checkin.onchange = hitung;
checkout.onchange = hitung;
roomCount.onchange = hitung;
roomCount.oninput = hitung;
[guestName, guestEmail, guestPhone, guestCount, paymentMethod, bookingMessage].forEach(input => {
    input.addEventListener("input", updateSummary);
    input.addEventListener("change", updateSummary);
});

function setBookingLoading(isLoading){
    bookingButton.disabled = isLoading;
    bookingButton.textContent = isLoading ? "Menyimpan..." : "Booking";
    bookingButton.classList.toggle("opacity-70", isLoading);
    bookingButton.classList.toggle("cursor-not-allowed", isLoading);
}

function getUser(){
    return auth.currentUser || auth.signInAnonymously().then(result => result.user);
}

function makeStatusBadge(status){
    const value = status || "Menunggu Pembayaran";
    const badge = document.createElement("span");
    const colorMap = {
        "Menunggu Pembayaran": "bg-yellow-100 text-yellow-800",
        "Dikonfirmasi": "bg-green-100 text-green-800",
        "Dibatalkan": "bg-red-100 text-red-800",
        "Selesai": "bg-blue-100 text-blue-800"
    };

    badge.className = `inline-flex rounded px-2 py-1 text-xs font-semibold ${colorMap[value] || "bg-gray-100 text-gray-700"}`;
    badge.textContent = value;
    return badge;
}

function setCell(row, value, className = ""){
    const cell = document.createElement("td");
    cell.className = "border-t px-3 py-3 align-top " + className;
    cell.textContent = value || "-";
    row.appendChild(cell);
    return cell;
}

function canCancelBooking(data){
    return data.status === "Menunggu Pembayaran" || data.status === "Dikonfirmasi";
}

async function cancelBooking(id, data){
    if(!id){
        myBookingsMessage.textContent = "Klik Cek Booking dulu sebelum membatalkan pesanan ini.";
        return;
    }

    if(!canCancelBooking(data)){
        alert("Booking ini tidak bisa dibatalkan karena statusnya sudah " + (data.status || "-") + ".");
        return;
    }

    if(!confirm("Batalkan booking " + data.bookingCode + "?")){
        return;
    }

    try {
        await db.collection("bookings").doc(id).update({ status: "Dibatalkan" });
        alert("Booking berhasil dibatalkan.");
    } catch (error) {
        alert("Gagal membatalkan booking: " + error.message);
    }
}

function renderMyBookings(items){
    myBookingList.replaceChildren();

    if(items.length === 0){
        myBookingsMessage.textContent = "Pesanan tidak ditemukan. Pastikan email dan kode booking sesuai.";
        return;
    }

    myBookingsMessage.textContent = items.length + " pesanan cocok ditemukan.";

    items
        .sort((a, b) => String(b.data.createdAt && b.data.createdAt.seconds || "").localeCompare(String(a.data.createdAt && a.data.createdAt.seconds || "")))
        .forEach(({ id, data }) => {
            const row = document.createElement("tr");
            row.className = "odd:bg-white even:bg-gray-50";

            setCell(row, data.bookingCode);
            setCell(row, data.room);
            setCell(row, (data.checkin || "-") + " s/d " + (data.checkout || "-"));
            setCell(row, (data.guests || 0) + " tamu, " + (data.rooms || 0) + " kamar");
            setCell(row, formatRupiah(data.total), "font-semibold");

            const statusCell = document.createElement("td");
            statusCell.className = "border-t px-3 py-3 align-top";
            statusCell.appendChild(makeStatusBadge(data.status));
            row.appendChild(statusCell);

            const actionCell = document.createElement("td");
            const cancelButton = document.createElement("button");
            actionCell.className = "border-t px-3 py-3 align-top";
            cancelButton.type = "button";
            cancelButton.textContent = "Batalkan";
            cancelButton.className = "rounded bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:bg-gray-300 disabled:text-gray-600";
            cancelButton.disabled = !canCancelBooking(data);
            cancelButton.addEventListener("click", () => cancelBooking(id, data));
            actionCell.appendChild(cancelButton);
            row.appendChild(actionCell);

            myBookingList.appendChild(row);
        });
}

async function loadMyBookings(){
    const emailValue = lookupEmail.value.trim().toLowerCase();
    const codeValue = lookupCode.value.trim().toUpperCase();

    myBookingList.replaceChildren();

    if(!emailValue || !codeValue){
        myBookingsMessage.textContent = "Masukkan email pemesan dan kode booking terlebih dahulu.";
        return;
    }

    if(!validGuestEmail(emailValue)){
        myBookingsMessage.textContent = "Format email pemesan tidak valid.";
        return;
    }

    if(!/^HTL-[0-9]{6}-[A-Z0-9]{5}$/.test(codeValue)){
        myBookingsMessage.textContent = "Format kode booking tidak valid. Contoh: HTL-123456-ABCDE.";
        return;
    }

    myBookingsMessage.textContent = "Memuat booking...";

    try {
        await getUser();

        const doc = await db.collection("bookings").doc(codeValue).get();

        if(!doc.exists){
            renderMyBookings([]);
            return;
        }

        const data = doc.data();

        if(data.userEmail !== emailValue || data.bookingCode !== codeValue){
            renderMyBookings([]);
            return;
        }

        renderMyBookings([{
            id: doc.id,
            data
        }]);
    } catch (error) {
        myBookingsMessage.textContent = "Gagal mengecek booking: " + getAuthErrorMessage(error);
    }
}

async function save(){
    if(!room){
        alert("Pilih kamar terlebih dahulu dari halaman Akomodasi.");
        location.href = "akomodasi.html";
        return;
    }

    hitung();

    const nameValue = guestName.value.trim();
    const emailValue = guestEmail.value.trim().toLowerCase();
    const phoneValue = guestPhone.value.trim();
    const guestValue = clampNumber(guestCount.value, 1, 10);
    const roomValue = clampNumber(roomCount.value, 1, 5);
    const nightsValue = Number(lama.value.replace(" malam", ""));

    guestCount.value = guestValue;
    roomCount.value = roomValue;

    if(!nameValue || !emailValue || !phoneValue || !paymentMethod.value){
        alert("Lengkapi data pemesan dan metode pembayaran!");
        return;
    }

    if(nameValue.length < 2 || nameValue.length > 80){
        alert("Nama pemesan harus 2-80 karakter.");
        return;
    }

    if(!validGuestEmail(emailValue)){
        alert("Format email tidak valid.");
        return;
    }

    if(!validGuestPhone(phoneValue)){
        alert("Nomor HP harus 8-20 karakter dan hanya berisi angka atau simbol telepon.");
        return;
    }

    if(!checkin.value || !checkout.value || !totalHarga || nightsValue < 1 || nightsValue > 30){
        alert("Lengkapi tanggal check-in dan check-out dengan benar!");
        return;
    }

    setBookingLoading(true);

    try {
        const user = await getUser();
        const bookingCode = makeBookingCode();
        const bookingData = {
            userId: user.uid,
            userName: nameValue,
            userEmail: emailValue,
            userPhone: phoneValue,
            bookingCode,
            room: room.nama,
            roomPrice: room.harga,
            checkin: checkin.value,
            checkout: checkout.value,
            nights: nightsValue,
            guests: guestValue,
            rooms: roomValue,
            paymentMethod: paymentMethod.value,
            status: "Menunggu Pembayaran",
            total: totalHarga,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection("bookings").doc(bookingCode).set(bookingData);

        showBookingResult(bookingData);
        guestName.value = "";
        guestEmail.value = "";
        guestPhone.value = "";
        paymentMethod.value = "";
        bookingMessage.value = "";
        checkin.value = "";
        checkout.value = "";
        guestCount.value = 1;
        roomCount.value = 1;
        lama.value = "";
        total.value = "";
        totalHarga = 0;
        updateSummary();
        renderMyBookings([{
            id: bookingCode,
            data: bookingData
        }]);
    } catch (error) {
        if(error && error.code && error.code.startsWith("auth/")){
            alert("Gagal menyiapkan login tamu: " + getAuthErrorMessage(error));
        }else{
            alert("Booking gagal: " + getBookingErrorMessage(error));
        }
    } finally {
        setBookingLoading(false);
    }
}
bookingButton.addEventListener("click", save);
refreshMyBookings.addEventListener("click", loadMyBookings);
window.save = save;
updateSummary();
