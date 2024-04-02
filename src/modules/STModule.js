import HHModule from './HHModule'
import Helpers from '../common/Helpers'

class STModule extends HHModule {
    constructor (props) {
        super({group: 'st', ...props})
        this.styles = props.styles
    }

    run () {
        if (!this.shouldRun() || this.hasRun) {return}

        if (!this.hasRunExtra) {
            this.runExtra()
        }
        this.styles.use()

        this.hasRun = true
        this.hasRunExtra = true
    }

    runExtra () {
        // NO-OP
    }

    tearDown () {
        this.styles.unuse()

        this.hasRun = false
    }
}

export default STModule
