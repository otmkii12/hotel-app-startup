function getRoomFromUrl(){
    const params = new URLSearchParams(location.search);

    if(!params.has("nama") || !params.has("harga") || !params.has("img")){
        return null;
    }

    return {
        nama: params.get("nama"),
        harga: Number(params.get("harga")),
        img: params.get("img")
    };
}

let room = getRoomFromUrl() || JSON.parse(localStorage.getItem("room"));

if(!room){
    alert("Pilih kamar terlebih dahulu!");
    location.href = "akomodasi.html";
    throw new Error("Room data is missing");
}

localStorage.setItem("room", JSON.stringify(room));

document.getElementById("nama").innerText = room.nama;
document.getElementById("harga").innerText = "Rp " + room.harga;
document.getElementById("img").src = room.img;


function book(){
    const params = new URLSearchParams(room);

    localStorage.setItem("room", JSON.stringify(room));
    localStorage.setItem("booking", JSON.stringify(room));
    location.href = "dashboard.html?" + params.toString();
}
