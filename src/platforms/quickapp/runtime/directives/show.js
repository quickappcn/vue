/* globals quickappHelper */

export default {
  bind (el, { value }, vnode) {
    const originalDisplay = el.__vOriginalDisplay =
      el.style.display === 'none' ? '' : (el.style.display || '')
    quickappHelper.setElementStyle(el, 'display', value ? originalDisplay : 'none')
  },

  update (el, { value, oldValue }, vnode) {
    if (value === oldValue) return
    quickappHelper.setElementStyle(el, 'display', value ? el.__vOriginalDisplay : 'none')
  },

  unbind (
    el,
    binding,
    vnode,
    oldVnode,
    isDestroy
  ) {
    if (!isDestroy) {
      quickappHelper.setElementStyle(el, 'display', el.__vOriginalDisplay)
    }
  }
}
