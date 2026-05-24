const API_BASE = (() => {
    const host = window.location.host;
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
        return '/backend/api';
    }
    return 'https://api.your-domain.com';
})();

const api = {
    async request(endpoint, options = {}) {
        let token = null;
        if (auth && auth.currentUser) {
            try {
                token = await auth.currentUser.getIdToken();
            } catch (e) {
            }
        }

        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }

        const response = await fetch(API_BASE + '/' + endpoint, {
            ...options,
            headers: { ...headers, ...options.headers },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    },

    getBookings(firebaseUid) {
        return this.request('bookings.php?firebase_uid=' + encodeURIComponent(firebaseUid));
    },

    getBooking(bookingId) {
        return this.request('bookings.php?booking_id=' + bookingId);
    },

    getAllBookings() {
        return this.request('bookings.php?all=true');
    },

    createBooking(data) {
        return this.request('bookings.php', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateBooking(data) {
        return this.request('bookings.php', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteBooking(bookingId) {
        return this.request('bookings.php?booking_id=' + bookingId, {
            method: 'DELETE',
        });
    },

    getRooms() {
        return this.request('rooms.php');
    },

    getRoom(id) {
        return this.request('rooms.php?id=' + id);
    },

    getUser(firebaseUid) {
        return this.request('users.php?firebase_uid=' + encodeURIComponent(firebaseUid));
    },

    createUser(data) {
        return this.request('users.php', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    checkAvailability(room, checkin, checkout) {
        const params = new URLSearchParams({ room, checkin, checkout });
        return this.request('availability.php?' + params.toString());
    },
};
