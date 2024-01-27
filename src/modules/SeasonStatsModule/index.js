import { lsKeys } from '../../common/Constants'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import CoreModule from '../CoreModule'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'seasonStats'
class SeasonStatsModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun() {
        return Helpers.isCurrentPage('season.html') || Helpers.isCurrentPage('season-arena')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}
        styles.use()

        Helpers.defer(() => {
            const seasonStats = Helpers.lsGet(lsKeys.SEASON_STATS)
            if (!seasonStats) {
                return
            }

            const {fights, victories, losses, won_mojo, lost_mojo} = seasonStats

            const statsTooltip = `
            <span class="scriptSeasonStatsTooltip" style="visibility: visible;">
                <table>
                    <tbody>
                        <tr><td>${this.label('fights')} :</td><td>${I18n.nThousand(fights)}</td></tr>
                        <tr><td>${this.label('victories')} :</td><td>${I18n.nThousand(victories)}</td></tr>
                        <tr><td>${this.label('defeats')} :</td><td>${I18n.nThousand(losses)}</td></tr>
                    </tbody>
                </table>
                <hr/>
                <table>
                    <tbody>
                        <tr><td>${this.label('mojoWon')} :</td><td>${I18n.nThousand(won_mojo)}</td></tr>
                        <tr><td>${this.label('mojoLost')} :</td><td>${I18n.nThousand(lost_mojo)}</td></tr>
                    </tbody>
                </table>
                <hr/>
                <table>
                    <tbody>
                        <tr><td>${this.label('mojoWonAvg')} :</td><td>${I18n.nRounding(won_mojo / Math.max(victories, 1), 2, -1)}</td></tr>
                        <tr><td>${this.label('mojoLostAvg')} :</td><td>${I18n.nRounding(lost_mojo / Math.max(losses, 1), 2, -1)}</td></tr>
                        <tr><td>${this.label('mojoAvg')} :</td><td>${I18n.nRounding((won_mojo - lost_mojo) / Math.max(fights, 1), 2, -1)}</td></tr>
                    </tbody>
                </table>
            </span>
        `.replace(/( {4}|\n)/g, '')

            const $stats = $('<span class="scriptSeasonStats">Stats</span>').attr('tooltip', statsTooltip)
            if (Helpers.isCurrentPage('season.html')) {
                $('div#seasons_tab_title').append($stats)
            } else {
                const attach_stats = () => {
                    $('.battle_hero .player_details').append($stats)
                }
                Helpers.doWhenSelectorAvailable('.battle_hero .player_details', attach_stats)
            }

        })

        this.hasRun = true
    }
}

export default SeasonStatsModule
