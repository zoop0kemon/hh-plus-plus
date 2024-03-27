import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import Sheet from '../../common/Sheet'

import meanIcon from '../../assets/mean.svg'
import filterIcon from '../../assets/filter.svg'

import styles from './styles.lazy.scss'
import { lsKeys } from '../../common/Constants'

const MODULE_KEY = 'league'

const TOPS = [4, 15, 30]
const CHALLENGES_PER_PLAYER = 3
const CIRCULAR_THRESHOLDS = {
    1: 'green',
    0.5: 'yellow',
    0.2: 'red'
}

const getScoreDisplayDataForTop = (currentPos, currentScore, top, scoreToBeat, scoreToStayAbove) => {
    let symbol = ''
    let diff
    let score
    let labelKey
    if (currentPos <= top) {
        score = scoreToStayAbove
        diff = currentScore - scoreToStayAbove
        if (diff) {
            symbol = '-'
        }
        labelKey = 'stayInTop'
    } else {
        score = scoreToBeat + 1
        diff = score - currentScore
        symbol = '+'
        labelKey = 'notInTop'
    }

    return {
        symbol,
        diff,
        score,
        labelKey
    }
}

class LeagueInfoModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true,
            subSettings: [
                {
                    key: 'board',
                    label: I18n.getModuleLabel('config', `${MODULE_KEY}_board`),
                    default: true
                },
                {
                    key: 'promo',
                    label: I18n.getModuleLabel('config', `${MODULE_KEY}_promo`),
                    default: true
                }
            ]
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('leagues.html')
    }

    run ({board, promo}) {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            this.injectCSSVars()
            this.displaySummary({board, promo})
            this.manageTable()
            this.fixLeagueSorting()
        })

        this.hasRun = true
    }

    injectCSSVars () {
        Sheet.registerVar('legendary-bg', `url("${Helpers.getCDNHost()}/legendary.png")`)
        Sheet.registerVar('filter-icon', `url('${filterIcon}')`)
    }

    fixLeagueSorting () {
        Helpers.doWhenSelectorAvailable('.league_table .data-list', () => {
            // fix / adjust sorting 
            //FIX LATTER
            // const isColumnSortable_actual = window.isColumnSortable
            // const hook = (column_name, settings) => {
            //     if (column_name === "team") {return true}
            //     return isColumnSortable_actual(column_name, settings)
            // }
            // window.isColumnSortable = hook

            const {opponents_list} = window
            if (opponents_list && opponents_list.length) {
                opponents_list.forEach((opponent) => {
                    const {player: {team: {total_power}}} = opponent
                    opponent.team = total_power
                })
            }
        })
    }

    displaySummary ({board, promo}) {
        const {opponents_list, season_end_at, shared: {Hero}} = window
        if (opponents_list && opponents_list.length) {
            const playersTotal = opponents_list.length
            const opponentsTotal = playersTotal - 1
            const posPointsIndex = {}
            const demoteThreshold = playersTotal-14
            const nonDemoteThreshold = playersTotal-15
            const thresholds = [...TOPS, ...TOPS.map(top => top+1)]
            const levels = []
            const demotions = {}
            const tops = {}

            let challengesDone = 0
            let tot_victory = 0
            let tot_defeat = 0
            let playerRank
            let playerScore
            opponents_list.forEach(({match_history, player, place, player_league_points}) => {
                const match_history_array = Object.values(match_history)[0]
                const points = player_league_points

                levels.push(parseInt(player.level, 10))

                posPointsIndex[place] = points
                if (thresholds.includes(place)) {
                    tops[place] = points
                }
                if (demoteThreshold === place) {
                    demotions.demote = points
                } else if (nonDemoteThreshold === place) {
                    demotions.nonDemote = points
                }

                if (match_history_array == false) {
                    // is self
                    playerRank = place
                    playerScore = points
                } else {
                    let nb_victories = 0
                    let nb_defeats = 0
                    match_history_array.forEach((match) => {
                        if (match) {
                            const {attacker_won} = match

                            nb_victories += attacker_won === 'won' ? 1 : 0
                            nb_defeats += attacker_won === 'lost' ? 1 : 0
                        }
                    })
                    tot_victory += nb_victories
                    tot_defeat += nb_defeats
                    challengesDone += match_history_array.filter((e) => {return e != null}).length
                }
            })

            const challengesPossibleMinutes = parseInt(Math.floor(season_end_at/60), 10)
            const challengesPossible = (Hero.energies.challenge.amount !== Hero.energies.challenge.max_regen_amount)? Math.floor((challengesPossibleMinutes + (35 - Hero.energies.challenge.next_refresh_ts / 60))/35) + parseInt(Hero.energies.challenge.amount, 10) : Math.floor(challengesPossibleMinutes/35) + parseInt(Hero.energies.challenge.amount, 10)

            levels.sort((a,b) => a-b)
            const midpoint = Math.floor(levels.length / 2)
            const levelRange = {
                min: Math.min(...levels),
                max: Math.max(...levels),
                median: levels.length % 2 ? levels[midpoint] : (levels[midpoint - 1] + levels[midpoint]) / 2.0
            }

            const challengesTotal = (opponentsTotal) * CHALLENGES_PER_PLAYER
            const avgScore = (challengesDone !== 0) ? playerScore/challengesDone : 0
            const avg = Math.round(avgScore*100)/100
            const scoreExpected = Math.floor(avgScore*challengesTotal)

            let topsHtml = ''
            let promoHtml = ''
            if (board) {
                topsHtml = TOPS.map(top => {
                    const scoreDisplayData = getScoreDisplayDataForTop(playerRank, playerScore, top, tops[top], tops[top+1])
                    const {diff, score, symbol, labelKey} = scoreDisplayData

                    return `<span class="minTop${top}" hh_title="${this.label(labelKey, {points: I18n.nThousand(score), top})}" tooltip><span class="scriptLeagueInfoIcon top${top}"></span>${symbol}${I18n.nThousand(diff)}</span>`
                }).join('')
            }
            if (promo) {
                const {current_tier_number, max_league} = window
                const {demote, nonDemote} = demotions

                const canDemote = current_tier_number > 1
                const canPromote = current_tier_number < max_league

                const playerAtZeroPoints = playerScore === 0
                const playerIsTop15 = playerRank <= 15
                const playerWouldDemote = canDemote && (playerAtZeroPoints || playerScore <= demote)

                let textDemote
                let textNonDemote
                let textStagnate

                if (canDemote) {
                    if (!playerWouldDemote) {
                        textDemote = this.label('toDemote', {players: demoteThreshold - playerRank})
                    } else {
                        if (playerAtZeroPoints) {
                            textDemote = this.label('willDemoteZero')
                            textNonDemote = this.label('toNotDemote')
                        } else {
                            textDemote = this.label('willDemote', {points: nonDemote})
                        }
                    }
                }

                if (canPromote) {
                    if (playerIsTop15) {
                        if (!playerAtZeroPoints) {
                            textStagnate = this.label('toStay', {players: 16 - playerRank})
                        }
                    } else {
                        textStagnate = this.label('willStay', {points: tops[15]})
                    }
                }

                const promotionInfoTooltip = [textStagnate, textNonDemote, textDemote].filter(a=>a).map(text=>`<p>${text}</p>`).join('')

                promoHtml = `
                    <span class="promotionInfo" hh_title="${promotionInfoTooltip}" tooltip>
                        <img src="${Helpers.getCDNHost()}/leagues/ic_rankup.png" style="height: 15px; width: 12px; margin-left: 6px; margin-bottom: 0px;">
                    </span>
                `
            }

            const challengesLeft = challengesTotal - challengesDone
            const possibleChallengesTooltip = `${this.label('challengesRegen', {challenges: challengesPossible})}<br/>${this.label('challengesLeft', {challenges: challengesLeft})}`

            const nb_unknown = challengesDone - tot_victory - tot_defeat
            const {min, max, median} = levelRange

            const leagueStatsText = `
                <hr/>
                <span id=&quot;leagueStats&quot;><u>${this.label('currentLeague')}</u>
                <table>
                    <tbody>
                        <tr><td>${this.label('victories')} :</td><td><em>${tot_victory}</em>/<em>${challengesTotal}</em></td></tr>
                        <tr><td>${this.label('defeats')} :</td><td><em>${tot_defeat}</em>/<em>${challengesTotal}</em></td></tr>
                        <tr><td>${this.label('unknown')} :</td><td><em>${nb_unknown}</em>/<em>${challengesTotal}</em></td></tr>
                        <tr><td>${this.label('notPlayed')} :</td><td><em>${challengesLeft}</em>/<em>${challengesTotal}</em></td></tr>
                        <tr><td>${this.label('levelRange')} :</td><td><em>${min}</em>…<em>${median}</em>…<em>${max}</em></td></tr>
                    </tbody>
                </table>
                </span>`

            const old_data = Helpers.lsGet(lsKeys.LEAGUE_RESULTS_OLD) || {}
            const old_nb_opponents = Helpers.lsGet(lsKeys.LEAGUE_PLAYERS_OLD) || 0
            const old_nb_unknown = Helpers.lsGet(lsKeys.LEAGUE_UNKNOWN_OLD) || 0
            const old_score = Helpers.lsGet(lsKeys.LEAGUE_SCORE_OLD) || {}
            const old_time = Helpers.lsGet(lsKeys.LEAGUE_TIME_OLD) || 0

            let oldLeagueStatsText = ''

            if (old_time > 0) {
                let old_tot_victory = 0
                let old_tot_defeat = 0

                const old_points = old_score.points || 0
                const old_avg = old_score.avg || 0

                for(let old_key in old_data) {
                    old_tot_victory += old_data[old_key].victories
                    old_tot_defeat += old_data[old_key].defeats
                }

                const old_challenges_total = CHALLENGES_PER_PLAYER * old_nb_opponents
                const old_tot_notPlayed = old_challenges_total - old_tot_victory - old_tot_defeat - old_nb_unknown

                const options = {year: 'numeric', month: 'short', day: 'numeric'}
                const old_date_end_league = new Date(old_time*1000).toLocaleDateString(I18n.getLang(), options)

                oldLeagueStatsText = `
                    <hr/>
                    <span id=&quot;oldLeagueStats&quot;>
                        ${this.label('leagueFinished', {date: `<em>${old_date_end_league}</em>`})}
                        <table>
                            <tbody>
                                <tr><td>${this.label('victories')} :</td><td><em>${old_tot_victory}</em>/<em>${old_challenges_total}</em></td></tr>
                                <tr><td>${this.label('defeats')} :</td><td><em>${old_tot_defeat}</em>/<em>${old_challenges_total}</em></td></tr>
                                <tr><td>${this.label('notPlayed')} :</td><td><em>${old_tot_notPlayed}</em>/<em>${old_challenges_total}</em></td></tr>
                                <tr><td>${this.label('opponents')} :</td><td><em>${old_nb_opponents}</em></td></tr>
                                <tr><td>${this.label('leaguePoints')} :</td><td><em>${I18n.nThousand(old_points)}</em></td></tr>
                                <tr><td>${this.label('avg')} :</td><td><em>${I18n.nThousand(old_avg)}</em></td></tr>
                            </tbody>
                        </table>
                    </span>`
            }

            const allLeagueStatsText = `${possibleChallengesTooltip}${leagueStatsText}${oldLeagueStatsText}`
            const summaryHtml = `
                <div class="scriptLeagueInfo">
                    <span class="averageScore" hh_title="${this.label('averageScore', {average: I18n.nThousand(avg)})}<br/>${this.label('scoreExpected', {score: I18n.nThousand(scoreExpected)})}" tooltip><img src="${meanIcon}" style="height: 15px; width: 16px; margin-left: 2px; margin-bottom: 0px;">${I18n.nThousand(avg)}</span>
                    <span class="possibleChallenges" hh_title="${allLeagueStatsText}" tooltip><img src="${Helpers.getCDNHost()}/pictures/design/league_points.png" style="height: 15px; width: 16px; margin-left: 6px; margin-bottom: 0px;">${challengesPossible}/${challengesLeft}</span>
                    ${topsHtml}
                    ${promoHtml}
                </div>
            `
            Helpers.doWhenSelectorAvailable('.league_buttons_block', () => {
                if ($('.change_team_container').length) {
                    $('.change_team_container').before(summaryHtml)
                } else {
                    $('.league_buttons_block').before(summaryHtml)
                }
            })
        }
    }

    manageTable () {
        const filters = {
            fought_opponent: {
                label: 'filterFoughtOpponents',
                type: "radio",
                options: [
                    {value: false, icon: 'quest/ic_eyeopen.svg'},
                    {value: true, icon: 'quest/ic_eyeclosed.svg'}
                ]
            },
            boosted: {
                label: 'filterBoosted',
                type: "radio",
                options: [
                    {value: false, icon: 'quest/ic_eyeopen.svg'},
                    {value: true, icon: 'quest/ic_eyeclosed.svg'}
                ]
            },
            team_theme: {
                label: 'filterTeamTheme',
                type: "checkbox",
                options: [
                    {value: 'darkness', icon: 'pictures/girls_elements/Dominatrix.png'},
                    {value: 'light', icon: 'pictures/girls_elements/Submissive.png'},
                    {value: 'psychic', icon: 'pictures/girls_elements/Voyeurs.png'},
                    {value: 'balanced', icon: 'pictures/girls_elements/Multicolored.png'},
                    {value: 'water', icon: 'pictures/girls_elements/Sensual.png'},
                    {value: 'fire', icon: 'pictures/girls_elements/Eccentric.png'},
                    {value: 'nature', icon: 'pictures/girls_elements/Exhibitionist.png'},
                    {value: 'stone', icon: 'pictures/girls_elements/Physical.png'},
                    {value: 'sun', icon: 'pictures/girls_elements/Playful.png'}
                ]
            }
        }
        const activeFilters = Helpers.lsGet(lsKeys.OPPONENT_FILTER) || {
            fought_opponent: false,
            boosted: false,
            team_theme: []
        }

        let pinPlayer = Helpers.lsGet(lsKeys.LEAGUE_PIN_PLAYER) || false

        const {tutoData} = window
        let tutorial_complete = !!tutoData.leagues6

        const createGridSelectorItem = ({id, type, value, icon}) => {
            const inputId = `${id}-${value}`
            const isChecked = type === 'checkbox' ? activeFilters[id].includes(value) : JSON.parse(activeFilters[id]) === value
            return `
                <input type="${type}" name="${id}" id="${inputId}" value="${value}"${isChecked ? ' checked' : ''}/>
                <label for="${inputId}">
                    <img src="${Helpers.getCDNHost()}/${icon}">
                </label>
            `
        }

        const createGridSelector = ({id, filter}) => {
            const {label, type, options} = filter
            return `
                <span>${this.label(label)}</span>
                <div class="grid-selector" rel="${id}">
                    ${options.map(option => {
                        const {value, icon} = option
                        return createGridSelectorItem({id, type, value, icon})
                    }).join('')}
                </div>
            `
        }

        const createFilterBox = () => {
            return $(`
                <div class="league_filter_box" style="display: none;">
                    ${Object.keys(filters).map(key => createGridSelector({id: key, filter: filters[key]})).join('')}
                </div>`)
        }

        const adjustStripes = () => {
            $('.data-row.body-row').removeClass('script-stripe')
            $('.data-row.body-row:not(.script-hide):not(:has(.player-pin.pinned)):even').addClass('script-stripe')
        }

        const buildBoosterProgress = (current, max) => {
            const percentage = Math.min(current / max, 1)
            const firstHalf = Math.min(percentage, 0.5) * 2
            const secondHalf = Math.max(percentage - 0.5, 0) * 2

            let colorClass = ''
            let flashingClass = ''

            if (percentage > 0) {
                Object.entries(CIRCULAR_THRESHOLDS).forEach(([threshold, className]) => {
                    if (percentage <= threshold) {
                        colorClass = className
                    }
                })
            } else {
                flashingClass = 'flashing'
            }

            const $progress = $(`
                <div class="circle">
                    <div class="circle-bar left ${flashingClass}">
                        <div class="progress ${colorClass}" style="transform: rotate(${180 * secondHalf}deg)"></div>
                    </div>
                    <div class="circle-bar right ${flashingClass}">
                        <div class="progress ${colorClass}" style="transform: rotate(${180 * firstHalf}deg)"></div>
                    </div>
                </div>
            `)

            return $progress
        }

        const hideOpponents = () => {
            const {opponents_list} = window

            if (opponents_list && opponents_list.length && tutorial_complete) {
                opponents_list.forEach(({match_history, boosters, player: {team: {theme}}}, index) => {
                    const match_history_array = Object.values(match_history)[0]

                    if (match_history_array) {// only care about opponents
                        let toHide = false

                        const challenges_done = match_history_array.filter((e) => {return e != null}).length
                        toHide |= challenges_done >= 3 && JSON.parse(activeFilters.fought_opponent)

                        const expiration = boosters.length ? boosters.reduce((a, b) => a.expiration > b.expiration ? a : b).expiration : 0
                        toHide |= boosters.length && expiration > 0 && JSON.parse(activeFilters.boosted)

                        const team_themes = (theme || 'balanced').split(',')
                        toHide |= !team_themes.some(e => activeFilters.team_theme.includes(e)) && activeFilters.team_theme.length

                        const $row = $('.data-row.body-row').eq(index)
                        if (toHide) {
                            $row.addClass('script-hide')
                        } else {
                            $row.removeClass('script-hide')
                        }
                    }
                })

                adjustStripes()
            }
        }

        const addFilterButtons = () => {
            const $filter = $('<button id="league_filter" class="blue_button_L"><span class="filter_mix_icn"></span></button>')
            const $filter_box = createFilterBox()

            Helpers.doWhenSelectorAvailable('.league_tiers', () => {
                $('.league_tiers').append($filter).append($filter_box)
            })

            $filter.click(() => {$filter_box.toggle()})
            $filter_box.find('input').each((i, input) => {
                $(input).change((e) => {
                    const {value, name, type} = e.target
                    if (type === 'checkbox') {
                        if ($(e.target).is(':checked')) {
                            activeFilters[name].push(value)
                        } else {
                            activeFilters[name] = activeFilters[name].filter(e => e !== value)
                        }
                    } else {
                        activeFilters[name] = value
                    }
                    hideOpponents()
                    Helpers.lsSet(lsKeys.OPPONENT_FILTER, activeFilters)
                    $(document).trigger('league:table-filtered')
                })
            })
        }

        const addTeamThemes = () => {
            const {opponents_list, GT} = window

            if (opponents_list && opponents_list.length) {
                opponents_list.forEach(({player: {team: {theme_elements, total_power}}}, index) => {
                    let $icons = []
                    if (theme_elements.length) {
                        theme_elements.forEach((theme_element) => {
                            const {ico_url, flavor} = theme_element
                            $icons.push(`<img class="team-theme icon" src="${ico_url}" tooltip="${flavor}">`)
                        })
                    } else {
                        $icons.push(`<img class="team-theme icon" src="${Helpers.getCDNHost()}/pictures/girls_elements/Multicolored.png" tooltip="${GT.design.balanced_theme_flavor}">`)
                    }
                    const $team_power = $(`<span class="team-power">${I18n.nThousand(Math.ceil(total_power))}</span>`)

                    $('.data-row.body-row').eq(index).find('.data-column[column=team] .button_team_synergy').append($($icons.join(''))).after($team_power)
                })
            }
        }

        const addBoosterStatus = () => {
            const $boosters = $('[column=boosters] .boosters .slot')
            $boosters.each((i, el) => {
                const data = $(el).data('d')
                const {usages_remaining, expiration, item} = data
                const {rarity, default_usages, duration} = item || {}
                let current = 0
                let max = 1
                const isMythic = rarity === 'mythic'

                if (isMythic) {
                    current = usages_remaining
                    max = default_usages
                } else {
                    const normalisedDuration = duration == 1440 ? 86400 : duration
                    current = expiration
                    max = normalisedDuration
                }

                $(el).wrap(`<div class="circular-progress"></div>`).before(buildBoosterProgress(current, max))
                if (current == 0) {
                    $(el).addClass('expired')
                }
            })
        }

        const addPlayerPin = () => {
            const $player_row = $('.data-row.body-row.player-row')
            const $pin_button = $(`<div class="player-pin${pinPlayer? ' pinned' : ''}"><img src="${Helpers.getCDNHost()}/clubs/ic_Pin.png"></div>`)

            $pin_button.click(() => {
                pinPlayer = !pinPlayer
                $pin_button.toggleClass('pinned')
                adjustStripes()
                Helpers.lsSet(lsKeys.LEAGUE_PIN_PLAYER, pinPlayer)
            })

            $player_row.find('.data-column[column=can_fight]').append($pin_button)

            adjustStripes()
        }

        Helpers.doWhenSelectorAvailable('.league_table .data-list', () => {
            addFilterButtons()
            hideOpponents()
            addTeamThemes()
            addBoosterStatus()
            addPlayerPin()

            $(document).on('league:table-sorted', () => {
                hideOpponents()
                addTeamThemes()
                addBoosterStatus()
                addPlayerPin()
            })
        })

        if (!tutorial_complete) {
            Helpers.onAjaxResponse(/action=tutorial_complete/, (response, opt) => {
                if (!response.success) {return}
                const searchParams = new URLSearchParams(opt.data)
                const tutorial = searchParams.get('tutorial')

                if (tutorial == 'leagues6') {
                    tutorial_complete = true
                    hideOpponents()
                }
            })
        }
    }
}

export default LeagueInfoModule
