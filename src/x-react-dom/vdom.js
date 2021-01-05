/* eslint-disable no-use-before-define */
import { isStringOrNumber, isClass } from "./utils";

function reconcileChildren(parentNode, children) {
  const newChildren = Array.isArray(children) ? children : [children];

  // Process children in order
  // ! This will cause problems: tasks with higher priority can't get processed first
  // -> solution: fiber
  newChildren.forEach((child) => {
    // child is a vnode
    render(child, parentNode);
  });
}

// ============= updaters =============
function updateNodeAttributes(node, attrs) {
  Object.keys(attrs)
    .filter((k) => k !== "children")
    .forEach((k) => {
      node[k] = attrs[k];
    });
}

function updateHostComponent(vnode) {
  const { type, props } = vnode;
  const node = document.createElement(type);

  updateNodeAttributes(node, props);
  reconcileChildren(node, props.children);
  return node;
}

function updateTextComponent(vnode) {
  return document.createTextNode(vnode);
}

function updateFunctionComponent(vnode) {
  const { type, props } = vnode;
  // vnode
  const child = type(props);
  return createNode(child);
}

function updateClassComponent(vnode) {
  const { type, props } = vnode;
  // init class
  const instance = new type(props);
  const child = instance.render();
  return createNode(child);
}

function updateFragmentComponent(vnode) {
  const { props } = vnode;
  const node = document.createDocumentFragment();
  reconcileChildren(node, props.children);
  return node;
}

function createNode(vnode) {
  const { type } = vnode;
  if (typeof type === "string") {
    return updateHostComponent(vnode);
  }

  if (isStringOrNumber(vnode)) {
    return updateTextComponent(vnode);
  }

  if (typeof type === "function") {
    return isClass(type)
      ? updateClassComponent(vnode)
      : updateFunctionComponent(vnode);
  }

  return updateFragmentComponent(vnode);
}

/** create DOM node
 * @param  {} vnode virtual dom node
 * @param  {} container real dom noe
 */
function render(vnode, container) {
  // step 1: vnode -> node
  const node = createNode(vnode);

  // step 2: add node to container
  container.appendChild(node);
}

export default { render };
