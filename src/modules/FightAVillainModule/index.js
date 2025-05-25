import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import VILLAINS from '../../data/Villains'
import { RARITIES } from '../../data/Rarities'
import { lsKeys } from '../../common/Constants'

import styles from './styles.lazy.scss'
import Sheet from '../../common/Sheet'

const MODULE_KEY = 'villain'

const DEFAULT_TIER_RARITY = {
    1: 'common',
    2: 'epic',
    3: 'legendary'
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
        if (this.hasRun) {return}

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
                $('#contains_all > header [type=fight] .bar-wrapper').click(async () => {
                    if (!this.$container) {
                        const $menu = await this.buildMenu()
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
        const {GT} = window
        Sheet.registerVar('troll-menu-font-weight', Helpers.isCxH() ? '800' : '400')
        Sheet.registerVar('girl-ico-tick', `url("${Helpers.getCDNHost()}/clubs/ic_Tick.png")`)
        Sheet.registerVar('E', `"${this.label('event')[0]}"`)
        Sheet.registerVar('R', `"${GT.design.raid[0]}"`)
    }

    async buildMenu () {
        const {server_now_ts} = window
        const villainsSet = VILLAINS[Helpers.getGameKey()]

        const eventTrolls = Helpers.lsGet(lsKeys.EVENT_VILLAINS) || []
        const mythicEventTrolls = Helpers.lsGet(lsKeys.MYTHIC_EVENT_VILLAINS) || []
        const raids = (Helpers.lsGet(lsKeys.RAIDS) || []).filter(({type, start, end}) => type === 'troll' && server_now_ts >= start && server_now_ts < end)
        const girlDictionary = await Helpers.getGirlDictionary()

        const queststatus = Helpers.lsGet(lsKeys.QUEST_STATUS)
        const currentWorld = queststatus.adventures?.[1]?.questing?.id_world || 2
        const worldIcon = `${Helpers.getCDNHost()}/pictures/design/quest/ico-quest.png`

        const filteredVillainSet = villainsSet.filter(villain => villain.world <= currentWorld)
        const $menu = $(`<div class="script-fight-a-villain-menu width-${Math.min(4, filteredVillainSet.length)}"></div>`)

        filteredVillainSet.forEach(({key, girls, opponent, world, gems, items, v}) => {
            const villainId = `${opponent ? opponent : world - 1}`
            const villainName = this.label(key)
            const villainIcon = `${Helpers.getCDNHost()}/pictures/trolls/${villainId}/ico1.png${v ? `?v=${v}` : ''}`
            const villainWorld = Helpers.getHref(queststatus.current_adventure === 1 ? `/world/${world}` : '/adventures.html')
            const eventTrollGirls = eventTrolls.filter(({troll}) => troll === villainId).map(({id}) => {return {id, source: 'event'}})
            const mythicTrollGirls = mythicEventTrolls.filter(({troll}) => troll === villainId).map(({id}) => {return {id, source: 'event'}})
            const raidsTrollGrils = raids.filter(({subtype}) => `${subtype}` === villainId).map(({id_girl}) => {return {id: `${id_girl}`, source: 'raid'}})
            const event_girls = [...eventTrollGirls, ...mythicTrollGirls, ...raidsTrollGrils]
            let allGirlsObtained = true
            let highest_rarity = 0
            event_girls.forEach(({id}) => {
                const dictGirl = girlDictionary.get(id)
                const owned = dictGirl ? dictGirl.shards === 100 : false
                if (!owned) {
                    const rarity = dictGirl?.rarity || 'legendary'
                    highest_rarity = Math.max(highest_rarity, RARITIES.indexOf(rarity))
                    allGirlsObtained = false
                }
            })

            const type = event_girls.length && !allGirlsObtained ? `eventTroll ${RARITIES[highest_rarity]}` : 'regular'
            const $villain = $(`<a class="menu-villain ${type}" href="${Helpers.getHref(`/troll-pre-battle.html?id_opponent=${villainId}`)}"></a>`)

            const $villainTopRow = $('<div class="menu-villain-top"></div>')
            $villainTopRow.append(`<img class="menu-villain-icon" src="${villainIcon}" />`)
            const $villainNameAndDrops = $('<div class="menu-villain-name-and-drops"></div>')
            $villainNameAndDrops.append(`<div class="menu-villain-name">${villainName}</div>`)
            const $villainDrops = $('<div class="menu-villain-drops"></div>')
            if (gems) {
                const {GT} = window
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

                tierGirls.forEach((girlId) => {
                    const girl = girlDictionary.get(girlId)
                    const name = girl?.name || '????'
                    const rarity = girl?.rarity || DEFAULT_TIER_RARITY[tier]
                    const shards = girl?.shards !== undefined ? girl.shards : '?'

                    const girlIcon = `${Helpers.getCDNHost()}/pictures/girls/${girlId}/ico0-300x.webp`

                    const showShards = shards === '?' || shards < 100

                    allGirlsObtained &= !showShards
                    $villainBottomRow.append(`<div class="girl_ico tier${tier}${showShards ? '' : ' obtained'}" rarity="${rarity}"><img src="${girlIcon}"/>${showShards ? `<div class="shard-count" shards="${shards}" name="${name}" shards-tooltip><span class="shard_icn"></span>${shards}</div>` : '' }</div>`)
                })
            })
            event_girls.forEach(({id, source}) => {
                const girl = girlDictionary.get(id)
                const name = girl?.name || '????'
                const rarity = girl?.rarity || 'legendary'
                const shards = girl?.shards !== undefined ? girl.shards : '?'

                const girlIcon = `${Helpers.getCDNHost()}/pictures/girls/${id}/ico0-300x.webp`

                const showShards = shards === '?' || shards < 100
                $villainBottomRow.append(`<div class="girl_ico ${source}${showShards ? '' : ' obtained'}" rarity="${rarity}"><img src="${girlIcon}"/>${showShards ? `<div class="shard-count" shards="${shards}" name="${name}" shards-tooltip><span class="shard_icn"></span>${shards}</div>` : '' }</div>`)
            })

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
