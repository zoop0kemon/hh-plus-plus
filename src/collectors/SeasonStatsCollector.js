import { lsKeys } from '../common/Constants'
import Helpers from '../common/Helpers'

const DEFAULT_STATS = {
    fights: 0,
    victories: 0,
    losses: 0,
    won_mojo: 0,
    lost_mojo: 0,
}

class SeasonStatsCollector {
    static collect () {
        Helpers.defer(() => {
            SeasonStatsCollector.migrate()
            if (Helpers.isCurrentPage('season') && !Helpers.isCurrentPage('season-arena')) {
                SeasonStatsCollector.rollOverStats()
            }
            if (Helpers.isCurrentPage('season-arena') || Helpers.isCurrentPage('battle')) {
                SeasonStatsCollector.collectFromBattle()
            }
        })
    }

    static migrate () {
        const seasonStats = Helpers.lsGetRaw(lsKeys.SEASON_STATS)
        if (seasonStats) {
            return
        }

        const legacySeasonStats = Helpers.lsGetRaw('SeasonStats')
        if (legacySeasonStats) {
            Helpers.lsSetRaw(lsKeys.SEASON_STATS, legacySeasonStats)
        }
    }

    static collectFromBattle () {
        Helpers.onAjaxResponse(/action=do_battles_seasons/i, (response) => {
            const {rewards} = response
            if (rewards && rewards.data && rewards.data.rewards) {
                const mojoReward = rewards.data.rewards.find(({type}) => type === 'victory_points')
                if (mojoReward) {
                    const seasonStats = Helpers.lsGet(lsKeys.SEASON_STATS) || {...DEFAULT_STATS}

                    const mojoAmount = parseInt(mojoReward.value, 10)

                    seasonStats.fights += 1
                    if (mojoAmount > 0) {
                        seasonStats.victories += 1
                        seasonStats.won_mojo += mojoAmount
                    } else {
                        seasonStats.losses += 1
                        seasonStats.lost_mojo -= mojoAmount
                    }

                    Helpers.lsSet(lsKeys.SEASON_STATS, seasonStats)
                }
            }
        })
    }

    static rollOverStats () {
        const {server_now_ts, season_sec_untill_event_end} = window
        const seasonEndTime = parseInt(Helpers.lsGetRaw(lsKeys.SEASON_END_TIME) || '0', 10)

        if (server_now_ts > seasonEndTime && season_sec_untill_event_end) {
            Helpers.lsSetRaw(lsKeys.OLD_SEASON_STATS, Helpers.lsGetRaw(lsKeys.SEASON_STATS))
            Helpers.lsSet(lsKeys.SEASON_STATS, DEFAULT_STATS)
            Helpers.lsSetRaw(lsKeys.SEASON_END_TIME, server_now_ts + season_sec_untill_event_end)
        }
    }
}

export default SeasonStatsCollector
