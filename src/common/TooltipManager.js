class TooltipManager {
    static initTooltipType(selector, callback) {
        $('body').off('touchstart', selector)
        $('body').off('touchend', selector)
        $('body').off('touchcancel', selector)

        $('body').off('mouseenter', selector)
        $('body').off('mouseleave', selector)

        if (window.TooltipManager) {
            // Old
            const { is_mobile, is_tablet, Tooltip } = window
            const isMobile = is_mobile && is_mobile() || is_tablet && is_tablet()

            window.TooltipManager.initTooltipType(isMobile, selector, false, (target) => {
                const { title, body } = callback()
                let newTooltip = new Tooltip($(target), title, body)
                window.TooltipManager.initNewTooltip(target, newTooltip)
            })
        } else if (window.tooltips) {
            // New
            //FIX LATTER maybe they'll re expose it
            window.tooltips[selector] = callback
            window.addEventHandlers(selector)
        }
    }
}

export default TooltipManager
