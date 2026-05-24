const table = document.getElementById("adminList");
const bookingSearch = document.getElementById("bookingSearch");
const emptySearchMessage = document.getElementById("emptySearchMessage");
const ROOM_ORDER = ["Deluxe Room", "Suite Room", "Family Room"];

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

const ALLOWED_ROOMS = {
    "Deluxe Room": 800000,
    "Suite Room": 1500000,
    "Family Room": 1200000
};

let bookings = [];

function formatRupiah(value) {
    return "Rp " + Number(value).toLocaleString("id-ID");
}

function setTextCell(row, value) {
    const cell = document.createElement("td");
    cell.className = "border-t px-3 py-3 align-top";
    cell.textContent = value || "-";
    row.appendChild(cell);
    return cell;
}

function makeButton(label, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = label;
    button.className = className;
    button.addEventListener("click", onClick);
    return button;
}

function validEmail(value) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function validPhone(value) {
    return /^[0-9+()\-\s]{8,20}$/.test(value);
}

function clampNumber(value, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return min;
    return Math.min(Math.max(number, min), max);
}

function calculateEditedBooking() {
    const checkinDate = new Date(editCheckin.value);
    const checkoutDate = new Date(editCheckout.value);
    const roomName = editRoom.value;
    const roomPrice = ALLOWED_ROOMS[roomName] || 0;
    const roomCnt = clampNumber(editRooms.value, 1, 5);
    const nights = (checkoutDate - checkinDate) / (1000 * 60 * 60 * 24);

    if (!roomPrice || !editCheckin.value || !editCheckout.value || nights < 1 || nights > 30) {
        return null;
    }

    return { roomPrice, nights, total: roomPrice * nights * roomCnt };
}

function updateEditPreview() {
    const calc = calculateEditedBooking();
    if (!calc) {
        editNightsPreview.textContent = "-";
        editTotalPreview.textContent = "-";
        return;
    }
    editNightsPreview.textContent = calc.nights;
    editTotalPreview.textContent = formatRupiah(calc.total);
}

function closeEditModal() {
    editModal.classList.add("hidden");
    editModal.classList.remove("flex");
    editForm.reset();
    editId.value = "";
    updateEditPreview();
}

function openEditModal(id, data) {
    editId.value = id;
    editUserName.value = data.user_name || "";
    editUserEmail.value = data.user_email || "";
    editUserPhone.value = data.user_phone || "";
    editRoom.value = data.room || "Deluxe Room";
    editCheckin.value = data.checkin || "";
    editCheckout.value = data.checkout || "";
    editGuests.value = data.guests || 1;
    editRooms.value = data.rooms || 1;
    editPaymentMethod.value = data.payment_method || "Transfer Bank";
    editStatus.value = data.status || "Menunggu Pembayaran";
    updateEditPreview();

    editModal.classList.remove("hidden");
    editModal.classList.add("flex");
}

function setEditLoading(isLoading) {
    saveEdit.disabled = isLoading;
    saveEdit.textContent = isLoading ? "Menyimpan..." : "Simpan";
    saveEdit.classList.toggle("opacity-70", isLoading);
    saveEdit.classList.toggle("cursor-not-allowed", isLoading);
}

function bookingMatchesSearch(data, keyword) {
    if (!keyword) return true;
    const searchableText = [
        data.booking_code, data.user_name, data.user_email,
        data.user_phone, data.room, data.checkin, data.checkout,
        data.status, data.payment_method
    ].join(" ").toLowerCase();
    return searchableText.includes(keyword);
}

function makeStatusBadge(status) {
    const value = status || "Menunggu Pembayaran";
    const badge = document.createElement("span");
    const colorMap = {
        "Menunggu Pembayaran": "bg-yellow-100 text-yellow-800",
        "Dikonfirmasi": "bg-green-100 text-green-800",
        "Dibatalkan": "bg-red-100 text-red-800",
        "Selesai": "bg-blue-100 text-blue-800"
    };
    badge.className = "inline-flex rounded px-2 py-1 text-xs font-semibold " + (colorMap[value] || "bg-gray-100 text-gray-700");
    badge.textContent = value;
    return badge;
}

function groupBookingsByRoom(items) {
    return items.reduce((groups, item) => {
        const roomName = item.room || "Kamar Tidak Diketahui";
        if (!groups[roomName]) groups[roomName] = [];
        groups[roomName].push(item);
        return groups;
    }, {});
}

function getOrderedRoomNames(groups) {
    const known = ROOM_ORDER.filter(name => groups[name]);
    const other = Object.keys(groups).filter(name => !ROOM_ORDER.includes(name)).sort();
    return [...known, ...other];
}

function renderRoomGroupHeader(roomName, groupItems) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    const total = groupItems.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const roomCnt = groupItems.reduce((sum, item) => sum + Number(item.rooms || 0), 0);

    cell.colSpan = 8;
    cell.className = "border-t bg-gray-100 px-3 py-3";
    cell.innerHTML = `
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <strong class="text-gray-900">${roomName}</strong>
            <span class="text-xs font-medium text-gray-600">${groupItems.length} booking | ${roomCnt} kamar | ${formatRupiah(total)}</span>
        </div>
    `;
    row.appendChild(cell);
    table.appendChild(row);
}

