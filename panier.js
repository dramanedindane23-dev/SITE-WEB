// Panier en FCFA branché sur l'espace admin, commande envoyée par WhatsApp.
(function () {
  var NUMERO = "2250799142133";

  var CFG = { apiKey: "AIzaSyDtr8Eb-npB9m2OArnkKXhhLr7P-v42waA", authDomain: "mr-paprika.firebaseapp.com", projectId: "mr-paprika" };
  var PIZZAS = {
    "margherita":      { cle: "margherita",     nom: "Margherita" },
    "pepperoni":       { cle: "pepperoni",      nom: "Pepperoni" },
    "vegetarienne":    { cle: "vegetarienne",   nom: "Végétarienne" },
    "quatre-fromages": { cle: "quatrefromages", nom: "Quatre Fromages" }
  };
  var PRIX = { margherita: 4000, pepperoni: 4500, vegetarienne: 4500, quatrefromages: 5000 };
  var SUPP = {
    "extra-cheese":    { nom: "Fromage supplémentaire", prix: 1000 },
    "extra-olives":    { nom: "Olives", prix: 500 },
    "extra-mushrooms": { nom: "Champignons", prix: 500 }
  };
  var TAILLES = { small: { nom: "Petite (25cm)", coef: 1 }, medium: { nom: "Moyenne (30cm)", coef: 1.6 }, large: { nom: "Grande (35cm)", coef: 2.2 } };
  var LIVRAISON = 1500;
  var cart = [];

  function $(id) { return document.getElementById(id); }
  function fcfa(n) { return new Intl.NumberFormat("fr-FR").format(n) + " FCFA"; }
  function arrondi(n) { return Math.round(n / 50) * 50; }

  // On retire les anciens gestionnaires de script.js (ils plantent) en clonant les boutons
  function neuf(id) { var el = $(id); if (!el) return null; var c = el.cloneNode(true); el.replaceWith(c); return c; }
  var addBtn = neuf("order-btn"), payBtn = neuf("checkout-btn");
  if (!addBtn || !payBtn || !$("pizza-form")) return;

  function refLivraison() {
    var r = document.querySelector('#pizza-form input[name="delivery_method"]');
    return r ? r.closest("fieldset") : null;
  }
  function livraisonChoisie() {
    var r = document.querySelector('input[name="delivery_method"]:checked');
    return !!r && r.value === "delivery";
  }

  function dessinerSupp() {
    var zone = $("extras-zone");
    var coches = {};
    if (zone) zone.querySelectorAll("input").forEach(function (i) { coches[i.value] = i.checked; });
    if (!zone) {
      zone = document.createElement("fieldset");
      zone.id = "extras-zone"; zone.className = "delivery-options";
      var ref = refLivraison();
      ref.parentNode.insertBefore(zone, ref);
    }
    zone.textContent = "";
    var lg = document.createElement("legend"); lg.textContent = "Suppléments (optionnel)"; zone.appendChild(lg);
    Object.keys(SUPP).forEach(function (id) {
      var l = document.createElement("label"); l.style.cssText = "display:flex;gap:10px;align-items:center;padding:6px 0;cursor:pointer";
      var c = document.createElement("input"); c.type = "checkbox"; c.value = id; c.checked = !!coches[id];
      var s = document.createElement("span"); s.textContent = SUPP[id].nom + " (+" + fcfa(SUPP[id].prix) + ")";
      l.append(c, s); zone.appendChild(l);
    });
  }

  function dessinerClient() {
    if ($("client-zone")) return;
    var zone = document.createElement("fieldset");
    zone.id = "client-zone"; zone.className = "delivery-options";
    var lg = document.createElement("legend"); lg.textContent = "Vos coordonnées"; zone.appendChild(lg);
    [["client-nom", "Votre nom", "text", "Nom et prénom", "name"],
     ["client-tel", "Votre téléphone", "tel", "07 XX XX XX XX", "tel"]].forEach(function (c) {
      var g = document.createElement("div"); g.className = "form-group";
      var l = document.createElement("label"); l.htmlFor = c[0]; l.textContent = c[1];
      var i = document.createElement("input"); i.id = c[0]; i.type = c[2]; i.placeholder = c[3]; i.autocomplete = c[4];
      g.append(l, i); zone.appendChild(g);
    });
    var ref = refLivraison();
    ref.parentNode.insertBefore(zone, ref);
  }

  function ligne(ul, texte, gras) {
    var p = document.createElement("p"); p.textContent = texte; p.style.margin = "4px 0";
    if (gras) p.style.fontWeight = "700";
    ul.appendChild(p);
  }

  function rendre() {
    var ul = $("cart-items"); ul.textContent = "";
    var lib = $("delivery-price-label"); if (lib) lib.textContent = fcfa(LIVRAISON);
    if (!cart.length) { var v = document.createElement("li"); v.textContent = "Le panier est vide."; ul.appendChild(v); return; }
    var sous = 0;
    cart.forEach(function (it, i) {
      sous += it.prix;
      var li = document.createElement("li");
      li.textContent = it.nom + " – " + it.taille + (it.extras.length ? " (" + it.extras.join(", ") + ")" : "") + " : " + fcfa(it.prix) + " ";
      var b = document.createElement("button"); b.type = "button"; b.className = "remove-item"; b.textContent = "Supprimer";
      b.addEventListener("click", function () { cart.splice(i, 1); rendre(); });
      li.appendChild(b); ul.appendChild(li);
    });
    var liv = livraisonChoisie() ? LIVRAISON : 0;
    ligne(ul, "Sous-total : " + fcfa(sous));
    if (liv) ligne(ul, "Livraison : " + fcfa(liv));
    ligne(ul, "Total : " + fcfa(sous + liv), true);
  }

  addBtn.addEventListener("click", function () {
    var type = $("type").value, size = $("size").value;
    var ids = Array.prototype.map.call(document.querySelectorAll("#extras-zone input:checked"), function (i) { return i.value; });
    var base = arrondi((PRIX[PIZZAS[type].cle] || 0) * TAILLES[size].coef);
    var prix = base + ids.reduce(function (s, id) { return s + SUPP[id].prix; }, 0);
    cart.push({ nom: PIZZAS[type].nom, taille: TAILLES[size].nom, extras: ids.map(function (id) { return SUPP[id].nom; }), prix: prix });
    $("order-summary").textContent = "Ajouté : " + PIZZAS[type].nom + " (" + TAILLES[size].nom + ") — " + fcfa(prix);
    rendre();
  });

  function afficherEnvoi(url) {
    var st = $("checkout-status");
    var box = $("commande-confirm");
    if (!box) {
      box = document.createElement("div"); box.id = "commande-confirm"; box.setAttribute("aria-live", "polite");
      st.parentNode.insertBefore(box, st.nextSibling);
    }
    box.textContent = "";
    var p = document.createElement("p");
    p.textContent = "Dernière étape : appuyez sur le bouton vert, puis sur « Envoyer » dans WhatsApp. Votre commande n'est reçue que lorsque le message est envoyé.";
    var a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener";
    a.textContent = "Envoyer ma commande sur WhatsApp";
    a.style.cssText = "display:inline-block;margin-top:8px;padding:14px 24px;border-radius:999px;background:#25d366;color:#fff;font-weight:700;text-decoration:none";
    a.addEventListener("click", function () {
      setTimeout(function () {
        cart = []; rendre(); box.textContent = "";
        st.textContent = "Merci ! Si le message WhatsApp est bien parti, nous préparons votre commande.";
        st.style.color = "#1a7a3a";
      }, 400);
    });
    box.append(p, a);
    box.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  payBtn.addEventListener("click", function () {
    var st = $("checkout-status");
    function msg(t) { st.textContent = t; st.style.color = "#c0392b"; }
    if (!cart.length) return msg("Le panier est vide : ajoutez au moins une pizza.");
    var nom = $("client-nom").value.trim();
    var telClient = $("client-tel").value.trim() || ($("customer-phone") ? $("customer-phone").value.trim() : "");
    if (!nom) return msg("Indiquez votre nom.");
    if (telClient.replace(/\D/g, "").length < 8) return msg("Indiquez un numéro de téléphone valide.");
    var livr = livraisonChoisie(), adr = "";
    if (livr) {
      adr = $("customer-address").value.trim();
      if (!adr) return msg("Indiquez votre adresse de livraison.");
    }
    if (!NUMERO) return msg("La commande en ligne n'est pas encore activée. Utilisez le bouton Appel pour commander.");

    var sous = cart.reduce(function (s, it) { return s + it.prix; }, 0), liv = livr ? LIVRAISON : 0;
    var numero = "MP-" + Date.now().toString(36).slice(-5).toUpperCase();
    var quand = new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
    var t = ["🍕 NOUVELLE COMMANDE MR PAPRIKA", "N° " + numero, "Date : " + quand, "",
             "Client : " + nom, "Téléphone : " + telClient, ""];
    cart.forEach(function (it) {
      t.push("• " + it.nom + " " + it.taille + (it.extras.length ? " + " + it.extras.join(", ") : "") + " : " + fcfa(it.prix));
    });
    t.push("", "Sous-total : " + fcfa(sous));
    if (liv) t.push("Livraison : " + fcfa(liv));
    t.push("TOTAL : " + fcfa(sous + liv), "");
    if (livr) { t.push("Mode : LIVRAISON", "Adresse : " + adr, "Heure souhaitée : " + $("delivery-time").value); }
    else { t.push("Mode : RETRAIT SUR PLACE"); }
    t.push("Paiement : à la " + (livr ? "livraison" : "récupération") + " (ou mobile money)");

    st.textContent = "";
    afficherEnvoi("https://wa.me/" + NUMERO + "?text=" + encodeURIComponent(t.join("\n")));
  });

  document.querySelectorAll('input[name="delivery_method"]').forEach(function (r) { r.addEventListener("change", rendre); });

  dessinerSupp(); dessinerClient(); rendre();

  try {
    if (window.firebase) {
      if (!firebase.apps.length) firebase.initializeApp(CFG);
      firebase.firestore().doc("config/prix").get().then(function (snap) {
        if (!snap.exists) return;
        var d = snap.data();
        if (d.pizzas) Object.keys(d.pizzas).forEach(function (k) { PRIX[k] = d.pizzas[k].prix; });
        if (d.supplements) Object.keys(d.supplements).forEach(function (k) { if (SUPP[k]) SUPP[k].prix = d.supplements[k].prix; });
        if (d.livraison && d.livraison.livraison) LIVRAISON = d.livraison.livraison.prix;
        dessinerSupp(); rendre();
      }).catch(function (e) { console.warn("Prix non chargés :", e); });
    }
  } catch (e) { console.warn(e); }
})();
