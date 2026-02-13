document.addEventListener("DOMContentLoaded",()=>{

const menuOpen = document.getElementById("menu-open");
const menuClose = document.getElementById("menu-close");
const menuPanel = document.getElementById("menu-panel");
const themeBtn = document.getElementById("theme-toggle");

/* MENU OPEN */

menuOpen.addEventListener("click",()=>{
  menuPanel.classList.add("open");
});

/* MENU CLOSE */

menuClose.addEventListener("click",()=>{
  menuPanel.classList.remove("open");
});

/* THEME TOGGLE */

themeBtn.addEventListener("click",()=>{

  document.body.classList.toggle("light");

});

});
