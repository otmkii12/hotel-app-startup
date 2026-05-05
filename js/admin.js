const table = document.getElementById("adminList");
window.ADMIN_EMAILS = window.ADMIN_EMAILS || ["rifkiagung874@gmail.com"];

function formatRupiah(value){
    return "Rp " + Number(value).toLocaleString("id-ID");
}

function isAdminUser(user){
    return user
        && user.emailVerified === true
        && window.ADMIN_EMAILS.includes(user.email);
}

function setTextCell(row, value){
    const cell = document.createElement("td");
    cell.textContent = value || "-";
    row.appendChild(cell);
    return cell;
}

function makeButton(label, className, onClick){
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = className;
    button.addEventListener("click", onClick);
    return button;
}

function load(){
db.collection("bookings")
.orderBy("createdAt","desc")
.onSnapshot(snapshot => {

    table.replaceChildren();

    snapshot.forEach(doc => {
        let d = doc.data();
        const row = document.createElement("tr");

        setTextCell(row, d.bookingCode);

        const userCell = document.createElement("td");
        userCell.textContent = d.userName || "-";
        userCell.appendChild(document.createElement("br"));

        const userDetail = document.createElement("small");
        userDetail.textContent = `${d.userEmail || "-"} | ${d.userPhone || "-"}`;
        userCell.appendChild(userDetail);
        row.appendChild(userCell);

        setTextCell(row, d.room);
        setTextCell(row, d.checkin);
        setTextCell(row, d.checkout);
        setTextCell(row, d.status || "Menunggu Pembayaran");
        setTextCell(row, formatRupiah(d.total));

        const actionCell = document.createElement("td");
        actionCell.className = "whitespace-nowrap";
        actionCell.appendChild(makeButton(
            "Konfirmasi",
            "bg-green-500 text-white px-2 py-1 rounded",
            () => ubahStatus(doc.id, "Dikonfirmasi")
        ));
        actionCell.appendChild(document.createTextNode(" "));
        actionCell.appendChild(makeButton(
            "Hapus",
            "bg-red-500 text-white px-2 py-1 rounded",
            () => hapus(doc.id)
        ));
        row.appendChild(actionCell);

        table.appendChild(row);
    });

});
}

function ubahStatus(id, status){
    if(!auth.currentUser || !isAdminUser(auth.currentUser)){
        alert("Sesi admin tidak valid.");
        return;
    }

    db.collection("bookings").doc(id).update({ status })
    .catch(error => alert("Gagal mengubah status: " + error.message));
}

function hapus(id){
    if(!auth.currentUser || !isAdminUser(auth.currentUser)){
        alert("Sesi admin tidak valid.");
        return;
    }

    if(confirm("Hapus booking ini?")){
        db.collection("bookings").doc(id).delete()
        .catch(error => alert("Gagal menghapus booking: " + error.message));
    }
}

auth.onAuthStateChanged(user => {
    if(isAdminUser(user)){
        load();
    }
});
