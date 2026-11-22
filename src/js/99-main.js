/* 99-main.js – Einstiegspunkt. Muss als letztes Modul geladen werden. */
document.addEventListener('DOMContentLoaded', function () {
  App.UI.init();
  if (location.hash === '#selftest') App.SelfTest.run();
});
