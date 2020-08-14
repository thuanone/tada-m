
// ////////////////////////////////////////////////////////////////////////////
// Test utility functions
// ////////////////////////////////////////////////////////////////////////////
import { createRenderer } from 'react-test-renderer/shallow';
const TestUtils = { createRenderer };

// This function is meant to provide a simplified means to find information about React components
// within a shallow rendering. Wrap the shallow rendered component like this:
//
//   const renderer = TestUtils.createRenderer();
//   renderer.render(<ActivityLogModule />);
//   const comp = TestUtils.wrap(renderer.getRenderOutput());
//
// Now we can use several convenient functions to find information about the component.
//
//   comp.className()                            --> 'armada-cluster-activity'
//   comp.find('ModuleHeader').children(0).is()  --> 'Activity Log'
//   comp.find('Table').props('cacheName')        --> 'activity'
//   comp.find('ModuleBody').count()             --> 1
//
TestUtils.wrap = components => {
  let component = components;
  let count = 1;
  if (Array.isArray(components)) {
    if (components.length > 0) {
      count = components.length;
      if (components[0].unwrap) component = components[0].unwrap();
    } else {
      count = 0;
    }
  }
  const getType = comp => {
    if (comp && comp.type && comp.type.name) return comp.type.name;
    if (comp && comp.type) return comp.type;
    return comp;
  };
  const getClassName = comp => comp && comp.props && comp.props.className;
  const getChildren = comp => {
    if (!comp) return [];
    const children = Array.isArray(comp)
      ? comp
      : comp.props && comp.props.children;
    if (!children) return [];
    if (Array.isArray(children)) return children;
    return [children];
  };
  const find = (selector, comp) => {
    if (!comp) return [];
    const comps = [];
    let match = null;
    let type = null;
    let className = null;
    if (typeof selector === 'string') {
      const path = selector.split('->');
      if (path.length > 1) {
        let found = comp;
        path.forEach(p => {
          found = find(p.trim(), found);
        });
        return found;
      }
      const parts = selector.split('.');
      if (selector.trim().substr(0, 1) === '.') {
        className = parts[1].trim();
      } else if (parts.length > 1) {
        type = parts[0].trim();
        className = parts[1].trim();
      } else {
        type = selector.trim();
      }
      match = c => (!type || getType(c) === type) && (!className || getClassName(c) === className);
    } else if (typeof selector === 'function') {
      match = c => selector(TestUtils.wrap(c));
    }
    const matchChildren = p => {
      getChildren(p).forEach(c => {
        if (match(c)) comps.push(c);
        matchChildren(c);
      });
    };
    matchChildren(comp);
    return comps;
  };
  return {
    // Return all descendents in the tree that match the given selector. If idx is provided, will
    // return only the component at the given index. Selector can be of the form:
    //  - '<type>.<className>'
    //  - '<type>'
    //  - '.<className>'
    //  - function
    // If selector is a function, wrapped components will be passed to the function and it should
    // return a boolean indicating whether the component should be in the set.
    // Multiple selectors can be separated by an arrow (->) to indicate matching on descendents.
    // This selector will match all TableHeader components that are descendents of components
    // matching div.armada-table-header:
    //   'div.armada-table-header -> TableHeader'
    // The returned set of components is itself wrapped and any wrapper function will act on the
    // first item in the set. Use the get function to get an item at a specific index.
    find: (selector, idx) => {
      const c = find(selector, component).map(TestUtils.wrap);
      if (idx !== undefined) return c[idx];
      return TestUtils.wrap(c);
    },
    // Return all immediate children of this wrapped component. If idx is provided, will return
    // only the component at the given index. Similar to the find function, the returned set of
    // components is itself wrapped.
    children: idx => {
      const c = getChildren(component).map(TestUtils.wrap);
      if (idx !== undefined) return c[idx];
      return TestUtils.wrap(c);
    },
    // Return the component at the given index in the set.
    get: idx => components[idx],
    // Return the type of the component. This will be the component class name for components, the
    // element tag name for DOM elements, the text content for text elements, an Array if the
    // component is an array of components (such as when the Array.map function is used to display
    // many items), or a primitive such as false or undefined in the cases where a conditional is
    // used to determine a component should not be displayed.
    is: () => getType(component),
    // Return the className property of the component.
    className: () => getClassName(component),
    // Return all custom properties of the component as an object, or just the value of the given
    // property name.
    props: name => (name ? component.props && component.props[name] : component.props),
    // Return the number of components in the set.
    count: () => count,
    // Return the unwrapped (raw) component as created by the shallow renderer.
    unwrap: () => component,
    // Call forEach on the array of wrapped components
    forEach: cb => (Array.isArray(components) ? components.forEach(cb) : [components].forEach(cb)),
  };
};

export default TestUtils;
