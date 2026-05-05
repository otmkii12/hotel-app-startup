function detail(nama, harga, img){
    const room = {nama, harga, img};
    const params = new URLSearchParams(room);

    localStorage.setItem("room", JSON.stringify(room));
    location.href = "detail.html?" + params.toString();
}

function viewRoom(type){
    if(type==="deluxe") detail("Deluxe Room",800000,"https://images.unsplash.com/photo-1631049035182-249067d7618e");
    if(type==="suite") detail("Suite Room",1500000,"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2");
    if(type==="family") detail("Family Room",1200000,"https://images.unsplash.com/photo-1611892440504-42a792e24d32");
}
