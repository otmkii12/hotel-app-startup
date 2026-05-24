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

if(!room){
    alert("Pilih kamar terlebih dahulu!");
    location.href = "akomodasi.html";
    throw new Error("Booking room data is missing");
}

localStorage.setItem("booking", JSON.stringify(room));
localStorage.setItem("room", JSON.stringify(room));

const checkin = document.getElementById("checkin");
const checkout = document.getElementById("checkout");
const guestName = document.getElementById("guestName");
const guestEmail = document.getElementById("guestEmail");
const guestPhone = document.getElementById("guestPhone");
const guestCount = document.getElementById("guestCount");
const roomCount = document.getElementById("roomCount");
const paymentMethod = document.getElementById("paymentMethod");
const lama = document.getElementById("lama");
const total = document.getElementById("total");
const bookingButton = document.getElementById("bookingButton");
let totalHarga = 0;

document.getElementById("room").innerText =
room.nama + " - " + formatRupiah(room.harga);

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

function getAuthErrorMessage(error){
    if(error && error.code === "auth/admin-restricted-operation"){
        return "Login tamu belum diaktifkan. Aktifkan provider Anonymous di Firebase Authentication.";
    }

    return error.message;
}

function hitung(){
    let ci = new Date(checkin.value);
    let co = new Date(checkout.value);
    let jumlahKamar = clampNumber(roomCount.value, 1, 5);
    roomCount.value = jumlahKamar;

    let hari = (co - ci)/(1000*60*60*24);

    if(hari <= 0 || hari > 30){
        lama.value = "";
        total.value = "";
        totalHarga = 0;
        return;
    }

    lama.value = hari;
    totalHarga = hari * room.harga * jumlahKamar;
    total.value = formatRupiah(totalHarga);
}

checkin.onchange = hitung;
checkout.onchange = hitung;
roomCount.onchange = hitung;
roomCount.oninput = hitung;

function setBookingLoading(isLoading){
    bookingButton.disabled = isLoading;
    bookingButton.textContent = isLoading ? "Menyimpan..." : "Booking";
    bookingButton.classList.toggle("opacity-70", isLoading);
    bookingButton.classList.toggle("cursor-not-allowed", isLoading);
}

function getUser(){
    return auth.currentUser || auth.signInAnonymously().then(result => result.user);
}

async function save(){
    hitung();

    const nameValue = guestName.value.trim();
    const emailValue = guestEmail.value.trim().toLowerCase();
    const phoneValue = guestPhone.value.trim();
    const guestValue = clampNumber(guestCount.value, 1, 10);
    const roomValue = clampNumber(roomCount.value, 1, 5);
    const nightsValue = Number(lama.value);

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

        await db.collection("bookings").add({
            userId: user.uid,
            userName: nameValue,
            userEmail: emailValue,
            userPhone: phoneValue,
            bookingCode: makeBookingCode(),
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
        });

        alert("Booking berhasil!");
        guestName.value = "";
        guestEmail.value = "";
        guestPhone.value = "";
        paymentMethod.value = "";
        checkin.value = "";
        checkout.value = "";
        guestCount.value = 1;
        roomCount.value = 1;
        lama.value = "";
        total.value = "";
        totalHarga = 0;
    } catch (error) {
        if(error && error.code && error.code.startsWith("auth/")){
            alert("Gagal menyiapkan login tamu: " + getAuthErrorMessage(error));
        }else{
            alert("Booking gagal: " + error.message);
        }
    } finally {
        setBookingLoading(false);
    }
}
bookingButton.addEventListener("click", save);
window.save = save;
