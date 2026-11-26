# Site vitrine de restaurant

Site statique (HTML, CSS, JavaScript vanille) prêt à être publié gratuitement sur **GitHub Pages**. Aucun serveur, aucune base de données, aucune dépendance à installer.

Tout le contenu (nom, carte, prix, cave, horaires, coordonnées, images) se modifie dans **un seul fichier** : `site.config.mjs`. Les valeurs fournies (restaurant « Maison Albâtre », plats, vins, prix en F CFA) sont des **exemples fictifs** à remplacer avant la mise en ligne.

## Arborescence

```
site-vitrine/
├─ site.config.mjs     Tout le contenu du site : à modifier
├─ build.mjs           Génère le site dans /docs à partir de la configuration
├─ package.json        Raccourci : npm run build
├─ src/
│  ├─ styles.css       Styles (palette et typographie en tête de fichier)
│  ├─ main.js          Onglets et filtres de la carte, statut ouvert/fermé, réservation, plan
│  └─ assets/          Images et illustrations (remplaçables par vos photos)
└─ docs/               Site généré : c'est ce dossier que GitHub Pages publie
   ├─ index.html
   ├─ 404.html, robots.txt, sitemap.xml, .nojekyll
   └─ assets/
```

Ne modifiez pas les fichiers de `docs/` à la main : ils sont réécrits à chaque génération.

## Modifier le contenu

