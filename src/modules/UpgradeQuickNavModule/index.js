import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'
import { lsKeys } from '../../common/Constants'

const MODULE_KEY = 'upgradeQuickNav'

const RESOURCE_TYPES = ['experience', 'affection', 'equipment', 'skills', 'teams']

class UpgradeQuickNavModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)

        this.linkUrls = {prev: {}, next: {}}
    }

    shouldRun () {
        return Helpers.isCurrentPage('/girl/')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(async () => {
            this.girlDictionary = await Helpers.getGirlDictionary()
            let filteredGirlIds = Helpers.lsGet(lsKeys.HAREM_FILTER_IDS)
            if (!filteredGirlIds.length) {
                filteredGirlIds = this.getFilteredGirlList()
            }
            $('#skills .girl-skills-avatar').wrap('<div class="script-girl-avatar"></div>')
            if (!filteredGirlIds || filteredGirlIds.length < 2) {return}
            const {replaceImageSources} = window.shared ? window.shared.webp_utilities : window
            const {girl: {id_girl}} = window

            const currentIndex = filteredGirlIds.indexOf(id_girl)
            let previousGirlId, nextGirlId
            if (currentIndex > -1) {
                let previousIndex = currentIndex - 1
                if (previousIndex < 0) {
                    previousIndex += filteredGirlIds.length
                }

                let nextIndex = currentIndex + 1
                if (nextIndex >= filteredGirlIds.length) {
                    nextIndex -= filteredGirlIds.length
                }

                previousGirlId = filteredGirlIds[previousIndex]
                nextGirlId = filteredGirlIds[nextIndex]
            } else {
                previousGirlId = filteredGirlIds[filteredGirlIds.length - 1]
                nextGirlId = filteredGirlIds[0]
            }

            const previousGirl = this.girlDictionary.get(`${previousGirlId}`)
            const nextGirl = this.girlDictionary.get(`${nextGirlId}`)

            RESOURCE_TYPES.forEach((resource) => {
                const $prev = this.buildAvatarHtml(previousGirlId, previousGirl, 'prev', resource)
                const $next = this.buildAvatarHtml(nextGirlId, nextGirl, 'next', resource)

                switch (resource) {
                case 'skills':
                    $(`#${resource} .girl-skills-avatar`).before($prev).after($next)
                    break
                case 'teams':
                    $(`#${resource}`).append($prev).append($next)
                    break
                default:
                    $(`#${resource} .girl-avatar`).prepend($prev).append($next)
                }
            })

            replaceImageSources()

            // Move equipment buttons out of the way
            const $unequip = $('.equipment-left-controls #girl-equipment-unequip')
            const $levelup = $('.equipment-left-controls #girl-equipment-level-up')
            $('#equipment .inventory-controls').prepend($levelup).prepend($unequip)
        })

        this.hasRun = true
    }

    buildAvatarHtml (id, {pose}, className, resource) {
        const imgType = resource == 'equipment' ? 'ico' : 'ava'
        const girlImage = `<img girl-${imgType}-src="${Helpers.getCDNHost()}/pictures/girls/${id}/${imgType}${pose}.png"/>`
        return $(`<a class="script-quicknav-${className}" resource="${resource}" href="${Helpers.getHref(`/girl/${id}?resource=${resource}`)}">${girlImage}</a>`)
    }

    getFilteredGirlList () {
        const filters = Helpers.lsGet('filters')
        const sort_by = Helpers.lsGetRaw('sort_by')
        const sort_by_direction = Helpers.lsGetRaw('sort_by_direction')
        const {level_range} = filters
        const min_level = parseInt(level_range?.match(/^\d+/)?.[0] || 1)
        const max_level = parseInt(level_range?.match(/-(\d+)/)?.[1] || min_level)

        const girls = []
        this.girlDictionary.forEach((girl, girl_id) => {
            const {shards} = girl
            if (shards === 100) {
                const {name, element, class: carac, rarity, grade, role, equips, figure, zodiac, eye_colors, hair_colors} = girl
                let {level, level_cap, graded} = girl
                level = level || 1
                level_cap = level_cap || 250
                graded = graded || 0

                let girlMaches = true
                girlMaches &= !filters.name || name.search(new RegExp(filters.name, 'i')) > -1
                girlMaches &= !filters.element?.length || filters.element.includes(element)
                girlMaches &= !filters.class?.length || filters.class.map(carac => parseInt(carac)).includes(carac)
                girlMaches &= !filters.level_range || (level >= min_level && level <= max_level)
                girlMaches &= !filters.level_cap || filters.level_cap === 'all' || (filters.level_cap === 'capped') === (level === level_cap)
                girlMaches &= !filters.rarity || filters.rarity === 'all' || filters.rarity === rarity
                girlMaches &= !filters.affection_cap || filters.affection_cap === 'all' || (filters.affection_cap === 'capped') === (grade === graded)
                girlMaches &= !filters.max_affection_grade || filters.max_affection_grade === 'all' || parseInt(filters.max_affection_grade) === grade
                girlMaches &= !filters.current_affection_grade || filters.current_affection_grade === 'all' || parseInt(filters.current_affection_grade) === graded
                girlMaches &= !filters.role || filters.role === 'all' || parseInt(filters.role) === role
                girlMaches &= !filters.equipment || filters.equipment === 'all' || (filters.equipment === 'equipped') === (!!equips?.length)
                girlMaches &= !filters.pose || filters.pose === 'all' || parseInt(filters.pose) === figure
                girlMaches &= !filters.zodiac || filters.zodiac === 'all' || filters.zodiac === zodiac
                girlMaches &= !filters.eye_color || filters.eye_color === 'all' || eye_colors?.includes(filters.eye_color)
                girlMaches &= !filters.hair_color || filters.hair_color === 'all' || hair_colors?.includes(filters.hair_color)

                if (girlMaches) {
                    const {date_added} = girl
                    girls.push({
                        girl_id: parseInt(girl_id),
                        date_added: date_added || 0,
                        level,
                        power: Helpers.calculateGirlStats(girl),
                        grade: grade || 3,
                        graded,
                        name
                    })
                }
            }
        })
        girls.sort((a, b) => {
            const direction = sort_by_direction === 'asc' ? 1 : -1
            let delta
            switch (sort_by) {
            case 'date_recruited':
                delta = a.date_added - b.date_added
                break
            case 'level':
                delta = a.level - b.level
                break
            case 'power':
                delta = a.power - b.power
                break
            case 'grade':
                delta = a.graded - b.graded || a.grade - b.grade
                break
            case 'name':
                delta = a.name.localeCompare(b.name)
                break
            default:
                delta = a.date_added - b.date_added
            }
            return direction * delta || (a.girl_id - b.girl_id)
        })

        return girls.map(({girl_id}) => girl_id)
    }
}

export default UpgradeQuickNavModule
