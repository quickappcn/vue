/* globals document */

import { makeMap } from 'shared/util'

export * from './class'

export const isReservedTag = makeMap(
  'template,script,style,element,content,slot,link,meta,svg,view,' +
  'a,div,img,image,text,span,input,switch,textarea,spinner,select,' +
  'slider,slider-neighbor,indicator,canvas,' +
  'list,cell,header,loading,loading-indicator,refresh,scrollable,scroller,' +
  'video,web,embed,tabbar,tabheader,datepicker,timepicker,marquee,countdown',
  true
)

// Elements that you can, intentionally, leave open (and which close themselves)
// more flexible than web
export const canBeLeftOpenTag = makeMap(
  'web,spinner,switch,video,textarea,canvas,' +
  'indicator,marquee,countdown',
  true
)

export const isRuntimeComponent = makeMap(
  'richtext,trisition,trisition-group',
  true
)

export const isPreTag = tag => tag === 'pre'

export const isUnaryTag = makeMap(
  'embed,img,image,input,link,meta',
  true
)

export const isTextInputType = makeMap(
  'text,number,password,search,email,tel,url'
)

export function mustUseProp () { /* console.log('mustUseProp') */ }
export function getTagNamespace () { /* console.log('getTagNamespace') */ }
export function isUnknownElement () { /* console.log('isUnknownElement') */ }

export function query (el, document) {
  if (typeof el === 'object' && el !== null) {
    return el
  }
  const nodeBody = document.body
  const nodeAttach = document.createElement('div')
  nodeBody.appendChild(nodeAttach)
  return nodeAttach
}
