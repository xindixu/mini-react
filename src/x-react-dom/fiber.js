/* eslint-disable no-bitwise */
import { isStringOrNumber, isClass } from "./utils";
import { Deletion, Placement, Update } from "./const";

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

const w = window;
// `render` will initiate first task
w.nextUnitOfWork = null;
w.wipRoot = null; // fiber | null
// root that got interrupted
w.currentRoot = null; // fiber | null
// functional components related
w.wipFiber = null;
w.hookIndex = null;

w.deletions = [];

function reconcileChildren(returnFiber, children) {
  // Filter out text node and process in `updateNode`
  if (isStringOrNumber(children)) {
    return;
  }

  const newChildren = Array.isArray(children) ? children : [children];

  // alternate - old fiber,
  let oldFiber = returnFiber.alternate?.child;
  let previousNewFiber = null;
  // Process children in order
  newChildren.forEach((child, index) => {
    const same = child && oldFiber && child.type === oldFiber.type;
    // child.key === oldFiber.key;

    let newFiber = null;
    if (same) {
      // Update
      newFiber = {
        key: child.key || null,
        type: child.type,
        props: { ...child.props },
        child: null, // fiber | null
        sibling: null, // fiber | null
        return: returnFiber, // fiber | null
        stateNode: oldFiber.stateNode, // DOM node for host tags,
        alternate: oldFiber, // last old fiber
        flags: Update,
      };
    }
    if (!same && child) {
      // Create
      newFiber = {
        key: child.key || null,
        type: child.type,
        props: { ...child.props },
        child: null, // fiber | null
        sibling: null, // fiber | null
        return: returnFiber, // fiber | null
        stateNode: null, // DOM node for host tags,
        alternate: null, // last old fiber
        flags: Placement,
      };
    }

    if (!same && oldFiber) {
      // Delete
      oldFiber.flags = Deletion;
      w.deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    // Create fiber structure
    if (index === 0) {
      returnFiber.child = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }

    previousNewFiber = newFiber;
  });
}

// ============= Updaters =============
function updateNode(node, prevAttrs, nextAttrs) {
  Object.keys(prevAttrs).forEach((k) => {
    if (k === "children") {
      // textNode
      if (isStringOrNumber(prevAttrs[k])) {
        node.textContent = "";
      }
    } else if (k.slice(0, 2) === "on") {
      const eventName = k.slice(2).toLocaleLowerCase();
      node.removeEventListener(eventName, prevAttrs[k]);
    } else if (!(k in nextAttrs)) {
      node.removeAttribute(k);
    }
  });

  Object.keys(nextAttrs)
    // .filter((k) => k !== "children")
    .forEach((k) => {
      if (k === "children") {
        // textNode
        if (isStringOrNumber(nextAttrs[k])) {
          node.textContent = `${nextAttrs[k]}`;
        }
      } else if (k.slice(0, 2) === "on") {
        const eventName = k.slice(2).toLocaleLowerCase();
        node.addEventListener(eventName, nextAttrs[k]);
      } else {
        node[k] = nextAttrs[k];
      }
    });
}

function createNode(workInProgress) {
  const { type, props } = workInProgress;
  const node = document.createElement(type);
  updateNode(node, {}, props);
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
  w.wipFiber = workInProgress;
  w.wipFiber.hooks = [];
  w.wipFiber.hookIndex = 0;

  const { type, props } = workInProgress;
  const child = type(props);
  reconcileChildren(workInProgress, child);
}

function updateClassComponent(workInProgress) {
  const { type, props } = workInProgress;
  const instance = new type(props);
  const child = instance.render();
  reconcileChildren(workInProgress, child);
}

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
function commitDeletions(workInProgress, parentNode) {
  if (workInProgress.stateNode) {
    parentNode.removeChild(workInProgress.stateNode);
  } else {
    // Find child's DOM node
    commitDeletions(workInProgress.child, parentNode);
  }
}

function commitWorker(workInProgress) {
  if (!workInProgress) {
    return;
  }
  // step 1: commit itself

  // Find parent's DOM node:
  // ! Not all fiber has a DOM node, i.e. Provider, Consumer, Fragment, etc.
  let parentNodeFiber = workInProgress.return;
  while (!parentNodeFiber.stateNode) {
    parentNodeFiber = parentNodeFiber.return;
  }
  const parentNode = parentNodeFiber.stateNode;

  if (workInProgress.flags & Placement && workInProgress.stateNode) {
    // Insert
    parentNode.appendChild(workInProgress.stateNode);
  } else if (workInProgress.flags & Update && workInProgress.stateNode) {
    // Update
    updateNode(
      workInProgress.stateNode,
      workInProgress.alternate.props,
      workInProgress.props
    );
  } else if (workInProgress.flags & Deletion && workInProgress.stateNode) {
    // Delete
    commitDeletions(workInProgress, parentNode);
  }

  // step 2: commit child
  commitWorker(workInProgress.child);
  // step 3: commit siblings
  commitWorker(workInProgress.sibling);
}

function commitRoot() {
  w.deletions.forEach(commitWorker);
  commitWorker(w.wipRoot.child);
  w.currentRoot = w.wipRoot;
  w.wipRoot = null;
}

function workLoop(IdleDeadline) {
  // idle time left
  while (w.nextUnitOfWork && IdleDeadline.timeRemaining() > 1) {
    // TODO: check priority, check time slot
    w.nextUnitOfWork = performUnitOfWork(w.nextUnitOfWork);
  }

  // Spy on the idle time and run task whenever there's idle time
  if (!w.nextUnitOfWork && w.wipRoot) {
    // commit task: update vdom to dom
    commitRoot();
  }
  window.requestIdleCallback(workLoop);
}

window.requestIdleCallback(workLoop);

/** create DOM node
 * @param  {} vnode virtual dom node
 * @param  {} container real dom noe
 */
function render(vnode, container) {
  w.wipRoot = {
    type: "div",
    props: { children: { ...vnode } },
    stateNode: container,
  };

  w.nextUnitOfWork = w.wipRoot;
  w.deletions = [];
}

export default { render };
