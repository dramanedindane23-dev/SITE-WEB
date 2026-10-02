// Galerie de pizzas, filtres et prix modifiables depuis l'espace admin.
(function () {
  var firebaseConfig = {
    apiKey: "AIzaSyDtr8Eb-npB9m2OArnkKXhhLr7P-v42waA",
    authDomain: "mr-paprika.firebaseapp.com",
    projectId: "mr-paprika"
  };

  // value = valeur du menu déroulant ; cle = nom dans l'espace admin
  var PIZZAS = [
    { value: "margherita",      cle: "margherita",     nom: "Margherita",      cat: "classique",  emoji: "🍕", desc: "Tomate, mozzarella, basilic frais." },
    { value: "pepperoni",       cle: "pepperoni",      nom: "Pepperoni",       cat: "viande",     emoji: "🌶️", desc: "Tomate, mozzarella, pepperoni épicé." },
    { value: "vegetarienne",    cle: "vegetarienne",   nom: "Végétarienne",    cat: "vegetarien", emoji: "🥬", desc: "Poivrons, champignons, olives, oignons." },
    { value: "quatre-fromages", cle: "quatrefromages", nom: "Quatre Fromages", cat: "classique",  emoji: "🧀", desc: "Mozzarella, chèvre, bleu et emmental." }
  ];
  var PRIX = { margherita: 4000, pepperoni: 4500, vegetarienne: 4500, quatrefromages: 5000 };
  var LIVRAISON = 1500;

  var galerie = document.getElementById("pizza-gallery");
  if (!galerie) return;

  function fcfa(n) { return new Intl.NumberFormat("fr-FR").format(n) + " FCFA"; }

  function dessiner() {
    galerie.textContent = "";
    PIZZAS.forEach(function (p) {
      var carte = document.createElement("article");
      carte.className = "pizza-card";
      carte.dataset.cat = p.cat;

      var visuel = document.createElement("div");
      visuel.className = "pizza-visual";
      var img = document.createElement("img");
      img.src = "images/" + p.value + ".jpg";
      img.alt = "Pizza " + p.nom;
      img.loading = "lazy";
      img.onerror = function () { img.remove(); visuel.textContent = p.emoji; };
      visuel.appendChild(img);

      var corps = document.createElement("div");
      corps.className = "pizza-body";
      var titre = document.createElement("h4"); titre.textContent = p.nom;
      var desc = document.createElement("p"); desc.textContent = p.desc;
      var prix = document.createElement("p"); prix.className = "pizza-price";
      prix.textContent = "À partir de " + fcfa(PRIX[p.cle] || 0);
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "pizza-choose"; btn.textContent = "Choisir";
      btn.addEventListener("click", function () {
        var select = document.getElementById("type");
        if (select) select.value = p.value;
        var form = document.getElementById("pizza-form");
        if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      corps.append(titre, desc, prix, btn);
      carte.append(visuel, corps);
      galerie.appendChild(carte);
    });
    var lib = document.getElementById("delivery-price-label");
    if (lib) lib.textContent = fcfa(LIVRAISON);
  }

  document.querySelectorAll(".filter-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.dataset.filter;
      document.querySelectorAll(".filter-btn").forEach(function (x) {
        x.classList.toggle("active", x === b);
      });
      galerie.querySelectorAll(".pizza-card").forEach(function (c) {
        c.hidden = !(f === "all" || c.dataset.cat === f);
      });
    });
  });

  dessiner();

  // Prix depuis Firebase (si la connexion échoue, les prix par défaut restent affichés)
  try {
    if (window.firebase) {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      firebase.firestore().doc("config/prix").get().then(function (snap) {
        if (!snap.exists) return;
        var d = snap.data();
        if (d.pizzas) Object.keys(d.pizzas).forEach(function (k) { PRIX[k] = d.pizzas[k].prix; });
        if (d.livraison && d.livraison.livraison) LIVRAISON = d.livraison.livraison.prix;
        dessiner();
      }).catch(function (e) { console.warn("Prix Firebase non chargés :", e); });
    }
  } catch (e) { console.warn(e); }
})();
