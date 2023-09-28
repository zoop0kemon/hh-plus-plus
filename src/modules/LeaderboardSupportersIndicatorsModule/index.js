import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import tierIconGold from '../../assets/hh-plus-plus-gold.svg'
import tierIconSilver from '../../assets/hh-plus-plus-silver.svg'

import styles from './styles.lazy.scss'
import Supporters from '../../data/Supporters'

const MODULE_KEY = 'leaderboardSupportersIndicators'

const TIER_ICONS = {
    gold: tierIconGold,
    silver: tierIconSilver,
}

class LeaderboardSupportersIndicatorsModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return ['activities', 'tower-of-fame', 'pantheon', 'season.html', 'path-of-valor', 'path-of-glory', 'seasonal'].some(page => Helpers.isCurrentPage(page))
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            if (Helpers.isCurrentPage('activities')) {
                Helpers.doWhenSelectorAvailable('#contests .right_part', () => {
                    this.addSupporterAnnotations()
                })
            } else if (Helpers.isCurrentPage('tower-of-fame')) {
                Helpers.doWhenSelectorAvailable('.league_table .data-list', () => {
                    this.addSupporterAnnotations()
                })
            }
        })

        $(document).on('leaderboard-annotated', (event, data) => this.addSupporterAnnotations(data))
        $(document).on('league:table-sorted', () => {this.addSupporterAnnotations()})

        this.hasRun = true
    }

    async addSupporterAnnotations (data) {
        const selector = (data && data.selector) || ''
        const isLeagues = Helpers.isCurrentPage('tower-of-fame')
        const supporters = await Supporters.getSupporters()
        const filteredSupporters = supporters.filter(({flairs}) => flairs)

        const gameKey = Helpers.getGameKey()
        const gamePlatform = Helpers.getPlatform()

        const nameColumnSelector = this.getNameColumnSelector()

        filteredSupporters.forEach(({tier, flairs}) => {
            flairs.forEach(({game, platform, id}) => {
                if (game === gameKey && platform === gamePlatform) {
                    const $nickname = isLeagues ? $(`.nickname[id-member="${id}"]`) : $(`${selector} [sorting_id='${id}']`).find(nameColumnSelector)
                    $nickname.append(`<div class="script-flair script-supporter"><img class="tier-icon" src="${TIER_ICONS[tier]}" tooltip="HH++ ${tier.substring(0,1).toUpperCase()}${tier.substring(1)} Tier Supporter"/></div>`)
                }
            })
        })
    }

    getNameColumnSelector () {
        if (Helpers.isCurrentPage('activities')) {
            return 'td:nth-of-type(2)'
        }
        return '> div:nth-of-type(2)'
    }
}

export default LeaderboardSupportersIndicatorsModule
