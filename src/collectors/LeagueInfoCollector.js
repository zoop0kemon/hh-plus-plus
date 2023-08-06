/* global server_now_ts, season_end_at */
import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'
import I18n from '../i18n'

const MIGRATIONS = {
    leaguePlayers: lsKeys.LEAGUE_PLAYERS,
    oldLeaguePlayers: lsKeys.LEAGUE_PLAYERS_OLD,
    pointHistory: lsKeys.LEAGUE_POINT_HISTORY,
    oldPointHistory: lsKeys.LEAGUE_POINT_HISTORY_OLD,
    leagueResults: lsKeys.LEAGUE_RESULTS,
    oldLeagueResults: lsKeys.LEAGUE_RESULTS_OLD,
    leagueScore: lsKeys.LEAGUE_SCORE,
    oldLeagueScore: lsKeys.LEAGUE_SCORE_OLD,
    leagueTime: lsKeys.LEAGUE_TIME,
    oldLeagueTime: lsKeys.LEAGUE_TIME_OLD,
    leagueUnknown: lsKeys.LEAGUE_UNKNOWN,
    oldLeagueUnknown: lsKeys.LEAGUE_UNKNOWN_OLD
}

class LeagueInfoCollector {
    static collect() {

        if (Helpers.isCurrentPage('tower-of-fame')) {
            Helpers.defer(() => {
                LeagueInfoCollector.collectAvaliableOpponents()
                LeagueInfoCollector.collectFromOpponentsList()
                LeagueInfoCollector.migrate()
                LeagueInfoCollector.clean()

                const observer = new MutationObserver(() => {
                    $(document).trigger('league:table-sorted')
                    LeagueInfoCollector.collectAvaliableOpponents()
                })
                Helpers.doWhenSelectorAvailable('.league_table .data-list', () => {
                    observer.observe($('.league_table .data-list')[0], {childList: true})
                })
            })
        }
    }

    static collectAvaliableOpponents () {
        const {opponents_list} = window
        if (opponents_list && opponents_list.length) {
            let avaliable_opponents = []

            opponents_list.forEach(({match_history, player}) => {
                const match_history_array = Object.values(match_history)[0]

                if (match_history_array) {
                    const player_id = parseInt(player.id_fighter)
                    const fights_played = match_history_array.filter((e) => {return e != null}).length

                    if (fights_played < 3) {
                        avaliable_opponents.push(player_id)
                    }
                }
            })

            Helpers.lsSet(lsKeys.AVAILABLE_OPPONENTS, avaliable_opponents)
        }
    }

    static collectFromOpponentsList () {
        const {opponents_list} = window
        if (opponents_list && opponents_list.length) {
            let data = Helpers.lsGet(lsKeys.LEAGUE_RESULTS) || {}
            const nb_players = opponents_list.length

            let playerScore = 0
            let challengesDone = 0
            let tot_victory = 0
            let tot_defeat = 0 
            opponents_list.forEach(({match_history, player, player_league_points}) => {
                const match_history_array = Object.values(match_history)[0]

                if (match_history_array) {
                    const player_id = parseInt(player.id_fighter)
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

                    let themeIcons = player.team.theme_elements.map((e) => e.ico_url)
                    if (!themeIcons.length) {
                        themeIcons = [`${Helpers.getCDNHost()}/pictures/girls_elements/Multicolored.png`]
                    }

                    data[player_id] = {
                        victories: nb_victories,
                        defeats: nb_defeats,
                        class: player.class,
                        themeIcons
                    }
                } else {
                    // is self
                    playerScore = I18n.parseLocaleRoundedInt(player_league_points)
                }
            })

            Helpers.lsSet(lsKeys.LEAGUE_RESULTS, data)
            Helpers.lsSet(lsKeys.LEAGUE_PLAYERS, nb_players-1)

            let nb_unknown = challengesDone - tot_victory - tot_defeat
            Helpers.lsSet(lsKeys.LEAGUE_UNKNOWN, nb_unknown)

            const avgScore = (challengesDone !== 0) ? playerScore/challengesDone : 0
            const avg = Math.round(avgScore*100)/100
            const leagueScore = {
                points: playerScore,
                avg
            }
            const oldScore = Helpers.lsGet(lsKeys.LEAGUE_SCORE) || {points: 0, avg: 0}
            const {points: oldPoints} = oldScore
            if (playerScore > oldPoints) {
                Helpers.lsSet(lsKeys.LEAGUE_SCORE, leagueScore)
            }
        }
    }

    static clean () {
        const leagueEndTime = server_now_ts + season_end_at
        const storedEndTime = Helpers.lsGet(lsKeys.LEAGUE_TIME)

        if (!storedEndTime) {
            Helpers.lsSet(lsKeys.LEAGUE_TIME, leagueEndTime)
            return
        }

        if (leagueEndTime > storedEndTime) {
            // archive
            Helpers.lsSetRaw(lsKeys.LEAGUE_PLAYERS_OLD, Helpers.lsGetRaw(lsKeys.LEAGUE_PLAYERS))
            Helpers.lsSetRaw(lsKeys.LEAGUE_POINT_HISTORY_OLD, Helpers.lsGetRaw(lsKeys.LEAGUE_POINT_HISTORY))
            Helpers.lsSetRaw(lsKeys.LEAGUE_RESULTS_OLD, Helpers.lsGetRaw(lsKeys.LEAGUE_RESULTS))
            Helpers.lsSetRaw(lsKeys.LEAGUE_SCORE_OLD, Helpers.lsGetRaw(lsKeys.LEAGUE_SCORE))
            Helpers.lsSetRaw(lsKeys.LEAGUE_UNKNOWN_OLD, Helpers.lsGetRaw(lsKeys.LEAGUE_UNKNOWN))
            Helpers.lsSet(lsKeys.LEAGUE_TIME_OLD, storedEndTime)

            // clear
            Helpers.lsRm(lsKeys.LEAGUE_PLAYERS)
            Helpers.lsRm(lsKeys.LEAGUE_POINT_HISTORY)
            Helpers.lsRm(lsKeys.LEAGUE_RESULTS)
            Helpers.lsRm(lsKeys.LEAGUE_SCORE)
            Helpers.lsRm(lsKeys.LEAGUE_UNKNOWN)

            // rollover
            Helpers.lsSet(lsKeys.LEAGUE_TIME, leagueEndTime)

            $(document).trigger('league:rollover')
        }
    }

    static migrate () {
        Object.entries(MIGRATIONS).forEach(([oldKey, newKey]) => {
            const oldVal = Helpers.lsGetRaw(oldKey)
            if (oldVal && !Helpers.lsGetRaw(newKey)) {
                Helpers.lsSetRaw(newKey, oldVal)
                // TODO delete old
            }
        })
    }
}

export default LeagueInfoCollector
