/* @flow */
/* globals quickappHelper */

import { extend, cached, camelize } from 'shared/util'

const normalize = cached(camelize)


function normalizeStyle (cssText) {
  const regex = /([\w-]*)\s*:\s*([^;]*)/g
  const rules = {}
  let match
  while (match = regex.exec(cssText)) {
    rules[match[1]] = match[2].trim()
  }
  return rules
}

function createStyle (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (!vnode.data.staticStyle) {
    updateStyle(oldVnode, vnode)
    return
  }
  const elm = vnode.elm
  const staticStyle = vnode.data.staticStyle
  for (const name in staticStyle) {
    if (staticStyle[name]) {
      quickappHelper.setElementStyle(elm, normalize(name), staticStyle[name])
    }
  }
  updateStyle(oldVnode, vnode)
}

function updateStyle (oldVnode: VNodeWithData, vnode: VNodeWithData) {
  if (!oldVnode.data.style && !vnode.data.style) {
    return
  }
  let cur, name
  const elm = vnode.elm
  let oldStyle: any = oldVnode.data.style || {}
  let style: any = vnode.data.style || {}

  if (typeof style === 'string') {
    style = normalizeStyle(style)
  }

  if (typeof oldStyle === 'string') {
    oldStyle = normalizeStyle(oldStyle)
  }

  const needClone = style.__ob__

  // handle array syntax
  if (Array.isArray(style)) {
    style = vnode.data.style = toObject(style)
  }

  // clone the style for future updates,
  // in case the user mutates the style object in-place.
  if (needClone) {
    style = vnode.data.style = extend({}, style)
  }

  for (name in oldStyle) {
    if (!style[name]) {
      quickappHelper.setElementStyle(elm, normalize(name), '')
    }
  }
  for (name in style) {
    cur = style[name]
    quickappHelper.setElementStyle(elm, normalize(name), cur)
  }
}

function toObject (arr) {
  const res = {}
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}

export default {
  create: createStyle,
  update: updateStyle
}
