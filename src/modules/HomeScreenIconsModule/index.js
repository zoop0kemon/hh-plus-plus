import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'homeScreenIcons'

const FEATURE_ICONS = {
    map: '/pictures/design/menu/map.svg',
    'god-path': '/design/menu/ic_champions.svg',
    harem: '/pictures/design/harem.svg',
    activities: '/design/menu/missions.svg',
    shop: '/design/menu/shop.svg',
    pachinko: '/pictures/design/menu/pachinko.svg',
    leaderboard: '/design/menu/leaderboard.svg',
    clubs: '/pictures/design/clubs.svg',
}

class HomeScreenIconsModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('home.html')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            this.attachIcons()
        })

        this.hasRun = true
    }

    attachIcons () {
        Object.entries(FEATURE_ICONS).forEach(([key, path]) => {
            const $link = $(`a[rel=${key}] > .notif-position`)

            if (!$link.length) {return}

            $link.prepend(`<img class="script-home-icon" src="${Helpers.getCDNHost()}${path}"></img>`)
        })
    }
}

export default HomeScreenIconsModule
