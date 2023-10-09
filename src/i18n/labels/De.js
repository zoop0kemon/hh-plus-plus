import Helpers from '../../common/Helpers'

const gameConfigs = {
    HH: {
        Blumen: 'Blumen',
    },
    GH: {
        Blumen: 'Lollis',
    },
    CxH: {
        Blumen: 'Juwelen',
    },
    PSH: {
        Blumen: 'Biere',
    },
    HoH: {
        Blumen: 'Blumen',
    },
}
const gameConfig = gameConfigs[Helpers.getGameKey()]

export const common = {
    all: 'Alle',
}

export const config = {
    villain: 'Schurken-Menü',
    villain_tiers: `Stufen mit ${Helpers.isGH() ? 'Kerlen' : 'Mädels'} anzeigen`,
    market: 'Markt-Informationen',
    marketEquipsFilter: 'Ausrüstungsfilter im Markt',
    harem: 'Harem-Informationen',
    league: 'Liga-Informationen',
    league_board: 'Die Liga-Spitzen anzeigen',
    league_promo: 'Werbeinformationen anzeigen',
    simFight: 'Liga/Saison/Schurken-Simulation',
    simFight_logging: 'Detaillierte Protokollierung in der Browserkonsole',
    teamsFilter: 'Teamfilter',
    champions: 'Champion-Informationen',
    champions_poseMatching: 'Aktiviere Erkennung für passende Champion-Position',
    champions_fixPower: `Kraft der ${Helpers.isGH() ? 'Kerle' : 'Mädchen'} zum Vergleich normalisieren`,
    homeScreen: 'Homepage Verknüpfungen & Timer',
    homeScreen_leaguePos:  'Aktuellen Rang in der Liga anzeigen (erstellt zusätzlichen Netzaufruf)',
    resourceBars: 'Ressourcen-Leisten / Booster Tracking',
    popSort: 'PoP-Sortierung und schnelle Navigation',
    seasonStats: 'Saison-Werte',
    pachinkoNames: 'Namen im Pachinko anzeigen',
    contestSummary: 'Zusammenfassung der gespeicherten Wettbewerbsprämien',
    battleEndstate: 'Endgültige Werte beim Überspringen des Kampfes anzeigen',
    gemStock: 'Juwelen-Vorrat im Markt/Harem',
    staticBackground: 'Verhindere Hintergrundveränderung währden Orgien Tagen',
    rewardShards: `Aktuelle Splitteranzahl für ${Helpers.isGH() ? 'Kerle' : 'Mädchen'} anzeigen`,
    hideClaimedRewards: 'Bereits beanspruchte Belohnungen ausblenden',
    disableDragDrop: 'Drag-and-Drop im Markt deaktivieren',
    autoRefresh: 'Automatisches Aktualisieren des Spiels alle 10 Minuten',
    villainBreadcrumbs: 'Ergänze Breadcrumbs für die Schurken-Seite',
    blessingSpreadsheetLink: 'Ergänze Verknüpfung zu der Datentabelle für Segnungen auf dem Segnungen Pop-Up',
    homeScreenIcons: 'Füge Feature-Symbole zu den Links auf dem Startbildschirm hinzu',
    homeScreenOrder: 'Alternative Anordnung der Links auf dem Startbildschirm',
    homeScreenOldish: 'Altes Startbildschirm-Layout (Nicht kompatibel mit rechtsseitiger reorganisierter Stil-Optimierung)',
    overridePachinkoConfirm: `Warn-Pop-ups "Keine ${Helpers.isGH() ? 'Jungs' : 'Mädchen'} verfügbar" in Pachinko/NC deaktivieren`,
    sidequestCompletionMarkers: 'Markierung für abgeschlossene Nebenquests',
    censorMode: 'Zensur aller NSFW-Bilder',
    fixProfilePopup: 'Fix für Spielerprofil-Popups',
    eventEndIndicators: 'Anzeige für Eventende auf dem Startbildschirm',
    haremTeamsFilter: 'Teamfilter für Harem',
    upgradeQuickNav: 'Schnellnavigation auf der Upgrade-Seite',
    leaderboardClubmateIndicators: 'Club-Mitglieder auf Ranglisten hervorheben',
    leaderboardProfilePopups: 'Links zu Spielerprofilen in den Ranglisten',
    improvedWaifu: `Verbesserte${Helpers.isGH()? 'r Boyfriend' : ' Waifu'}`,
    sortDailyMissions: 'Tägliche Missionen nach Dauer sortieren',
    sortDailyMissions_reverse: 'Umgekehrte Reihenfolge',
    upgradeInfo: 'Informationen zur Verbesserungsseite',
    leagueQuickNav: 'Schnellnavigation für Ligagegner'
}
export const stConfig = {
    missionsBackground: 'Missionshintergrund ändern',
    collectMoneyAnimation: 'Geldsammel-Animation deaktivieren',
    mobileBattle: 'Fix für den Kampfbildschirm am Handy',
    hideRotateDevice: 'Gerät-drehen-Hinweis am Handy verbergen',
    salaryTimers: `Lesbarer Lohntimer der ${Helpers.isGH() ? 'Jungs' : 'Mädchen'}`,
    moveSkipButton: 'Verschiebe die Kampf überspringen Taste nach unten',
    poseAspectRatio: `${Helpers.isGH() ? 'Kerle' : 'Mädchen'} Posen-Seitenverhältnisse im Kampf korrigieren`,
    reduceBlur: 'Reduziere Tiefenschärfe-Effekt auf dem Startbildschirm',
    homeScreenRightSideRearrange: 'Ordne die Elemente auf der rechten Seite des Startbildschirms neu an',
    selectableId: 'Mache User-ID auswählbar',
    messengerDarkMode: 'Dunkler Modus für den Messenger',
    leagueTableCompressed: 'Kompakte Ligatabelle',
    leagueTableRowStripes: 'Gestreifte Ligatabellen-Zeilen',
    removeParticleEffects: 'Entferne die Partikeleffekte des Startbildschirms',
    eventGirlTicks: `Verbesserte Häkchen für Event${Helpers.isGH() ? 'kerle' : 'mädels'}`,
    eventGirlBorders: `Grüne Umrandung um erworbene Event${Helpers.isGH() ? 'kerle' : 'mädchen'}`,
    compactNav: 'Kompaktes Hauptmenü',
    poaBorders: 'Grüne Umrandung um erworbene PoA-Belohnungen',
    champGirlPower: `Überlauf von ${Helpers.isGH() ? 'Jungs' : 'Mädchen'}kraft bei Champions beheben`,
    champGirlOverlap: `Behebe Überlappen von ${Helpers.isGH() ? 'Jungs' : 'Mädchen'} mit ${Helpers.isGH() ? 'Jungs' : 'Mädchen'}auswahl bei Champions`,
    hideGameLinks: 'Spiellinks verbergen',
    poaTicks: 'Behebe Häkchenposition im PoA',
    poaGirlFade: `Behebe verblassen der ${Helpers.isGH() ? 'Jungs' : 'Mädchen'}pose im PoA`,
    newButtons: 'Tausche verbleibende alte Schaltflächen aus',
    bonusFlowersOverflow: `Verhindere, dass ${gameConfig.Blumen} in die nächste Zeile rutschen`,
    popButtons: 'Verberge die Schalflächen für automatisches Zuweisen und Einsammeln in PoP',
    contestNotifs: 'Verschiebe die Wettbewerbs-meldungen',
    contestPointsWidth: 'Verhindere überlauf von Wettbewerbspunkten',
    compactPops: 'Kompakte PoPs',
    monthlyCardText: 'Behebe den Text der Monatskarten',
    povUnclutter: 'PoV/PoG Seiten-übersichtlichkeit',
    dailyGoals: 'Restyle der Täglichen Ziele',
    bbProgress: 'Bessere Belohungsfort-schrittsleiste in Boss Bums',
    compactLossScreen: 'Kompakte Niederlage-Anzeige',
    seasonalEventTweaks: 'Optimierungen für Mega-Events',
    compactHaremFilters: 'Kompakte Haremfilter',
    expandedMarketInventory: 'Erweitertes Marktinventar',
    compactResourceSummary: 'Kompaktes Ressourcen-Inventar',
    hideClaimAllButton: '"Alles beanspruchen"-Button in der Saison verbergen',
    dpEventTweaks: 'DP-Event Anpassungen',
    compactDailyMissions: 'Kompakte tägliche Missionen',
    removeSlotBorder: 'Weißen Rahmen im Markt entfernen',
    hideLeagueMultiFight: 'Verstecke 15x in Liga auftreten Knopf',
}

