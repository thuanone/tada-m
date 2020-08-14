const statics = window.armada.staticFileMap;

const get = (name) => statics[`img/${name}`] && statics[`img/${name}`].path;

export default { get };
