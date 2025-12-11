// src/hooks.js
// Lightweight hooks runner. Each functional component is identified by an id string.
const hookStore = new Map(); // componentId -> hooks array
let currentComponent = null;
let hookCursor = 0;

export function runWithHooks(componentId, fn) {
  currentComponent = componentId;
  hookCursor = 0;
  if (!hookStore.has(componentId)) hookStore.set(componentId, []);
  const result = fn();
  currentComponent = null;
  return result;
}

function getHooks() {
  if (!currentComponent) throw new Error('Hooks can only be used inside a function component');
  return hookStore.get(currentComponent);
}

// useState
export function useState(initial) {
  const hooks = getHooks();
  const idx = hookCursor++;
  if (hooks[idx] === undefined) hooks[idx] = typeof initial === 'function' ? initial() : initial;

  const setState = (next) => {
    const value = typeof next === 'function' ? next(hooks[idx]) : next;
    hooks[idx] = value;
    // trigger a re-render of the root — a global callback is exposed by renderer
    if (typeof window !== 'undefined' && window.__MYUI_SCHEDULE_RERENDER__) {
      window.__MYUI_SCHEDULE_RERENDER__();
    }
  };

  return [hooks[idx], setState];
}

// useEffect
export function useEffect(effect, deps) {
  const hooks = getHooks();
  const idx = hookCursor++;
  const prev = hooks[idx];
  const hasChanged = !prev || !deps || deps.some((d, i) => d !== prev.deps[i]);

  if (hasChanged) {
    if (prev && typeof prev.cleanup === 'function') prev.cleanup();
    const cleanup = effect();
    hooks[idx] = { deps: deps ? deps.slice() : undefined, cleanup };
  }
}

// Two-way data binding helper: returns [value, binder]
// binder is an object you can spread into an input's props: <input {...binder} />
export function useModel(initial) {
  const [value, setValue] = useState(initial);
  const binder = {
    value,
    // note prop name is 'onInput' to match createElement event handling (onInput -> input)
    onInput: (e) => setValue(e.target.value)
  };
  return [value, setValue, binder];
}
