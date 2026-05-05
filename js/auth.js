auth.onAuthStateChanged(user => {
    if(!user && location.pathname !== "/index.html"){
        location.href = "index.html";
    }
});