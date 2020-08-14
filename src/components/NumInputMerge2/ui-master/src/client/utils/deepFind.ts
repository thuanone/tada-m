/*
  utility used to find a value in an object from a path
  example-

  const o = {
    a: {
      b: {
        c: 'some value',
      },
    },
  };
  const value = deepFind(o, 'a.b.c'); // some value

  if the path is incorrect it should just return undefined and not throw any sort of TypeError

  const value = deepFind(o, 'a.x.y.z'); // undefined
*/

function deepFind(obj, path) {
  return path.split('.').reduce((acc, cur) => acc && acc[cur], obj);
}

export default deepFind;
