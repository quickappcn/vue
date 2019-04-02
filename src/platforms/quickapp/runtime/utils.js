export function $extend (target, ...src) {
  /* istanbul ignore else */
  if (typeof Object.assign === 'function') {
    Object.assign(target, ...src)
  } else {
    const first = src.shift()
    // 覆盖旧值
    for (const key in first) {
      target[key] = first[key]
    }
    if (src.length) {
      $extend(target, ...src)
    }
  }
  return target
}

export function isEmptyObject (obj) {
  for (const key in obj) {
    return false
  }
  return true
}
