import CoreModule from '../CoreModule'
import Helpers from '../../common/Helpers'
import I18n from '../../i18n'

import styles from './styles.lazy.scss'

const MODULE_KEY = 'homeScreenOrder'

const CHANGES = [
    {
        rel: 'activities',
        after: 'map',
    },
    {
        rel: 'leaderboard',
        after: 'activities',
    },
    {
        rel: 'shop',
        after: 'leaderboard',
    },
    {
        rel: 'god-path',
        after: 'shop',
    },
    {
        rel: 'clubs',
        after: 'god-path',
    }
]

class HomeScreenOrderModule extends CoreModule {
    constructor () {
        super({
            baseKey: MODULE_KEY,
            label: I18n.getModuleLabel('config', MODULE_KEY),
            default: false
        })
        this.label = I18n.getModuleLabel.bind(this, MODULE_KEY)
    }

    shouldRun () {
        return Helpers.isCurrentPage('home.html')
    }

    run () {
        if (this.hasRun || !this.shouldRun()) {return}

        styles.use()

        Helpers.defer(() => {
            this.reorderLinks()
        })

        this.hasRun = true
    }

    getItemForRel(rel) {
        return $(`.quest-container:has([rel=${rel}]), [rel=${rel}]`).eq(0)
    }

    reorderLinks () {
        CHANGES.forEach(({rel, before, after}) =>  {
            const $workingItem = this.getItemForRel(rel)
            if (!$workingItem.length) {return}

            let destinationRel
            let attachmentFunction

            if (after) {
                destinationRel = after
                attachmentFunction = 'after'
            } else if (before) {
                destinationRel = before
                attachmentFunction = 'before'
            }

            const $destination = this.getItemForRel(destinationRel)
            if (!$destination.length) {return}

            $destination[attachmentFunction]($workingItem)
        })
    }
}

export default HomeScreenOrderModule
