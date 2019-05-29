/* @flow */

import Vue from 'core/index'
import { patch } from 'quickapp/runtime/patch'
import { mountComponent } from 'core/instance/lifecycle'
import platformDirectives from 'quickapp/runtime/directives/index'
import platformComponents from 'quickapp/runtime/components/index'
import { extend } from 'shared/util'

import {
  query,
  mustUseProp,
  isReservedTag,
  isRuntimeComponent,
  isUnknownElement
} from 'quickapp/util/index'

import { $extend, isEmptyObject } from './utils'

// install platform runtime directives and components
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)

const accessors = ['public', 'protected', 'private']

// install platform specific utils
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isRuntimeComponent = isRuntimeComponent
Vue.config.isUnknownElement = isUnknownElement

// install platform patch function
Vue.prototype.__patch__ = patch

// wrap mount
Vue.prototype.$mount = function (el, hydrating) {
  const options = this.$options
  const { type = 'component' } = options
  const component = mountComponent(
    this,
    el && query.bind(this)(el, this.$document),
    hydrating
  )
  // 将页面与根VM链接
  if (type === 'page') {
    this._connectVm2Page && this._connectVm2Page()
    this._registerPageLifecycle && this._registerPageLifecycle()
  }

  return component
}

Vue.prototype._initExternalData = function () {
  const externalData = Vue.config.externalData
  if (this.$options.type !== 'page') {
    return
  }
  if (!externalData) {
    return
  }
  if (!this.$options._descriptor) {
    $extend(this.$options.data, externalData)
    return
  }
  let fromExternal = this._page.intent && this._page.intent.fromExternal
  if (!this._page.intent || this._page.intent.fromExternal === undefined) {
    // 不传递则走按严格校验
    fromExternal = true
  }
  console.trace(`### App Framework ### 页面VM中声明的权限定义：${JSON.stringify(this.$options._descriptor)}`)
  if (this.$options.$props && !isEmptyObject(externalData)) {
    console.warn(`### App Framework ### 页面VM中不支持props，推荐在public或protected中声明参数`)
  }
    // 校验合并
  for (const extName in externalData) {
    const extDesc = this.$options._descriptor[extName]

    if (!extDesc) {
      console.trace(`### App Framework ### 传递外部数据${extName}在VM中未声明，放弃更新`)
      continue
    }

    const matchFromExPackage = fromExternal && accessors.indexOf(extDesc.access) > 0
    const matchFromInPackage = !fromExternal && accessors.indexOf(extDesc.access) > 1
    if (matchFromExPackage || matchFromInPackage) {
      console.warn(`### App Framework ### 传递外部数据${extName}在VM中声明为${extDesc.access}，放弃更新`)
    } else {
      console.trace(`### App Framework ### 传递外部数据${extName}，原值为:${JSON.stringify(this._data[extName])}`)
      console.trace(`### App Framework ### 传递外部数据${extName}，新值为:${JSON.stringify(externalData[extName])}`)
      this.$options.data[extName] = externalData[extName]
    }
  }
}

Vue.prototype._mergeAccess2Data = function (options) {
  if (typeof options.data === 'function') {
    options.data = options.data()
  }
  if (options.data && accessors.some(acc => options[acc])) {
    throw new Error('页面VM对象中的属性data不可与' + accessors.join(',') + '同时存在，请使用private替换data名称')
  } else if (!options.data) {
    options.data = {}
    options._descriptor = {}
    accessors.forEach(acc => {
      const accType = typeof options[acc]
      if (accType === 'object') {
        options.data = Object.assign(options.data, options[acc])
        for (const name in options[acc]) {
          options._descriptor[name] = {
            access: acc
          }
        }
      } else if (accType === 'function') {
        console.warn('页面VM对象中的属性' + acc + '的值不能是函数，请使用对象')
      }
    })
  }
}

const _init = Vue.prototype._init

Vue.prototype._init = function (options) {
  const vm = this
  const $options = vm.constructor.options
  if ($options.type === 'page') {
    this._connectLifecycle && this._connectLifecycle($options)
    this._mergeAccess2Data && this._mergeAccess2Data($options)
  }
  _init.call(this, options)
}

Vue.prototype._connectLifecycle = function (options) {
  // onReady 放到 Vue mounted钩子中执行
  const pageReadyHook = () => {
    this._ready = true
    // const readyHook = options.onReady
    // if (readyHook && typeof readyHook === 'function') {
    //   readyHook.call(this)
    // }
  }
  options.mounted = options.mounted || []
  options.mounted = Array.isArray(options.mounted) ? options.mounted : [options.mounted]
  options.mounted.push(pageReadyHook)

  // // onInit 放到 Vue 的created钩子中执行
  // const pageInitHook = () => {
  //   const initHook = options.onInit
  //   if (initHook && typeof initHook === 'function') {
  //     initHook.call(this)
  //   }
  // }

  const initExternalData = () => {
    // 将page与Vue的vm实例，用于权限控制 initExternalData 方法调用
    this._initExternalData()
  }

  const initHook = () => {
    const onInitHook = this.$options['onInit']
    if (onInitHook && typeof onInitHook === 'function') {
      onInitHook.call(this, this._page._meta.query)
    }
  }

  options.created = options.created || []
  options.created = Array.isArray(options.created) ? options.created : [options.created]
  options.created.push(initExternalData)
  options.created.unshift(initHook)

  // // onDestroy 放到 Vue 的beforeDestroy钩子中执行
  // const pageDestroyHook = () => {
  //   const destroyHook = options.onDestroy
  //   if (destroyHook && typeof destroyHook === 'function') {
  //     destroyHook.call(this)
  //   }
  // }
  // options.beforeDestroy = options.beforeDestroy || []
  // options.beforeDestroy = Array.isArray(options.beforeDestroy) ? options.beforeDestroy : [options.beforeDestroy]
  // options.beforeDestroy.push(pageDestroyHook)
}

export default Vue
