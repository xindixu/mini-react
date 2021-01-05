// util
export function isStringOrNumber(sth) {
  return typeof sth === "string" || typeof sth === "number";
}

export function isClass(type) {
  // React.Component subclasses have this flag
  return Boolean(type.prototype) && Boolean(type.prototype.isReactComponent);
}
