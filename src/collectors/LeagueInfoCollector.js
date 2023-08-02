/* global server_now_ts, season_end_at */
import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'

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
        // if (Helpers.isCurrentPage('battle') && !Helpers.isCurrentPage('pre-battle')) {
        //     LeagueInfoCollector.collectLeagueBattlePoints()
        // }

        if (Helpers.isCurrentPage('tower-of-fame')) {
            Helpers.defer(() => {
                LeagueInfoCollector.migrate()
                LeagueInfoCollector.clean()
                // LeagueInfoCollector.setupListeners()
            })
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

    static collectLeagueBattlePoints() {
        Helpers.onAjaxResponse(/action=do_battles_leagues/i, (response, opt) => {
            const searchParams = new URLSearchParams(opt.data)
            const player = searchParams.get('id_opponent')
            const number_of_battles = searchParams.get('number_of_battles')

            if (number_of_battles > 1) {
                // can't handle a x15, no individual scores or player ids available
                return
            }

            const points = response.rewards.heroChangesUpdate.league_points

            const pointHist = Helpers.lsGet(lsKeys.LEAGUE_POINT_HISTORY) || {}
            try {
                pointHist[player].points.push(points)
            } catch(e) {
                pointHist[player]={points:[points]}
            }
            Helpers.lsSet(lsKeys.LEAGUE_POINT_HISTORY, pointHist)
        })
    }

    static setupListeners () {
        new MutationObserver(() => {
            $(document).trigger('league:player-selected')
        }).observe(document.getElementById('leagues_right'), {childList: true})
    }
}

export default LeagueInfoCollector
