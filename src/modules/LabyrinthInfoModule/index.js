import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'

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

            if (Helpers.isCurrentPage('labyrinth-pre-battle')) {
                this.addGirlIcons()

                Helpers.doWhenSelectorAvailable('.team-hexagon', () => {
                    const {hero_fighter, opponent_fighter} = window

                    const all_girls = [...Object.values(hero_fighter.fighters).map(({speed, id_girl}) => {
                        return {team: 'player', speed: speed, id_girl: id_girl}
                    }), ...opponent_fighter.fighters.map(({speed, id_girl}) => {
                        return {team: 'opponent', speed: speed, id_girl: id_girl}
                    })].sort((a, b) => b.speed-a.speed)

                    all_girls.forEach(({team, id_girl}, index) => {
                        $(`.${team}-panel .team-member-container[data-girl-id="${id_girl}"]`).append(`<div class="team-order-number">${index+1}</div>`)
                    })
                })
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
        Helpers.doWhenSelectorAvailable('.team-hexagon', () => {
            $('.team-member-container').each((i, el) => {
                const girl_data = $(el).find('.girl_img').data('new-girl-tooltip')
                $(el).find('.icon.hexagon-girl-element').wrap('<div class="girl-icons"></div>').after(`<div carac="class${girl_data.class}" class="icon caracs"></div>`)
            })
        })
    }
}

export default LabyrinthInfoModule
