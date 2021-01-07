const w = window;

export function useState(init) {
  const oldHook = w.wipFiber.alternate?.hooks[w.wipFiber.hookIndex];

  const hook = oldHook
    ? {
        state: oldHook.state,
        queue: oldHook.queue,
      }
    : {
        state: init,
        queue: [],
      };

  // update hooks in bulk
  hook.queue.forEach((action) => {
    hook.state = action;
  });

  const setState = (action) => {
    hook.queue.push(action);
    w.wipRoot = {
      stateNode: w.currentRoot.stateNode,
      props: w.currentRoot.props,
      alternate: w.currentRoot,
    };
    w.nextUnitOfWork = w.wipRoot;
  };

  w.wipFiber.hooks.push(hook);
  w.wipFiber.hookIndex += 1;

  return [hook.state, setState];
}
