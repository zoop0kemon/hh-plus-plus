import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import { RELIC_BONUSES } from '../../data/Relics'

import styles from './styles.lazy.scss'
import { lsKeys } from '../../common/Constants'

const {$} = Helpers

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

        Helpers.defer(async () => {
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
            if (Helpers.isCurrentPage('labyrinth.html')) {
                this.addSeasonTimer()
            }
        })

        this.hasRun = true
    }

    async normalizePower () {
        if (Helpers.isCurrentPage('labyrinth-pool-select') || Helpers.isCurrentPage('edit-labyrinth-team')) {
            const is_pool = Helpers.isCurrentPage('labyrinth-pool-select')
            const {owned_girls, availableGirls} = window
            const game_girls = owned_girls || availableGirls
            const girl_powers = []
            if (is_pool) {
                game_girls.forEach((girl) => {
                    const {id_girl, caracs_sum, blessed_caracs} = girl
                    const power = caracs_sum ? caracs_sum : Object.values(blessed_caracs).reduce((a,b) => a+b)
                    girl.power_display = power
                    girl_powers.push({id_girl, power})
                })
            } else {
                // temp fix for missing girl data on page
                const girlDictionary = await Helpers.getGirlDictionary()
                game_girls.forEach((girl) => {
                    const {id_girl} = girl
                    const power = Helpers.calculateGirlStats(girlDictionary.get(`${id_girl}`))
                    girl.power_display = power
                    girl_powers.push({id_girl, power})
                })
            }
            girl_powers.sort((a, b) => b.power - a.power)

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
                member_girl.power_display = member_girl.caracs_sum
            })
        }
    }

    async improveGirlTooltip () {
        const RELIC_KEYS = Object.keys(RELIC_BONUSES)
        const relics = Helpers.lsGet(lsKeys.LABYRINTH_RELICS)?.filter(({identifier}) => RELIC_KEYS.includes(identifier)) || []

        $('body').on('mouseenter touchstart', '[data-new-girl-tooltip]', (event) => {
            const $target = $(event.currentTarget)
            if ((Helpers.isCurrentPage('labyrinth-pre-battle') && $target.closest('.opponent-panel').length) ||
                (Helpers.isCurrentPage('labyrinth-battle') && $target.closest('.container-opponent').length)) {
                // No relics for the opponent
                return
            }
            const girl_id = parseInt($target.attr('src').match(/girls\/(\d+)/)[1])
            const {battle_caracs, element_data: {type: girl_element}} = JSON.parse($target.attr('data-new-girl-tooltip'))
            if (!battle_caracs) {return}
            const bonus_caracs = {}

            relics.forEach(({identifier, bonus, girl}) => {
                const type = identifier.match(/[a-z]+/g)[0]
                const {carac, element} = RELIC_BONUSES[identifier]
                const girl_matches = type === 'girl' ? girl.id_girl === girl_id : true
                const element_matches = element ? element === girl_element : true

                if (girl_matches && element_matches) {
                    const bonus_carac = Math.ceil(battle_caracs[carac] * (bonus/100))
                    bonus_caracs[carac] = (bonus_caracs[carac] || 0) + bonus_carac
                }
            })

            Helpers.doWhenSelectorAvailable('body > .new_girl_tooltip', () => {
                const $stats = $('body > .new_girl_tooltip .stats-wrapper .caracs')

                Object.entries(bonus_caracs).forEach(([carac, bonus]) => {
                    const $stat = $stats.find(`span[carac="${carac === 'defense' ? 'def0' : carac}"]`)
                    $stat.addClass('relic-attribute')
                    $stat.html(I18n.nThousand(battle_caracs[carac] + bonus))
                })
            })
        })

        // temp fix for missing girl data on page
        if (Helpers.isCurrentPage('edit-labyrinth-team')) {
            const {availableGirls} = window
            const girlDictionary = await Helpers.getGirlDictionary()

            availableGirls.forEach((girl) => {
                const {id_girl, blessing_bonuses} = girl
                const {skill_tiers} = girlDictionary.get(`${id_girl}`)
                const $girl = $(`.harem-girl-container[id_girl="${id_girl}"] [data-new-girl-tooltip]`)
                const tooltip_data = JSON.parse($girl.attr('data-new-girl-tooltip'))

                tooltip_data.blessed_caracs = {}
                tooltip_data.blessed_attributes = Object.keys(blessing_bonuses)
                if (skill_tiers) {
                    const skill_tiers_info = {}
                    skill_tiers.forEach((skill_points_used, tier) => {
                        tier++
                        skill_tiers_info[tier] = {
                            tier,
                            skill_points_used,
                            icon: 'active_skills',
                            icon_path: '/images/pictures/design/girl_skills/active_skills_icon.png'
                        }
                    })
                    tooltip_data.skill_tiers_info = skill_tiers_info
                }
                $girl.attr('data-new-girl-tooltip', JSON.stringify(tooltip_data))
            })
        }
    }

    addGirlIcons () {
        const {GT} = window

        const addToHex = () => {
            Helpers.doWhenSelectorAvailable('.team-hexagon', () => {
                $('.team-member-container:has(.girl_img)').each((i, el) => {
                    const girl = JSON.parse($(el).find('.girl_img').attr('data-new-girl-tooltip'))
                    const $icon = `<div carac="${girl.class}" tooltip="${GT.design[`class_${CLASS_NAMES[girl.class]}`]}" class="icon caracs"></div>`
                    if (Helpers.isCurrentPage('labyrinth-battle')) {
                        const {element_data: {ico_url, type, flavor}} = girl
                        const $element_icon = `<img class="icon hexagon-girl-element" src="${ico_url}" element="${type}" tooltip="${GT.design[flavor]}">`

                        const $girl_icons = $('<div class="girl-icons"></div>').append($icon, $element_icon)
                        $(el).prepend($girl_icons)
                    } else {
                        $(el).find('.icon.hexagon-girl-element').wrap('<div class="girl-icons"></div>').before($icon)
                    }
                })
            })
        }
        const addToPanel = () => {
            Helpers.doWhenSelectorAvailable('.harem-panel-girls', () => {
                $('.harem-girl-container ').each((i, el) => {
                    const girl = JSON.parse($(el).find('.girl_img').attr('data-new-girl-tooltip'))
                    $(el).prepend(`<div carac="${girl.class}" tooltip="${GT.design[`class_${CLASS_NAMES[girl.class]}`]}" class="icon caracs"></div>`)
                })
            })
        }
        const addToPool = () => {
            $('.girl-container:not(.slide_left)').each((i, el) => {
                if (!$(el).find('.icon').length) {
                    const girl = JSON.parse($(el).find('.girl-image').attr('data-new-girl-tooltip'))
                    const $class_icon = `<div carac="${girl.class}" tooltip="${GT.design[`class_${CLASS_NAMES[girl.class]}`]}" class="icon caracs"></div>`
                    const {flavor, ico_url} = girl.element_data
                    const $element_icon = `<div class="icon element" tooltip="${GT.design[flavor]}"><img src="${ico_url}"></div>`
                    $(el).append($class_icon, $element_icon)
                }
            })
        }

        if (Helpers.isCurrentPage('labyrinth-pre-battle') || Helpers.isCurrentPage('labyrinth-battle')) {
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
            const {GT} = window
            const buildRelicContainerHtml = (relic) => {
                const {buildGirlTooltipData} = window.shared ? window.shared.team_block_builder : window
                const {identifier, type, rarity, bonus, girl} = relic
                const relic_icon = RELIC_BONUSES[identifier] ? RELIC_BONUSES[identifier]?.element : false
                const {remaining_ego_percent, member_girl} = girl || {}

                return `
                <div class="relic-container ${rarity}-relic${type === 'girl' ? ' large-card' : ''}">
                    <div class="relic-name">${GT.design[`${identifier}_name`]} <span>${GT.design[`girls_rarity_${rarity}`]}</span></div>
                    <div class="relic-description">${GT.design[`${identifier}_description`].replace("[percent_chance]", bonus)}</div>
                    <div class="relic-infos">
                        ${type === 'team' && relic_icon ? `
                        <div class="team-relic-icon">
                            <span class="${relic_icon}_element_relic_icn" tooltip="${GT.design[`${relic_icon}_flavor_element`]}"></span>
                        </div>` : ''}
                        ${type === 'girl' && girl ? `
                        <span>${member_girl.girl.name}</span>
                        <img class="girl-image rarity-background ${member_girl.girl.rarity}" src="${member_girl.ico}" data-new-girl-tooltip="${buildGirlTooltipData(member_girl)}"/>
                        <div class="ego-bar-container">
                            <span>${remaining_ego_percent > 0 ? `${remaining_ego_percent}%` : GT.design.tired}</span>
                            <div class="ego-fill" style="width:${remaining_ego_percent}%;"></div>
                        </div>` : ''}
                    </div>
                </div>`
            }

            const relics_trimed = Helpers.lsGet(lsKeys.LABYRINTH_RELICS) || []
            const relics = relics_trimed.map((relic) => {
                const {identifier, rarity, bonus, girl} = relic
                const type = identifier.match(/[a-z]+/g)[0]
                const relic_data = {identifier, rarity, type, bonus}
                if (girl) {relic_data.girl = girl}

                return relic_data
            })
            const $relic_panel = $(`
            <div class="script-relics-panel hh-scroll">
                <div class="script-relics-grid">
                    ${relics.length ? relics.map(relic => buildRelicContainerHtml(relic)).join('') : GT.design.labyrinth_no_relics}
                </div>
            </div>`)
            $relic_panel.hide()

            const $toggle = $(`<div class="script-relics-toggle"><img src="${Helpers.getCDNHost()}/labyrinth/relics_icon.png"></div>`)
            $toggle.click(() => {
                $relic_panel.toggle()
            })

            Helpers.doWhenSelectorAvailable('.player-panel .personal_info', () => {
                $('.player-panel .personal_info').append($toggle)
            })
            Helpers.doWhenSelectorAvailable('.boss-bang-panel, .buttons-container.back-button', () => {
                $('.boss-bang-panel, .buttons-container.back-button').after($relic_panel)
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

    addSeasonTimer () {
        const {createTimer} = window.shared ? window.shared.timer : window
        const {server_now_ts} = window
        const {labyrinth_cycle: {cycle_end, labyrinth_season: {event_end}}} = labyrinth_data

        const timezone_offset = Date.parse(cycle_end)/1000 - server_now_ts - cycle_end_in_seconds
        const season_end = Date.parse(event_end)/1000 - server_now_ts - timezone_offset

        Helpers.doWhenSelectorAvailable('.floor-title .floor-name', () => {
            const $timerTarget = $('<span class="season_timer"></span>')
            $('.floor-title .floor-name').text(`${$('.floor-title .floor-name').text()} `).append($timerTarget)

            const onComplete = ()  => {}
            createTimer($timerTarget, season_end, {onComplete: onComplete}).startTimer()
        })
    }
}

export default LabyrinthInfoModule
