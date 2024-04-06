import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import CoreModule from '../CoreModule'

const MODULE_KEY = 'battleEndstate'
class BattleEndstateModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
    }

    shouldRun () {
        return Helpers.isCurrentPage('battle') && !Helpers.isCurrentPage('pre-battle')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        Helpers.onAjaxResponse(/action=do_battles_(leagues|seasons|troll|pantheon|boss_bang)/i, (response) => {
            //We already spent some combativity, let's show this to the player:
            if (~location.search.search(/number_of_battles=\d+/i)) {
                const nBattlesCount = parseInt(location.search.match(/number_of_battles=(\d+)/i)[1], 10)
                if ($.isNumeric(nBattlesCount)) {
                    const {Hero} = window.shared ? window.shared : window
                    if (Helpers.isCurrentPage('troll-battle')) {
                        Hero.update('energy_fight', Hero.energies.fight.amount - nBattlesCount, false)
                    }
                    if (Helpers.isCurrentPage('season-battle')) {
                        Hero.update('energy_kiss', Hero.energies.kiss.amount - nBattlesCount, false)
                    }
                    if (Helpers.isCurrentPage('league-battle')) {
                        Hero.update('energy_challenge', Hero.energies.challenge.amount - nBattlesCount, false)
                    }
                    if (Helpers.isCurrentPage('pantheon-battle')) {
                        Hero.update('energy_worship', Hero.energies.worship.amount - nBattlesCount, false)
                    }
                }
            }

            // const {hero_fighter, opponent_fighter} = window
            const {rounds, battle_result} = response
            const playerWon = battle_result === 'hero_won'

            const nPlayerInitialEgo = $('.new-battle-player .new-battle-hero-ego-value').data('total-ego')
            const nOpponentInitialEgo = $('.new-battle-opponent .new-battle-hero-ego-value').data('total-ego')
            const {attacker, defender} = rounds.at(-1)[playerWon ? 'hero_hit' : 'opponent_hit']
            const nPlayerFinalEgo = playerWon ? attacker.remaining_ego : defender.remaining_ego
            const nOpponentFinalEgo = playerWon ? defender.remaining_ego : attacker.remaining_ego

            /* Seems to be built on assumtions that are no longer true with tier 5 skills
            const nRoundsLen = rounds.length
            if (nRoundsLen >= 2) {
                const arrLastRounds = [rounds[nRoundsLen - 2], rounds[nRoundsLen - 1]]
                if (!arrLastRounds[1].opponent_hit) {
                    nPlayerFinalEgo = arrLastRounds[0].opponent_hit.defender.remaining_ego
                    nOpponentFinalEgo = arrLastRounds[1].hero_hit.defender.remaining_ego
                } else if (!arrLastRounds[1].hero_hit) {
                    nPlayerFinalEgo = arrLastRounds[1].opponent_hit.defender.remaining_ego
                    nOpponentFinalEgo = arrLastRounds[0].hero_hit.defender.remaining_ego
                } else {
                    nPlayerFinalEgo = rounds[nRoundsLen - 1].opponent_hit.defender.remaining_ego
                    nOpponentFinalEgo = rounds[nRoundsLen - 1].hero_hit.defender.remaining_ego
                }
            } else if (nRoundsLen === 1) {
                if (!rounds[0].opponent_hit) {
                    nPlayerFinalEgo = nPlayerInitialEgo
                    nOpponentFinalEgo = rounds[0].hero_hit.defender.remaining_ego
                } else if (!rounds[0].hero_hit) {
                    nPlayerFinalEgo = rounds[0].opponent_hit.defender.remaining_ego
                    nOpponentFinalEgo = nOpponentInitialEgo
                } else {
                    nPlayerFinalEgo = rounds[0].opponent_hit.defender.remaining_ego
                    nOpponentFinalEgo = rounds[0].hero_hit.defender.remaining_ego
                }
            } else {
                throw new Error('incorrect amount of rounds')
            }*/

            $('#new-battle-skip-btn').on('click', () => {
                const {GT} = window
                const $playerBar = $('.new-battle-player .new-battle-hero-ego-initial-bar')
                const $playerDamageBar = $('.new-battle-player .new-battle-hero-ego-damage-bar')
                const $playerHealBar = $('.new-battle-player .new-battle-hero-ego-heal-bar')
                const $opponentBar = $('.new-battle-opponent .new-battle-hero-ego-initial-bar')
                const $opponentDamageBar = $('.new-battle-opponent .new-battle-hero-ego-damage-bar')
                const $opponentHealBar = $('.new-battle-opponent .new-battle-hero-ego-heal-bar')

                const $playerEgo = $('.new-battle-player .new-battle-hero-ego-value')
                const $opponentEgo = $('.new-battle-opponent .new-battle-hero-ego-value')
                const $playerDamageDone = $('.new-battle-opponent .new-battle-hero-damage-taken-text')
                const $opponentDamageDone = $('.new-battle-player .new-battle-hero-damage-taken-text')
                const $criticalDamageIndicator = $('.new-battle-hero-container .new-battle-hero-critical-text')

                $playerDamageDone.css('opacity', '0')
                $opponentDamageDone.css('opacity', '0')
                $criticalDamageIndicator.css('opacity', '0')
                $playerHealBar.css('opacity', '0')
                $opponentHealBar.css('opacity', '0')

                const strPlayerCurEgo = $playerEgo.text().split(GT.ego)[1].replace(/[, ]/g, '')
                let nPlayerCurEgo = nPlayerInitialEgo
                if ($.isNumeric(strPlayerCurEgo)) {
                    nPlayerCurEgo = parseInt(strPlayerCurEgo)
                }
                const strOpponentCurEgo = $opponentEgo.text().split(GT.ego)[1].replace(/[, ]/g, '')
                let nOpponentCurEgo = nOpponentInitialEgo
                if ($.isNumeric(strOpponentCurEgo)) {
                    nOpponentCurEgo = parseInt(strOpponentCurEgo)
                }
                const nPlayerCompleteAtk = nOpponentCurEgo - nOpponentFinalEgo
                const nOpponentCompleteAtk = nPlayerCurEgo - nPlayerFinalEgo
                $playerDamageDone.text(nPlayerCompleteAtk.toString())
                $opponentDamageDone.text(nOpponentCompleteAtk.toString())

                const fPlayerEgoBarWidth = nPlayerFinalEgo <= 0 ? 0 : nPlayerFinalEgo / nPlayerInitialEgo * 100.0
                const fOpponentEgoBarWidth = nOpponentFinalEgo <= 0 ? 0 : nOpponentFinalEgo / nOpponentInitialEgo * 100.0

                const arrPlayerAnimationSequence = [
                    {e: $playerBar, p: {width: fPlayerEgoBarWidth.toFixed(2) + '%'}, o: {duration: 200}},
                    {e: $playerDamageBar, p: {width: fPlayerEgoBarWidth.toFixed(2) + '%'}, o: {duration: 200}},
                    {e: $playerDamageDone, p: {opacity: [0, 1], translateY: -20, translateZ: 0}, o: {
                            duration: 300,
                            sequenceQueue: false,
                            complete: function(elm) {
                                $playerEgo.text(GT.ego + ' ' + nPlayerFinalEgo.toString())
                                $(elm).velocity({translateY: 0}, 0)
                            }
                        }
                    }
                ]
                const arrOpponentAnimationSequence = [
                    {e: $opponentBar, p: {width: fOpponentEgoBarWidth.toFixed(2) + '%'}, o: {duration: 200}},
                    {e: $opponentDamageBar, p: {width: fOpponentEgoBarWidth.toFixed(2) + '%'}, o: {duration: 200}},
                    {e: $opponentDamageDone, p: {opacity: [0, 1], translateY: -20, translateZ: 0}, o: {
                            duration: 300,
                            sequenceQueue: false,
                            complete: function(elm) {
                                $opponentEgo.text(GT.ego + ' ' + nOpponentFinalEgo.toString())
                                $(elm).velocity({translateY: 0}, 0)
                            }
                        }
                    }
                ]

                $('.velocity-animating').velocity('stop', true)
                //FIX LATTER IDK
                if (window.setRounds) {
                    setRounds([])
                }
                $.Velocity.RunSequence(arrPlayerAnimationSequence)
                $.Velocity.RunSequence(arrOpponentAnimationSequence)
            })
            $('#new-battle-skip-btn').show()
        })

        this.hasRun = true
    }
}

export default BattleEndstateModule
