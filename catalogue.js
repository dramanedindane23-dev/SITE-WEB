// Catalogue MR PAPRIKA : [nom, catégorie, prix FCFA, description, visible (false = à compléter)]
const CATALOGUE = [
// Pizzas
['Pizza poulet – Petite','Viande',3000],['Pizza poulet – Moyenne','Viande',4000],['Pizza poulet – Grande','Viande',6000],
['Pizza pepperoni – Moyenne','Viande',4000],['Pizza pepperoni – Grande','Viande',6000],
['Pizza margherita – Petite','Classique',3000],
['Pizza royale – Moyenne','Spéciale',4000],['Pizza royale – Grande','Spéciale',7000],
['Pizza bolognaise – Petite','Viande',3000],['Pizza bolognaise – Moyenne','Viande',4000],['Pizza bolognaise – Grande','Viande',6000],
['Pizza jambon – Petite','Viande',3000],['Pizza jambon – Moyenne','Viande',4000],
['Pizza poulet crémeux – Moyenne','Viande',4000],['Pizza poulet crémeux – Grande','Viande',7000],
['Pizza jambon crémeux – Moyenne','Viande',4000],['Pizza jambon crémeux – Grande','Viande',7000],
['Pizza viande crémière – Moyenne','Viande',4000],['Pizza viande crémière – Grande','Viande',7000],
['Pizza crevette – Moyenne','Poisson',4000],
['Pizza alloco – Petite','Spéciale',3500],
['Pizza calzone','Spéciale',0,'Prix à compléter',false],
['Pizza calzone extrême','Spéciale',4000],
['Pizza calzone infinie','Spéciale',6000,'Promo (ancien prix 7 000 FCFA)'],
// Burgers, chawarmas, tacos, manaïche
['Burger classic','Burger',3000],
['Burger Debout','Burger',5000],
['Burger classic + une portion de frites','Burger',4000,'Promo (ancien prix 4 500 FCFA)'],
['Chawarma poulet','Chawarma',2000],['Chawarma foie','Chawarma',2000],['Chawarma cœur','Chawarma',2000],['Chawarma langue','Chawarma',2000],
['Chawarma viande','Chawarma',0,'Prix à compléter',false],
['Chawarma poulet + frites','Chawarma',3000],
['Tacos poulet','Tacos',2500,'Promo (ancien prix 3 000 FCFA)'],
['Manaïche mixte','Manaïche',2500],['Manaïche viande','Manaïche',2000],['Manaïche fromage','Manaïche',2000],
// Accompagnements et plats
['Portion de frites','Accompagnement',1000],['Portion d’alloco','Accompagnement',1000],
['Poulet crispy + frites','Poulet crispy',5000],
['Poulet crispy','Poulet crispy',0,'Prix à compléter',false],
['Frites fondues au fromage','Plat',4000,'Promo (ancien prix 4 500 FCFA)'],
['Pasta mozzarella bolognaise','Plat',4000],
['Riz marocain, viande de mouton','Plat',4000,'Promo (ancien prix 5 000 FCFA)'],
// Menus
['Menu Classique','Menu',5000,'Un burger classic + une portion de frites + une boisson. Promo (ancien prix 5 500 FCFA)'],
['Le Debout','Menu',6000,'Un burger Debout + une portion de frites'],
['Menu du Debout','Menu',7000,'Un burger Debout + une portion de frites + une boisson'],
['Menu Tacos poulet','Menu',4000,'Promo (ancien prix 4 500 FCFA)'],
['Menu Goto','Menu',7000,'Promo (ancien prix 8 000 FCFA)'],
['Menu Patrick','Menu',7000,'Pasta mozzarella bolognaise + pizza royale…'],
['Le goûter','Menu',7000,'1 pizza poulet petite, 8 morceaux de poulet crispy'],
['Menu Ultra box','Menu',18000,'1 pizza royale moyenne, 2 petites pizzas, 8 morceaux de poulet crispy…'],
['Menu du Patron','Menu',22000,'1 pizza royale moyenne, 2 petites pizzas, 8 morceaux de poulet crispy…'],
['Menu Aranud','Menu',0,'Prix et description à compléter',false],
// Tables
['Table 1','Table',10000,'8 morceaux de poulet crispy, 1 pizza poulet…'],
['Table 2','Table',10000,'1 pizza poulet, 1 pizza jambon, burger classic…'],
['Table 3','Table',10000,'8 morceaux de poulet crispy, burger classic…'],
['Table 4','Table',10000,'1 pizza royale grande, 1 pizza jambon petite…'],
['Table 5','Table',10500,'Poulet crispy, pasta mozzarella bolognaise…'],
['Table du silence','Table',12000,'8 morceaux de poulet crispy, 1 pasta mozzarella…'],
['Table élastique','Table',11000,'1 pizza royale moyenne, 1 pasta mozzarella bolognaise… Promo (ancien prix 12 000 FCFA)'],
['Table Royale','Table',25500,'1 pizza royale grande, 2 petites pizzas, 1 pizza…']
];

function slugCatalogue(n){
  return 'c-' + n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

function importerCatalogue(){
  if (typeof data === 'undefined' || !data) return say('Attendez le chargement du menu, puis réessayez.', 'err');
  const deja = new Set(data.menu.map(x => x.id));
  let ajoutes = 0;
  CATALOGUE.forEach(([nom, cat, prix, desc, visible]) => {
    const id = slugCatalogue(nom);
    if (deja.has(id)) return;
    data.menu.push({id, nom, desc: desc || '', cat, prix, pizza: false, actif: visible !== false});
    deja.add(id); ajoutes++;
  });
  renderMenu();
  say(ajoutes + ' produits ajoutés. Complétez les lignes « à compléter », puis cliquez sur « Enregistrer ».', 'ok');
}

document.addEventListener('DOMContentLoaded', () => {
  const b = document.createElement('button');
  b.type = 'button'; b.id = 'importCat'; b.textContent = 'Importer le catalogue Mr Paprika';
  b.style.cssText = 'background:#fff;color:#b3260e;border:2px solid #b3260e;border-radius:12px;padding:12px;width:100%;font-size:1rem;font-weight:700;cursor:pointer;margin:8px 0';
  b.onclick = importerCatalogue;
  const menu = document.getElementById('menu');
  if (menu) menu.parentNode.insertBefore(b, menu);
});
