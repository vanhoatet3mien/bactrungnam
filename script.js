/* MENU */
document.getElementById("menu-toggle").onclick = () => {
    document.getElementById("side-menu").classList.toggle("open");
};

/* CHUYỂN TRANG */
function showPage(id){
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    document.getElementById("side-menu").classList.remove("open");
}

/* ACCORDION */
document.addEventListener("click", e=>{
    if(e.target.classList.contains("accordion-button")){
        let item = e.target.nextElementSibling;
        item.style.maxHeight = item.style.maxHeight ? null : item.scrollHeight + "px";
    }
});

/* KÉO + ZOOM BẢN ĐỒ */
const map = document.getElementById("map");
let isDragging = false, startX, startY, translateX = 0, translateY = 0;
let scale = 1;

map.addEventListener("mousedown", e=>{
    isDragging = true;
    startX = e.clientX - translateX;
    startY = e.clientY - translateY;
});

window.addEventListener("mousemove", e=>{
    if(isDragging){
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        map.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
});

window.addEventListener("mouseup", ()=> isDragging = false);

window.addEventListener("wheel", e=>{
    e.preventDefault();
    scale += e.deltaY * -0.001;
    scale = Math.min(Math.max(.6, scale), 2.5);
    map.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
});
