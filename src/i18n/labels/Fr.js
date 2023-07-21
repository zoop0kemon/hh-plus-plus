import Helpers from '../../common/Helpers'

const gameConfigs = {
    HH: {
        fille: 'fille',
        delafille: 'de la fille',
        fleurs: 'fleurs',
        waifu: 'waifu'
    },
    GH: {
        fille: 'mec',
        delafille: 'du mec',
        fleurs: 'sucettes',
        waifu: 'boyfriend'
    },
    CxH: {
        fille: 'fille',
        delafille: 'de la fille',
        fleurs: 'bijoux',
        waifu: 'waifu'
    },
    PSH: {
        fille: 'fille',
        delafille: 'de la fille',
        fleurs: 'bières',
        waifu: 'waifu'
    },
    HoH: {
        fille: 'fille',
        delafille: 'de la fille',
        fleurs: 'fleurs',
        waifu: 'waifu'
    },
}
const gameConfig = gameConfigs[Helpers.getGameKey()]

export const common = {
    all: 'Toutes',
}

export const config = {
    refresh: 'Rafraîchir page d\'accueil',
    villain: 'Menu des combats des trolls',
    villain_tiers: `Montrer les paliers/${gameConfig.fille}s`,
    market: 'Infos marché',
    marketEquipsFilter: 'Filtre d\'équipements au marché',
    harem: 'Infos harem',
    league: 'Infos ligue',
    league_board: 'Montrer les tops ligue',
    league_promo: 'Montrer les informations sur la promotion',
    simFight: 'Simu ligue / saison / combats de troll',
    simFight_logging: 'Détails dans la console du navigateur',
    teamsFilter: 'Filtre d\'équipes',
    champions: 'Infos champions',
    champions_poseMatching: 'Ajouter des indicateurs de correspondance de pose',
    champions_fixPower: `Normaliser le pouvoir des ${gameConfig.fille}s pour comparaison`,
    homeScreen: 'Raccourcis & timers de l\'écran principal',
    homeScreen_leaguePos: 'Afficher le rang de Ligue actuel (ajoute de la charge réseau supplémentaire)',
    resourceBars: 'Barres de ressources / Indicateurs de boosters',
    popSort: 'Tri LdP et navigation rapide',
    seasonStats: 'Stats de la saison',
    pachinkoNames: 'Montrer les noms au Pachinko',
    contestSummary: 'Récap\' des récompenses des Compètes enregistrées',
    battleEndstate: 'Afficher le détail quand tu passes le combat',
    gemStock: 'Stock de gemmes au marché/harem',
    staticBackground: 'Empêche les changements de décor durant les Jours d\'Orgie',
    rewardShards: `Affiche le nombre de Fragments d'Affection actuels sur les ${gameConfig.fille}s en récompense`,
    leaderboardFix: 'Corrige les classements de Saison, VdV, VdlG et Panthéon',
    hideClaimedRewards: 'Masquer les récompenses récupérées',
    disableDragDrop: 'Désactiver la fonction glisser-déposer dans le marché',
    autoRefresh: 'Actualise automatiquement le jeu toutes les 10 minutes',
    villainBreadcrumbs: 'Ajouter une chaîne de navigation aux pages des boss du mode aventure',
    blessingSpreadsheetLink: 'Ajouter un lien vers la feuille de données des bénédictions à l\'infobulle des bénédictions',
    homeScreenIcons: 'Ajouter des icônes aux menus de l\'écran principal',
    homeScreenOrder: 'Ordre alternatif des menus de l\'écran principal',
    homeScreenOldish: 'Mise en page d\'origine de l\'écran principal (incompatible avec la réorganisation des éléments à droite)',
    overridePachinkoConfirm: `Désactive l'avertissement "Pas de ${gameConfig.fille} disponible" dans le Pachinko/NC`,
    sidequestCompletionMarkers: 'Marqueurs de complétion pour les quêtes secondaires',
    censorMode: 'Censurer le contenu NSFW',
    fixProfilePopup: 'Corriger les popups du profil joueur',
    eventEndIndicators: 'Indicateurs de fin d\'évènement sur la page d\'accueil',
    haremTeamsFilter: 'Filtre d\'équipes dans le harem',
    upgradeQuickNav: 'Navigation rapide sur la page d\'amélioration',
    leaderboardClubmateIndicators: 'Surligner les coéquipiers  dans les classements',
    leaderboardProfilePopups: 'Liens vers les profils de joueurs dans les classements',
    improvedWaifu: `Paramètres avancés pour ${gameConfig.waifu}`,
    sortDailyMissions: 'Trier les missions par durée',
    sortDailyMissions_reverse: 'Ordre inverse',
    upgradeInfo: 'Infos sur la page d\'amélioration'
}
export const stConfig = {
    missionsBackground: 'Change l\'arrière-plan des missions',
    collectMoneyAnimation: 'Désactive l\'animation de récolte d\'argent',
    mobileBattle: 'Corrige l\'écran de bataille sur mobile',
    darkMobileLeague: 'Fond sombre en Ligue sur mobile',
    hideRotateDevice: 'Masque le message de rotation de l\'écran sur mobile',
    salaryTimers: `Timers des salaires des ${gameConfig.fille}s visibles`,
    moveSkipButton: 'Mettre le bouton pour passer les combats en-bas',
    poseAspectRatio: `Corriger les proportions de la pose ${gameConfig.delafille} en combat`,
    reduceBlur: 'Réduire l\'effet de flou sur l\'écran principal',
    homeScreenRightSideRearrange: 'Réorganiser les éléments sur le côté droit de l\'écran principal',
    selectableId: 'Rendre l\'ID sélectionnable dans le profil utilisateur',
    messengerDarkMode: 'Mode nuit pour la messagerie',
    leagueTableCompressed: 'Tableau de Ligue compact',
    leagueTableRowStripes: 'Lignes rayées dans le tableau de Ligue',
    leagueTableShadow: 'Enlever l\'ombre dans le tableau de Ligue',
    removeParticleEffects: 'Enlever les effets de particules de la page d\'accueil',
    eventGirlTicks: `Coches améliorées pour les ${gameConfig.fille}s d'événement`,
    eventGirlBorders: `Bordures vertes pour les ${gameConfig.fille}s d'événement obtenues`,
    compactNav: 'Menu principal compact',
    poaBorders: 'Bordures vertes pour les récompenses du CdlA',
    champGirlPower: `Corriger le débordement des points de puissance ${gameConfig.delafille} de Champion`,
    champGirlOverlap: `Corriger la superposition ${gameConfig.delafille} de Champion lors de la sélection des ${gameConfig.fille}s`,
    hideGameLinks: 'Masquer les liens vers les autres jeux',
    poaTicks: 'Corriger la position des coches dans l\'écran du CdlA',
    poaGirlFade: `Corriger l'estompement de la pose des ${gameConfig.fille}s dans le CdlA`,
    newButtons: 'Remplacer les anciens boutons de menu restants',
    bonusFlowersOverflow: `Empêcher les ${gameConfig.fleurs} bonus d'apparaître hors écran`,
    popButtons: 'Masquer les boutons d\'auto-assignement et d\'auto-récupération dans les LdP',
    contestNotifs: 'Déplacer les notifications de compet\'',
    contestPointsWidth: 'Empêcher le débordement des points dans le tableau de compet\'',
    leagueChangeTeamButton: 'Corriger le positionnement des boutons de gauche dans la Ligue',
    compactPops: 'LdP compacts',
    monthlyCardText: 'Corriger le texte de la carte memsuelle',
    povUnclutter: 'Meilleure clarté de page pour VdlV/VdlG',
    dailyGoals: 'Redesign de la page des Objectifs Journaliers',
    bbProgress: 'Meilleure barre de progrès des récompenses de Boss Bang',
    compactLossScreen: 'Ecran de défaite compact',
    seasonalEventTweaks: 'Modifications pour les Evènements Saisonniers',
    compactHaremFilters: 'Filtres de harem compacts',
    expandedMarketInventory: 'Inventaire du marché élargi',
    compactResourceSummary: 'Inventaire de ressources compact',
    hideClaimAllButton: 'Cacher le bouton "Tout réclamer" pour les récompenses de saison',
    dpEventTweaks: 'Modifications pour la Double Pénétration',
    compactDailyMissions: 'Missions quotidiennes compactes',
    removeSlotBorder: 'Retirer la bordure blanche dans le marché'
}

