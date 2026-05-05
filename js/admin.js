const table = document.getElementById("adminList");

function formatRupiah(value){
    return "Rp " + Number(value).toLocaleString("id-ID");
}

function load(){
db.collection("bookings")
.orderBy("createdAt","desc")
.onSnapshot(snapshot => {

    table.innerHTML = "";

    snapshot.forEach(doc => {
        let d = doc.data();

        table.innerHTML += `
        <tr>
            <td>${d.bookingCode || "-"}</td>
            <td>
                ${d.userName}<br>
                <small>${d.userEmail || "-"} | ${d.userPhone || "-"}</small>
            </td>
            <td>${d.room}</td>
            <td>${d.checkin}</td>
            <td>${d.checkout}</td>
            <td>${d.status || "Menunggu Pembayaran"}</td>
            <td>${formatRupiah(d.total)}</td>
            <td class="whitespace-nowrap">
                <button onclick="ubahStatus('${doc.id}', 'Dikonfirmasi')"
                class="bg-green-500 text-white px-2 py-1 rounded">
                Konfirmasi
                </button>
                <button onclick="hapus('${doc.id}')"
                class="bg-red-500 text-white px-2 py-1 rounded">
                Hapus
                </button>
            </td>
        </tr>`;
    });

});
}

function ubahStatus(id, status){
    db.collection("bookings").doc(id).update({ status });
}

function hapus(id){
    if(confirm("Hapus booking ini?")){
        db.collection("bookings").doc(id).delete();
    }
}

auth.onAuthStateChanged(user => {
    if(user && user.email === "rifkiagung874@gmail.com"){
        load();
    }
});
