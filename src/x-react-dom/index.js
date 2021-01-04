/* eslint-disable no-use-before-define */
// util
function isStringOrNumber(sth) {
  return typeof sth === "string" || typeof sth === "number";
}

function isClass(type) {
  // React.Component subclasses have this flag
  return Boolean(type.prototype) && Boolean(type.prototype.isReactComponent);
}

function reconcileChildren(parentNode, children) {
  const newChildren = Array.isArray(children) ? children : [children];

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