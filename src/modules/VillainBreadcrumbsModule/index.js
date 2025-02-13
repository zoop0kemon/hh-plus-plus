import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import VILLAINS from '../../data/Villains'
import * as WORLDS from '../../data/Worlds'

import styles from './styles.lazy.scss'
import { lsKeys } from '../../common/Constants'

const MODULE_KEY = 'villainBreadcrumbs'

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
            const {has_parallel_adventures, current_adventure} = Helpers.lsGet(lsKeys.QUEST_STATUS)

            const breadcumbLink = (href, text) => `<a class="back" href="${Helpers.getHref(current_adventure === 1 || href === '/home.html' ? href : '/adventures.html')}">${text}<span class="mapArrowBack_flat_icn"></span></a>`

            const adventureParts = has_parallel_adventures ? [
                breadcumbLink('/adventures.html', this.label('adventures')),
                breadcumbLink('/map.html', this.label('mainadventure'))
            ] : [
                breadcumbLink('/map.html', this.label('adventure'))
            ]
            const parts = [
                breadcumbLink('/home.html', this.label('town')),
                ...adventureParts,
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
