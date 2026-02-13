document.addEventListener("DOMContentLoaded",()=>{

/* =====================
   MENU TOGGLE
===================== */

const menuBtn = document.getElementById("menuBtn");
const panel = document.getElementById("menuPanel");

menuBtn.addEventListener("click",()=>{
  panel.classList.toggle("open");
});

/* =====================
   DARK / LIGHT MODE
===================== */

const themeBtn = document.getElementById("themeToggle");

themeBtn.addEventListener("click",()=>{

  document.body.classList.toggle("light");

  if(document.body.classList.contains("light")){
    document.body.style.background="#fff";
    document.body.style.color="#000";
    themeBtn.textContent="☀️";
  } else {
    document.body.style.background="#000";
    document.body.style.color="#fff";
    themeBtn.textContent="🌙";
  }

});

});
