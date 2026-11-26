// =====================================================================
//  site.config.mjs : TOUT LE CONTENU DU SITE SE MODIFIE ICI
//
//  1. Modifiez les valeurs ci-dessous (textes, carte, horaires, photos...).
//  2. Lancez `node build.mjs` pour régénérer le dossier /docs.
//  3. Envoyez le tout sur GitHub : le site se met à jour.
//
//  Les valeurs d'exemple sont fictives : remplacez-les toutes avant la
//  mise en ligne (nom, plats, prix, vins, avis, téléphone, adresse...).
// =====================================================================

export default {
  // ---------------------------------------------------------------
  //  RÉGLAGES TECHNIQUES
  // ---------------------------------------------------------------
  // Adresse finale du site, avec le "/" à la fin (canonical, Open Graph, sitemap).
  // Ici : le dépôt contient le dossier docs/ à sa racine et GitHub Pages sert la racine, d'où "/docs/".
  // Si vous choisissez le dossier /docs comme source dans les réglages Pages, l'adresse devient
  // "https://alanaxel26.github.io/MaisonAlbatre/" : changez cette ligne en conséquence.
  siteUrl: "https://alanaxel26.github.io/MaisonAlbatre/docs/",
  // Écran de chargement affiché à l'arrivée sur le site, puis deux volets qui s'ouvrent.
  //   enabled : false pour le supprimer. seconds : durée minimale d'affichage (le site n'apparaît jamais
  //   avant d'être chargé). oncePerSession : true = une seule fois par visite (pas à chaque retour
  //   sur la page). messages : phrases affichées successivement pendant le chargement.
  loader: {
    enabled: true,
    seconds: 2.6,
    oncePerSession: false,
    messages: ["Allumage des lumières", "Dressage des tables", "Ouverture de la cave", "Bienvenue"],
  },
  lang: "fr",
  locale: "fr_FR",

  // Fuseau horaire du restaurant : sert au statut "Ouvert / Fermé" et à la
  // date minimale du formulaire de réservation.
  timezone: "Africa/Abidjan",

  // Réservation par formulaire.
  // - Avec Formspree : collez l'adresse du formulaire ("https://formspree.io/f/xxxxxxxx").
  // - Laissé vide : la messagerie du visiteur s'ouvre avec la demande rédigée.
  formspreeEndpoint: "",

  // ---------------------------------------------------------------
  //  COULEURS
  //  Quelques valeurs suffisent : le reste (survols, fonds atténués, pied de
  //  page, illustrations, image de partage) est calculé automatiquement.
  //  À chaque `node build.mjs`, les contrastes sont vérifiés et tout défaut
  //  d'accessibilité (WCAG AA) est signalé dans le terminal.
  // ---------------------------------------------------------------
  theme: {
    primary: "#161616", // noir charbon : en-tête, sections immersives, titres
    secondary: null, // null = fonds de section calculés à partir du fond de page
    accent: "#C5A059", // or brossé : boutons d'action, filets décoratifs, détails
    background: "#FAF8F5", // blanc albâtre : fond de page
    text: "#161616", // noir charbon : texte principal et pied de page
    textSoft: "#7A746E", // gris taupe : descriptions et mentions secondaires
    header: "dark", // "dark" : en-tête sur fond primary ; "light" : sur le fond de page
  },

  // ---------------------------------------------------------------
  //  IDENTITÉ DU RESTAURANT
  // ---------------------------------------------------------------
  business: {
    name: "Maison Albâtre",
    legalName: "Maison Albâtre SARL",
    tagline: "Cuisine de saison et cave choisie.",
    // 150 à 160 caractères : texte affiché sous le titre dans Google.
    description:
      "Maison Albâtre, restaurant à Abidjan : carte courte de saison, menu dégustation et cave choisie. Consultez la carte et réservez votre table en ligne.",
    schemaType: "Restaurant", // schema.org : Restaurant, BarOrPub, CafeOrCoffeeShop...
    cuisine: "Cuisine de saison", // pour Google
    priceRange: "$$$", // $ à $$$$ : pour Google
    phone: "+225 07 67 71 03 38", // affiché tel quel ; mettez l'indicatif du pays (+225) : sur mobile, « Appeler » ouvre le clavier du téléphone avec ce numéro
    // Lien d'appel : calculé automatiquement depuis "phone". Renseignez phoneLink (ex. "+2250700000000") seulement pour le forcer.
    phoneLink: "",
    email: "reservation.maisonalbatre@gmail.com",
    address: {
      street: "12 rue des Artisans",
      line2: "Cocody",
      postalCode: "",
      city: "Abidjan",
      countryName: "Côte d'Ivoire",
      countryCode: "CI",
    },
    // Latitude et longitude (clic droit sur votre emplacement dans OpenStreetMap ou Google Maps).
    geo: { lat: 5.36, lon: -3.99 },
    // Carte de la section « Venir » : "google" (Google Maps, par défaut) ou "osm" (OpenStreetMap).
    // locate : "address" (par défaut) = Google Maps retrouve le lieu à partir du nom et de l'adresse ci-dessus ;
    // "coordinates" = il utilise les coordonnées GPS de geo. query (facultatif) : texte exact à chercher dans
    // Google Maps, par exemple le nom de la fiche de l'établissement suivi de la ville.
    // autoLoad : true = la carte s'affiche d'elle-même quand on arrive sur la section ;
    // false = le visiteur clique sur « Afficher la carte ». zoom : 1 (monde) à 19 (rue).
    map: { provider: "google", locate: "address", zoom: 16, autoLoad: true },
  },

  // ---------------------------------------------------------------
  //  MENU DE NAVIGATION (le bouton "Réserver" est ajouté automatiquement)
  // ---------------------------------------------------------------
  nav: [
    { label: "La maison", href: "#maison" },
    { label: "La carte", href: "#carte" },
    { label: "La cave", href: "#cave" },
    { label: "Galerie", href: "#galerie" },
    { label: "Venir", href: "#venir" },
  ],

  // ---------------------------------------------------------------
  //  HORAIRES : une ligne par jour, du lundi au dimanche.
  //  Fermé toute la journée : ranges: []
  //  Déjeuner et dîner : deux plages, ex. [["12:00", "14:30"], ["19:00", "22:30"]]
  // ---------------------------------------------------------------
  hours: [
    { day: "Lundi", ranges: [] },
    { day: "Mardi", ranges: [["12:00", "14:30"], ["19:00", "22:30"]] },
    { day: "Mercredi", ranges: [["12:00", "14:30"], ["19:00", "22:30"]] },
    { day: "Jeudi", ranges: [["12:00", "14:30"], ["19:00", "22:30"]] },
    { day: "Vendredi", ranges: [["12:00", "14:30"], ["19:00", "23:00"]] },
    { day: "Samedi", ranges: [["12:00", "14:30"], ["19:00", "23:00"]] },
    { day: "Dimanche", ranges: [["12:00", "15:30"]] },
  ],

  // ---------------------------------------------------------------
  //  ACCUEIL
  // ---------------------------------------------------------------
  hero: {
    title: "Une cuisine de saison, servie sans hâte.",
    subtitle:
      "Produits du marché, cuissons justes et une carte courte qui change avec les arrivages. Réservez votre table pour le déjeuner ou le dîner.",
    primaryCta: { label: "Réserver une table", href: "#reserver" },
    secondaryCta: { label: "Voir la carte", href: "#carte" },
    // Arrière-plan de l'accueil :
    //   "arche"    : vos photos (liste photos ci-dessous) dans une grande arche dorée, qui s'enchaînent en
    //                fondu, sur un fond de lumières dorées. 
    //   "ambiance" : lumières dorées qui dérivent lentement (lueur de bougies), grain de pellicule,
    //                monogramme en filigrane, sans photo. Léger, sans fichier à charger, identique sur tous les appareils.
    //   "video"    : la vidéo ci-dessous (la porte d'entrée), à remplacer par la vôtre.
    background: "ambiance",
    // Photos de l'arche (3 à 5 conseillées, format portrait ou carré de préférence).
    // position : cadrage dans l'arche (x y en %). Les fichiers sont ceux de src/assets/.
    photos: [
      {
        src: "assets/dessert.webp",
        alt: "Fondant au chocolat, boule de glace vanille et cerise sur une assiette blanche",
        position: "50% 30%",
      },
      {
        src: "assets/cave-accord.webp",
        alt: "Mur de bouteilles de vin rangées sur des étagères métalliques, devant un mur de briques",
        position: "50% 45%",
      },
      {
        src: "assets/table-dressee.webp",
        alt: "Table en bois dressée : assiettes blanches sur sets en rotin, serviette grise et branches d'eucalyptus",
        position: "50% 55%",
      },
      {
        src: "assets/pain-du-jour.webp",
        alt: "Deux pains au levain farinés, empilés sur une table en bois",
        position: "50% 70%",
      },
    ],
    // Durée d'affichage de chaque photo, en secondes.
    photoSeconds: 5,
    // Vidéo d'ambiance en arrière-plan de l'accueil (la porte d'entrée).
    // Elle démarre à l'arrivée sur le site, sans son, et se joue une fois.
    // Le fichier fourni est une ANIMATION D'EXEMPLE : remplacez-la par votre vidéo
    // (MP4 H.264, sans son, 1920 x 1080 maximum, 3 à 8 Mo, 5 à 10 secondes),
    // placée dans src/assets/. "" pour retirer la vidéo (l'assiette dessinée s'affiche alors).
    video: {
      src: "assets/entree.mp4",
      srcWebm: "assets/entree.webm", // facultatif : second format (WebM), lu par les navigateurs sans H.264
      poster: "assets/entree-poster.jpg", // image affichée avant le démarrage et si la vidéo ne peut pas jouer
      loop: false, // true : la vidéo tourne en boucle
      // true : ne pas lancer la vidéo si l'appareil demande de réduire les animations
      // (réglage « supprimer les animations » d'Android, « réduire les animations » d'iOS ou de Windows).
      respectReducedMotion: false,
    },
  },

  // ---------------------------------------------------------------
  //  LA MAISON : présentation, chef et valeurs
  //  Photo : déposez-la dans src/assets/ (portrait 4:5, 1000 px de large)
  //  puis changez src et alt.
  // ---------------------------------------------------------------
  about: {
    title: "La maison",
    paragraphs: [
      "Maison Albâtre est née d'une idée simple : une carte courte, des produits que le chef choisit lui-même au marché et un service attentif, sans cérémonie inutile.",
      "Ici, chaque assiette est pensée pour être partagée autant que savourée. La carte change avec les saisons, la cave suit la cuisine, et l'équipe prend le temps de vous conseiller.",
    ],
    chef: { name: "Chef Prénom Nom", role: "Chef et propriétaire" },
    image: {
      src: "assets/chef.svg",
      alt: "Illustration à remplacer par le portrait du chef",
      width: 640,
      height: 800,
    },
    values: [
      {
        title: "Le marché d'abord",
        text: "Le chef compose chaque semaine sa carte selon ce qu'il trouve de meilleur, auprès de producteurs qu'il connaît.",
      },
      {
        title: "Une carte courte",
        text: "Peu de plats, tous maîtrisés. C'est la garantie de produits frais et de cuissons précises.",
      },
      {
        title: "Un service attentif",
        text: "Allergie, régime, occasion particulière : dites-le-nous à la réservation, tout sera prêt à votre arrivée.",
      },
    ],
  },

  // ---------------------------------------------------------------
  //  LA CARTE
  //  diets : "veg" (végétarien), "gf" (sans gluten), ou []. Vérifiez chaque
  //  mention avec votre cuisine : une erreur peut avoir des conséquences
  //  pour un client allergique.
  // ---------------------------------------------------------------
  menu: {
    title: "La carte",
    intro: "Une carte courte, renouvelée avec les saisons. Les plats peuvent varier selon les arrivages.",
    currency: "F CFA",
    note: "Prix en F CFA, service compris. Indiquez toute allergie à la réservation ou à votre arrivée.",
    filters: [
      { id: "veg", label: "Végétarien" },
      { id: "gf", label: "Sans gluten" },
    ],
    categories: [
      {
        id: "entrees",
        label: "Entrées",
        items: [
          {
            name: "Tartare de thon, mangue et piment doux",
            desc: "Thon du jour, mangue verte, huile de coriandre, chips de plantain.",
            price: "9 500",
            diets: ["gf"],
          },
          {
            name: "Velouté de potiron",
            desc: "Lait de coco, graines torréfiées, huile d'olive.",
            price: "6 500",
            diets: ["veg", "gf"],
          },
          {
            name: "Salade de crevettes tiédies",
            desc: "Crevettes snackées, avocat, agrumes, vinaigrette au gingembre.",
            price: "8 500",
            diets: ["gf"],
          },
          {
            name: "Œuf parfait et champignons",
            desc: "Crème de maïs, champignons sautés, jus de volaille réduit.",
            price: "7 000",
            diets: [],
          },
        ],
      },
      {
        id: "plats",
        label: "Plats",
        items: [
          {
            name: "Filet de bar, beurre blanc citronné",
            desc: "Légumes du marché, riz parfumé.",
            price: "21 000",
            diets: ["gf"],
          },
          {
            name: "Magret de canard, sauce au tamarin",
            desc: "Purée de patate douce, légumes rôtis.",
            price: "24 000",
            diets: ["gf"],
          },
          {
            name: "Risotto aux légumes de saison",
            desc: "Parmesan affiné, huile d'herbes.",
            price: "15 000",
            diets: ["veg", "gf"],
          },
          {
            name: "Côte de bœuf à partager",
            desc: "Pour deux personnes. Pommes grenailles, sauce au poivre, salade.",
            price: "52 000",
            diets: ["gf"],
          },
        ],
      },
      {
        id: "desserts",
        label: "Desserts",
        items: [
          {
            name: "Fondant au chocolat noir",
            desc: "Glace vanille, éclats de noisette.",
            price: "6 500",
            diets: ["veg"],
          },
          {
            name: "Mangue rôtie, sorbet citron vert",
            desc: "Crumble sablé, menthe fraîche.",
            price: "6 000",
            diets: ["veg"],
          },
          {
            name: "Crème brûlée à la vanille",
            desc: "Vanille infusée, sucre caramélisé.",
            price: "5 500",
            diets: ["veg", "gf"],
          },
          {
            name: "Assiette de fromages affinés",
            desc: "Sélection du jour, confiture maison, pain grillé.",
            price: "8 000",
            diets: ["veg"],
          },
        ],
      },
    ],
    tasting: {
      title: "Menu dégustation",
      text: "Cinq services composés par le chef selon le marché du jour, pour l'ensemble de la table.",
      courses: ["Mise en bouche", "Entrée froide", "Poisson", "Viande", "Dessert"],
      price: "45 000",
      cta: "Réserver le menu dégustation",
    },
  },

  // ---------------------------------------------------------------
  //  LA CAVE (section sombre)
  // ---------------------------------------------------------------
  cave: {
    title: "La cave",
    intro: "Une sélection courte, choisie pour accompagner la carte. Notre équipe vous conseille un accord pour chaque plat.",
    groups: [
      {
        title: "Rouges",
        items: [
          { name: "Saint-Émilion, 2018", detail: "Fruits noirs, tanins soyeux", price: "68 000" },
          { name: "Côtes du Rhône, 2020", detail: "Épices, fruits rouges", price: "32 000" },
          { name: "Bourgogne, 2019", detail: "Cerise, fraîcheur", price: "48 000" },
        ],
      },
      {
        title: "Blancs",
        items: [
          { name: "Chablis, 2021", detail: "Minéral, vif", price: "45 000" },
          { name: "Sancerre, 2022", detail: "Agrumes, herbes fraîches", price: "42 000" },
          { name: "Pouilly-Fuissé, 2021", detail: "Rond, beurré", price: "58 000" },
        ],
      },
      {
        title: "Rosés et bulles",
        items: [
          { name: "Rosé de Provence", detail: "Léger, fruits blancs", price: "30 000" },
          { name: "Crémant brut", detail: "Fines bulles, pomme verte", price: "38 000" },
          { name: "Champagne brut", detail: "Brioché, élégant", price: "85 000" },
        ],
      },
    ],
    note: "Prix de la bouteille, en F CFA. Sélection de vins au verre disponible en salle. L'abus d'alcool est dangereux pour la santé.",
  },

  // ---------------------------------------------------------------
  //  GALERIE
  //  size : "l" (grande), "m" (moyenne), "s" (petite). Pour 5 photos : l, m, s, s, s.
  //  Photos : déposez-les dans src/assets/ (JPEG ou WebP, 1200 px, moins de 200 Ko)
  //  puis changez src et alt (le texte alternatif décrit la photo).
  // ---------------------------------------------------------------
  gallery: {
    title: "À table",
    intro: "Quelques images de la salle, de la cuisine et de la cave.",
    // size : "wide" (grand, 4 colonnes), "tall" (haut, 2 colonnes) ou "half" (moitié, 3 colonnes).
    // position : cadrage de la photo dans sa vignette (x y en %), pour garder le sujet visible.
    // width et height : dimensions réelles du fichier en pixels (évite que la page saute au chargement).
    items: [
      {
        src: "assets/table-dressee.webp",
        alt: "Table en bois dressée : assiettes blanches sur des sets en rotin, serviette grise, branches d'eucalyptus et bougies",
        caption: "La table dressée",
        size: "wide",
        position: "50% 55%",
        width: 1300,
        height: 868,
      },
      {
        src: "assets/cave-accord.webp",
        alt: "Mur de bouteilles de vin rangées sur des étagères métalliques, devant un mur de briques",
        caption: "Un accord à la cave",
        size: "tall",
        position: "50% 50%",
        width: 640,
        height: 960,
      },
      {
        src: "assets/pain-du-jour.webp",
        alt: "Deux pains au levain farinés, empilés sur une table en bois avec un torchon blanc",
        caption: "Le pain du jour",
        size: "half",
        position: "50% 78%",
        width: 1000,
        height: 1502,
      },
      {
        src: "assets/dessert.webp",
        alt: "Fondant au chocolat nappé de sauce, boule de glace vanille et cerise, sur une assiette blanche",
        caption: "Le dessert du chef",
        size: "half",
        position: "50% 48%",
        width: 1000,
        height: 1500,
      },
    ],
  },

  // ---------------------------------------------------------------
  //  VENIR
  // ---------------------------------------------------------------
  visit: {
    title: "Venir",
    intro: "Réservation recommandée le week-end. Le statut ci-dessous se met à jour en direct.",
    access: "Entrée de plain-pied, accessible en fauteuil roulant.", // "" pour masquer
  },

  // ---------------------------------------------------------------
  //  RÉSERVATION
  //  slots : horaires proposés dans le formulaire, par service.
  //  whatsapp : numéro WhatsApp (chiffres, avec indicatif) ; "" pour désactiver WhatsApp.
  //  sendVia : "whatsapp" (le bouton principal ouvre WhatsApp avec le message prêt, l'envoi par
  //  e-mail devient le bouton secondaire) ou "email" (l'inverse).
  //  maxGuests : adultes au maximum ; maxChildren : enfants au maximum.
  // ---------------------------------------------------------------
  reservation: {
    title: "Réserver une table",
    intro:
      "Choisissez une date et un horaire. Nous confirmons chaque réservation par téléphone ou par message : la table n'est garantie qu'après notre confirmation.",
    groupNote: "Pour plus de 8 personnes ou un événement privé, appelez-nous directement.",
    maxGuests: 8,
    maxChildren: 6,
    sendVia: "whatsapp",
    slots: [
      { label: "Déjeuner", times: ["12:00", "12:30", "13:00", "13:30", "14:00"] },
      { label: "Dîner", times: ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30"] },
    ],
    whatsapp: "2250767710338",
  },

  // ---------------------------------------------------------------
  //  RÉSEAUX SOCIAUX (supprimez une ligne pour la masquer)
  //  Reconnus automatiquement : Facebook, Instagram, WhatsApp, TikTok, YouTube, X, LinkedIn.
  //  Chaque icône prend la couleur de son réseau au survol.
  // ---------------------------------------------------------------
  social: [
    { label: "Instagram", href: "https://www.instagram.com/" },
    { label: "Facebook", href: "https://www.facebook.com/" },
    { label: "WhatsApp", href: "https://wa.me/2250767710338" },
  ],

  // ---------------------------------------------------------------
  //  MENTIONS LÉGALES (à compléter avec vos informations réelles)
  // ---------------------------------------------------------------
  legal: {
    publisher: "Maison Albâtre SARL",
    registration: "RCCM ou SIRET : à compléter",
    director: "", // nom du responsable de la publication ; "" pour masquer la ligne
    host: "", // hébergeur du site ; "" pour masquer la ligne
    dataNotice:
      "Les informations saisies dans le formulaire servent uniquement à traiter votre réservation. Si vous choisissez WhatsApp, votre demande est transmise au restaurant par WhatsApp. Elles ne sont ni revendues ni utilisées à d'autres fins, et vous pouvez demander leur suppression à tout moment par e-mail.",
    cookiesNotice: "Ce site n'utilise ni cookie de suivi ni outil de mesure d'audience.",
  },

  // ---------------------------------------------------------------
  //  RÉFÉRENCEMENT
  // ---------------------------------------------------------------
  seo: {
    // Titre de l'onglet et de Google (60 caractères maximum).
    title: "Maison Albâtre | Restaurant à Abidjan : carte et réservation",
    // Image de partage (1200 x 630 px) : générée par build.mjs si src/assets/og-image.png est absent.
    ogImage: "assets/og-image.png",
    ogImageAlt: "Maison Albâtre, restaurant à Abidjan",
  },
};
