export function useState(init) {
  const state = init;
  const setState = (action) => {
    console.log(action);
  };
  return [state, setState];
}
