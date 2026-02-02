document.addEventListener("DOMContentLoaded", () => {
  console.log("MIDTERMS JS IS RUNNING");

  const yearSpan = document.getElementById("election-year");
  if (yearSpan) {
    yearSpan.textContent = "2026";
  }
});
