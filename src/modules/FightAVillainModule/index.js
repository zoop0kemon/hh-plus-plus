/* global Hero, GT */
import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import VILLAINS from '../../data/Villains'
import { lsKeys } from '../../common/Constants'

import styles from './styles.lazy.scss'
import Sheet from '../../common/Sheet'

const MODULE_KEY = 'villain'

const DEFAULT_TIER_RARITY = {
    1: 'common',
    2: 'epic',
    3: 'legendary',
    event: 'epic',
    mythicEvent: 'mythic',
}

class FightAVillainModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true,
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    run () {
        if (this.hasRun) {
            return
        }
        styles.use()

        Helpers.defer(() => {
            this.injectCSSVars()

            this.$overlay = $('<div class="script-fight-a-villain-menu-overlay"></div>')
            $('body').append(this.$overlay)

            this.$overlay.click(() => {
                this.$container.removeClass('shown')
                this.$overlay.removeClass('shown')
            })
            Helpers.doWhenSelectorAvailable('#contains_all > header [type=fight] .bar-wrapper', () => {
                $('#contains_all > header [type=fight] .bar-wrapper').click(() => {
                    if (!this.$container) {
                        const $menu = this.buildMenu()
                        this.$container = $('<div class="script-fight-a-villain-menu-container fixed_scaled"></div>')
                        this.$container.append($menu)
                        $('body').append(this.$container)
                    }
                    this.$container.addClass('shown')
                    this.$overlay.addClass('shown')
                })
            })
        })

        this.hasRun = true
    }

    injectCSSVars () {
        Sheet.registerVar('troll-menu-font-weight', Helpers.isCxH() ? '800' : '400')
        Sheet.registerVar('girl-ico-tick', `url("${Helpers.getCDNHost()}/clubs/ic_Tick.png")`)
    }

    buildMenu () {
        const villainsSet = VILLAINS[Helpers.getGameKey()]

        const eventTrolls = Helpers.lsGet(lsKeys.EVENT_VILLAINS) || []
        const mythicEventTrolls = Helpers.lsGet(lsKeys.MYTHIC_EVENT_VILLAINS) || []
        const girlDictionary = Helpers.getGirlDictionary()


        const currentWorld = Hero.infos.questing.id_world
        const worldIcon = `${Helpers.getCDNHost()}/pictures/design/quest/ico-quest.png`

        const filteredVillainSet = villainsSet.filter(villain => villain.world <= currentWorld)
        const $menu = $(`<div class="script-fight-a-villain-menu width-${Math.min(4, filteredVillainSet.length)}"></div>`)

        filteredVillainSet.forEach(({key, girls, world, gems, items, v}) => {
            const villainId = `${world - 1}`
            const villainName = this.label(key)
            const villainIcon = `${Helpers.getCDNHost()}/pictures/trolls/${villainId}/ico1.png${v ? `?v=${v}` : ''}`
            const villainWorld = `/world/${world}`
            let type = 'regular'
            const eventTrollGirl = eventTrolls.find(({troll}) => troll === villainId)
            let allGirlsObtained = true
            const events = {}
            if (eventTrollGirl) {
                const {id, rarity} = eventTrollGirl
                events.event = id
                const dictGirl = girlDictionary.get(id)
                const owned = dictGirl ? dictGirl.shards === 100 : false
                if (!owned) {
                    type = `eventTroll ${rarity}`
                    allGirlsObtained = false
                }
            }
            const mythicTrollGirl = mythicEventTrolls.find(({troll}) => troll === villainId)
            if (mythicTrollGirl) {
                const {id} = mythicTrollGirl
                events.mythicEvent = id
                const dictGirl = girlDictionary.get(id)
                const owned = dictGirl ? dictGirl.shards === 100 : false
                if (!owned) {
                    type = 'mythicEventTroll'
                    allGirlsObtained = false
                }
            }

            const $villain = $(`<a class="menu-villain ${type}" href="/troll-pre-battle.html?id_opponent=${villainId}"></a>`)

            const $villainTopRow = $('<div class="menu-villain-top"></div>')
            $villainTopRow.append(`<img class="menu-villain-icon" src="${villainIcon}" />`)
            const $villainNameAndDrops = $('<div class="menu-villain-name-and-drops"></div>')
            $villainNameAndDrops.append(`<div class="menu-villain-name">${villainName}</div>`)
            const $villainDrops = $('<div class="menu-villain-drops"></div>')
            if (gems) {
                gems.forEach(({element, amount}) => {
                    $villainDrops.append(`<div class="menu-villain-gem-drop-container" tooltip="${GT.design[`${element}_gem`]}"><img class="menu-villain-drop" src="${Helpers.getCDNHost()}/pictures/design/gems/${element}.png" /><span class="menu-villain-gem-drop-amount">${amount}</span></div>`)
                })
            }
            if (items) {
                items.forEach(item => {
                    $villainDrops.append(`<img class="menu-villain-drop" src="${Helpers.getCDNHost()}/pictures/items/${item}.png" />`)
                })
            }
            $villainNameAndDrops.append($villainDrops)
            $villainTopRow.append($villainNameAndDrops)
            $villainTopRow.append(`<div class="menu-villain-world"><a href="${villainWorld}"><img src="${worldIcon}" /></a></div>`)

            const $villainBottomRow = $('<div class="menu-villain-bottom"></div>')


            Object.entries(girls).forEach(([tier, tierGirls]) => {
                if (!tierGirls.length) {return}
                const $villainTier = $('<div class="menu-villain-tier"></div>')
                const $villainTierTitle = $(`<div class="menu-villain-tier-title">${tier}</div>`)
                const $villainTierGirls = $(`<div class="menu-villain-tier-girls tier${tier}"></div>`)

                tierGirls.forEach((girlId) => {
                    const girl = girlDictionary.get(girlId)
                    let name, rarity, shards
                    if (girl) {
                        ({name, rarity, shards} = girl)
                    } else {
                        name = 'Unknown',
                        rarity = DEFAULT_TIER_RARITY[tier]
                        shards = '?'
                    }

                    const girlIcon = `${Helpers.getCDNHost()}/pictures/girls/${girlId}/ico0-300x.webp`

                    const showShards = shards === '?' || shards < 100

                    allGirlsObtained &= !showShards
                    $villainTierGirls.append(`<div class="girl_ico ${showShards ? '' : 'obtained'}" rarity="${rarity}"><img src="${girlIcon}"/>${showShards ? `<div class="shard-count" shards="${shards}" name="${name}" shards-tooltip><span class="shard"></span>${shards}</div>` : '' }</div>`)
                })
                $villainTier.append($villainTierTitle).append($villainTierGirls)
                $villainBottomRow.append($villainTier)
            })
            if (Object.entries(events).length) {
                const $villainTier = $('<div class="menu-villain-tier"></div>')
                const $villainTierTitle = $(`<div class="menu-villain-tier-title">${this.label('event')}</div>`)
                const $villainTierGirls = $('<div class="menu-villain-tier-girls event"></div>')
                Object.entries(events).forEach(([type, girlId]) => {

                    const girl = girlDictionary.get(girlId)
                    let name, rarity, shards
                    if (girl) {
                        ({name, rarity, shards} = girl)
                    } else {
                        name = 'Unknown',
                        rarity = DEFAULT_TIER_RARITY[type]
                        shards = '?'
                    }

                    const girlIcon = `${Helpers.getCDNHost()}/pictures/girls/${girlId}/ico0-300x.webp`

                    const showShards = shards === '?' || shards < 100
                    $villainTierGirls.append(`<div class="girl_ico ${showShards ? '' : 'obtained'}" rarity="${rarity}"><img src="${girlIcon}"/>${showShards ? `<div class="shard-count" shards="${shards}" name="${name}" shards-tooltip><span class="shard"></span>${shards}</div>` : '' }</div>`)
                })
                $villainTier.append($villainTierTitle).append($villainTierGirls)
                $villainBottomRow.append($villainTier)
            }

            if (allGirlsObtained) {
                $villain.addClass('all-obtained')
            }

            $villain.append($villainTopRow)
            $villain.append($villainBottomRow)
            $menu.append($villain)
        })

        return $menu
    }
}

export default FightAVillainModule
