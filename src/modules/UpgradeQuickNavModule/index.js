import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'
import { lsKeys } from '../../common/Constants'

const MODULE_KEY = 'upgradeQuickNav'

const RESOURCE_TYPES = ['experience', 'affection', 'equipment', 'skills', 'teams']

class UpgradeQuickNavModule extends CoreModule {
    constructor() {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)

        this.linkUrls = { prev: {}, next: {} }
    }

    shouldRun() {
        return Helpers.isCurrentPage('/girl/')
    }

    run() {
        if (this.hasRun || !this.shouldRun()) { return }

        styles.use()

        Helpers.defer(() => {
            const filteredGirlIds = Helpers.lsGet(lsKeys.HAREM_FILTER_IDS)
            if (!filteredGirlIds || filteredGirlIds.length < 2) { return }
            const girlDictionary = Helpers.getGirlDictionary()
            const currentGirlId = window.girl.id_girl

            const currentIndex = filteredGirlIds.indexOf(currentGirlId)
            if (currentIndex > -1) {
                let previousIndex = currentIndex - 1
                if (previousIndex < 0) {
                    previousIndex += filteredGirlIds.length
                }

                let nextIndex = currentIndex + 1
                if (nextIndex >= filteredGirlIds.length) {
                    nextIndex -= filteredGirlIds.length
                }

                this.previousGirlId = filteredGirlIds[previousIndex]
                this.nextGirlId = filteredGirlIds[nextIndex]
            } else {
                this.previousGirlId = filteredGirlIds[0]
                this.nextGirlId = filteredGirlIds[filteredGirlIds.length - 1]
            }

            this.previousGirl = girlDictionary.get(`${this.previousGirlId}`)
            this.nextGirl = girlDictionary.get(`${this.nextGirlId}`)

            RESOURCE_TYPES.forEach((resource) => {
                const $prev = this.buildAvatarHtml(this.previousGirlId, this.previousGirl, 'prev', resource)
                const $next = this.buildAvatarHtml(this.nextGirlId, this.nextGirl, 'next', resource)

                if (resource == 'skills') {
                    $(`#${resource} .girl-skills-avatar`).wrap('<div class="script-girl-avatar"></div>').before($prev).after($next)
                } if (resource == 'teams') {
                    $(`#${resource}`).append($prev).append($next)
                } else {
                    $(`#${resource} .girl-avatar`).prepend($prev).append($next)
                }
            })

            window.replaceImageSources()

            // Move equipment buttons out of the way
            const $unequip = $('.equipment-left-controls #girl-equipment-unequip')
            const $levelup = $('.equipment-left-controls #girl-equipment-level-up')
            $('#equipment .inventory-controls').prepend($levelup).prepend($unequip)
        })

        this.hasRun = true
    }

    buildAvatarHtml(id, {pose}, className, resource) {
        const imgType = resource == 'equipment' ? 'ico' : 'ava'

        const girlImage = `<img girl-${imgType}-src="${Helpers.getCDNHost()}/pictures/girls/${id}/${imgType}${pose}.png"/>`
        return $(`<a class="script-quicknav-${className}" resource="${resource}" href="/girl/${id}?resource=${resource}">${girlImage}</a>`)
    }
}

export default UpgradeQuickNavModule
