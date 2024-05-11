import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import {ICON_NAMES as ELEMENTS_ICON_NAMES} from '../../data/Elements'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'upgradeInfo'

const RESONANCE_PATH = {
    class: 'misc/items_icons',
    element: 'girls_elements',
    figure: 'design/battle_positions'
}

class UpgradeInfoModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('/girl/')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            this.addGirlInfo()
            this.addResourceInfo()
            this.addEquipIcons()
        })

        this.hasRun = true
    }

    addGirlInfo () {
        // additional girl stats
        const $girl_upper_info = $('.girl-upper-info')
        const $girl_class = $girl_upper_info.children().eq(1)
        const $girl_theme = $girl_upper_info.children().eq(0)
        // Don't know the blessing bonus % or base stats, so can't update caracs...
        // const isBlessed = !!girl.blessed_attributes
        // const $girl_upper_stats = $(`
        // <div class="girl-upper-stats${isBlessed? ' blessed-attribute' : ''}">
        //     <div carac="1"><br>${I18n.nThousand(girl.caracs.carac1)}</div>
        //     <div carac="2"><br>${I18n.nThousand(girl.caracs.carac2)}</div>
        //     <div carac="3"><br>${I18n.nThousand(girl.caracs.carac3)}</div>
        // </div>`)

        $girl_class.after($girl_theme)
        // $girl_upper_info.after($girl_upper_stats)
    }

    addResourceInfo () {
        const resources = ['experience', 'affection']
        resources.forEach((resource) => {
            // Girl's current resource count
            const addResourceCurrent = (current = -1) => {
                const $resource_section = $(`#${resource} .girl-resource-section`)

                let $script_current = $resource_section.find('.script-current')
                if (!$script_current.length) {
                    $script_current = $('<span class="script-current"></span>')
                    $resource_section.find('.top-text>p').eq(0).append($script_current)
                }

                if (current < 0) {
                    const {girl} = window
                    current = resource === 'experience' ? girl.Xp.cur : girl.Affection.cur
                }
                $script_current.text(` ${I18n.nThousand(current)}`)
            }
    
            addResourceCurrent()
            const resource_observer = new MutationObserver(() => {
                addResourceCurrent()
            })
            resource_observer.observe($(`#${resource} .girl-resource-section`)[0], {childList: true})
            Helpers.onAjaxResponse(resource === 'experience' ? /action=girl_give_xp/i : /action=girl_give_affection/i, (response) => {
                const current = response[resource === 'experience' ? 'xp' : 'affection']
                addResourceCurrent(current)
            })

            // Total resource count
            const inventory_observer = new MutationObserver(() => {
                let total = 0
                $(`#${resource} .filled-slot .slot`).each((i, el) => {
                    const {item: {value}} = JSON.parse($(el).attr('data-d'))
                    const quantity = parseInt($(el).find('.item-quantity').text())
                    total += value * quantity
                })
                $(`#${resource} .total-from-items span`).text(I18n.nThousand(total))
            })
            inventory_observer.observe($(`#${resource} .inventory`)[0], {childList: true, subtree: true})
        })
    }

    addEquipIcons () {
        // Move equipment buttons out of the way, to keep consistent with quick nav
        const $unequip = $('.equipment-left-controls #girl-equipment-unequip')
        const $levelup = $('.equipment-left-controls #girl-equipment-level-up')
        $('#equipment .inventory-controls').prepend($levelup).prepend($unequip)

        // equip resonance match indication
        const {girl} = window
        const inventories = ['#equipment .inventory', '#equipment .item-column .equipment_slot']

        const equip_observer = new MutationObserver(() => {
            $(`#equipment .slot_girl_armor`).each((i, slot) => {
                const $slot = $(slot)
                const {resonance_bonuses} = JSON.parse($slot.attr('data-d'))

                if (!$slot.find('.item_resonances').length && Object.keys(resonance_bonuses).length) {
                    const $item_resonanceses = $(`<div class="item_resonances"></div>`)

                    Object.entries(resonance_bonuses).forEach(([key, bonus]) => {
                        const matches = girl[key] == bonus.identifier ? ' matches' : ''
                        const src = `${Helpers.getCDNHost()}/pictures/${RESONANCE_PATH[key]}/${key == 'element' ? ELEMENTS_ICON_NAMES[bonus.identifier] : bonus.identifier}.png`

                        $item_resonanceses.append($(`<div class="resonance_${key}${matches}"><img src="${src}"></div>`))
                    })

                    $slot.append($item_resonanceses)
                }
            })
        })
        inventories.forEach(inventory => {
            Helpers.doWhenSelectorAvailable(inventory, () => {
                equip_observer.observe($(inventory)[0], {childList: true})
            })
        })
    }
}

export default UpgradeInfoModule
