const arrow_size = 10
const opened_tooltip = []

class TooltipManager {
    static initTooltipType(selector, callback) {
        $('body').off('touchstart', selector)
        $('body').off('touchend', selector)
        $('body').off('touchcancel', selector)

        $('body').off('mouseenter', selector)
        $('body').off('mouseleave', selector)

        if (window.tooltips) {
            // not avliable with new bundler, maybe they'll re expose it
            window.tooltips[selector] = callback
            window.addEventHandlers(selector)
        } else {
            TooltipManager.addEventHandlers(selector, callback)
        }
    }

    // Copied and edited KK code from right before the bundler update
    static addEventHandlers(selector, callback) {
        const {is_mobile_device} = window
        if (!is_mobile_device()) {
            $('body').on('mouseenter', selector, (event) => {
                TooltipManager.close()
                const $target = $(event.currentTarget)
                TooltipManager.createTooltip($target, callback($target))
            }).on('mouseleave', selector, () => {
                TooltipManager.close()
            })
        } else {
            window.addEventListener('contextmenu', (e) => {
                e.preventDefault()
            })
            const delay = 0
            const longpress = 800
            $('body').on('touchstart', selector, (event) => {
                TooltipManager.close()
                delay = setTimeout(() => {
                    const $target = $(event.currentTarget)
                    TooltipManager.createTooltip($target, callback($target))
                }, longpress)
            })
            $('body').on('touchend', () => {
                if (delay) {
                    clearTimeout(delay)
                    TooltipManager.close()
                }
            })
        }
    }

    static createTooltip($target, options) {
        const {title, body, class_name, title_class_name, $avoided_element} = options || {}
        if (!title && !body) {return}

        const tooltip_class = class_name ? class_name : 'hh_tooltip_new have_arrows'
        const tooltip_title_class = title_class_name ? title_class_name : ''
        const tooltip_class_replies = $target.attr('class') === 'replies-info' ? $target.attr('class') : ''
        const title_html = title ? `<h5 class="${tooltip_title_class}">${title}</h5>` : ''
        const $html = $(`<div class="${tooltip_class}${body ? ` ${tooltip_class_replies}` : ''}">${title_html}${body ? body : ''}</div>`)
        opened_tooltip.push($html)
        $('#overlay').after($html)
        TooltipManager.arrange($target, $html)
        if ($avoided_element) {
            TooltipManager.avoidRearrange($target, $html, $avoided_element)
        }
    }

    static arrange($target, $html) {
        const {own, target, bounds, position} = TooltipManager.getRects($target, $html)
        let tooltip_y = 0
        let tooltip_x = 0

        switch (position) {
        case 'top':
            tooltip_y = target.y - own.height - arrow_size * bounds.scale
            break
        case 'bottom':
            tooltip_y = target.y + target.height + arrow_size * bounds.scale
            break
        case 'slide_left':
            tooltip_x = target.x - own.width - arrow_size * bounds.scale
            tooltip_y = target.y
            break
        case 'slide_right':
            tooltip_x = target.x + target.width + arrow_size * bounds.scale
            tooltip_y = target.y
            break
        case 'slide_left_center':
            tooltip_x = target.x - own.width - arrow_size * bounds.scale
            tooltip_y = target.y + target.height / 2 + arrow_size - own.height / 2
            break
        case 'slide_right_center':
            tooltip_x = target.x + target.width + arrow_size * bounds.scale
            tooltip_y = target.y + target.height / 2 + arrow_size - own.height / 2
            break
        }
        if (tooltip_y !== 0) {
            $html.addClass(`align-${position}`)
            $html.css('top', `${tooltip_y}px`)
        }
        const center_target_x = target.x + target.width / 2
        const centered_own_left_edge = center_target_x - own.width / 2
        const centered_own_right_edge = center_target_x + own.width / 2
        if (['top', 'bottom'].includes(position)) {
            if (centered_own_left_edge >= bounds.x && centered_own_right_edge <= bounds.x + bounds.width) {
                tooltip_x = centered_own_left_edge
            } else if (centered_own_left_edge < bounds.x) {
                tooltip_x = target.x
                $html.addClass('align-vertical-left')
            } else {
                tooltip_x = target.x + target.width - own.width
                $html.addClass('align-vertical-right')
            }
        }
        if (tooltip_x !== 0) {
            $html.css('left', `${tooltip_x}px`)
        }
    }

