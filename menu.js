// Menu dynamique : lit les plats, prix et photos de l'espace admin, dessine la galerie et les filtres.
(function () {
  var CFG = { apiKey: "AIzaSyDtr8Eb-npB9m2OArnkKXhhLr7P-v42waA", authDomain: "mr-paprika.firebaseapp.com", projectId: "mr-paprika" };
  var EMOJI = { "Classique": "🍕", "Viande": "🥩", "Végétarienne": "🥬", "Poisson": "🐟", "Spéciale": "⭐", "Boisson": "🥤", "Dessert": "🍰", "Autre": "🍽️" };

  // Données par défaut (utilisées si Firebase est inaccessible)
  var D = {
    menu: [
      { id: "margherita",     nom: "Margherita",      desc: "Tomate, mozzarella, basilic frais.",      cat: "Classique",    prix: 4000, pizza: true, actif: true },
      { id: "pepperoni",      nom: "Pepperoni",       desc: "Tomate, mozzarella, pepperoni épicé.",    cat: "Viande",       prix: 4500, pizza: true, actif: true },
      { id: "vegetarienne",   nom: "Végétarienne",    desc: "Poivrons, champignons, olives, oignons.", cat: "Végétarienne", prix: 4500, pizza: true, actif: true },
      { id: "quatrefromages", nom: "Quatre Fromages", desc: "Mozzarella, chèvre, bleu et emmental.",   cat: "Classique",    prix: 5000, pizza: true, actif: true }
    ],
    supplements: {
      "extra-cheese":    { nom: "Fromage supplémentaire", prix: 1000 },
      "extra-olives":    { nom: "Olives", prix: 500 },
      "extra-mushrooms": { nom: "Champignons", prix: 500 }
    },
    livraison: 1500,
    images: {}
  };
  window.MPData = D;

  var galerie = document.getElementById("pizza-gallery");
  if (!galerie) return;
  var filtreActif = "all";

  function fcfa(n) { return new Intl.NumberFormat("fr-FR").format(n) + " FCFA"; }

  function appliquerFiltre() {
    galerie.querySelectorAll(".pizza-card").forEach(function (c) {
      c.hidden = !(filtreActif === "all" || c.dataset.cat === filtreActif);
    });
  }

  function dessinerFiltres() {
    var box = document.querySelector(".menu-filters");
    if (!box) return;
    var cats = [];
    D.menu.forEach(function (p) { if (p.actif !== false && cats.indexOf(p.cat) < 0) cats.push(p.cat); });
    if (filtreActif !== "all" && cats.indexOf(filtreActif) < 0) filtreActif = "all";
    box.textContent = "";
    [["all", "Toutes"]].concat(cats.map(function (c) { return [c, c]; })).forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "filter-btn" + (c[0] === filtreActif ? " active" : "");
      b.dataset.filter = c[0]; b.textContent = c[1];
      b.addEventListener("click", function () { filtreActif = c[0]; dessinerFiltres(); appliquerFiltre(); });
      box.appendChild(b);
    });
  }

  function dessiner() {
    galerie.textContent = "";
    D.menu.forEach(function (p) {
      if (p.actif === false) return;
      var emoji = EMOJI[p.cat] || "🍽️";
      var carte = document.createElement("article");
      carte.className = "pizza-card"; carte.dataset.cat = p.cat;

      var visuel = document.createElement("div"); visuel.className = "pizza-visual";
      var img = document.createElement("img");
      img.src = D.images[p.id] || ("images/" + p.id + ".jpg"); img.alt = p.nom; img.loading = "lazy";
      img.onerror = function () { img.remove(); visuel.textContent = emoji; };
      visuel.appendChild(img);

      var corps = document.createElement("div"); corps.className = "pizza-body";
      var titre = document.createElement("h4"); titre.textContent = p.nom;
      var desc = document.createElement("p"); desc.textContent = p.desc || "";
      var prix = document.createElement("p"); prix.className = "pizza-price";
      prix.textContent = (p.pizza ? "À partir de " : "") + fcfa(p.prix || 0);
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "pizza-choose"; btn.textContent = "Choisir";
      btn.addEventListener("click", function () {
        var select = document.getElementById("type");
        if (select) { select.value = p.id; select.dispatchEvent(new Event("change")); }
        var form = document.getElementById("pizza-form");
        if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      corps.append(titre, desc, prix, btn);
      carte.append(visuel, corps);
      galerie.appendChild(carte);
    });
    var lib = document.getElementById("delivery-price-label");
    if (lib) lib.textContent = fcfa(D.livraison);
    appliquerFiltre();
    document.dispatchEvent(new CustomEvent("mp:data"));
  }

  dessinerFiltres();
  dessiner();

  try {
    if (window.firebase) {
      if (!firebase.apps.length) firebase.initializeApp(CFG);
      var db = firebase.firestore();
      Promise.all([db.doc("config/prix").get(), db.collection("images").get()]).then(function (res) {
        var d = res[0].exists ? res[0].data() : {};
        if (Array.isArray(d.menu)) { D.menu = d.menu; }
        else if (d.pizzas) { D.menu.forEach(function (p) { if (d.pizzas[p.id]) p.prix = d.pizzas[p.id].prix; }); }
        if (d.supplements) Object.keys(d.supplements).forEach(function (k) { if (D.supplements[k]) D.supplements[k].prix = d.supplements[k].prix; });
        if (d.livraison && d.livraison.livraison) D.livraison = d.livraison.livraison.prix;
        res[1].forEach(function (doc) { D.images[doc.id] = doc.data().data; });
        dessinerFiltres(); dessiner();
      }).catch(function (e) { console.warn("Menu Firebase non chargé :", e); });
    }
  } catch (e) { console.warn(e); }
})();
