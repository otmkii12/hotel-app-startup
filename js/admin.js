const table = document.getElementById("adminList");
window.ADMIN_EMAILS = window.ADMIN_EMAILS || ["rifkiagung874@gmail.com"];
const bookingSearch = document.getElementById("bookingSearch");
const emptySearchMessage = document.getElementById("emptySearchMessage");
const ALLOWED_ROOMS = {
    "Deluxe Room": 800000,
    "Suite Room": 1500000,
    "Family Room": 1200000
};
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const editId = document.getElementById("editId");
const editUserName = document.getElementById("editUserName");
const editUserEmail = document.getElementById("editUserEmail");
const editUserPhone = document.getElementById("editUserPhone");
const editRoom = document.getElementById("editRoom");
const editCheckin = document.getElementById("editCheckin");
const editCheckout = document.getElementById("editCheckout");
const editGuests = document.getElementById("editGuests");
const editRooms = document.getElementById("editRooms");
const editPaymentMethod = document.getElementById("editPaymentMethod");
const editStatus = document.getElementById("editStatus");
const editNightsPreview = document.getElementById("editNightsPreview");
const editTotalPreview = document.getElementById("editTotalPreview");
const saveEdit = document.getElementById("saveEdit");
let bookings = [];
const ROOM_ORDER = ["Deluxe Room", "Suite Room", "Family Room"];

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
    cell.className = "border-t px-3 py-3 align-top";
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