function renderBookingRow(id, d) {
    const row = document.createElement("tr");
    row.className = "odd:bg-white even:bg-gray-50 hover:bg-yellow-50";

    setTextCell(row, d.booking_code);

    const userCell = document.createElement("td");
    userCell.className = "border-t px-3 py-3 align-top";
    userCell.innerHTML = `
        <strong class="block text-gray-900">${d.user_name || "-"}</strong>
        <span class="block text-xs text-gray-500">${d.user_email || "-"}</span>
        <span class="block text-xs text-gray-500">${d.user_phone || "-"}</span>
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
    actionCell.appendChild(makeButton("Edit", "rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600", () => openEditModal(id, d)));
    actionCell.appendChild(document.createTextNode(" "));
    actionCell.appendChild(makeButton("Konfirmasi", "rounded bg-green-500 px-2 py-1 text-white hover:bg-green-600", () => ubahStatus(id, "Dikonfirmasi")));
    actionCell.appendChild(document.createTextNode(" "));
    actionCell.appendChild(makeButton("Hapus", "rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600", () => hapus(id)));
    row.appendChild(actionCell);

    table.appendChild(row);
}

function renderBookings() {
    const keyword = bookingSearch.value.trim().toLowerCase();
    const filtered = bookings.filter(d => bookingMatchesSearch(d, keyword));
    const grouped = groupBookingsByRoom(filtered);
    const roomNames = getOrderedRoomNames(grouped);

    table.replaceChildren();
    emptySearchMessage.classList.toggle("hidden", filtered.length > 0);

    roomNames.forEach(roomName => {
        const items = grouped[roomName];
        renderRoomGroupHeader(roomName, items);
        items.forEach(d => renderBookingRow(d.id, d));
    });
}

async function load() {
    try {
        const result = await api.getAllBookings();
        bookings = result.data || [];
        renderBookings();
    } catch (error) {
        console.error("Failed to load bookings:", error);
    }
}

function getEditedBookingData() {
    const nameValue = editUserName.value.trim();
    const emailValue = editUserEmail.value.trim().toLowerCase();
    const phoneValue = editUserPhone.value.trim();
    const guestValue = clampNumber(editGuests.value, 1, 10);
    const roomValue = clampNumber(editRooms.value, 1, 5);
    const calc = calculateEditedBooking();

    editGuests.value = guestValue;
    editRooms.value = roomValue;

    if (nameValue.length < 2 || nameValue.length > 80) {
        alert("Nama pemesan harus 2-80 karakter.");
        return null;
    }
    if (!validEmail(emailValue)) {
        alert("Format email tidak valid.");
        return null;
    }
    if (!validPhone(phoneValue)) {
        alert("Nomor HP harus 8-20 karakter.");
        return null;
    }
    if (!calc) {
        alert("Tanggal check-in dan check-out harus benar.");
        return null;
    }

    return {
        booking_id: editId.value,
        user_name: nameValue,
        user_email: emailValue,
        user_phone: phoneValue,
        room: editRoom.value,
        checkin: editCheckin.value,
        checkout: editCheckout.value,
        nights: calc.nights,
        guests: guestValue,
        rooms: roomValue,
        payment_method: editPaymentMethod.value,
        status: editStatus.value
    };
}

async function updateBooking(event) {
    event.preventDefault();
    if (!auth.currentUser || !isAdminUser(auth.currentUser)) {
        alert("Sesi admin tidak valid.");
        return;
    }

    const data = getEditedBookingData();
    if (!data) return;

    setEditLoading(true);
    try {
        await api.updateBooking(data);
        closeEditModal();
        await load();
    } catch (error) {
        alert("Gagal update data: " + error.message);
    } finally {
        setEditLoading(false);
    }
}

async function ubahStatus(id, status) {
    if (!auth.currentUser || !isAdminUser(auth.currentUser)) {
        alert("Sesi admin tidak valid.");
        return;
    }
    try {
        await api.updateBooking({ booking_id: id, status });
        await load();
    } catch (error) {
        alert("Gagal mengubah status: " + error.message);
    }
}

async function hapus(id) {
    if (!auth.currentUser || !isAdminUser(auth.currentUser)) {
        alert("Sesi admin tidak valid.");
        return;
    }
    if (confirm("Hapus booking ini?")) {
        try {
            await api.deleteBooking(id);
            await load();
        } catch (error) {
            alert("Gagal menghapus booking: " + error.message);
        }
    }
}

auth.onAuthStateChanged(user => {
    if (isAdminUser(user)) {
        load();
    }
});

editForm.addEventListener("submit", updateBooking);
document.getElementById("closeEditModal").addEventListener("click", closeEditModal);
document.getElementById("cancelEdit").addEventListener("click", closeEditModal);
editModal.addEventListener("click", event => {
    if (event.target === editModal) closeEditModal();
});
[editRoom, editCheckin, editCheckout, editRooms].forEach(input => {
    input.addEventListener("input", updateEditPreview);
    input.addEventListener("change", updateEditPreview);
});
bookingSearch.addEventListener("input", renderBookings);