export const villain = {
    ninjaspy: 'Espion Ninja',
    jacksoncrew: 'Éq. de Jackson',
    pandorawitch: 'Sorcière Pandora',
    werebunnypolice: 'Police des Lapines-Garous',
    asaakira: 'Directrice Asa Akira',
    fallback: 'Monde {{world}} troll',
}

export const market = {
    pointsUnbought: 'Nombre de points requis pour max',
    moneyUnspent: 'Argent demandé pour max',
    moneySpent: 'Argent dépensé dans le marché',
    pointsLevel: 'Points donnés par ton niveau',
    pointsBought: 'Points achetés au marché',
    pointsEquip: 'Points donnés par ton équipement',
    pointsBooster: 'Points donnés par tes boosters',
    pointsClub: 'Points donnés par ton club',
    boosterItem: 'boosters',
    xpItem: 'livres',
    xpCurrency: 'XP',
    affItem: 'cadeaux',
    affCurrency: 'affection',
    equips: 'équipements',
    youOwn: 'Tu possèdes <b>{{count}}</b> {{type}}.',
    youCanSell: 'Tu peux tout vendre pour <b>{{cost}}</b> <span class="hudSC_mix_icn"></span>.',
    youCanGive: 'Tu peux donner un total de <b>{{value}}</b> {{currency}}.',
}

