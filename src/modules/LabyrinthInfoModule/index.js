import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'
import { lsKeys } from '../../common/Constants'

const MODULE_KEY = 'labyrinth'

class LabyrinthInfoModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('labyrinth')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            this.improveGirlTooltip()
            this.addGirlIcons()
            this.addGirlOrder()
            if (Helpers.isCurrentPage('labyrinth-battle')) {
                this.fasterSkipButton()
            }
        })

        this.hasRun = true
    }

    improveGirlTooltip () {
        const {number_format_lang} = window
        const actual = window.displayPvpV4Caracs
        const hook = (...args) => {
            const ret = actual(...args)
            try {
                const $ego = $(`<span carac="ego">${number_format_lang(args[0].battle_caracs.ego)}</span>`)
                const $ret = $(`<div class="wrapper">${ret}</div>`)
                $ret.find('.left-section').prepend($ego)
                return $ret.html()
            } catch {
                return ret
            }
        }
        window.displayPvpV4Caracs = hook
    }

    addGirlIcons () {
        const CLASS_NAMES = {
            1: 'hardcore',
            2: 'charm',
            3: 'knowhow'
        }
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

    // TODO update opponent speeds in battle for when defeated to remove knocked out opponent girls
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
            Helpers.lsSet(lsKeys.LABYRINTH_SPEEDS, opponent_speeds)

            Helpers.doWhenSelectorAvailable('.team-hexagon', () => {
                girl_speeds.forEach(({position, girl_id}, i) => {
                    $(`.${position<7 ? 'player' : 'opponent'}-panel .team-member-container[data-girl-id="${girl_id}"]`).append(`<div class="team-order-number">${i+1}</div>`)
                })
            })
        } else if (Helpers.isCurrentPage('edit-labyrinth-team')) {
            const opponent_speeds = Helpers.lsGet(lsKeys.LABYRINTH_SPEEDS)
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
        } else if (Helpers.isCurrentPage('labyrinth-pool-select')) {
            Helpers.lsSet(lsKeys.LABYRINTH_SPEEDS, [])
        }
    }

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

    // TODO replace display power with girl power and resort
}

export default LabyrinthInfoModule