    static avoidRearrange($target, $html, $avoided_element) {
        const rect1 = $avoided_element[0].getBoundingClientRect()
        const rect2 = $html[0].getBoundingClientRect()
        const overlap = !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom)
        if (!overlap) {return}
        const {own, target, bounds} = TooltipManager.getRects($target, $html)
        $html.removeClass('align-top')
        $html.removeClass('align-bottom')
        $html.removeClass('align-vertical-left')
        $html.removeClass('align-vertical-right')
        let tooltip_y = target.y
        if (target.y + own.height > bounds.y + bounds.height) {
            tooltip_y = target.y - (own.height - target.height)
        }
        $html.css('top', `${tooltip_y}px`)
        let tooltip_x = 0
        var type = target.y <= tooltip_y ? 'top' : 'bottom'
        if (target.x + target.width + own.width < bounds.x + bounds.width) {
            tooltip_x = target.x + target.width
            $html.addClass('align-right')
        } else if (target.x - own.width > bounds.x) {
            tooltip_x = target.x - own.width
            $html.addClass('align-left')
        }
        $html.addClass(`align-vertical-${type}`)
        $html.css('left', `${tooltip_x}px`)
    }

    static getRects($target, $html) {
        let own_width = $html.outerWidth()
        const max_width = 500
        if (own_width > max_width) {
            own_width = max_width
            $html.width(own_width)
        }
        let own_height = $html.outerHeight()
        const $bounds_element = $('#contains_all').length ? $('#contains_all') : $('body')
        const $bounds_scale_match = $('#contains_all').length ? $bounds_element.css('transform').match(/matrix\(((\d*\.)?\d+),/) : []
        const bounds_scale = $bounds_scale_match[1] ? parseFloat($bounds_scale_match[1]) : 1
        if ($bounds_scale_match[1]) {
            $html.width($html.width() + 2)
            // applyScale
            const scale_string = `scale("${bounds_scale}")`
            $html.css('transform', scale_string)
            $html.css('-moz-transform', scale_string)
            $html.css('-webkit-transform', scale_string)
            $html.css('transform-origin', 'left top')
            $html.css('-moz-transform-origin', 'left top')
            $html.css('-webkit-transform-origin', 'left top')

            own_width *= bounds_scale
            own_height *= bounds_scale
        }
        let target_width = $target.outerWidth() * bounds_scale
        let target_height = $target.outerHeight() * bounds_scale
        const $target_transformed = $target.css('transform').match(/matrix\(((\d*\.)?\d+),/)
        if ($target_transformed && $target_transformed[1]) {
            const scale = parseFloat($target_transformed[1])
            target_width *= scale
            target_height *= scale
        }
        const own = {
            width: own_width,
            height: own_height
        }
        const target = {
            width: target_width,
            height: target_height,
            x: $target.offset().left,
            y: $target.offset().top
        }
        const bounds = {
            width: $bounds_element.outerWidth() * bounds_scale,
            height: $bounds_element.outerHeight() * bounds_scale,
            x: $bounds_element.offset().left,
            y: $bounds_element.offset().top,
            scale: bounds_scale
        }
        // check and modify bounds
        const x_left = target.x - target.width / 2 - (own.width + arrow_size) > bounds.x
        const x_right = target.x + target.width / 2 + (own.width + arrow_size) < bounds.width
        let position = 'top'
        if (target.y - own.height - arrow_size > bounds.y) {
            position = 'top'
        } else if (target.y + target.height + (own.height + arrow_size) < bounds.height) {
            position = 'bottom'
        } else if (x_left && target.y + own.height < bounds.height) {
            position = 'slide_left'
        } else if (x_right && target.y + own.height < bounds.height) {
            position = 'slide_right'
        } else if (x_left && target.y - own.height / 2) {
            position = 'slide_left_center'
        } else if (x_right && target.y - own.height / 2) {
            position = 'slide_right_center'
        } else {
            console.error('Impossible tooltip placement.')
        }

        return {own, target, bounds, position}
    }

    static close() {
        if ($('#equiped .armor .potential').length) {
            $('#equiped .armor .potential').removeClass('potential')
            $('#equiped .armor .potential_old').addClass('potential')
            $('#equiped .armor .potential').removeClass('potential_old')
        }
        if (!opened_tooltip.length) {return}

        opened_tooltip.forEach($tooltip => {
            $tooltip.remove()
            opened_tooltip.shift()
        })
    }
}

export default TooltipManager
