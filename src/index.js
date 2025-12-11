// index.js - MyUI Framework Core

let rootDom = null;
let currentComponent = null;
let state = [];
let stateIndex = 0;

export function h(type, props, ...children) {
  return { type, props: props || {}, children };
}

export function useState(initial) {
  const index = stateIndex;
  state[index] = state[index] !== undefined ? state[index] : initial;

  const setState = (value) => {
    state[index] = typeof value === "function" ? value(state[index]) : value;
    render();
  };

  stateIndex++;
  return [state[index], setState];
}

export function useModel(initial) {
  const [value, setValue] = useState(initial);
  return [
    value,
    setValue,
    {
      value,
      oninput: (e) => setValue(e.target.value)
    }
  ];
}

function createDom(vnode) {
  if (typeof vnode === "string" || typeof vnode === "number") {
    return document.createTextNode(vnode);
  }

  if (typeof vnode.type === "function") {
    return createDom(vnode.type(vnode.props || {}));
  }

  const el = document.createElement(vnode.type);

  for (const prop in vnode.props) {
    if (prop.startsWith("on")) {
      const evt = prop.substring(2).toLowerCase();
      el.addEventListener(evt, vnode.props[prop]);
    } else {
      el[prop] = vnode.props[prop];
    }
  }

  vnode.children.forEach(child => el.appendChild(createDom(child)));
  return el;
}

function render() {
  stateIndex = 0;
  const vnodeTree = currentComponent();
  rootDom.innerHTML = "";
  rootDom.appendChild(createDom(vnodeTree));
}

export function mount(component, container) {
  currentComponent = component;
  rootDom = container;
  render();
}
