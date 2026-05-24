const toggleButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const bookingForm = document.querySelector(".booking-form");
const availabilityForm = document.getElementById("availabilityForm");
const availabilityRoom = document.getElementById("availabilityRoom");
const availabilityCheckin = document.getElementById("availabilityCheckin");
const availabilityCheckout = document.getElementById("availabilityCheckout");
const availabilityResult = document.getElementById("availabilityResult");
const bookedList = document.getElementById("bookedList");

if (toggleButton && navLinks) {
    toggleButton.addEventListener("click", () => {
        const isOpen = navLinks.classList.toggle("open");
        toggleButton.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.addEventListener("click", (event) => {
        if (event.target.tagName === "A") {
            navLinks.classList.remove("open");
            toggleButton.setAttribute("aria-expanded", "false");
        }
    });
}

if (bookingForm) {
    bookingForm.addEventListener("submit", (event) => {
        event.preventDefault();
        location.href = "akomodasi.html";
    });
}

function setAvailabilityMessage(message, status) {
    availabilityResult.textContent = message;
    availabilityResult.className = "availability-result";
    if (status) {
        availabilityResult.classList.add(status);
    }
}

function dateRangesOverlap(startDate, endDate, bookedStart, bookedEnd) {
    return startDate < bookedEnd && endDate > bookedStart;
}

function renderBookedList(conflicting) {
    bookedList.replaceChildren();
    conflicting.forEach(booking => {
        const item = document.createElement("li");
        item.textContent = `${booking.checkin} sampai ${booking.checkout} - ${booking.status || "Menunggu Pembayaran"}`;
        bookedList.appendChild(item);
    });
}

async function checkAvailability(event) {
    event.preventDefault();

    const room = availabilityRoom.value;
    const checkin = availabilityCheckin.value;
    const checkout = availabilityCheckout.value;
    const submitButton = availabilityForm.querySelector("button");

    renderBookedList([]);

    if (!room || !checkin || !checkout) {
        setAvailabilityMessage("Pilih kamar, tanggal check-in, dan tanggal check-out terlebih dahulu.", "error");
        return;
    }

    if (new Date(checkout) <= new Date(checkin)) {
        setAvailabilityMessage("Tanggal check-out harus setelah tanggal check-in.", "error");
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Mengecek...";
    setAvailabilityMessage("Sedang mengecek data booking...", "");

    try {
        const result = await api.checkAvailability(room, checkin, checkout);

        if (result.data.available) {
            setAvailabilityMessage("Tanggal tersebut masih tersedia untuk kamar ini.", "available");
        } else {
            setAvailabilityMessage("Tanggal tersebut sudah dipakai untuk kamar ini.", "unavailable");
            renderBookedList(result.data.conflicting_bookings || []);
        }
    } catch (error) {
        setAvailabilityMessage("Gagal mengecek data booking: " + error.message, "error");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Cek Tanggal";
    }
}

if (availabilityForm) {
    const today = new Date().toISOString().split("T")[0];
    availabilityCheckin.min = today;
    availabilityCheckout.min = today;
    availabilityCheckin.addEventListener("change", () => {
        availabilityCheckout.min = availabilityCheckin.value || today;
    });
    availabilityForm.addEventListener("submit", checkAvailability);
}