export const harem = {
    marketRestocked: '> Le <a href="../shop.html">Marché</a> s\'est rempli depuis votre dernière visite.',
    visitMarket: '> Visitez d\'abord le <a href="../shop.html">Marché</a> pour pouvoir afficher un résumé de votre inventaire ici',
    haremStats: 'Stats du harem',
    upgrades: 'Améliorations',
    levelsAwakening: 'Niveaux & Eveil',
    market: 'Inventaire & Marché',
    wikiPage: 'Page wiki de {{name}}',
    haremLevel: 'Niveau de harem',
    unlockedScenes: 'Scènes déverrouillées',
    income: 'Revenus',
    or: '{{left}} ou {{right}}',
    toUpgrade: 'Pour tout améliorer:',
    toLevelCap: 'Pour limite de niveau:',
    toLevelMax: 'Pour niveau max ({{max}}):',
    affectionScenes: 'Scènes d\'affection',
    buyable: 'Dispo au marché',
    sellable: 'Dans l\'inventaire',
    gifts: 'Cadeaux',
    books: 'Livres',
    canBeSold: 'Vendable pour {{sc}}',
    canBeBought: '{{item}} pour {{amount}}',
    marketRestock: 'Marché rempli à {{time}} ou au niv. {{level}}',
}

export const league = {
    stayInTop: 'Pour <em><u>rester dans le top {{top}}</u></em>, vous devez avoir un minimum de <em>{{points}}</em> points',
    notInTop: 'Pour <em><u>être dans le top {{top}}</u></em>, vous devez avoir un minimum de <em>{{points}}</em> points',
    challengesRegen: 'Régénération naturelle: <em>{{challenges}}</em>',
    challengesLeft: 'Défis restants: <em>{{challenges}}</em>',
    averageScore: 'Average score per fight: <em>{{average}}</em>',
    scoreExpected: 'Score moyen par combat: <em>{{score}}</em>',
    toDemote: 'Pour <em><u>être rétrogradé</u></em>, vous devez être dépassé par <em>{{players}}</em> joueurs',
    willDemote: 'Pour <em><u>être rétrogradé</u></em>, vous pouvez avoir un maximum de <em>{{points}}</em> points',
    willDemoteZero: 'Pour <em><u>être rétrogradé</u></em>, vous devez rester avec <em>0</em> points',
    toNotDemote: 'Pour <em><u>ne pas être rétrogradé</u></em>, vous devez avoir plus de <em>0</em> points',
    toStay: 'Pour <em><u>ne pas être promu</u></em>, vous devez être dépassé par <em>{{players}}</em> joueurs',
    willStay: 'Pour <em><u>ne pas être promu</u></em>, vous pouvez avoir un maximum de <em>{{points}}</em> points',
    hideFoughtOpponents: 'Masquer adversaires combattus',
    showFoughtOpponents: 'Montrer adversaires combattus',
    currentLeague: 'Ligue actuelle',
    victories: 'Victoires',
    defeats: 'Defaites',
    unknown: 'Inconnus',
    notPlayed: 'Non joués',
    levelRange: 'Étendue de niveau',
    leagueFinished: 'Ligue terminée le {{date}}',
    opponents: 'Adversaires',
    leaguePoints: 'Points',
    avg: 'Moyenne',
}

export const simFight = {
    guaranteed: 'Victoire garantie',
    impossible: 'Victoire impossible',
}

export const teamsFilter = {
    searchedName: 'Nom',
    girlName: `Nom ${Helpers.isGH() ? 'du mec' : 'de la fille'}`,
    searchedClass: 'Classe',
    searchedElement: 'Élément',
    searchedRarity: 'Rareté',
    levelRange: 'Intervalle de niveaux',
    levelCap: 'Niveau-plafond',
    levelCap_capped: 'Atteint',
    levelCap_uncapped: 'Non-atteint',
    searchedAffCategory: 'Catégorie d\'affection',
    searchedAffLevel: 'Niveau d\'affection',
    grade0: '0 étoile',
    grade1: '1 étoile',
    grade2: '2 étoiles',
    grade3: '3 étoiles',
    grade4: '4 étoiles',
    grade5: '5 étoiles',
    grade6: '6 étoiles',
    searchedBlessedAttributes: 'Bénédictions',
    blessedAttributes: Helpers.isGH() ? 'Mecs bénis' : 'Filles bénies',
    nonBlessedAttributes: Helpers.isGH() ? 'Mecs non bénis' : 'Filles non bénies',
}

