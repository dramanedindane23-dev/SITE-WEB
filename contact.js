// Barre de contact (WhatsApp, Appel, SMS, Coordonnées), section « Nous trouver » et chat « Contactez-nous » par WhatsApp
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

  // --- Chat « Contactez-nous » : le message est envoyé par WhatsApp au restaurant ---
  var ancienForm = document.getElementById("chat-form");
  if (ancienForm) {
    var form = ancienForm.cloneNode(true);       // retire l'ancien gestionnaire de script.js (stockage local inutile)
    ancienForm.replaceWith(form);
    var vieux = document.getElementById("chat-messages");
    if (vieux) vieux.hidden = true;
    var bouton = form.querySelector('button[type="submit"]');
    if (bouton) bouton.textContent = "Préparer mon message WhatsApp";
    var zone = document.createElement("div");
    zone.setAttribute("aria-live", "polite");
    form.appendChild(zone);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nom = document.getElementById("chat-name").value.trim();
      var msg = document.getElementById("chat-message").value.trim();
      zone.textContent = "";
      if (!nom || !msg) return;
      var texte = "Bonjour MR PAPRIKA,\n\n" + msg + "\n\n— " + nom + " (message envoyé depuis le site)";
      var p1 = document.createElement("p");
      p1.textContent = "Dernière étape : appuyez sur le bouton vert, puis sur « Envoyer » dans WhatsApp. Votre message n'est reçu que lorsqu'il est envoyé.";
      var l = document.createElement("a");
      l.href = "https://wa.me/" + NUMERO + "?text=" + encodeURIComponent(texte);
      l.target = "_blank"; l.rel = "noopener"; l.textContent = "Envoyer sur WhatsApp";
      l.style.cssText = "display:inline-block;margin-top:8px;padding:14px 24px;border-radius:999px;background:#25d366;color:#fff;font-weight:700;text-decoration:none";
      l.addEventListener("click", function () {
        setTimeout(function () {
          document.getElementById("chat-message").value = "";
          zone.textContent = "Merci ! Nous vous répondons dès que possible.";
        }, 400);
      });
      zone.append(p1, l);
    });
  }

  // --- Barre de contact en bas de l'écran ---
  var ancien = document.getElementById("wa-float");
  if (ancien) ancien.remove();
  var msgBarre = encodeURIComponent("Bonjour MR PAPRIKA, je souhaite commander une pizza.");
  var items = [
    { cls: "wa", icone: "fab fa-whatsapp", texte: "WhatsApp", href: "https://wa.me/" + NUMERO + "?text=" + msgBarre, externe: true },
    { icone: "fas fa-phone", texte: "Appel", href: "tel:+" + NUMERO },
    { icone: "fas fa-comment-dots", texte: "SMS", href: "sms:+" + NUMERO + "?body=" + msgBarre },
    { icone: "fas fa-map-marker-alt", texte: "Coordonnées", href: "#location", ouvre: true }
  ];
  var barre = document.createElement("nav");
  barre.className = "contactbar";
  barre.setAttribute("aria-label", "Nous contacter");
  items.forEach(function (x) {
    var lk = document.createElement("a");
    lk.href = x.href;
    if (x.cls) lk.className = x.cls;
    if (x.externe) { lk.target = "_blank"; lk.rel = "noopener"; }
    var i = document.createElement("i"); i.className = x.icone; i.setAttribute("aria-hidden", "true");
    var s = document.createElement("span"); s.textContent = x.texte;
    lk.append(i, s);
    if (x.ouvre) lk.addEventListener("click", function () {
      var d = document.getElementById("location"); if (d) d.open = true;
    });
    barre.appendChild(lk);
  });
  document.body.appendChild(barre);
  document.body.classList.add("has-contactbar");
})();
