/* global pachinkoDef */
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'
import CoreModule from '../CoreModule'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'pachinkoNames'
class PachinkoNamesModule extends CoreModule {
    constructor() {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: true
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun() {
        return Helpers.isCurrentPage('pachinko')
    }

    run() {
        if (this.hasRun || !this.shouldRun()) { return }
        styles.use()

        Helpers.defer(() => {
            const girlDictionary = Helpers.getGirlDictionary()

            this.girlLists = {}

            pachinkoDef.forEach(({ type, content }) => {
                const rewardGirls = (content && content.rewards && content.rewards.girl_shards && content.rewards.girl_shards.plain_data) || []
                const poolGirls = (content && content.girls_pool && content.girls_pool.girl_shards && content.girls_pool.girl_shards.plain_data) || []
                const girlList = rewardGirls.map(({ id_girl }) => girlDictionary.get(`${id_girl}`))
                const girlPool = poolGirls.map(({ id_girl }) => ({ ...girlDictionary.get(`${id_girl}`), id_girl }))
                this.girlLists[type] = { girlList, girlPool }
            })

            const deferredAttachment = () => {
                const observer = new MutationObserver(() => this.applyPanel())
                observer.observe($('.playing-zone')[0], { attributes: true })

                this.applyPanel()
            }

            if ($('.playing-zone').length) {
                deferredAttachment()
            } else {
                const pachinkoReadyObserver = new MutationObserver(() => {
                    if ($('.playing-zone').length) {
                        pachinkoReadyObserver.disconnect()
                        deferredAttachment()
                    }
                })
                pachinkoReadyObserver.observe($('#pachinko_whole')[0], { childList: true })
            }
        })

        this.hasRun = true
    }

    applyPanel() {
        const type = $('.playing-zone').attr('type-panel')
        const { girlList, girlPool } = this.girlLists[type]

        const isCxH = Helpers.isCxH()
        const isPSH = Helpers.isPSH()
        const $panelHtml = Helpers.$(`
            <div class="availableGirls rarity-styling">
                <div class="scrollArea">
                    <div class="availableOnly">
                        ${girlList.length ? this.label('availableGirls') : ''}
                        ${girlList.map(girl => girl ? `<${isCxH || isPSH ? 'span' : `a href="${Helpers.getWikiLink(girl.name)}" target="_blank"`} class="availableGirl ${girl.rarity}-text">${girl.name.replace(' ', ' ')}</${isCxH || isPSH ? 'span' : 'a'}>` : '<span class="unknownGirl">Unknown</span>').join(', ')}
                    </div>
                    <div class="fullPool">
                        ${girlPool.length ? this.label('poolGirls') : ''}
                        ${girlPool.map(girl => girl ? `<a href="/harem/${girl.id_girl}" class="availableGirl ${girl.rarity}-text">${girl.name.replace(' ', ' ')}</a>` : '<span class="unknownGirl">Unknown</span>').join(', ')}
                    </div>
                </div>
            </div>
        `)

        $('.game-rewards').before($panelHtml)

        $panelHtml.niceScroll('.scrollArea', { bouncescroll: false })
        $panelHtml.find('.nicescroll-rails-vr').css('right', '5px')
    }
}

export default PachinkoNamesModule