export const villain = {
    darklord: 'Dunkler Lord',
    ninjaspy: 'Ninja Spion',
    jacksoncrew: 'Jacksons Crew',
    pandorawitch: 'Pandora Hexe',
    werebunnypolice: 'Wer-Kaninchen Polizei',
    fallback: 'Welt {{world}} Schurke',
}

export const market = {
    pointsUnbought: 'Kaufbare Statuspunkte bis Maximum',
    moneyUnspent: 'Nötiges Geld bis Maximum',
    moneySpent: 'Bisher ausgegebens Geld',
    pointsLevel: 'Levelbasierte Statuspunkte',
    pointsBought: 'Gekaufte Statuspunkte',
    pointsEquip: 'Statuspunkte durch Ausrüstung',
    pointsBooster: 'Statuspunkte durch Booster',
    pointsClub: 'Statuspunkte durch Club-Boni',
    boosterItem: 'Booster',
    xpItem: 'Bücher',
    xpCurrency: 'XP',
    affItem: 'Geschenke',
    affCurrency: 'Zuneigung',
    equips: 'Ausrüstungen',
    youOwn: 'Du besitzt <b>{{count}}</b> {{type}}.',
    youCanSell: 'Du kannst alles verkaufen für <b>{{cost}}</b> <span class="hudSC_mix_icn"></span>.',
    youCanGive: 'Du kannst ingesamt <b>{{value}}</b> {{currency}} vergeben.',
}

