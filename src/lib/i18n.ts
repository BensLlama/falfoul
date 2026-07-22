export type Lang = "en" | "fr";

/**
 * UI strings, English and French. The language is a cookie ("lang"),
 * toggled from the menu bar; server pages read it with getLang().
 */
const dict = {
  // menu bar
  "nav.dashboard": ["Dashboard", "Accueil"],
  "nav.products": ["Products", "Produits"],
  "nav.categories": ["Categories", "Catégories"],
  "nav.suppliers": ["Suppliers", "Fournisseurs"],
  "nav.sales": ["Sales", "Ventes"],
  "nav.analytics": ["Analytics", "Statistiques"],
  "nav.alerts": ["Alerts", "Alertes"],

  // common
  "common.save": ["Save", "Enregistrer"],
  "common.cancel": ["Cancel", "Annuler"],
  "common.delete": ["Delete", "Supprimer"],
  "common.edit": ["Edit", "Modifier"],
  "common.add": ["Add", "Ajouter"],
  "common.duplicate": ["Duplicate", "Dupliquer"],
  "common.excel": ["Excel", "Excel"],
  "common.print": ["PDF / Print", "PDF / Imprimer"],
  "common.scan": ["Scan", "Scanner"],

  // pages
  "dashboard.title": ["Dashboard", "Accueil"],
  "dashboard.subtitle": [
    "A quick look at your store: stock value, expiring items, low stock and best sellers.",
    "Un coup d'œil sur votre magasin : valeur du stock, produits qui expirent, stock bas et meilleures ventes.",
  ],
  "products.title": ["Products", "Produits"],
  "products.subtitle": [
    "Everything you bought — product details, invoice, stock and prices in one place.",
    "Tout ce que vous avez acheté — détails, facture, stock et prix au même endroit.",
  ],
  "products.new": ["+ Save product", "+ Ajouter produit"],
  "categories.title": ["Categories", "Catégories"],
  "categories.subtitle": [
    "Each card is a main category. Open a group to see what's inside — add, rename or delete anywhere.",
    "Chaque carte est une catégorie principale. Ouvrez un groupe pour voir son contenu — ajoutez, renommez ou supprimez librement.",
  ],
  "suppliers.title": ["Suppliers", "Fournisseurs"],
  "suppliers.subtitle": [
    "Your fournisseurs — add them once, pick them fast in the product form.",
    "Vos fournisseurs — ajoutez-les une fois, sélectionnez-les vite dans le formulaire produit.",
  ],
  "sales.title": ["Sales", "Ventes"],
  "sales.new": ["+ Record sale", "+ Nouvelle vente"],
  "analytics.title": ["Analytics", "Statistiques"],
  "alerts.title": ["Alerts", "Alertes"],

  // product form
  "form.newProduct": ["New Product", "Nouveau produit"],
  "form.theProduct": ["1 · THE PRODUCT", "1 · LE PRODUIT"],
  "form.whatYouBought": ["2 · WHAT YOU BOUGHT", "2 · VOTRE ACHAT"],
  "form.extras": ["3 · EXTRAS (OPTIONAL)", "3 · EXTRAS (OPTIONNEL)"],
  "form.name": ["Name", "Nom"],
  "form.variant": ["Version / variant (optional)", "Version / variante (optionnel)"],
  "form.variantPh": ["e.g. Lemon, Chocolate, 33cl…", "ex. Citron, Chocolat, 33cl…"],
  "form.barcode": ["Barcode (optional)", "Code-barres (optionnel)"],
  "form.barcodePh": ["Scan or type…", "Scannez ou tapez…"],
  "form.category": ["Category", "Catégorie"],
  "form.newCategory": ["…or type a new category", "…ou nouvelle catégorie"],
  "form.supplier": ["Supplier (fournisseur)", "Fournisseur"],
  "form.newSupplier": ["…or new supplier", "…ou nouveau fournisseur"],
  "form.choose": ["— Choose —", "— Choisir —"],
  "form.purchaseDate": ["Purchase date", "Date d'achat"],
  "form.packs": ["Packs", "Packs"],
  "form.piecesPerPack": ["Pieces / pack", "Pièces / pack"],
  "form.piecesTotal": ["pieces in total", "pièces au total"],
  "form.pricePerPack": ["Price per pack", "Prix du pack"],
  "form.totalPaid": ["= Total paid", "= Total payé"],
  "form.margin": ["Your margin %", "Votre marge %"],
  "form.sellAt": ["sell 1 piece at", "vendre 1 pièce à"],
  "form.expiration": ["Expiration date", "Date d'expiration"],
  "form.lowStock": ["Low-stock alert (pcs)", "Alerte stock bas (pcs)"],
  "form.invoice": ["Invoice photo", "Photo de la facture"],
  "form.keepCurrent": ["(empty = keep current)", "(vide = garder l'actuelle)"],
  "form.note": ["Note", "Note"],
  "form.notePh": ["Anything to remember…", "Quelque chose à retenir…"],
  "form.pieces": ["Pieces", "Pièces"],
  "form.costPc": ["Cost/pc", "Coût/pc"],
  "form.sellPc": ["Sell/pc", "Vente/pc"],
  "form.profitPc": ["Profit/pc", "Profit/pc"],
  "form.totalProfit": ["Total profit", "Profit total"],
} as const;

export type TKey = keyof typeof dict;

export function t(lang: Lang, key: TKey): string {
  return dict[key][lang === "fr" ? 1 : 0];
}

/** Build a bound translator: const tr = tr(lang); tr("form.name") */
export function translator(lang: Lang) {
  return (key: TKey) => t(lang, key);
}