function validEmail(value){
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function validPhone(value){
    return /^[0-9+()\-\s]{8,20}$/.test(value);
}

function clampNumber(value, min, max){
    const number = Number(value);

    if(!Number.isFinite(number)){
        return min;
    }

    return Math.min(Math.max(number, min), max);
}

function calculateEditedBooking(){
    const checkinDate = new Date(editCheckin.value);
    const checkoutDate = new Date(editCheckout.value);
    const roomName = editRoom.value;
    const roomPrice = ALLOWED_ROOMS[roomName] || 0;
    const roomCount = clampNumber(editRooms.value, 1, 5);
    const nights = (checkoutDate - checkinDate) / (1000 * 60 * 60 * 24);

    if(!roomPrice || !editCheckin.value || !editCheckout.value || nights < 1 || nights > 30){
        return null;
    }

    return {
        roomPrice,
        nights,
        total: roomPrice * nights * roomCount
    };
}

function updateEditPreview(){
    const calculation = calculateEditedBooking();

    if(!calculation){
        editNightsPreview.textContent = "-";
        editTotalPreview.textContent = "-";
        return;
    }

    editNightsPreview.textContent = calculation.nights;
    editTotalPreview.textContent = formatRupiah(calculation.total);
}

function closeEditModal(){
    editModal.classList.add("hidden");
    editModal.classList.remove("flex");
    editForm.reset();
    editId.value = "";
    updateEditPreview();
}

function openEditModal(id, data){
    editId.value = id;
    editUserName.value = data.userName || "";
    editUserEmail.value = data.userEmail || "";
    editUserPhone.value = data.userPhone || "";
    editRoom.value = data.room || "Deluxe Room";
    editCheckin.value = data.checkin || "";
    editCheckout.value = data.checkout || "";
    editGuests.value = data.guests || 1;
    editRooms.value = data.rooms || 1;
    editPaymentMethod.value = data.paymentMethod || "Transfer Bank";
    editStatus.value = data.status || "Menunggu Pembayaran";
    updateEditPreview();

    editModal.classList.remove("hidden");
    editModal.classList.add("flex");
}

function setEditLoading(isLoading){
    saveEdit.disabled = isLoading;
    saveEdit.textContent = isLoading ? "Menyimpan..." : "Simpan";
    saveEdit.classList.toggle("opacity-70", isLoading);
    saveEdit.classList.toggle("cursor-not-allowed", isLoading);
}

function bookingMatchesSearch(data, keyword){
    if(!keyword){
        return true;
    }

    const searchableText = [
        data.bookingCode,
        data.userName,
        data.userEmail,
        data.userPhone,
        data.room,
        data.checkin,
        data.checkout,
        data.status,
        data.paymentMethod
    ].join(" ").toLowerCase();

    return searchableText.includes(keyword);
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

function groupBookingsByRoom(items){
    return items.reduce((groups, booking) => {
        const roomName = booking.data.room || "Kamar Tidak Diketahui";

        if(!groups[roomName]){
            groups[roomName] = [];
        }

        groups[roomName].push(booking);
        return groups;
    }, {});
}

function getOrderedRoomNames(groups){
    const knownRooms = ROOM_ORDER.filter(roomName => groups[roomName]);
    const otherRooms = Object.keys(groups)
        .filter(roomName => !ROOM_ORDER.includes(roomName))
        .sort();

    return [...knownRooms, ...otherRooms];
}

function renderRoomGroupHeader(roomName, groupItems){
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    const total = groupItems.reduce((sum, item) => sum + Number(item.data.total || 0), 0);
    const roomCount = groupItems.reduce((sum, item) => sum + Number(item.data.rooms || 0), 0);

    cell.colSpan = 8;
    cell.className = "border-t bg-gray-100 px-3 py-3";
    cell.innerHTML = `
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <strong class="text-gray-900">${roomName}</strong>
            <span class="text-xs font-medium text-gray-600">${groupItems.length} booking | ${roomCount} kamar | ${formatRupiah(total)}</span>
        </div>
    `;
    row.appendChild(cell);
    table.appendChild(row);
}

function renderBookingRow(id, d){
    const row = document.createElement("tr");
    row.className = "odd:bg-white even:bg-gray-50 hover:bg-yellow-50";

    setTextCell(row, d.bookingCode);

    const userCell = document.createElement("td");
    userCell.className = "border-t px-3 py-3 align-top";
    userCell.innerHTML = `
        <strong class="block text-gray-900">${d.userName || "-"}</strong>
        <span class="block text-xs text-gray-500">${d.userEmail || "-"}</span>
        <span class="block text-xs text-gray-500">${d.userPhone || "-"}</span>
    `;
    row.appendChild(userCell);

    setTextCell(row, d.room);
    setTextCell(row, d.checkin);
    setTextCell(row, d.checkout);

    const statusCell = document.createElement("td");
    statusCell.className = "border-t px-3 py-3 align-top";
    statusCell.appendChild(makeStatusBadge(d.status));
    row.appendChild(statusCell);

    const totalCell = setTextCell(row, formatRupiah(d.total));
    totalCell.classList.add("font-semibold");

    const actionCell = document.createElement("td");
    actionCell.className = "border-t px-3 py-3 align-top whitespace-nowrap";
    actionCell.appendChild(makeButton(
        "Edit",
        "rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600",
        () => openEditModal(id, d)
    ));
    actionCell.appendChild(document.createTextNode(" "));
    actionCell.appendChild(makeButton(
        "Konfirmasi",
        "rounded bg-green-500 px-2 py-1 text-white hover:bg-green-600",
        () => ubahStatus(id, "Dikonfirmasi")
    ));
    actionCell.appendChild(document.createTextNode(" "));
    actionCell.appendChild(makeButton(
        "Hapus",
        "rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600",
        () => hapus(id)
    ));
    row.appendChild(actionCell);

    table.appendChild(row);
}

function renderBookings(){
    const keyword = bookingSearch.value.trim().toLowerCase();
    const filteredBookings = bookings.filter(({ data }) => bookingMatchesSearch(data, keyword));
    const groupedBookings = groupBookingsByRoom(filteredBookings);
    const roomNames = getOrderedRoomNames(groupedBookings);

    table.replaceChildren();
    emptySearchMessage.classList.toggle("hidden", filteredBookings.length > 0);

    roomNames.forEach(roomName => {
        const groupItems = groupedBookings[roomName];
        renderRoomGroupHeader(roomName, groupItems);
        groupItems.forEach(({ id, data }) => renderBookingRow(id, data));
    });
}

function load(){
db.collection("bookings")
.orderBy("createdAt","desc")
.onSnapshot(snapshot => {
    bookings = [];

    snapshot.forEach(doc => {
        bookings.push({
            id: doc.id,
            data: doc.data()
        });
    });

    renderBookings();
});
}

function getEditedBookingData(){
    const nameValue = editUserName.value.trim();
    const emailValue = editUserEmail.value.trim().toLowerCase();
    const phoneValue = editUserPhone.value.trim();
    const guestValue = clampNumber(editGuests.value, 1, 10);
    const roomValue = clampNumber(editRooms.value, 1, 5);
    const calculation = calculateEditedBooking();

    editGuests.value = guestValue;
    editRooms.value = roomValue;

    if(nameValue.length < 2 || nameValue.length > 80){
        alert("Nama pemesan harus 2-80 karakter.");
        return null;
    }

    if(!validEmail(emailValue)){
        alert("Format email tidak valid.");
        return null;
    }

    if(!validPhone(phoneValue)){
        alert("Nomor HP harus 8-20 karakter dan hanya berisi angka atau simbol telepon.");
        return null;
    }

    if(!calculation){
        alert("Tanggal check-in dan check-out harus benar. Lama menginap 1-30 malam.");
        return null;
    }

    return {
        userName: nameValue,
        userEmail: emailValue,
        userPhone: phoneValue,
        room: editRoom.value,
        roomPrice: calculation.roomPrice,
        checkin: editCheckin.value,
        checkout: editCheckout.value,
        nights: calculation.nights,
        guests: guestValue,
        rooms: roomValue,
        paymentMethod: editPaymentMethod.value,
        status: editStatus.value,
        total: calculation.total
    };
}

function updateBooking(event){
    event.preventDefault();

    if(!auth.currentUser || !isAdminUser(auth.currentUser)){
        alert("Sesi admin tidak valid.");
        return;
    }

    const editedBooking = getEditedBookingData();

    if(!editedBooking){
        return;
    }

    setEditLoading(true);

    db.collection("bookings").doc(editId.value).update(editedBooking)
    .then(() => closeEditModal())
    .catch(error => alert("Gagal update data: " + error.message))
    .finally(() => setEditLoading(false));
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

editForm.addEventListener("submit", updateBooking);
document.getElementById("closeEditModal").addEventListener("click", closeEditModal);
document.getElementById("cancelEdit").addEventListener("click", closeEditModal);
editModal.addEventListener("click", event => {
    if(event.target === editModal){
        closeEditModal();
    }
});
[editRoom, editCheckin, editCheckout, editRooms].forEach(input => {
    input.addEventListener("input", updateEditPreview);
    input.addEventListener("change", updateEditPreview);
});
bookingSearch.addEventListener("input", renderBookings);