export const harem = {
    marketRestocked: '> Der <a href="../shop.html">Markt</a> wurde seit deinem letzten Besuch aufgefüllt.',
    visitMarket: '> Besuche zuerst den <a href="../shop.html">Markt</a>, um hier eine Inventarzusammenfassung zu sehen',
    haremStats: 'Haremwerte',
    upgrades: 'Upgrades',
    levelsAwakening: 'Level & Erwachen',
    market: 'Inventar & Markt',
    wikiPage: '{{name}}s Wikiseite',
    haremLevel: 'Harem-Level',
    unlockedScenes: 'Freigeschaltete Szenen',
    income: 'Einkommen',
    or: '{{left}} oder {{right}}',
    toUpgrade: 'Um alle upzugraden',
    toLevelCap: 'Um bis zur Grenze zu leveln',
    toLevelMax: 'Um bis zum Maximum zu leveln ({{max}})',
    affectionScenes: 'Zuneigungsszenen',
    buyable: 'Im Markt zu kaufen',
    sellable: 'Im Inventar',
    gifts: 'Geschenke',
    books: 'Bücher',
    canBeSold: 'Kann für {{sc}} verkauft werden',
    canBeBought: '{{item}} für {{amount}}',
    marketRestock: 'Markt füllt sich um {{time}} oder bei Level {{level}} wieder auf',
}

export const league = {
    stayInTop: 'Um <em><u>in den Top {{top}} zu bleiben</u></em>, musst du mindestens <em>{{points}}</em> Punkte haben',
    notInTop: 'Um <em><u>in die Top {{top}} zu kommen</u></em>, musst du mindestens <em>{{points}}</em> Punkte haben',
    challengesRegen: 'Regeneration: <em>{{challenges}}</em>',
    challengesLeft: 'Verbleibende Kämpfe: <em>{{challenges}}</em>',
    averageScore: 'Durchschnitt pro Kampf: <em>{{average}}</em>',
    scoreExpected: 'Erwartetes Ergebnis: <em>{{score}}</em>',
    toDemote: 'Um <em><u>abzusteigen</u></em>, musst du von <em>{{players}}</em> Spielern überholt werden',
    willDemote: 'Um <em><u>abzusteigen</u></em>, darfst du maximal <em>{{points}}</em> Punkte haben',
    willDemoteZero: 'Um <em><u>abzusteigen</u></em>, musst du bei <em>0</em> Punkten bleiben',
    toNotDemote: 'Um <em><u>nicht abzusteigen</u></em>, musst du mehr als <em>0</em> Punkte',
    toStay: 'Um <em><u>nicht aufzusteigen</u></em>, musst du von <em>{{players}}</em> Spielern überholt werden',
    willStay: 'Um <em><u>nicht aufzusteigen</u></em>, darfst du maximal <em>{{points}}</em> Punkte haben',
    filterFoughtOpponents: 'Bekämpfte Gegner',
    filterBoosted: 'Geboostet',
    filterTeamTheme: 'Team-Element',
    currentLeague: 'Aktuelle Liga',
    victories: 'Siege',
    defeats: 'Niederlagen',
    unknown: 'Unbekannt',
    notPlayed: 'Nicht gespielt',
    levelRange: 'Level-Spanne',
    leagueFinished: 'Liga endete am {{date}}',
    opponents: 'Gegner',
    leaguePoints: 'Punkte',
    avg: 'Mittelwert',
}

export const simFight = {
    simResults: 'Sim Resultate',
    guaranteed: 'Garantiert',
    impossible: 'Unmöglich',
}