1. Ouvrez `site.config.mjs` et changez les couleurs (bloc `theme`), le nom, le téléphone, l'adresse, les horaires, la carte, la cave, la galerie et les réseaux sociaux. Chaque bloc est commenté.
2. Régénérez le site. Il faut Node.js 18 ou plus récent ([nodejs.org](https://nodejs.org)) :

   ```bash
   node build.mjs
   ```

3. Ouvrez `docs/index.html` dans votre navigateur pour vérifier le résultat.

### Points à ne pas oublier

- **Avis clients** : le site n'en affiche pas. Si vous en ajoutez plus tard, utilisez de vrais avis, avec l'accord de leurs auteurs : publier de faux avis est interdit.
- **Allergènes et régimes** : chaque plat porte des mentions « Végétarien » et « Sans gluten » (champ `diets`). Ces mentions sont **indicatives** et doivent être vérifiées avec votre cuisine, plat par plat : une erreur peut avoir des conséquences graves pour un client allergique. Le site rappelle d'indiquer toute allergie.
- **Alcool** : la cave affiche l'avertissement sur les dangers de l'abus d'alcool. Vérifiez les mentions exigées dans votre pays.
- **Mentions légales** : complétez le bloc `legal` (numéro d'immatriculation). Les lignes « Responsable de la publication » (`director`) et « Hébergement » (`host`) sont masquées tant que ces champs sont vides ; renseignez-les pour les afficher.
- **Adresse du site** : renseignez `siteUrl` une fois l'adresse GitHub Pages connue (voir plus bas), puis régénérez.
- **Téléphone** : saisissez le numéro avec l'indicatif du pays dans `business.phone` (ex. `+225 07 00 00 00 00`). Les boutons « Appeler » en sont déduits : sur un téléphone, un appui ouvre directement l'application Téléphone avec ce numéro prêt à composer. Sur ordinateur, le bouton flottant n'est pas affiché. Si l'application Téléphone ne s'ouvre pas (ordinateur, aperçu intégré), un petit message affiche le numéro avec un bouton « Copier ».
- **Lieu sur la carte** : par défaut (`business.map.locate: "address"`), Google Maps retrouve le restaurant à partir de son nom et de l'adresse (`business.address`). Corrigez l'adresse dans `site.config.mjs` : la carte, le lien « Ouvrir dans Google Maps » et l'itinéraire suivent. Si Google place mal le repère, copiez dans `business.map.query` le nom exact de la fiche Google Maps de l'établissement suivi de la ville. Pour un repère au mètre près, passez `locate` à `"coordinates"` et renseignez `business.geo` (clic droit sur le lieu dans Google Maps : la première ligne donne latitude puis longitude).
- **Carte** : `business.map` règle le fournisseur (`"google"` ou `"osm"`), le zoom (1 à 19) et `autoLoad` (`true` : la carte s'affiche seule en arrivant sur la section ; `false` : le visiteur clique sur « Afficher la carte »). Les liens « Ouvrir dans... » et « Calculer l'itinéraire » restent toujours visibles sous la carte.

### La carte

Le bloc `menu` contient les catégories (`categories`), chacune avec ses plats : `name`, `desc`, `price`, `diets` (`"veg"`, `"gf"` ou `[]`). Ajouter une catégorie ou un plat, c'est ajouter un bloc. Le bloc `menu.tasting` décrit le menu dégustation, `cave` la carte des vins, `gallery` les photos.

Sur le site, les catégories s'affichent en onglets (navigation au clavier : flèches, Début, Fin) et deux filtres de régime se combinent. Sans JavaScript, toutes les catégories restent affichées l'une sous l'autre.

### Horaires et statut « Ouvert / Fermé »

Les horaires se saisissent par jour. Déjeuner et dîner s'écrivent avec deux plages : `[["12:00", "14:30"], ["19:00", "22:30"]]`. Un jour fermé s'écrit `ranges: []`.

Le statut affiché sous le titre d'accueil et dans « Venir » se calcule dans le navigateur avec le fuseau `timezone` du restaurant. Le formulaire de réservation refuse aussi les dates passées et les jours de fermeture. Sans JavaScript, le tableau des horaires reste affiché.

### Écran de chargement

À l'arrivée, un écran sombre affiche un compteur de 000 à 100 %, des anneaux dorés qui tournent et votre monogramme qui se remplit de bas en haut, avec une phrase qui change (« Allumage des lumières », « Dressage des tables »...). Puis deux volets s'ouvrent comme une porte et l'accueil s'anime.

- Le site n'apparaît jamais avant d'être chargé : l'écran dure au minimum `loader.seconds` (2,6 s) et attend la fin du chargement. Un clic sur « Passer » ou la touche Échap l'ouvre tout de suite.
- Pendant l'attente le reste de la page est inactif (clavier et lecteurs d'écran compris).
- Si l'appareil demande de réduire les animations, il n'y a ni rotation ni volets : un simple fondu d'environ une demi-seconde.
- Sécurité : sans JavaScript l'écran n'apparaît pas, et il est retiré d'office après 9 secondes si un problème survient.
- Réglages dans `site.config.mjs`, bloc `loader` : `enabled` (`false` pour le supprimer), `seconds`, `oncePerSession` (`true` = une seule fois par visite) et `messages` (les phrases).

### Arrière-plan de l'accueil

`hero.background` choisit le décor derrière le titre :

- `"arche"` : vos photos dans une grande arche cernée d'un filet doré, à droite du titre. Elles s'enchaînent en fondu avec un très léger zoom, sur un fond de lumières dorées. La liste se règle dans `hero.photos` (3 à 5 photos, de préférence en portrait ; `position` règle le cadrage) et `hero.photoSeconds` donne la durée d'affichage de chacune. Le défilement s'arrête quand l'onglet est caché, quand l'accueil sort de l'écran ou si l'appareil demande de réduire les animations : la première photo reste alors affichée. Sur mobile, l'arche passe sous le texte.
- `"ambiance"` (réglage actuel) : lumières dorées qui dérivent lentement, comme des bougies dans une salle le soir, avec un léger grain de pellicule et votre monogramme en filigrane, sans photo. Il ne charge aucun fichier et s'immobilise si l'appareil demande de réduire les animations.
- `"video"` : la vidéo décrite ci-dessous.

### Vidéo d'accueil (la porte d'entrée)

Le bloc `hero.video` de `site.config.mjs` place une vidéo en arrière-plan de l'accueil. Elle démarre dès l'arrivée sur le site, sans son, et se joue une fois (elle reste sur la dernière image ; `loop: true` pour une boucle). Il n'y a pas de bouton de pause : la vidéo est muette, dure quelques secondes et ne se joue qu'une fois.

**La vidéo fournie est une animation d'exemple** (une porte qui s'ouvre), pas votre porte. Pour mettre la vôtre :

1. Filmez la porte en plan fixe ou avec un léger mouvement, de préférence avec la porte à **droite** de l'image (le texte est à gauche), 5 à 10 secondes, sans son.
2. Exportez en **MP4 H.264**, 1920 x 1080 au maximum, **3 à 8 Mo** (un fichier lourd ralentit le site, surtout sur mobile). Option : une copie WebM (champ `srcWebm`).
3. Déposez-la dans `src/assets/`, ajoutez une image fixe (JPEG, première image de la vidéo) pour `poster`, changez les chemins dans `hero.video`, puis `node build.mjs`.

Si le navigateur bloque le démarrage automatique (mode économie d'énergie, fenêtre intégrée), la vidéo démarre au premier défilement, toucher, clic ou touche, et chaque fois que l'accueil revient à l'écran, sauf si la personne l'a mise en pause. Par défaut elle se lance même quand l'appareil demande de réduire les animations (c'est une seule lecture muette, avec bouton pause) ; mettez `respectReducedMotion: true` dans `hero.video` pour l'empêcher.

Un voile sombre se place automatiquement sur la vidéo pour garder le texte lisible. Si le visiteur a activé l'économiseur de données, la vidéo ne se lance pas toute seule : seule l'image fixe s'affiche. Mettez `src: ""` pour retirer la vidéo ; l'assiette dessinée revient alors. GitHub Pages accepte les fichiers jusqu'à 100 Mo, mais restez bien en dessous.

### Images

La galerie « À table » affiche quatre photos : la table dressée, l'accord à la cave, le pain du jour et le dessert (fichiers `table-dressee.webp`, `cave-accord.webp`, `pain-du-jour.webp` et `dessert.webp`, convertis en WebP pour rester légers). Pour changer une photo :

1. Déposez la nouvelle image dans `src/assets/` (JPEG ou WebP, environ 1200 px de large, moins de 200 Ko).
2. Dans `site.config.mjs`, bloc `gallery.items`, changez `src`, `alt` (une phrase qui décrit la photo), `width` et `height` (dimensions réelles en pixels).
3. `size` règle la place dans la mosaïque (`wide`, `tall` ou `half`) et `position` le cadrage (par exemple `"50% 78%"` descend vers le bas de l'image). Lancez ensuite `node build.mjs`.

**Droits des photos** : les photos du pain et de la table portent un filigrane « Unsplash+ » : ce sont des versions d'aperçu. Avant de publier le site, utilisez les versions sous licence (Unsplash+ est payant) ou vos propres photos, sinon le filigrane reste visible et l'usage n'est pas couvert.

**Logo** : le monogramme M est dans `src/assets/logo-m.svg` (un seul tracé, sans fond). Il s'affiche dans l'en-tête, le menu mobile, le pied de page et l'icône de l'onglet, en doré sur fond sombre. Pour changer de logo, remplacez ce fichier par un SVG d'un seul tracé rempli en `currentColor`, puis lancez `node build.mjs`. Sans ce fichier, le site revient à un petit losange doré. `logo-m.png` (fond transparent) sert pour les réseaux sociaux ou l'impression ; `logo-monogramme-complet.svg` garde la version d'origine avec le J et le point.

L'image de partage (`og-image.png`, 1200 x 630 px) est générée automatiquement au premier lancement si l'outil `rsvg-convert` est installé. Pour utiliser la vôtre, placez simplement un fichier de ce nom dans `src/assets/` : il ne sera pas écrasé.

### Réservation

Le formulaire demande la date, l'heure (créneaux du bloc `reservation.slots`), le nombre d'**adultes** et d'**enfants** (`maxGuests` et `maxChildren`), le nom, le téléphone, et facultativement l'e-mail et une précision (allergie, occasion, chaise haute). Le choix du mode d'envoi se fait avec `reservation.sendVia`, sans serveur :

- **`"whatsapp"` (réglage actuel)** : le bouton principal ouvre WhatsApp vers le numéro de `reservation.whatsapp` (chiffres avec indicatif, ici `2250767710338`) avec un message déjà rédigé, par exemple :
  ```
  Bonjour Maison Albâtre,
  Je souhaite réserver une table :
  *Date :* mercredi 25 novembre
  *Heure :* 20h00
  *Personnes :* 2 adultes et 2 enfants
  *Nom :* ...
  *Téléphone :* ...
  Merci de me confirmer la disponibilité.
  ```
  Le client n'a plus qu'à appuyer sur « Envoyer » dans WhatsApp. Un second bouton « Envoyer par e-mail » reste disponible. Le message n'est pas envoyé automatiquement : un site statique ne peut pas le faire.
- **`"email"`** : `formspreeEndpoint` est vide, la messagerie du visiteur s'ouvre avec la demande rédigée. WhatsApp devient le bouton secondaire (mettez `whatsapp: ""` pour le retirer).
- **Avec Formspree** (plan gratuit disponible) : créez un formulaire sur [formspree.io](https://formspree.io) et collez son adresse (`https://formspree.io/f/xxxxxxxx`) dans `formspreeEndpoint`, avec `sendVia: "email"`. Les demandes arrivent dans votre boîte e-mail sans quitter le site.

Le numéro et le message transitent par WhatsApp : la mention de confidentialité du pied de page (`legal.dataNotice`) le précise.

Ce site ne gère pas de plan de salle : chaque demande est une **demande** que vous confirmez par téléphone ou par message, et le texte l'indique au client. Pour une réservation confirmée automatiquement, il faut un service tiers (TheFork, Zenchef, Resengo...) à lier au bouton « Réserver ».

Les champs sont validés avant l'envoi, avec des messages d'erreur annoncés aux lecteurs d'écran. Un champ piège invisible limite les envois automatiques. Sur mobile, une petite pastille translucide « Réserver une table / Appeler » reste en bas de l'écran, sauf quand le bouton d'accueil ou le formulaire sont déjà visibles.

## Publier sur GitHub Pages

1. **Créer le dépôt** : sur [github.com/new](https://github.com/new), créez un dépôt public (par exemple `mon-restaurant`), sans README ni `.gitignore`.
2. **Envoyer le projet** depuis le dossier du site :

   ```bash
   git init
   git add .
   git commit -m "Premier jet du site vitrine"
   git branch -M main
   git remote add origin https://github.com/VOTRE-COMPTE/mon-restaurant.git
   git push -u origin main
   ```

3. **Activer GitHub Pages** : dans le dépôt, ouvrez *Settings*, puis *Pages*. Sous *Build and deployment*, choisissez *Source : Deploy from a branch*, puis la branche `main` et le dossier **`/docs`**. Enregistrez.
4. **Attendre une à deux minutes** : le site est alors en ligne à l'adresse `https://VOTRE-COMPTE.github.io/mon-restaurant/`.
   > **Adresse avec `/docs/`** : si le site s'ouvre sur `https://VOTRE-COMPTE.github.io/mon-restaurant/docs/index.html`, c'est que Pages sert la racine du dépôt et non le dossier `docs`. Le site fonctionne, mais l'adresse est longue : dans *Settings*, *Pages*, choisissez le dossier `/docs` pour obtenir l'adresse courte, puis mettez `siteUrl` à jour.

5. **Renseigner cette adresse** dans `siteUrl` (avec le `/` final), lancez `node build.mjs`, puis publiez la mise à jour :

   ```bash
   git add .
   git commit -m "Adresse du site"
   git push
   ```

Pour chaque modification ultérieure, répétez : modifier `site.config.mjs`, `node build.mjs`, `git add .`, `git commit`, `git push`.

### Utiliser votre propre nom de domaine

Dans *Settings*, *Pages*, renseignez *Custom domain* et configurez l'enregistrement DNS demandé chez votre registrar. GitHub crée un fichier `docs/CNAME` : la génération le conserve. Mettez ensuite votre domaine dans `siteUrl`.

## Choix de conception

**Palette** : définie dans le bloc `theme` de `site.config.mjs`. Le reste (survols, fonds atténués, pied de page, illustrations, image de partage) est calculé à partir de ces couleurs. À chaque génération, `build.mjs` affiche les contrastes et signale tout défaut WCAG AA. Palette actuelle :

| Rôle | Couleur | Usage |
|---|---|---|
| Blanc albâtre | `#FAF8F5` | Fond de page, la dominante (60 %). Lecture confortable de la carte, met en valeur les photos. |
| Noir charbon | `#161616` | En-tête, accueil, cave, réservation, pied de page, menu dégustation, texte principal (30 %). Contraste de 17,1 : 1 sur le fond. |
| Or brossé | `#C5A059` | Boutons d'action (texte noir dessus, 7,4 : 1), filets, tracé de l'assiette, prix des vins sur fond sombre (10 %). |
| Gris taupe | `#7A746E` | Descriptions et mentions secondaires. Seul à 4,3 : 1 sur le fond, il est assombri automatiquement en `#6B6661` (5,4 : 1) pour respecter le seuil AA. |
| Fond de section | calculé | Ton albâtre légèrement plus soutenu, pour alterner les sections. |

`theme.header` choisit un en-tête sombre (`"dark"`) ou clair (`"light"`).

**Typographie** : *Marcellus* (titres, une seule graisse) et *Public Sans* (texte), chargées depuis Google Fonts avec repli sur Palatino/Georgia et les polices du système. Lignes limitées à 65 caractères.

**Structure** : accueil sombre (charbon) avec assiette dessinée au trait, « La maison » claire, « La carte » sur fond plus soutenu, « La cave » sombre, galerie, réservation sombre, « Venir ». L'alternance clair/sombre suit la répartition 60 / 30 / 10 de la palette.

**Élément signature** : l'assiette au trait doré qui se dessine au chargement, et le statut « Ouvert / Fermé » calculé en direct juste en dessous. Le reste reste volontairement sobre.

**Mouvement** (désactivé si le système demande de réduire les animations) :
- *Au chargement* : l'en-tête descend, le losange du logo pivote, le titre se révèle mot par mot, l'assiette se dessine trait par trait, puis le texte, les boutons et le bandeau d'informations arrivent à tour de rôle.
- *Au défilement* : chaque bloc arrive avec sa direction (image du chef dévoilée de haut en bas, photos qui grandissent, lignes d'horaires une à une, trait doré sous chaque titre).
- *Menu (ordinateur)* : au survol d'un lien, un filet doré entre par la gauche sous le texte et ressort par la droite quand le pointeur s'éloigne. Au clavier, il reste affiché sur le lien ciblé.
- *Au survol et à la sélection* : reflet sur les boutons (« Réserver une table », « Réserver » et « Demander cette table » « Réserver » et « Réserver une table » ont un contour doré et un intérieur vide : au survol ils se remplissent d'or, montent légèrement et un reflet les traverse, comme « Voir la carte » le fait en clair ; « Demander cette table » se remplit d'une teinte dorée plus profonde ; « Appeler » et « Voir la carte » se remplissent de clair, appui visible sur mobile), icônes des réseaux sociaux du pied de page qui prennent la couleur de leur réseau (Facebook bleu, Instagram rose, WhatsApp vert...), pointillés des plats qui passent à l'or, nom du plat qui avance, vins qui s'allument en or, photos qui s'agrandissent doucement, onglets et filtres qui réagissent, texte sélectionné à la souris en or. Mêmes retours au clavier (focus visible).
- Pour ne pas ralentir la page, on anime surtout `transform`, `translate`, `scale`, `opacity` et `clip-path` (et le tracé de l'assiette, un seul dessin léger). Si le script ne se charge pas, le contenu s'affiche quand même après 3 secondes.

## Performance, accessibilité et référencement

- Un seul fichier CSS et un seul script, sans bibliothèque. Images en lazy loading avec dimensions déclarées (pas de saut de mise en page).
- Polices chargées sans bloquer l'affichage. La carte se charge seulement quand la section approche de l'écran (ou au clic avec `autoLoad: false`), ce qui allège le premier affichage.
- HTML sémantique, lien d'évitement, focus visible, cibles tactiles d'au moins 44 px, menu burger avec `aria-expanded`, tous les champs étiquetés.
- Balises `title`, `description`, Open Graph, données structurées `Restaurant` (adresse, horaires, cuisine, gamme de prix, réservation acceptée, lien vers la carte), `sitemap.xml` et `robots.txt` générés.
- Aucun cookie, aucun outil de suivi.

Après publication, vérifiez le site avec Lighthouse (outils de développement de Chrome, onglet *Lighthouse*) ou [PageSpeed Insights](https://pagespeed.web.dev).
