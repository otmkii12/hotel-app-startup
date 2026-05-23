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

function renderBookedList(bookings) {
    bookedList.replaceChildren();

    bookings.forEach((booking) => {
        const item = document.createElement("li");
        item.textContent = `${booking.checkin} sampai ${booking.checkout} - ${booking.status || "Menunggu Pembayaran"}`;
        bookedList.appendChild(item);
    });
}

function getAvailabilityUser() {
    return auth.currentUser || auth.signInAnonymously().then((result) => result.user);
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
        await getAvailabilityUser();

        const snapshot = await db.collection("bookings")
            .where("room", "==", room)
            .get();

        const selectedStart = new Date(checkin);
        const selectedEnd = new Date(checkout);
        const usedBookings = [];

        snapshot.forEach((doc) => {
            const booking = doc.data();

            if (!booking.checkin || !booking.checkout || booking.status === "Dibatalkan") {
                return;
            }

            if (dateRangesOverlap(
                selectedStart,
                selectedEnd,
                new Date(booking.checkin),
                new Date(booking.checkout)
            )) {
                usedBookings.push(booking);
            }
        });

        if (usedBookings.length > 0) {
            setAvailabilityMessage("Tanggal tersebut sudah dipakai atau sudah dibooking untuk kamar ini.", "unavailable");
            renderBookedList(usedBookings);
            return;
        }

        setAvailabilityMessage("Tanggal tersebut masih tersedia untuk kamar ini.", "available");
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
