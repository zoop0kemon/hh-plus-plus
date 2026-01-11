import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import Sheet from '../../common/Sheet'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'
import League from './League'
import Simulator from './Simulator'
import Season from './Season'
import BDSMPvE from './BDSMPvE'
import SimHelpers from './SimHelpers'
import { lsKeys } from '../../common/Constants'

const MODULE_KEY = 'simFight'

class BattleSimulatorModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true,
            subSettings: [
                {
                    key: 'logging',
                    label: I18n.getModuleLabel('config', `${MODULE_KEY}_logging`),
                    default: false
                }
            ]
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)

        this.simManagers = []
        this.logging = false
    }

    shouldRun () {
        return ['pre-battle', 'leagues.html', 'season-arena'].some(page=>Helpers.isCurrentPage(page)) && !['labyrinth', 'world-boss', 'penta-drill'].some(page=>Helpers.isCurrentPage(page)) 
    }

    run ({logging}) {
        if (this.hasRun || !this.shouldRun()) {return}
        this.logging = logging

        styles.use()

        Helpers.defer(() => {
            this.injectCSSVars()

            if (Helpers.isCurrentPage('leagues.html')) {
                Helpers.doWhenSelectorAvailable('.league_table .data-list', async () => {
                    const {opponents_list, GT} = window
                    if (opponents_list && opponents_list.length) {
                        const player_data = await this.getLeaguePlayerData()
                        if (player_data) {
                            const $column_label = $('.data-column.head-column[column=power]>span')
                            $column_label.html(`${this.label('simResults')}<span class="${$column_label.find('span').attr('class')}"></span></span>`)

                            opponents_list.forEach((opponent) => {
                                if (player_data.id_fighter != opponent.player.id_fighter) {
                                    this.simManagers.push(new League(true, player_data, opponent))
                                } else {
                                    opponent.power = 0
                                    opponent.team = player_data.team.total_power
                                }
                            })

                            const updatePlayerRow = () => {
                                $('.data-row.body-row.player-row .data-column[column=power]').text('-')

                                // show the correct team theme / power
                                const {team: {theme_elements, total_power}} = player_data
                                let $icons = []
                                if (theme_elements.length) {
                                    theme_elements.forEach((theme_element) => {
                                        const {ico_url, flavor} = theme_element
                                        $icons.push(`<img class="team-theme icon" src="${ico_url}" tooltip="${GT.design[flavor]}">`)
                                    })
                                } else {
                                    $icons.push(`<img class="team-theme icon" src="${Helpers.getCDNHost()}/pictures/girls_elements/Multicolored.png" tooltip="${GT.design.balanced_theme_flavor}">`)
                                }
                                const $team_power = $(`<span class="team-power">${I18n.nThousand(Math.ceil(total_power))}</span>`)

                                Helpers.doWhenSelectorAvailable('.data-row.body-row.player-row .data-column[column=team] .team-theme', () => {
                                    const $team_button = $('.data-row.body-row.player-row .data-column[column=team] .button_team_synergy')
                                    $team_button.empty().next().remove()
                                    $team_button.append($($icons.join(''))).after($team_power)
                                })
                            }

                            updatePlayerRow()
                            $(document).on('league:table-sorted', () => {
                                updatePlayerRow()
                            })

                            this.runManagedSim()
                        }
                    }
                })
            } else if (Helpers.isCurrentPage('leagues-pre-battle')) {
                this.simManagers = [new League(false)]

                this.runManagedSim()
            } else if (Helpers.isCurrentPage('season-arena')) {
                this.preSim = true
                this.simManagers = [
                    new Season(1),
                    new Season(2),
                    new Season(3),
                ]

                this.runManagedSim()
            } else if (Helpers.isCurrentPage('pre-battle')) {
                this.preSim = true
                this.simManagers = [new BDSMPvE({label: this.label})]

                this.runManagedSim()
            }
        })

        this.hasRun = true
    }

    injectCSSVars () {
        Sheet.registerVar('mojo-icon-s', `url(${Helpers.getCDNHost()}/pictures/design/ic_mojo_white.svg)`)
    }

    runManagedSim () {
        const isMainLeague = Helpers.isCurrentPage('leagues.html')
        this.simManagers.forEach(simManager => {
            const {player, opponent} = simManager.extract()
            const {logging, preSim} = this

            const simulator = new Simulator({player, opponent, logging, preSim})
            const result = simulator.run()

            if (!isMainLeague) {
                const waitOpnt = () => {
                    setTimeout(function() {
                        if ($('.average-lvl')) {
                            simManager.display(result)
                        } else {
                            waitOpnt()
                        }
                    }, 50)
                }
                waitOpnt()
            } else {
                simManager.display(result)
            }
        })

        if (isMainLeague) {
            $(document).trigger('league:sim-done')
        }
    }

    async getLeaguePlayerData () {
        const {opponents_list} = window
        const opponent = opponents_list.find(({match_history_sorting}) => match_history_sorting>=0 && match_history_sorting<3)
        let player_data

        if (opponent) {
            const {player: {id_fighter: opponent_id}} = opponent

            const page = await new Promise((res) => {
                window.$.ajax({
                    url: Helpers.getHref(`/leagues-pre-battle.html?id_opponent=${opponent_id}`),
                    success: res
                })
            })

            $(page).find('script:not([src])').each((i, el) => {
                const html = $(el).html()
                if (html.includes('hero_data')) {
                    player_data = JSON.parse(html.match(/hero_data\s+=\s+(\{.*\})/)[1])

                    const {damage, team} = player_data
                    const {team: {theme_elements}} = opponent.player
                    const playerElements = team.theme_elements.map(({type}) => type)
                    const opponentElements = theme_elements.map(({type}) => type)
                    const dominanceBonuses = SimHelpers.calculateDominationBonuses(playerElements, opponentElements)

                    const re_damage = Math.round(team.caracs.damage * (1+dominanceBonuses.player.attack))
                    player_data.hasAME = Math.round(damage/re_damage * 100) === 115
                }
            })

            Helpers.lsSet(lsKeys.PLAYER_DATA, player_data)
        } else {
            // backup method if the player can't load any league pre-battle pages due to finishing all available challenges
            player_data = Helpers.lsGet(lsKeys.PLAYER_DATA)
        }

        return player_data
    }
}

export default BattleSimulatorModule
