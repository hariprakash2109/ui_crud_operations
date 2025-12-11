// src/renderer.js
import { runWithHooks } from './hooks.js';
import { Fragment } from './vdom.js';

function isEventProp(name) {
  return /^on[A-Z]/.test(name);
}
function toEventName(name) {
  // onClick -> click, onInput -> input
  return name.slice(2).toLowerCase();
}
function setProps(dom, props) {
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'children') continue;
    if (k === 'style' && typeof v === 'object') {
      Object.assign(dom.style, v);
    } else if (isEventProp(k) && typeof v === 'function') {
      dom.__listeners = dom.__listeners || {};
      const ev = toEventName(k);
      // remove old listener if there
      if (dom.__listeners[ev]) dom.removeEventListener(ev, dom.__listeners[ev]);
      dom.addEventListener(ev, v);
      dom.__listeners[ev] = v;
    } else {
      if (v === false || v == null) dom.removeAttribute(k);
      else dom.setAttribute(k, v);
    }
  }
}
function updateProps(dom, oldProps = {}, newProps = {}) {
  // remove old props not present
  for (const key of Object.keys(oldProps)) {
    if (key === 'children') continue;
    if (!(key in newProps)) {
      if (isEventProp(key)) {
        const ev = toEventName(key);
        if (dom.__listeners && dom.__listeners[ev]) {
          dom.removeEventListener(ev, dom.__listeners[ev]);
          delete dom.__listeners[ev];
        }
      } else {
        dom.removeAttribute(key);
      }
    }
  }
  // set new/changed props
  setProps(dom, newProps);
}

// create real DOM from vnode
function createDom(vnode, componentId = null) {
  if (vnode == null) return document.createTextNode('');
  if (typeof vnode === 'string' || typeof vnode === 'number') return document.createTextNode(String(vnode));

  // component (function)
  if (typeof vnode.type === 'function') {
    const id = vnode.type.name || ('_fc_' + Math.random().toString(36).slice(2,7));
    const rendered = runWithHooks(id, () => vnode.type({ ...vnode.props, children: vnode.children }));
    return createDom(rendered, id);
  }

  // Fragment
  if (vnode.type === Fragment) {
    const frag = document.createDocumentFragment();
    vnode.children.forEach(ch => frag.appendChild(createDom(ch, componentId)));
    return frag;
  }

  // native element
  const el = document.createElement(vnode.type);
  // set props
  setProps(el, vnode.props);
  // append children
  vnode.children.forEach(child => el.appendChild(createDom(child, componentId)));
  return el;
}

// Simple diffing algorithm
function changed(a, b) {
  return typeof a !== typeof b ||
         (typeof a === 'string' && a !== b) ||
         (a && b && a.type !== b.type);
}

function diff(parent, dom, oldVNode, newVNode, componentId = null) {
  // mount
  if (!oldVNode) {
    const newDom = createDom(newVNode, componentId);
    parent.appendChild(newDom);
    return newDom;
  }

  // remove
  if (!newVNode) {
    parent.removeChild(dom);
    return null;
  }

  // replace
  if (changed(oldVNode, newVNode)) {
    const newDom = createDom(newVNode, componentId);
    parent.replaceChild(newDom, dom);
    return newDom;
  }

  // same type and text handled
  if (typeof newVNode === 'string' || typeof newVNode === 'number') {
    if (dom.textContent !== String(newVNode)) dom.textContent = String(newVNode);
    return dom;
  }

  // function components are resolved in createDom/changed above,
  // at this point both oldVNode.type === newVNode.type are strings (native elements) or fragments
  if (typeof newVNode.type === 'string') {
    // update props
    updateProps(dom, oldVNode.props, newVNode.props);

    // reconcile children
    const max = Math.max(oldVNode.children.length, newVNode.children.length);
    for (let i = 0; i < max; i++) {
      diff(dom, dom.childNodes[i], oldVNode.children[i], newVNode.children[i], componentId);
    }
  } else if (newVNode.type === Fragment) {
    // handle fragments by diffing children on the fragment parent
    const max = Math.max(oldVNode.children.length, newVNode.children.length);
    for (let i = 0; i < max; i++) {
      diff(parent, dom.childNodes[i], oldVNode.children[i], newVNode.children[i], componentId);
    }
  }

  return dom;
}

// mount API which stores vnode per root for updates
const roots = new Map(); // container -> { vnode, dom }

export function mount(vnode, container) {
  container.innerHTML = '';
  const dom = createDom(vnode);
  container.appendChild(dom);
  roots.set(container, { vnode, dom });
}

export function render(vnode, container) {
  const entry = roots.get(container);
  if (!entry) return mount(vnode, container);
  const newDom = diff(container, entry.dom, entry.vnode, vnode);
  roots.set(container, { vnode, dom: newDom || entry.dom });
}

// expose a schedule rerender function used by hooks.setState
// simple batching: schedule a microtask to rerender all roots using saved root render functions
let scheduled = false;
export function scheduleRerender() {
  if (scheduled) return;
  scheduled = true;
  Promise.resolve().then(() => {
    scheduled = false;
    // naive: re-render each root by reusing the last vnode function if vnode.type is function
    for (const [container, entry] of roots.entries()) {
      // if the root vnode was a function component, we re-evaluate it
      const rootVNode = entry.vnode;
      let newVNode = rootVNode;
      if (typeof rootVNode.type === 'function') {
        // re-run component to get new VNode
        newVNode = runWithHooks(rootVNode.type.name || '_root', () => rootVNode.type({ ...rootVNode.props, children: rootVNode.children }));
      }
      render(newVNode, container);
    }
    // also call window-level helper if present
    if (typeof window !== 'undefined') {
      if (typeof window.__MYUI_AFTER_RENDER__ === 'function') window.__MYUI_AFTER_RENDER__();
    }
  });
}

// allow hooks to call scheduleRerender via global
if (typeof window !== 'undefined') {
  window.__MYUI_SCHEDULE_RERENDER__ = scheduleRerender;
}

export default { mount, render };