export const teamsFilter = {
    searchedName: 'Suche',
    girlName: 'Name',
    searchedClass: 'Klasse',
    searchedRarity: 'Seltenheit',
    levelRange: 'Level-Spanne',
    levelCap: 'Level-Grenze',
    levelCap_capped: 'Erreicht',
    levelCap_uncapped: 'Nicht erreicht',
    searchedAffCategory: 'Maximale Zuneigung',
    searchedAffLevel: 'Aktuelle Zuneigung',
    grade0: '0 Sterne',
    grade1: '1 Stern',
    grade2: '2 Sterne',
    grade3: '3 Sterne',
    grade4: '4 Sterne',
    grade5: '5 Sterne',
    grade6: '6 Sterne',
    searchedBlessedAttributes: 'Segnungen',
    blessedAttributes: `Gesegnete ${Helpers.isGH() ? 'Kerle' : 'Mädchen'}`,
    nonBlessedAttributes: `Nicht gesegnete ${Helpers.isGH() ? 'Kerle' : 'Mädchen'}`,
}

export const champions = {
    participants: 'Teilnehmer: {{participants}}/{{members}}',
    clubChampDuration: '{{duration}} seit Rundenbeginn',
}
export const resourceBars = {
    popsIn: 'PoPs in {{time}}',
    popsReady: 'PoPs bereit',
    readyAt: 'Bereit um {{time}}',
    endAt: 'Endet um {{time}}',
    fullAt: 'Voll um {{time}}',
    xp: 'Nächstes: {{xp}} XP',
}

export const homeScreen = {
    clubChamp: 'Club-Champion',
    completeIn: 'Beendet in ',
    newMissionsIn: 'Neue Missionen in ',
    missionsReady: 'Missionen bereit',
}

export const seasonStats = {
    fights: 'Kämpfe',
    victories: 'Siege',
    defeats: 'Niederlagen',
    mojoWon: 'Gewonnenes Mojo',
    mojoLost: 'Verlorenes Mojo',
    mojoWonAvg: 'Durchschnittlich gewonnenes Mojo',
    mojoLostAvg: 'Durchschnittlich verlorenes Mojo',
    mojoAvg: 'Insgesamt durchschnittliches Mojo',
}

export const pachinkoNames = {
    availableGirls: `Verfügbare ${Helpers.isGH() ? 'Kerle' : 'Mädchen'}: `,
    poolGirls: 'Aktuelle Auswahl: ',
}

export const contestSummary = {
    totalRewards: 'Gesamtzahl der gespeicherten Belohnungen ({{contests}} Wettbewerbe):',
    contestsWarning: 'Wettbewerbe verfallen nach 21 Tagen!',
}

export const villainBreadcrumbs = {
    town: 'Stadt',
    adventure: 'Abenteuer',
    begincity: 'Vorspiel-Stadt',
    gemskingdom: 'Edelstein-Königreich',
    ninjavillage: 'Ninja Dorf',
    invadedkingdom: 'Überfallenes Königreich',
    juysea: 'Das feuchte Meer',
    admittance: 'Einlass der Toten',
    magicforest: 'Magischer Wald',
    hamelintown: 'Die Stadt Hameln',
    plainofrituals: 'Ebene der Rituale',
    heroesuniversity: 'Helden Universität',
    ninjasacredlands: 'Heilige Lande der Ninja',
    splatters: 'Spritzer-Archipel',
    digisekai: 'Digisekai',
    stairway: 'Himmelstreppe',
    training: 'Trainingsdimension',
    weresquidisland: 'Wer-Tintenfisch-Insel',
    haremtournament: 'Das Haremturnier',
}

export const blessingSpreadsheetLink = {
    name: `Öffne die Datentabelle für Segnungen von ${Helpers.isGH() ? 'Bella' : 'zoopokemon'}`
}

export const haremTeamsFilter = {
    team: 'Team',
    visitTeams: 'Besuche zuerst die <a href="../teams.html">Teams</a>.',
}

export const leaderboardClubmateIndicators = {
    clubmate: 'Club-Mitglieder',
}

export const improvedWaifu = {
    editPose: 'Pose bearbeiten',
    resetPose: 'Pose zurücksetzen',
    savePose: 'Pose speichern',
    favGirl: `${Helpers.isGH() ? 'Kerl' : 'Mädchen'} favorisieren`,
    unfavGirl: `${Helpers.isGH() ? 'Kerl' : 'Mädchen'} entfavorisieren`,
    modeAll: `Modus: Alle ${Helpers.isGH() ? 'Kerle' : 'Mädchen'}`,
    modeFav: `Modus: Lieblings-${Helpers.isGH() ? 'Kerle' : 'Mädchen'}`,
    randomWaifu: `Zufällige${Helpers.isGH() ? 'r Boyfriend' : ' Waifu'}`,
    cycleWaifu: `${Helpers.isGH() ? 'Boyfriend' : 'Waifu'} durchwechseln`,
    cyclePause: 'Durchwechseln pausieren',
}

export const compactResourceSummary = {
    orbsTitle: 'Kugeln ({{totalOrbs}})',
    gemsTitle: 'Juwelen ({{totalGems}})'
}
