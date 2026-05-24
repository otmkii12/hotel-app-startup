const ADMIN_EMAILS = ["rifkiagung874@gmail.com"];

function isAdminUser(user) {
    return user
        && user.emailVerified === true
        && ADMIN_EMAILS.includes(user.email);
}

function requireAuth() {
    if (!auth.currentUser) {
        location.href = "index.html";
        return null;
    }
    return auth.currentUser;
}

auth.onAuthStateChanged(user => {
    document.body.classList.toggle('auth-loaded', true);

    if (!user && !window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('akomodasi.html') && !window.location.pathname.endsWith('rooms.html') && !window.location.pathname.endsWith('gallery.html')) {
        const publicPages = ['akomodasi.html', 'rooms.html', 'gallery.html', 'index.html'];
        const currentPage = window.location.pathname.split('/').pop();
        if (!publicPages.includes(currentPage)) {
            location.href = "index.html";
        }
    }
});
