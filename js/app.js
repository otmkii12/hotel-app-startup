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

const room = getRoomFromUrl() || JSON.parse(localStorage.getItem("booking") || localStorage.getItem("room"));

if(!room){
    alert("Pilih kamar terlebih dahulu!");
    location.href = "rooms.html";
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
let totalHarga = 0;

document.getElementById("room").innerText =
room.nama + " - " + formatRupiah(room.harga);

const today = new Date().toISOString().split("T")[0];
checkin.min = today;
checkout.min = today;

function formatRupiah(value){
    return "Rp " + Number(value).toLocaleString("id-ID");
}

function makeBookingCode(){
    const random = Math.random().toString(36).slice(2, 7).toUpperCase();
    return "HTL-" + Date.now().toString().slice(-6) + "-" + random;
}

function hitung(){
    let ci = new Date(checkin.value);
    let co = new Date(checkout.value);
    let jumlahKamar = Number(roomCount.value) || 1;

    let hari = (co - ci)/(1000*60*60*24);

    if(hari <= 0){
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

function getUser(){
    return auth.currentUser || auth.signInAnonymously().then(result => result.user);
}

async function save(){
    const user = await getUser().catch(error => {
        alert("Gagal menyiapkan login tamu: " + error.message);
        return null;
    });

    if(!user){
        return;
    }

    if(!guestName.value || !guestEmail.value || !guestPhone.value || !paymentMethod.value){
        alert("Lengkapi data pemesan dan metode pembayaran!");
        return;
    }

    if(!checkin.value || !checkout.value || !totalHarga){
        alert("Lengkapi tanggal check-in dan check-out dengan benar!");
        return;
    }

    db.collection("bookings").add({
        userId: user.uid,
        userName: guestName.value,
        userEmail: guestEmail.value,
        userPhone: guestPhone.value,
        bookingCode: makeBookingCode(),
        room: room.nama,
        roomPrice: room.harga,
        checkin: checkin.value,
        checkout: checkout.value,
        nights: Number(lama.value),
        guests: Number(guestCount.value) || 1,
        rooms: Number(roomCount.value) || 1,
        paymentMethod: paymentMethod.value,
        status: "Menunggu Pembayaran",
        total: totalHarga,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
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
    }).catch(error => {
        alert("Booking gagal: " + error.message);
    });
}
const list = document.getElementById("list");

function loadMyBooking(){
    const user = auth.currentUser;
    if(!user) return;

    db.collection("bookings")
    .where("userId","==",user.uid)
    .onSnapshot(snapshot => {
        list.innerHTML = "";

        snapshot.forEach(doc => {
            let d = doc.data();

            list.innerHTML += `
            <tr>
                <td>${d.bookingCode || "-"}</td>
                <td>${d.room}</td>
                <td>${d.checkin} - ${d.checkout}</td>
                <td>${d.rooms || 1} kamar, ${d.guests || 1} tamu</td>
                <td>${d.status || "Menunggu Pembayaran"}</td>
                <td>${formatRupiah(d.total)}</td>
            </tr>`;
        });
    });
}

auth.onAuthStateChanged(user => {
    if(user){
        loadMyBooking();
    }else{
        auth.signInAnonymously().catch(error => {
            alert("Gagal masuk sebagai tamu: " + error.message);
        });
    }
});