export const champions = {
    participants: 'Participants: {{participants}}/{{members}}',
    clubChampDuration: '{{duration}} depuis le début du tour',
}

export const resourceBars = {
    popsIn: 'LdP dans {{time}}',
    popsReady: 'LdP dispo',
    readyAt: 'Prêt à {{time}}',
    endAt: 'Fin à {{time}}',
    fullAt: 'Rempli à {{time}}',
    xp: 'Suiv.: {{xp}} XP',
}

export const homeScreen = {
    clubChamp: 'Le Champion de Club',
    completeIn: 'Terminé dans ',
    newMissionsIn: 'Nouv. missions dans ',
    missionsReady: 'Missions disponibles',
}

export const seasonStats = {
    fights: 'Combats',
    victories: 'Victoires',
    defeats: 'Defaites',
    mojoWon: 'Mojo gagnés',
    mojoLost: 'Mojo perdus',
    mojoWonAvg: 'Moyenne mojo gagnés',
    mojoLostAvg: 'Moyenne mojo perdus',
    mojoAvg: 'Moyenne mojo globale',
}

export const pachinkoNames = {
    availableGirls: `${Helpers.isGH() ? 'Mecs' : 'Filles'} disponibles: `,
    poolGirls: 'Pool actuel: ',
}

export const contestSummary = {
    totalRewards: 'Total des récompenses enregistrées ({{contests}} Compètes) :',
    contestsWarning: 'Les Compètes expirent après 21 jours !',
}

export const villainBreadcrumbs = {
    town: 'Ville',
    adventure: 'Aventure',
    begincity: 'Ville du Prélude',
    gemskingdom: 'Royaume des Gemmes',
    ninjavillage: 'Village Ninja',
    invadedkingdom: 'Royaume envahi',
    juysea: 'La Mouillemer',
    admittance: 'Admittance of the dead',
    magicforest: 'Forêt Magique',
    hamelintown: 'Ville d\'Hamelin',
    plainofrituals: 'Plaine des Rituels',
    heroesuniversity: 'Université des Héros',
    ninjasacredlands: 'Terres Sacrées des Ninjas',
    splatters: 'Archipel des Éclaboussures',
    digisekai: 'Digisekai',
    stairway: 'La Montée aux Cieux',
    training: 'La dimension d\'entraînement',
    weresquidisland: 'L\'île des Poulpes Garous',
    haremtournament: 'Le Tournoi de Harem',

    begincitycxh: 'Préludeville',
    heroacademy: 'Académie des Héros',
    newcenabum: 'Nouveau Cénabum',
    ontheprowl: 'À l\'affût',
    bushexplorations: 'Explorations de la brousse',
    thespy: 'L’espion qui venait en moi',
    hornyknight: 'Le chevalier corné',
    suitdown: 'Sans costume',
    manmeatofsteel: 'L\'Homme au morceau d\'acier',

    fukwell: 'Université de Belbaise',
    eurodick: 'Eurobite',
    homecumming: 'Retrouvailles',
    biggerintexas: 'Plus GROS au Texas',
    westcock: 'Con Ouest',
    whenangelscum: 'Quand les anges montent au septième ciel',
    suckramento: 'Bienvenue à Fiakramento',
    fiskyfresno: 'Des folies à Fresno',
    milftown: 'Cité MILF',
}

export const blessingSpreadsheetLink = {
    name: `Ouvrir la feuille de données des bénédictions de ${Helpers.isGH() ? 'Bella' : 'zoopokemon'}`
}

export const haremTeamsFilter = {
    team: 'Équipe',
    visitTeams: 'Visiter d\'abord <a href="../teams.html">l\'équipe</a>.',
}

export const leaderboardClubmateIndicators = {
    clubmate: 'Coéquipier',
}

export const improvedWaifu = {
    editPose: 'Editer Pose',
    resetPose: 'Réinitialiser Pose',
    savePose: 'Sauvegarder Pose',
    favGirl: `Sélectionner ${gameConfig.fille}`,
    unfavGirl: `Désélectionner ${gameConfig.fille}`,
    modeAll: `Mode: Totalité des ${gameConfig.fille}s`,
    modeFav: `Mode: Sélection de ${gameConfig.fille}s`,
    randomWaifu: `${gameConfig.waifu} aléatoire`,
    cycleWaifu: `Cycle de ${gameConfig.waifu}`,
    cyclePause: 'Arrêter défilement',
}
