// Panier en FCFA branché sur le menu de l'espace admin. Paiement Wave ou à la livraison, commande envoyée par WhatsApp.
(function () {
  var NUMERO = "2250799142133";      // WhatsApp du restaurant (réception des commandes)

  // ===== PAIEMENT WAVE : À REMPLIR =====
  var WAVE_NUMERO = "";              // numéro Wave du restaurant, ex : "07 99 14 21 33"
  var WAVE_NOM = "";                 // nom affiché dans Wave quand on tape le numéro
  var WAVE_LIEN = "";                // optionnel : lien de paiement Wave Business, sinon laisser vide
  var ESPECES = false;               // true = proposer aussi « payer à la livraison / au retrait »
  // =====================================

  var TAILLES = { small: { nom: "Petite (25cm)", coef: 1 }, medium: { nom: "Moyenne (30cm)", coef: 1.6 }, large: { nom: "Grande (35cm)", coef: 2.2 } };
  var D = window.MPData || { menu: [], supplements: {}, livraison: 1500 };
  var cart = [];

  function $(id) { return document.getElementById(id); }
  function fcfa(n) { return new Intl.NumberFormat("fr-FR").format(n) + " FCFA"; }
  function arrondi(n) { return Math.round(n / 50) * 50; }
  function plat(id) { return D.menu.filter(function (p) { return p.id === id; })[0]; }
  function actifs() { return D.menu.filter(function (p) { return p.actif !== false; }); }

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
  function cashPossible() { return ESPECES || !WAVE_NUMERO; }
  function modePaiement() {
    var r = document.querySelector('input[name="pay_method"]:checked');
    return r ? r.value : "";
  }
  function totaux() {
    var sous = cart.reduce(function (s, it) { return s + it.prix; }, 0);
    var liv = cart.length && livraisonChoisie() ? D.livraison : 0;
    return { sous: sous, liv: liv, total: sous + liv };
  }
  function libelle(it) {
    return it.nom + (it.taille ? " – " + it.taille : "") + (it.extras.length ? " (" + it.extras.join(", ") + ")" : "");
  }

  // Liste déroulante construite à partir du menu
  function majSelect() {
    var s = $("type"), cur = s.value;
    s.textContent = "";
    actifs().forEach(function (p) {
      var o = document.createElement("option"); o.value = p.id; o.textContent = p.nom; s.appendChild(o);
    });
    if (cur && plat(cur)) s.value = cur;
    majOptions();
  }
  // Tailles et suppléments seulement pour les pizzas
  function majOptions() {
    var p = plat($("type").value), pizza = !!(p && p.pizza);
    var row = $("size") ? $("size").closest(".form-row") : null;
    if (row) row.style.display = pizza ? "" : "none";
    var z = $("extras-zone"); if (z) z.style.display = pizza ? "" : "none";
  }
  $("type").addEventListener("change", majOptions);

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
    Object.keys(D.supplements).forEach(function (id) {
      var l = document.createElement("label"); l.style.cssText = "display:flex;gap:10px;align-items:center;padding:6px 0;cursor:pointer";
      var c = document.createElement("input"); c.type = "checkbox"; c.value = id; c.checked = !!coches[id];
      var s = document.createElement("span"); s.textContent = D.supplements[id].nom + " (+" + fcfa(D.supplements[id].prix) + ")";
      l.append(c, s); zone.appendChild(l);
    });
    majOptions();
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

  function dessinerPaiement() {
    if ($("pay-zone")) return;
    var zone = document.createElement("fieldset");
    zone.id = "pay-zone"; zone.className = "delivery-options";
    var lg = document.createElement("legend"); lg.textContent = "Mode de paiement"; zone.appendChild(lg);

    function option(val, texte, coche) {
      var l = document.createElement("label"); l.style.cssText = "display:flex;gap:10px;align-items:center;padding:8px 0;cursor:pointer";
      var r = document.createElement("input"); r.type = "radio"; r.name = "pay_method"; r.value = val; r.checked = coche;
      r.addEventListener("change", majPaiement);
      var s = document.createElement("span"); s.textContent = texte;
      l.append(r, s); zone.appendChild(l);
    }
    if (WAVE_NUMERO) option("wave", "Wave (mobile money)", true);
    if (cashPossible()) option("cash", "Payer à la livraison / au retrait", !WAVE_NUMERO);

    var info = document.createElement("div"); info.id = "wave-info"; info.hidden = true;
    info.style.cssText = "margin-top:10px;padding:12px;border-radius:12px;background:#eaf6ff";
    var p1 = document.createElement("p"); p1.id = "wave-texte"; p1.style.margin = "0 0 8px";
    var lien = document.createElement("a"); lien.id = "wave-lien"; lien.target = "_blank"; lien.rel = "noopener"; lien.hidden = true;
    lien.textContent = "Payer avec Wave"; lien.style.cssText = "display:inline-block;margin:4px 0 10px;padding:10px 18px;border-radius:999px;background:#1dc8ff;color:#fff;font-weight:700;text-decoration:none";
    var g = document.createElement("div"); g.className = "form-group";
    var l = document.createElement("label"); l.htmlFor = "pay-ref"; l.textContent = "Référence de la transaction Wave";
    var i = document.createElement("input"); i.id = "pay-ref"; i.type = "text"; i.placeholder = "Ex : T_ABC123XYZ"; i.autocomplete = "off";
    var pm = document.createElement("small"); pm.textContent = "Vous la trouvez dans le SMS ou dans l'historique de l'application Wave.";
    g.append(l, i, pm);
    info.append(p1, lien, g);
    zone.appendChild(info);

    var panier = document.querySelector(".cart");
    if (panier) panier.parentNode.insertBefore(zone, panier);
    else payBtn.parentNode.insertBefore(zone, payBtn);
  }

  function majPaiement() {
    var info = $("wave-info"); if (!info) return;
    var wave = modePaiement() === "wave";
    info.hidden = !wave;
    if (!wave) return;
    var t = totaux().total;
    $("wave-texte").textContent = (t
      ? "1) Ouvrez Wave. 2) Envoyez exactement " + fcfa(t)
      : "1) Ajoutez vos articles au panier. 2) Dans Wave, envoyez le total")
      + " au " + WAVE_NUMERO + (WAVE_NOM ? " (" + WAVE_NOM + ")" : "") + ". 3) Saisissez ci-dessous la référence de la transaction.";
    var lien = $("wave-lien");
    if (WAVE_LIEN && t) {
      lien.href = WAVE_LIEN + (WAVE_LIEN.indexOf("?") > -1 ? "&" : "?") + "amount=" + t;
      lien.hidden = false;
    } else { lien.hidden = true; }
  }

  function ligne(ul, texte, gras) {
    var p = document.createElement("p"); p.textContent = texte; p.style.margin = "4px 0";
    if (gras) p.style.fontWeight = "700";
    ul.appendChild(p);
  }

  function rendre() {
    var ul = $("cart-items"); ul.textContent = "";
    var lib = $("delivery-price-label"); if (lib) lib.textContent = fcfa(D.livraison);
    if (!cart.length) { var v = document.createElement("li"); v.textContent = "Le panier est vide."; ul.appendChild(v); majPaiement(); return; }
    cart.forEach(function (it, i) {
      var li = document.createElement("li");
      li.textContent = libelle(it) + " : " + fcfa(it.prix) + " ";
      var b = document.createElement("button"); b.type = "button"; b.className = "remove-item"; b.textContent = "Supprimer";
      b.addEventListener("click", function () { cart.splice(i, 1); rendre(); });
      li.appendChild(b); ul.appendChild(li);
    });
    var T = totaux();
    ligne(ul, "Sous-total : " + fcfa(T.sous));
    if (T.liv) ligne(ul, "Livraison : " + fcfa(T.liv));
    ligne(ul, "Total : " + fcfa(T.total), true);
    majPaiement();
  }

  addBtn.addEventListener("click", function () {
    var p = plat($("type").value);
    if (!p) return;
    var prix, taille = "", noms = [];
    if (p.pizza) {
      var size = $("size").value;
      taille = TAILLES[size].nom;
      prix = arrondi((p.prix || 0) * TAILLES[size].coef);
      Array.prototype.forEach.call(document.querySelectorAll("#extras-zone input:checked"), function (i) {
        var s = D.supplements[i.value]; if (s) { prix += s.prix; noms.push(s.nom); }
      });
    } else {
      prix = p.prix || 0;
    }
    cart.push({ nom: p.nom, taille: taille, extras: noms, prix: prix });
    $("order-summary").textContent = "Ajouté : " + p.nom + (taille ? " (" + taille + ")" : "") + " — " + fcfa(prix);
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
        var ref = $("pay-ref"); if (ref) ref.value = "";
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
    if (!cart.length) return msg("Le panier est vide : ajoutez au moins un article.");
    var nom = $("client-nom").value.trim();
    var telClient = $("client-tel").value.trim() || ($("customer-phone") ? $("customer-phone").value.trim() : "");
    if (!nom) return msg("Indiquez votre nom.");
    if (telClient.replace(/\D/g, "").length < 8) return msg("Indiquez un numéro de téléphone valide.");
    var livr = livraisonChoisie(), adr = "";
    if (livr) {
      adr = $("customer-address").value.trim();
      if (!adr) return msg("Indiquez votre adresse de livraison.");
    }
    var mode = modePaiement();
    if (!mode) return msg("Choisissez un mode de paiement.");
    var ref = "";
    if (mode === "wave") {
      ref = $("pay-ref").value.trim();
      if (ref.length < 5) return msg("Payez d'abord avec Wave, puis saisissez la référence de la transaction.");
    }
    if (!NUMERO) return msg("La commande en ligne n'est pas encore activée. Utilisez le bouton Appel pour commander.");

    var T = totaux();
    var numero = "MP-" + Date.now().toString(36).slice(-5).toUpperCase();
    var quand = new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
    var t = ["🍕 NOUVELLE COMMANDE MR PAPRIKA", "N° " + numero, "Date : " + quand, "",
             "Client : " + nom, "Téléphone : " + telClient, ""];
    cart.forEach(function (it) {
      t.push("• " + it.nom + (it.taille ? " " + it.taille : "") + (it.extras.length ? " + " + it.extras.join(", ") : "") + " : " + fcfa(it.prix));
    });
    t.push("", "Sous-total : " + fcfa(T.sous));
    if (T.liv) t.push("Livraison : " + fcfa(T.liv));
    t.push("TOTAL : " + fcfa(T.total), "");
    if (livr) { t.push("Mode : LIVRAISON", "Adresse : " + adr, "Heure souhaitée : " + $("delivery-time").value); }
    else { t.push("Mode : RETRAIT SUR PLACE"); }
    if (mode === "wave") {
      t.push("", "💳 Paiement : WAVE (" + fcfa(T.total) + " envoyés)", "Référence Wave : " + ref,
             "⚠️ À vérifier dans Wave avant de préparer la commande.");
    } else {
      t.push("", "Paiement : à la " + (livr ? "livraison" : "récupération"));
    }

    st.textContent = "";
    afficherEnvoi("https://wa.me/" + NUMERO + "?text=" + encodeURIComponent(t.join("\n")));
  });

  document.querySelectorAll('input[name="delivery_method"]').forEach(function (r) { r.addEventListener("change", rendre); });

  // Démarrage + mise à jour quand le menu Firebase arrive
  dessinerSupp(); dessinerClient(); dessinerPaiement(); majSelect(); rendre();
  document.addEventListener("mp:data", function () {
    D = window.MPData || D;
    majSelect(); dessinerSupp(); rendre();
  });
})();
