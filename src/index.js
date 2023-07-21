import {
    BoosterStatusCollector,
    ClubStatusCollector,
    EventVillainsCollector,
    GirlDictionaryCollector,
    HaremFilterCollector,
    LeagueInfoCollector,
    MarketInfoCollector,
    PathEventCollector,
    SeasonStatsCollector,
    SidequestStatusCollector,
    TeamsCollector,
    TimerCollector
} from './collectors'
import Helpers from './common/Helpers'
import TableAnnotation from './common/TableAnnotation'
import Config from './config'
import * as modules from './modules'
import LeaderboardSupportersIndicatorsModule from './modules/LeaderboardSupportersIndicatorsModule'

const runScript = () => {
    const config = new Config()

    // base modules
    GirlDictionaryCollector.collect()
    TeamsCollector.collect()
    EventVillainsCollector.collect()
    SeasonStatsCollector.collect()
    MarketInfoCollector.collect()
    LeagueInfoCollector.collect()
    TimerCollector.collect()
    BoosterStatusCollector.collect()
    ClubStatusCollector.collect()
    SidequestStatusCollector.collect()
    PathEventCollector.collect()
    HaremFilterCollector.collect()

    TableAnnotation.run()

    new LeaderboardSupportersIndicatorsModule().run()

    // configurable modules

    // core
    config.registerGroup({
        key: 'core',
        name: `${Helpers.getGameKey()}++ Core`
    })

    // style tweaks
    config.registerGroup({
        key: 'st',
        name: 'Style Tweaks',
        iconEl: '<div></div>'
    })

    Object.values(modules).forEach(module => {
        config.registerModule(new module())
    })

    config.loadConfig()

    config.runModules()

    Helpers.runDeferred()

    // expose config for other scripts to register their own modules
    window.hhPlusPlusConfig = {
        registerGroup: config.registerGroup.bind(config),
        registerModule: config.registerModule.bind(config),
        runModules: config.runModules.bind(config),
        loadConfig: config.loadConfig.bind(config),
    }
}

if (!window.$) {
    console.log('HH++ WARNING: No jQuery found. Probably an error page. Ending the script here')
} else if (location.pathname === '/' && (location.hostname.includes('www') || location.hostname.includes('test'))) {
    // iframe container, do nothing.
} else if (['/integrations/', '/index.php'].some(path => path === location.pathname) && location.hostname.includes('nutaku')) {
    // nutaku post-login home screen, redirect.
    location.replace(`${location.origin}/home.html`)
} else if (document.getElementById('loading-overlay')) {
    // loading page, do nothing.
} else {
    runScript()
}
