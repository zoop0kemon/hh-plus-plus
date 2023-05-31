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
            const {girl} = window
            const isBlessed = !!girl.blessed_attributes

            // additional girl stats
            const $girl_upper_info = $('.girl-upper-info')
            const $girl_class = $girl_upper_info.children().eq(1)
            const $girl_theme = $girl_upper_info.children().eq(0)
            const $girl_figure = $(`<div class="girl_pos"><img src="${Helpers.getCDNHost()}/pictures/design/battle_positions/${girl.figure}.png"></div>`)
            // Don't know the blessing bonus % or base stats, so can't update caracs...
            // const $girl_upper_stats = $(`
            // <div class="girl-upper-stats${isBlessed? ' blessed-attribute' : ''}">
            //     <div carac="1"><br>${I18n.nThousand(girl.caracs.carac1)}</div>
            //     <div carac="2"><br>${I18n.nThousand(girl.caracs.carac2)}</div>
            //     <div carac="3"><br>${I18n.nThousand(girl.caracs.carac3)}</div>
            // </div>`)

            $girl_class.after($girl_theme)
            $girl_upper_info.append($girl_figure)
            // $girl_upper_info.after($girl_upper_stats)

            // equip resonance match indication
            const $equip_inventory = $('#equipment .inventory')
            const equip_observer = new MutationObserver(() => {
                $('.girl-leveler-panel .slot_girl_armor').each((i, slot) => {
                    const $slot = $(slot)
                    const {resonance_bonuses} = $slot.data('d')

                    if (!$slot.find('.item_resonances').length && Object.keys(resonance_bonuses).length) {
                        let $item_resonanceses = $(`<div class="item_resonances"></div>`)

                        Object.entries(resonance_bonuses).forEach(([key, bonus]) => {
                            const matches = girl[key] == bonus.identifier ? ' matches' : ''
                            const src = `${Helpers.getCDNHost()}/pictures/${RESONANCE_PATH[key]}/${key == 'element' ? ELEMENTS_ICON_NAMES[bonus.identifier] : bonus.identifier}.png`

                            $item_resonanceses.append($(`<div class="resonance_${key}${matches}"><img src="${src}"></div>`))
                        })

                        $slot.append($item_resonanceses)
                    }
                })
            })
            equip_observer.observe($equip_inventory[0], { childList: true })

            // current resource spent amount
            const $resource_section = $('.girl-resource-section')
            const addResourceCur = (cur = -1) => {
                const resource = this.getCurrentResource()

                if (['experience', 'affection'].includes(resource)) {
                    let $script_cur = $resource_section.find('.script-cur')
                    if (!$script_cur.length) {
                        $script_cur = $('<span class="script-cur"></span>')
                        $resource_section.find('.top-text>p').eq(0).append($script_cur)
                    }

                    if (cur < 0) {
                        cur = resource === 'experience' ? girl.Xp.cur : girl.Affection.cur
                    }
                    $script_cur.text(` ${I18n.nThousand(cur)}`)
                }
            }

            addResourceCur()
            const resource_observer = new MutationObserver(() => {
                addResourceCur()
            })
            resource_observer.observe($resource_section[0], { childList: true })
            Helpers.onAjaxResponse(/action=girl_give_/, (response, opt) => {
                if (!response.success) {return}

                const searchParams = new URLSearchParams(opt.data)
                const cur = response[searchParams.get('action').replace('girl_give_', '')]
                addResourceCur(cur)
            })
        })

        this.hasRun = true
    }

    getCurrentResource() {
        let resource = 'experience'
        if (location.search && location.search.includes('resource')) {
            const urlPattern = new RegExp('resource=(?<resource>[a-z]+)')
            const matches = urlPattern.exec(location.search)
            resource = matches.groups.resource
        }
        return resource
    }
}

export default UpgradeInfoModule
