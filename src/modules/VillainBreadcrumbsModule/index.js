import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import VILLAINS from '../../data/Villains'
import * as WORLDS from '../../data/Worlds'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'villainBreadcrumbs'

const breadcumbLink = (href, text) => `<a class="back" href="${Helpers.getHref(href)}">${text}<span class="mapArrowBack_flat_icn"></span></a>`

class VillainBreadcrumbsModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
        this.villainLabel = I18n.getModuleLabel.bind(this, 'villain')
    }

    shouldRun () {
        return Helpers.isCurrentPage('troll-pre-battle')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            const gameVillains = VILLAINS[Helpers.getGameKey()]
            const gameWorlds = WORLDS[Helpers.getGameKey()]
            const searchParams = new URLSearchParams(window.location.search)
            const villainId = searchParams.get('id_opponent')
            const villain = gameVillains.find(({opponent, world}) =>  `${(opponent ? opponent : world-1)}` === villainId)

            const parts = [
                breadcumbLink('/home.html', this.label('town')),
                breadcumbLink('/map.html', this.label('adventure')),
                breadcumbLink(`/world/${villain.world}`, this.label(gameWorlds[villain.world])),
                `<span>${this.villainLabel(villain.key)}</span>`,
            ]

            const breadcrumbHtml = parts.join('<span>></span>')

            $('#breadcrumbs').html(breadcrumbHtml)
        })

        this.hasRun = true
    }
}

export default VillainBreadcrumbsModule
