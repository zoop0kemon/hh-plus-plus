import { lsKeys } from '../../common/Constants'
import Helpers from '../../common/Helpers'
import Sheet from '../../common/Sheet'
import TooltipManager from '../../common/TooltipManager'
import {HC, CH, KH} from '../../data/Classes'
import {POINTS_PER_LEVEL, calculateTotalPrice, SELLABLE, TYPES, NEW_TYPES} from '../../data/Market'
import I18n from '../../i18n'
import CoreModule from '../CoreModule'
import styles from './styles.lazy.scss'

const MODULE_KEY = 'market'
const CLASSES = [HC, CH, KH]

const caracKey = carac => `carac${carac}`

class MarketInfoModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
        this.$tooltips = {}
        this.previousCaracs = {
            1: 0,
            2: 0,
            3: 0
        }
        this.toolipData = {
            caracs: {},
            inventory: {},
        }
    }

    shouldRun () {
        return Helpers.isCurrentPage('shop')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}
        styles.use()

        Helpers.defer(() => {
            this.injectCSSVars()
            this.setupHooks()

            this.updateStats()
            this.updateInventory()
            this.updateEquips()
        })

        this.hasRun = true
    }

    updateStats () {
        const {shared: {Hero}, heroStatsPrices, market_inventory} = window
        const equips = []
        const boosters = []

        if (Object.entries(this.previousCaracs).every(([carac, value]) => value === Hero.infos.caracs[caracKey(carac)])) {
            // No change
            return
        }

        $('#equiped .armor .slot:not(.empty)').each((i, slot) => {
            equips.push($(slot).data('d'))
        })
        $('#equiped .booster .slot:not(.empty):not(.mythic)').each((i, slot) => {
            boosters.push($(slot).data('d'))
        })

        CLASSES.forEach(carac => {
            const key = caracKey(carac)
            const keyEquip = `${key}_equip`
            const totalStat = Hero.infos.caracs[key]
            const equipStat = equips.map(equip => equip[key] || +equip[keyEquip]).reduce((a,b) => a+b, 0)
            const {base_stat: baseStat} = heroStatsPrices[carac]
            const boughtStat = Hero.infos[key]
            const maxBoughtStat = Hero.infos.level * POINTS_PER_LEVEL
            const unboughtStat = maxBoughtStat - boughtStat

            const maxSpent = calculateTotalPrice(maxBoughtStat)
            const spent = calculateTotalPrice(boughtStat)
            const unspent = maxSpent - spent

            let boosterAdd = 0
            let boosterMultiply = 0

            boosters.forEach((booster) => {
                const item = booster.item || booster
                const {identifier, rarity} = item
                if (identifier !== 'B1') {
                    return
                }

                const amount = item[key]

                if (rarity === 'legendary') {
                    boosterMultiply += amount / 100
                } else {
                    boosterAdd += amount
                }
            })

            const boosterStat = boosterAdd + Math.ceil((baseStat + boughtStat + equipStat + boosterAdd) * boosterMultiply)

            let clubStat = 0
            if (Helpers.isInClub()) {
                clubStat = totalStat - baseStat - boughtStat - equipStat - boosterStat
            }

            this.toolipData.caracs[carac] = {
                key,
                unboughtStat,
                unspent,
                spent,
                baseStat,
                boughtStat,
                equipStat,
                boosterStat,
                clubStat,
            }

            if (!market_inventory) {
                //old market, old tooltips
                if (!this.$tooltips[carac]) {
                    this.$tooltips[carac] = $(`<div class="statToolTip" rel="${key}"></div>`)
                    $(`.hero_stats [hero=${key}]`).append('<div class="marketInfoIcon statInfo" ></div>').append(this.$tooltips[carac])
                }

                this.$tooltips[carac].html(this.buildCaracTooltipHtml(this.toolipData.caracs[carac]))
            }
        })
    }

    buildCaracTooltipHtml(data) {
        const {unboughtStat, unspent, spent, baseStat, boughtStat, equipStat, boosterStat, clubStat} = data

        return `
            <table class="statToolTipTable">
                <tbody>
                    <tr><td>${this.label('pointsUnbought')} :</td><td>${I18n.nThousand(unboughtStat)}</td></tr>
                    <tr><td>${this.label('moneyUnspent')} :</td><td>${I18n.nThousand(unspent)}</td></tr>
                    <tr><td>${this.label('moneySpent')} :</td><td>${I18n.nThousand(spent)}</td></tr>
                </tbody>
            </table>
            <hr/>
            <table class="statToolTipTable">
                <tbody>
                    <tr><td>${this.label('pointsLevel')} :</td><td>${I18n.nThousand(baseStat)}</td></tr>
                    <tr><td>${this.label('pointsBought')} :</td><td>${I18n.nThousand(boughtStat)}</td></tr>
                    <tr><td>${this.label('pointsEquip')} :</td><td>${I18n.nThousand(equipStat)}</td></tr>
                    <tr><td>${this.label('pointsBooster')} :</td><td>${I18n.nThousand(boosterStat)}</td></tr>
                    <tr><td>${this.label('pointsClub')} :</td><td>${I18n.nThousand(clubStat)}</td></tr>
                </tbody>
            </table>
        `.replace(/( {4}|\n)/g, '')
    }

    buildItemTooltipHtml(type, data) {
        const {count, cost, value} = data
        return `<div class="itemToolTipContent">
            ${this.label('youOwn', {count: I18n.nThousand(count), type: this.label(`${type}Item`)})}<br />
            ${['xp', 'aff'].includes(type) ? this.label('youCanGive', {value: I18n.nThousand(value), currency: this.label(`${type}Currency`)}) + '<br />' : ''}
            ${this.label('youCanSell', {cost: I18n.nThousand(cost)})}
        </div>`
    }

    buildEquipsTooltipHtml(data) {
        const {count, cost} = data
        return `<div class="itemToolTipContent">
            ${this.label('youOwn', {count: I18n.nThousand(count), type: this.label('equips')})}<br />
            ${this.label('youCanSell', {cost: I18n.nThousand(cost)})}
        </div>`
    }

    updateInventory () {
        this.updateItems()
        this.updateEquips()
    }

    updateItems () {
        const {market_inventory} = window
        if (market_inventory) {
            // new market, nothing to update
            return
        }

        const marketInfo = Helpers.lsGet(lsKeys.MARKET_INFO)

        if (!marketInfo.sellableItems) {
            return
        }

        SELLABLE.forEach(type => {
            if (!this.$tooltips[type]) {
                this.$tooltips[type] = $('<div class="inventoryToolTip"></div>')
                const $infoIcon = $('<div class="marketInfoIcon inventoryInfo"></div>')
                $(`#inventory .${TYPES[type]}`).prepend($infoIcon)
                $infoIcon.after(this.$tooltips[type])
            }

            this.$tooltips[type].html(this.buildItemTooltipHtml(type, marketInfo.sellableItems[type]))
        })
    }

    updateEquips () {
        const {market_inventory} = window
        if (market_inventory) {
            // new market, nothing to update
            return
        }
        const marketInfo = Helpers.lsGet(lsKeys.MARKET_INFO)

        if (!marketInfo.equipsAggregate) {
            return
        }

        const type = 'equip'
        if (!this.$tooltips[type]) {
            this.$tooltips[type] = $('<div class="inventoryToolTip"></div>')
            const $infoIcon = $('<div class="marketInfoIcon inventoryInfo"></div>')
            $('#inventory .armor').prepend($infoIcon)
            $infoIcon.after(this.$tooltips[type])
        }

        this.$tooltips[type].html(this.buildEquipsTooltipHtml(marketInfo.equipsAggregate))
    }

    setupHooks () {
        // Purchase stat points
        Helpers.onAjaxResponse(/action=update_stats/, (response, xhr) => {
            if (!response.success) {return}
            const search = new URLSearchParams(xhr.data)
            const carac = caracKey(search.get('carac'))
            const {market_inventory, shared: {Hero}} = window
            if (market_inventory) {
                const value = response[carac]

                Hero.infos[carac] = value
            } else {
                const nb = +search.get('nb')

                Hero.infos[carac] += nb
            }
        })

        // Observe change (after side-effects have run)
        CLASSES.forEach(carac => {
            const key = caracKey(carac)

            const observer = new MutationObserver(() => this.updateStats())
            observer.observe($(`[hero=${key}] [carac=${carac}]`)[0], {childList: true})
        })

        // Listen for updates from collector
        $(document).on('market:inventory-updated', () => this.updateItems())
        $(document).on('market:equips-updated', () => this.updateEquips())

        const {market_inventory} = window
        if (market_inventory) {
            // new market, new tooltips
            CLASSES.forEach(carac => {
                const selector = `.my-hero-stats [hero=carac${carac}] [carac=${carac}]`
                const title = $(selector).attr('hh_title')
                $(selector).removeAttr('hh_title')
                $(selector).removeAttr('tooltip')

                TooltipManager.initTooltipType(selector, () => {
                    const data = this.toolipData.caracs[carac]
                    const html = this.buildCaracTooltipHtml(data)
                    return {title, body: html}
                })
            })

            SELLABLE.forEach(type => {
                const parentSelector = `#${NEW_TYPES[type]}-tab-container #player-inventory-container`
                const selector = `${parentSelector} .inventoryInfo`
                const $infoIcon = $('<div class="marketInfoIcon inventoryInfo"></div>')
                $(parentSelector).append($infoIcon)

                TooltipManager.initTooltipType(selector, () => {
                    const marketInfo = Helpers.lsGet(lsKeys.MARKET_INFO)
                    const data = marketInfo.sellableItems[type]
                    const html = this.buildItemTooltipHtml(type, data)
                    return {title: '', body: html}
                })
            })

            const equipsParentSelector = '#equipement-tab-container #player-inventory-container'
            const equipsSelector = `${equipsParentSelector} .inventoryInfo`
            const $infoIcon = $('<div class="marketInfoIcon inventoryInfo"></div>')
            $(equipsParentSelector).append($infoIcon)

            TooltipManager.initTooltipType(equipsSelector, () => {
                const marketInfo = Helpers.lsGet(lsKeys.MARKET_INFO)
                const data = marketInfo.equipsAggregate
                const html = this.buildEquipsTooltipHtml(data)
                return {title: '', body: html}
            })
        }
    }

    injectCSSVars () {
        Sheet.registerVar('info-icon', `url(${Helpers.getCDNHost()}/design/ic_info.svg)`)
    }
}

export default MarketInfoModule
