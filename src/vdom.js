// src/vdom.js
export function h(type, props = {}, ...children) {
  props = props || {};
  const flatChildren = children.flat().map(c => (typeof c === 'object' ? c : String(c)));
  return { type, props, children: flatChildren };
}

export const Fragment = Symbol('Fragment');
