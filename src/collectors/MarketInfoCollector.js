import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'
import { BUYABLE, NEW_TYPES, SELLABLE, TYPES } from '../data/Market'
import debounce from 'lodash.debounce'

let marketInfo

const saveMarketInfo = () => {
    Helpers.lsSet(lsKeys.MARKET_INFO, marketInfo)
}

const castInt = (value) => {
    return typeof value === 'string' ? parseInt(value, 10) : value
}

const debounceWrap = (func) => debounce(func, 200, {leading: false, trailing: true})

class MarketInfoCollector {
    static collect () {
        if (!Helpers.isCurrentPage('shop')) {
            return
        }

        Helpers.defer(() => {
            marketInfo = Helpers.lsGet(lsKeys.MARKET_INFO) || {}

            const handleBuyableItemUpdate = debounceWrap(async type => {
                MarketInfoCollector.collectBuyableItemsOfType(type)
                saveMarketInfo()
            })
            const handleSellableItemUpdate = debounceWrap(async type => {
                MarketInfoCollector.collectSellableItemsOfType(type)
                saveMarketInfo()
                $(document).trigger('market:inventory-updated')
            })
            const handleEquipsInventoryUpdate = debounceWrap(async () => {
                MarketInfoCollector.collectEquipsList()
                saveMarketInfo()
                $(document).trigger('market:equips-updated')
            })

            BUYABLE.forEach(type => {
                new MutationObserver(() => handleBuyableItemUpdate(type)).observe($(`.merchant-inventory-container.${TYPES[type]} .${TYPES[type]}`)[0], {childList: true})
            })
            SELLABLE.forEach(type => {
                new MutationObserver(() => handleSellableItemUpdate(type)).observe($(`#inventory .${TYPES[type]} .inventory_slots > div, .right-container .player-inventory-content.${TYPES[type]} > div, #${NEW_TYPES[type]}-tab-container #player-inventory`)[0], {childList: true, subtree: true})
            })
            new MutationObserver(handleEquipsInventoryUpdate).observe($('#inventory .armor .inventory_slots > div, #equipement-tab-container #player-inventory')[0], {childList: true})

            MarketInfoCollector.collectRefreshTime()
            MarketInfoCollector.collectBuyableItems()
            MarketInfoCollector.collectSellableItems()
            MarketInfoCollector.collectEquipsList()

            saveMarketInfo()
        })
    }

    static collectRefreshTime () {
        const {Hero: {infos: {level}}} = window.shared ? window.shared : window 
        const {server_now_ts} = window
        marketInfo.refreshTime = server_now_ts + parseInt($('.shop_count .restock-timer').attr('data-time-stamp'), 10)
        marketInfo.refreshLevel = level
    }

    static collectBuyableItems () {
        if (!marketInfo.buyableItems) {
            marketInfo.buyableItems = {}
        }

        BUYABLE.forEach(MarketInfoCollector.collectBuyableItemsOfType)
    }

    static collectBuyableItemsOfType (type) {
        const collector = {
            sc: {
                count: 0,
                cost: 0,
                value: 0,
            },
            hc: {
                count: 0,
                cost: 0,
                value: 0,
            }
        }
        window.market_inventory[TYPES[type]].forEach(slot => {
            const {price_buy, item: {currency, value}} = slot
            const subCollector = collector[currency]

            subCollector.count += 1
            subCollector.cost += castInt(price_buy)
            subCollector.value += castInt(value)
        })
        marketInfo.buyableItems[type] = collector
    }

    static collectSellableItems () {
        if (!marketInfo.sellableItems) {
            marketInfo.sellableItems = {
                booster: {
                    count: 0,
                    cost: 0,
                },
                xp: {
                    count: 0,
                    cost: 0,
                    value: 0
                },
                aff: {
                    count: 0,
                    cost: 0,
                    value: 0
                }
            }
        }
        SELLABLE.forEach(type => MarketInfoCollector.collectSellableItemsOfType(type))
    }

    static collectSellableItemsOfType (type) {
        const items = {
            count: 0,
            cost: 0,
            value: 0
        }

        $(`#inventory .${TYPES[type]} .slot:not(.empty), #${NEW_TYPES[type]}-tab-container #player-inventory .slot-container:not(.empty) .slot`).each((i, slot) => {
            const {count: countStr, quantity: quantityStr, item, value, price_sell} = $(slot).data('d')

            const count = castInt(countStr || quantityStr)
            items.count += count
            items.cost += castInt(price_sell) * count
            if (['xp', 'aff'].includes(type)) {
                items.value += castInt(value || item.value) * count
            }
        })

        marketInfo.sellableItems[type] = items
    }

    static collectEquipsList () {
        const items = {
            count: 0,
            cost: 0
        }

        $('#inventory .armor .slot:not(.empty), #equipement-tab-container #player-inventory .slot-container:not(.empty) .slot').each((i, slot) => {
            const {price_sell} = $(slot).data('d')

            items.count += 1
            items.cost += castInt(price_sell)
        })

        marketInfo.equipsAggregate = items
    }
}

export default MarketInfoCollector
