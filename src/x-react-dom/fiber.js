import { isStringOrNumber, isClass } from "./utils";

// Initial render phase

/* 
  ! fiber attributes
    type
    key: unique value in the current level
    props
    child: first child node
    sibling: next sibling node
    return: parent node
    stateNode: DOM node for host tag, null for function comp, instance for class comp
    index: current position the current level
 */

let wipRoot = null; // fiber | null
// next task that need to update (fiber)
let nextUnitOfWork = null; // fiber | null

function reconcileChildren(workInProgress, children) {
  // Filter out text node and process in `updateNodeAttributes`
  if (isStringOrNumber(children)) {
    return;
  }

  const newChildren = Array.isArray(children) ? children : [children];

  console.log(newChildren);
  let previousNewFiber = null;
  // Process children in order
  newChildren.forEach((child, index) => {
    // Create fiber
    const newFiber = {
      type: child.type,
      props: { ...child.props },
      child: null, // fiber | null
      sibling: null, // fiber | null
      return: workInProgress, // fiber | null
      stateNode: null, // DOM node for host tags
    };

    if (index === 0) {
      workInProgress.child = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }

    previousNewFiber = newFiber;
  });
}

// ============= Updaters =============
function updateNodeAttributes(node, attrs) {
  Object.keys(attrs)
    // .filter((k) => k !== "children")
    .forEach((k) => {
      if (k === "children") {
        // textNode
        if (isStringOrNumber(attrs[k])) {
          node.textContent = `${attrs[k]}`;
        }
      } else {
        node[k] = attrs[k];
      }
    });
}

function createNode(workInProgress) {
  const { type, props } = workInProgress;
  const node = document.createElement(type);
  updateNodeAttributes(node, props);
  return node;
}

function updateHostComponent(workInProgress) {
  const { props } = workInProgress;

  if (!workInProgress.stateNode) {
    workInProgress.stateNode = createNode(workInProgress);
  }
  reconcileChildren(workInProgress, props.children);
}

function updateFunctionComponent(workInProgress) {
  const { type, props } = workInProgress;
  const child = type(props);
  reconcileChildren(workInProgress, child);
}

function updateClassComponent(workInProgress) {}

function updateFragmentComponent(workInProgress) {
  reconcileChildren(workInProgress, workInProgress.props.children);
}

// ============= Perform =============
function updateFiber(workInProgress) {
  const { type } = workInProgress;

  if (typeof type === "string") {
    return updateHostComponent(workInProgress);
  }

  if (typeof type === "function") {
    return isClass(type)
      ? updateClassComponent(workInProgress)
      : updateFunctionComponent(workInProgress);
  }

  return updateFragmentComponent(workInProgress);
}

function performUnitOfWork(workInProgress) {
  // step 1: update fiber
  updateFiber(workInProgress);

  // step 2: return next fiber to update
  // order: first child > sibling > return.sibling (depth-first)

  /*
      A
      ├── B
      │   ├── C
      │   │   └── D
      │   └── E
      └── F
      │   ├── G
      │   │   └── H
      │   └── I
      │       └── J
      └── K


      Order: A -> B -> C -> D -> E -> F -> G -> H -> I -> J
      @D: child -> null, sibling -> null, return -> C, C.sibling -> E
      @E: child -> null, sibling -> null, return -> B, B.sibling -> F
      @H: child -> null, sibling -> null, return -> G, G.sibling -> I
      @J: child -> null, sibling -> null, return -> I, I.sibling -> null, I.return -> F, F.sibling -> K
  */

  if (workInProgress.child) {
    return workInProgress.child;
  }

  let nextFiber = workInProgress;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.return;
  }
}

// ============= Commit =============
function commitWorker(workInProgress) {
  if (!workInProgress) {
    return;
  }
  // step 1: commit itself

  // Find parent's DOM node:
  // Not all fiber has a DOM node, i.e. Provider, Consumer, Fragment, etc.
  let parentNodeFiber = workInProgress.return;
  while (!parentNodeFiber.stateNode) {
    parentNodeFiber = parentNodeFiber.return;
  }
  const parentNode = parentNodeFiber.stateNode;

  if (workInProgress.stateNode) {
    parentNode.appendChild(workInProgress.stateNode);
  }

  // step 2: commit child
  commitWorker(workInProgress.child);
  // step 3: commit siblings
  commitWorker(workInProgress.sibling);
}

function commitRoot() {
  commitWorker(wipRoot.child);
  wipRoot = null;
}

function workLoop(IdleDeadline) {
  // idle time left
  while (nextUnitOfWork && IdleDeadline.timeRemaining() > 1) {
    // TODO: check priority, check time slot
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  // Spy on the idle time and run task whenever there's idle time
  window.requestIdleCallback(workLoop);
  if (!nextUnitOfWork && wipRoot) {
    // commit task: update vdom to dom
    commitRoot();
  }
}

window.requestIdleCallback(workLoop);

/** create DOM node
 * @param  {} vnode virtual dom node
 * @param  {} container real dom noe
 */
function render(vnode, container) {
  wipRoot = {
    type: "div",
    props: { children: { ...vnode } },
    stateNode: container,
  };

  nextUnitOfWork = wipRoot;
}

export default { render };
