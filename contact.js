// Barre de contact (WhatsApp, Appel, SMS, Coordonnées) et section « Nous trouver »
(function () {
  var NUMERO = "2250799142133";
  var ADRESSE = "Angré Nouveau CHU, Abidjan";
  var TEL_AFFICHE = "07 99 14 21 33";
  var HORAIRES = "Mardi au dimanche : 9h – 22h30 (fermé le lundi)";

  // --- Section « Nous trouver » ---
  var adr = document.getElementById("owner-address-display");
  var tel = document.getElementById("owner-phone-display");
  if (adr) adr.textContent = ADRESSE;
  if (tel) {
    tel.textContent = "";
    var lien = document.createElement("a");
    lien.href = "tel:+" + NUMERO; lien.textContent = TEL_AFFICHE;
    tel.appendChild(lien);
  }
  var info = document.querySelector(".location-info");
  if (info && !document.getElementById("horaires-display")) {
    var h = document.createElement("h3"); h.textContent = "Horaires";
    var p = document.createElement("p"); p.id = "horaires-display";
    p.textContent = HORAIRES;
    var it = document.createElement("p");
    var a = document.createElement("a");
    a.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ADRESSE);
    a.target = "_blank"; a.rel = "noopener"; a.textContent = "Ouvrir l'itinéraire dans Google Maps";
    it.appendChild(a);
    info.append(h, p, it);
  }
  var carte = document.getElementById("map-container");
  if (carte && !carte.querySelector("iframe")) {
    var f = document.createElement("iframe");
    f.src = "https://maps.google.com/maps?q=" + encodeURIComponent(ADRESSE) + "&output=embed";
    f.width = "100%"; f.height = "300"; f.style.border = "0"; f.loading = "lazy";
    f.title = "Carte de localisation de MR PAPRIKA";
    carte.appendChild(f);
  }

  // --- Barre de contact en bas de l'écran ---
  var ancien = document.getElementById("wa-float");
  if (ancien) ancien.remove();
  var msg = encodeURIComponent("Bonjour MR PAPRIKA, je souhaite commander une pizza.");
  var items = [
    { cls: "wa", icone: "fab fa-whatsapp", texte: "WhatsApp", href: "https://wa.me/" + NUMERO + "?text=" + msg, externe: true },
    { icone: "fas fa-phone", texte: "Appel", href: "tel:+" + NUMERO },
    { icone: "fas fa-comment-dots", texte: "SMS", href: "sms:+" + NUMERO + "?body=" + msg },
    { icone: "fas fa-map-marker-alt", texte: "Coordonnées", href: "#location", ouvre: true }
  ];
  var barre = document.createElement("nav");
  barre.className = "contactbar";
  barre.setAttribute("aria-label", "Nous contacter");
  items.forEach(function (x) {
    var l = document.createElement("a");
    l.href = x.href;
    if (x.cls) l.className = x.cls;
    if (x.externe) { l.target = "_blank"; l.rel = "noopener"; }
    var i = document.createElement("i"); i.className = x.icone; i.setAttribute("aria-hidden", "true");
    var s = document.createElement("span"); s.textContent = x.texte;
    l.append(i, s);
    if (x.ouvre) l.addEventListener("click", function () {
      var d = document.getElementById("location"); if (d) d.open = true;
    });
    barre.appendChild(l);
  });
  document.body.appendChild(barre);
  document.body.classList.add("has-contactbar");
})();
