import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'
import { lsKeys } from '../../common/Constants'
import TooltipManager from '../../common/TooltipManager'

const MODULE_KEY = 'labyrinth'

const CLASS_NAMES = {
    1: 'hardcore',
    2: 'charm',
    3: 'knowhow'
}

class LabyrinthInfoModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true,
            subSettings: [
                {
                    key: 'fixPower',
                    label: I18n.getModuleLabel('config', `${MODULE_KEY}_fixPower`),
                    default: false
                }
            ]
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('labyrinth')
    }

    run ({fixPower}) {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            if (fixPower) {
                this.normalizePower()
            }
            this.improveGirlTooltip()
            this.addGirlIcons()
            this.addGirlOrder()
            this.addRelicsMenu()
            if (Helpers.isCurrentPage('labyrinth-battle')) {
                this.fasterSkipButton()
            }
        })

        this.hasRun = true
    }

    normalizePower() {
        if (Helpers.isCurrentPage('labyrinth-pool-select') || Helpers.isCurrentPage('edit-labyrinth-team')) {
            const {owned_girls, availableGirls} = window
            const game_girls = owned_girls || availableGirls
            const girl_powers = []
            game_girls.forEach((girl) => {
                const {id_girl, caracs: {carac1, carac2, carac3}} = girl
                const power = carac1 + carac2 + carac3
                girl.power_display = power
                girl_powers.push({id_girl, power})
            })
            girl_powers.sort((a, b) => b.power - a.power)

            const is_pool = Helpers.isCurrentPage('labyrinth-pool-select')
            const grid_selector = is_pool ? '.girl-grid' : '.harem-panel-girls'
            const container_selector = is_pool ? '.girl-container' : '.harem-girl-container'
            const power_selector = is_pool ? '.girl-power-number' : '.girl-power-icon>span'
            Helpers.doWhenSelectorAvailable(grid_selector, () => {
                const detached_containers = []
                girl_powers.forEach((girl) => {
                    const $girl = $(`${container_selector}[id_girl="${girl.id_girl}"]`)

                    detached_containers.push($girl.detach())
                    $girl.find(power_selector).html(I18n.nThousand(Math.ceil(girl.power)))
                })
                detached_containers.forEach((container) => {
                    $(grid_selector).append(container)
                })
            })
        } else if (Helpers.isCurrentPage('labyrinth.html')) {
            const {girl_squad} = window
            girl_squad.forEach(({member_girl}) => {
                const {caracs: {carac1, carac2, carac3}} = member_girl
                member_girl.power_display = carac1 + carac2 + carac3
            })
        }
    }

    // TODO add relic stats to tooltips
    improveGirlTooltip () {
        // const {number_format_lang} = window
        // const actual = window.displayPvpV4Caracs
        // const hook = (...args) => {
        //     const ret = actual(...args)
        //     try {
        //         const $ego = $(`<span carac="ego">${number_format_lang(args[0].battle_caracs.ego)}</span>`)
        //         const $ret = $(`<div class="wrapper">${ret}</div>`)
        //         $ret.find('.left-section').prepend($ego)
        //         return $ret.html()
        //     } catch {
        //         return ret
        //     }
        // }
        // window.displayPvpV4Caracs = hook

        // add tooltips to battle page, have to use a bunch of nasty hacks to get it to be a pvp v4 tooltip
        if (Helpers.isCurrentPage('labyrinth-battle')) {
            const {hero_fighter_v4, opponent_fighter_v4} = window
            const actual_tooltip = window.tooltips['[data-new-girl-tooltip]']
            const actual_displayClassHTML = window.displayClassHTML
            const actual_buildGirlSkills = window.buildGirlSkills
            const girls = [...Object.values(hero_fighter_v4.fighters), ...opponent_fighter_v4.fighters]

            Helpers.doWhenSelectorAvailable('.container-opponent', () => {
                girls.forEach((girl) => {
                    const $container = $(`.container-${girl.is_hero_fighter ? 'hero' : 'opponent'} .team-member-container[id="member-${girl.id_girl}"]`)
                    const {girl: {graded2, caracs, blessed_caracs, battle_caracs, level, skill_tiers_info, girl: {name, rarity, class: g_class, element_data}}} = girl
                    const girl_data = {name, graded2, rarity, class: g_class, caracs, blessed_caracs, battle_caracs, level, element_data, skill_tiers_info}

                    $container.find('.girl_img').attr('data-new-girl-tooltip', JSON.stringify(girl_data))
                })
            })

            const hook_tooltip = (...args) => {
                const ret = actual_tooltip(...args)
                try {
                    const {displayPvpV4Caracs} = window
                    const girl = JSON.parse($(args[0])[0].getAttribute("data-new-girl-tooltip"))
                    const $body = $(`<div class="script-temp-wrapper">${ret.body}</div>`)
                    $body.find('.caracs').html(displayPvpV4Caracs(girl))

                    ret.body = $body.html()
                    ret.class_name = `${ret.class_name}pvp-v4`
                    return ret
                } catch {
                    return ret
                }
            }
            // window.tooltips['[data-new-girl-tooltip]'] = hook_tooltip
            TooltipManager.initTooltipType('[data-new-girl-tooltip]', hook_tooltip)
            const hook_displayClassHTML = (...args) => {
                if (args.length > 2 && typeof args[2] == "boolean") {
                    args[2] = !args[2]
                }
                const ret = actual_displayClassHTML(...args)
                return ret
            }
            window.displayClassHTML = hook_displayClassHTML
            const hook_buildGirlSkills = (...args) => {
                if (args.length > 1 && typeof args[1] == "boolean") {
                    args[1] = !args[1]
                }
                const ret = actual_buildGirlSkills(...args)
                return ret
            }
            window.buildGirlSkills = hook_buildGirlSkills
        }
    }

    addGirlIcons () {
        const {GT} = window

        const addToHex = () => {
            Helpers.doWhenSelectorAvailable('.team-hexagon', () => {
                $('.team-member-container').each((i, el) => {
                    const girl = $(el).find('.girl_img').data('new-girl-tooltip')
                    if (girl) {
                        const $icon = `<div carac="${girl.class}" tooltip="${GT.design[`class_${CLASS_NAMES[girl.class]}`]}" class="icon caracs"></div>`
                        $(el).find('.icon.hexagon-girl-element').wrap('<div class="girl-icons"></div>').before($icon)
                    }
                })
            })
        }
        const addToPanel = () => {
            Helpers.doWhenSelectorAvailable('.harem-panel-girls', () => {
                $('.harem-girl-container ').each((i, el) => {
                    const girl = $(el).find('.girl_img').data('new-girl-tooltip')
                    $(el).prepend(`<div carac="${girl.class}" tooltip="${GT.design[`class_${CLASS_NAMES[girl.class]}`]}" class="icon caracs"></div>`)
                })
            })
        }
        const addToPool = () => {
            $('.girl-container:not(.slide_left)').each((i, el) => {
                if (!$(el).find('.icon').length) {
                    const girl = $(el).find('.girl-image').data('new-girl-tooltip')
                    const $class_icon = `<div carac="${girl.class}" tooltip="${GT.design[`class_${CLASS_NAMES[girl.class]}`]}" class="icon caracs"></div>`
                    const {flavor, ico_url} = girl.element_data
                    const $element_icon = `<div class="icon element" tooltip="${flavor}"><img src="${ico_url}"></div>`
                    $(el).append($class_icon).append($element_icon)
                }
            })
        }

        if (Helpers.isCurrentPage('labyrinth-pre-battle')) {
            addToHex()
        } else if (Helpers.isCurrentPage('edit-labyrinth-team')) {
            addToHex()
            addToPanel()

            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    const {target} = mutation
                    const girl = JSON.parse($(target).attr('data-new-girl-tooltip'))
                    const $icon = girl ? `<div carac="${girl.class}" tooltip="${GT.design[`class_${CLASS_NAMES[girl.class]}`]}" class="icon caracs"></div>` : ''
                    const $container = $(target).parents('.team-member-container')
                    if ($container.find('.icon.caracs').length) {
                        $container.find('.icon.caracs').replaceWith($icon)
                    } else {
                        $container.find('.icon.hexagon-girl-element').wrap('<div class="girl-icons"></div>').before($icon)
                    }
                })
            })
            Helpers.doWhenSelectorAvailable('.team-hexagon', () => {
                observer.observe($('.team-hexagon')[0], {subtree: true, attributes: true, attributeFilter: ['data-new-girl-tooltip']})
            })
        } else if (Helpers.isCurrentPage('labyrinth-pool-select')) {
            Helpers.doWhenSelectorAvailable('.girl-grid', addToPool)
        } else if (Helpers.isCurrentPage('labyrinth.html')) {
            const observer = new MutationObserver(() => {
                if ($('.girl-container:not(.slide_left)').length != $('.girl-container .icon.caracs').length) {
                    addToPool()
                }
            })
            Helpers.doWhenSelectorAvailable('.squad-container', () => {
                observer.observe($('.squad-container')[0], {childList: true})
                observer.observe($('.rejuvenation_stones-container')[0], {childList: true})
            })
        }
    }

    // off in some cases for girls with same speed
    addGirlOrder () {
        if (Helpers.isCurrentPage('labyrinth-pre-battle')) {
            const {hero_fighter, opponent_fighter} = window

            const player_speeds = Object.values(hero_fighter.fighters).map(({speed, id_girl, position}) => {
                return {speed: speed, girl_id: id_girl, position: position}
            })
            const opponent_speeds = opponent_fighter.fighters.map(({speed, id_girl, position}) => {
                return {speed: speed, girl_id: id_girl, position: position+7}
            })
            const girl_speeds = [...player_speeds, ...opponent_speeds].sort((a, b) => b.speed-a.speed)

            Helpers.doWhenSelectorAvailable('.team-hexagon', () => {
                girl_speeds.forEach(({position, girl_id}, i) => {
                    $(`.${position<7 ? 'player' : 'opponent'}-panel .team-member-container[data-girl-id="${girl_id}"]`).append(`<div class="team-order-number">${i+1}</div>`)
                })
            })
        } else if (Helpers.isCurrentPage('edit-labyrinth-team')) {
            const opponent_speeds = Helpers.lsGet(lsKeys.LABYRINTH_SPEEDS) || []
            let girl_speeds
            let selected

            const getTeam = () => {
                const player_speeds = []
                $('.team-member-container').each((i, el) => {
                    const girl_id = parseInt($(el).attr('data-girl-id'))
                    if (girl_id) {
                        const speed = JSON.parse($(el).find('.team-member>img').attr('data-new-girl-tooltip')).battle_caracs.speed
                        const position = $(el).data('team-member-position')
                        player_speeds.push({speed: speed, girl_id: girl_id, position: position})
                    }
                })

                girl_speeds = [...player_speeds, ...opponent_speeds].sort((a,b) => a.position-b.position).sort((a,b) => b.speed-a.speed)
            }
            const getSelected = () => {
                let new_selected
                const $container = $('.team-member-container.selected')
                const player_speeds = girl_speeds.filter(({position}) => position < 7)

                if ($container.length) {
                    const position = parseInt($container.attr('data-team-member-position'))
                    const new_id = parseInt($container.attr('data-girl-id')) || 0
                    const index = girl_speeds.findIndex(({girl_id, position}) => girl_id === new_id && position < 7)
                    new_selected = {index: index, girl_id: new_id, position: position, method: 'selected'}
                } else if (player_speeds.length) {
                    const girl = player_speeds.at(-1)
                    const index = girl_speeds.findIndex(({girl_id, position}) => girl_id === girl.girl_id && position < 7)
                    new_selected = {index: index, girl_id: girl.girl_id, position: girl.position, method: 'slowest girl'}
                } else {
                    new_selected = {index: -1, girl_id: 0, position: 0, method: 'no girl'}
                }

                if (!selected || (selected.girl_id != new_selected.girl_id) || new_selected.girl_id === 0) {
                    selected = new_selected
                    addToPanel()
                }
            }

            const addToHex = () => {
                girl_speeds.forEach(({position, girl_id}, i) => {
                    if (position < 7) {
                        const $container = $(`.team-member-container[data-girl-id="${girl_id}"]`)
                        $container.find('.team-order-number').remove()
                        $container.append(`<div class="team-order-number">${i+1}</div>`)
                    }
                })
            }
            const addToPanel = () => {
                const {index, position} = selected
                const hasPosition = girl_speeds.findIndex((g) => g.position === position)
                $('.harem-girl-container .girl_img').each((i, el) => {
                    const new_speed = $(el).data('new-girl-tooltip').battle_caracs.speed
                    const new_id = parseInt($(el).parent().attr('id_girl'))
                    let new_girl_speeds
                    const inTeam = girl_speeds.findIndex(({girl_id, position}) => girl_id === new_id && position < 7)

                    if (inTeam > -1) {
                        if (index > -1) {
                            new_girl_speeds = girl_speeds.map(e => ({...e}))
                            new_girl_speeds[inTeam].position = girl_speeds[index].position
                            new_girl_speeds[index].position = girl_speeds[inTeam].position
                        } else {
                            new_girl_speeds = girl_speeds
                        }
                    } else {
                        const new_girl = {speed: new_speed, girl_id: new_id, position: position}

                        if (hasPosition > -1) {
                            new_girl_speeds = [...girl_speeds.slice(0, index), new_girl, ...girl_speeds.slice(index+1)]
                        } else {
                            new_girl_speeds = [...girl_speeds, new_girl]
                        }
                    }
                    new_girl_speeds = new_girl_speeds.sort((a, b) => a.position-b.position).sort((a, b) => b.speed-a.speed)

                    const order = new_girl_speeds.findIndex(({girl_id, position}) => girl_id === new_id && position < 7)+1
                    $(el).siblings('.team-order-number').remove()
                    $(el).before(`<div class="team-order-number">${order}</div>`)
                })
            }

            const hex_observer = new MutationObserver(() => {
                getTeam()
                addToHex()
                getSelected()
            })

            Helpers.doWhenSelectorAvailable('.team-hexagon', () => {
                getTeam()
                addToHex()
                hex_observer.observe($('.team-hexagon')[0], {subtree: true, attributes: true, attributeFilter: ['data-girl-id']})

                Helpers.doWhenSelectorAvailable('.harem-panel-girls', () => {
                    getSelected()
                    $('.team-member-container, .harem-girl-container').click(() => {
                        getSelected()
                    })
                })
            })
        }
    }

    addRelicsMenu () {
        if (Helpers.isCurrentPage('edit-labyrinth-team') || Helpers.isCurrentPage('labyrinth-pre-battle')) {
            const {buildRelicContainerHTML, GT} = window
            const relics_trimed = Helpers.lsGet(lsKeys.LABYRINTH_RELICS) || []
            const relics = relics_trimed.map((relic) => {
                const {identifier, rarity, bonus, girl} = relic
                const type = identifier.match(/[a-z]+/g)[0]
                const relic_data = {identifier, rarity, type, bonus}
                if (girl) {relic_data.girl = girl}

                return relic_data
            })
            const $relic_panel = $(`
            <div class="script-relics-panel">
                <div class="script-relics-grid">
                    ${relics.length ? relics.map(relic => buildRelicContainerHTML(relic)).join('') : GT.design.labyrinth_no_relics}
                </div>
            </div>`)
            $relic_panel.hide()

            const $toggle = $(`<div class="script-relics-toggle"><img src="${Helpers.getCDNHost()}/labyrinth/relics_icon.png"></div>`)
            $toggle.click(() => {
                $relic_panel.toggle()
                $relic_panel.getNiceScroll().resize()
            })

            Helpers.doWhenSelectorAvailable('.player-panel .personal_info', () => {
                $('.player-panel .personal_info').append($toggle)
            })
            Helpers.doWhenSelectorAvailable('.boss-bang-panel, .buttons-container.back-button', () => {
                $('.boss-bang-panel, .buttons-container.back-button').after($relic_panel)
                $relic_panel.niceScroll('.script-relics-grid', {bouncescroll: false})
            })
        }
    }

    // TODO show end state of battle
    fasterSkipButton () {
        Helpers.onAjaxResponse(/action=do_battles_labyrinth/i, (response) => {
            Helpers.doWhenSelectorAvailable('#new-battle-skip-btn', () => {
                // $('#new-battle-skip-btn').click(() => {
                    // TODO show end state of battle
                // })
                $('#new-battle-skip-btn').show()
            })
        })
    }
}

export default LabyrinthInfoModule
