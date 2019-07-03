import algoliasearchHelper from 'algoliasearch-helper';
import { createSearchClient } from '../../../test/mock/createSearchClient';
import { createWidget } from '../../../test/mock/createWidget';
import { createMutliSearchResponse } from '../../../test/mock/createAPIResponse';
import { runAllMicroTasks } from '../../../test/utils/runAllMicroTasks';
import InstantSearch from '../InstantSearch';
import version from '../version';
import { warning } from '../utils';

jest.useFakeTimers();

jest.mock('algoliasearch-helper', () => {
  const module = require.requireActual('algoliasearch-helper');
  const mock = jest.fn((...args) => {
    const helper = module(...args);

    const searchOnlyWithDerivedHelpers = helper.searchOnlyWithDerivedHelpers.bind(
      helper
    );

    helper.searchOnlyWithDerivedHelpers = jest.fn((...searchArgs) => {
      return searchOnlyWithDerivedHelpers(...searchArgs);
    });

    return helper;
  });

  Object.entries(module).forEach(([key, value]) => {
    mock[key] = value;
  });

  return mock;
});

beforeEach(() => {
  algoliasearchHelper.mockClear();
});

describe('Usage', () => {
  it('throws without indexName', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new InstantSearch({ indexName: undefined });
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`indexName\` option is required.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });

  it('throws without searchClient', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new InstantSearch({ indexName: 'indexName', searchClient: undefined });
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`searchClient\` option is required.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });

  it('throws if searchClient does not implement a search method', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new InstantSearch({ indexName: 'indexName', searchClient: {} });
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`searchClient\` must implement a \`search\` method.

See: https://www.algolia.com/doc/guides/building-search-ui/going-further/backend-search/in-depth/backend-instantsearch/js/"
`);
  });

  it('throws if insightsClient is not a function', () => {
    expect(() => {
      // eslint-disable-next-line no-new
      new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
        insightsClient: 'insights',
      });
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`insightsClient\` option should be a function.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });

  it('throws if addWidgets is called with a single widget', () => {
    expect(() => {
      const search = new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
      });
      search.addWidgets({});
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`addWidgets\` method expects an array of widgets. Please use \`addWidget\`.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });

  it('throws if a widget without render or init method is added', () => {
    const widgets = [{ render: undefined, init: undefined }];

    expect(() => {
      const search = new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
      });
      search.addWidgets(widgets);
    }).toThrowErrorMatchingInlineSnapshot(`
"The widget definition expects a \`render\` and/or an \`init\` method.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });

  it('does not throw with a widget having a init method', () => {
    const widgets = [{ init: () => {} }];

    expect(() => {
      const search = new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
      });
      search.addWidgets(widgets);
    }).not.toThrow();
  });

  it('does not throw with a widget having a render method', () => {
    const widgets = [{ render: () => {} }];

    expect(() => {
      const search = new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
      });
      search.addWidgets(widgets);
    }).not.toThrow();
  });

  it('throws if removeWidgets is called with a single widget', () => {
    expect(() => {
      const search = new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
      });
      search.removeWidgets({});
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`removeWidgets\` method expects an array of widgets. Please use \`removeWidget\`.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });

  it('throws if a widget without dispose method is removed', () => {
    const widgets = [{ init: () => {}, render: () => {}, dispose: undefined }];

    expect(() => {
      const search = new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
      });
      search.removeWidgets(widgets);
    }).toThrowErrorMatchingInlineSnapshot(`
"The widget definition expects a \`dispose\` method.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });

  it('throws if createURL is called before start', () => {
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    expect(() => search.createURL()).toThrowErrorMatchingInlineSnapshot(`
"The \`start\` method needs to be called before \`createURL\`.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });

  it('throws if refresh is called before start', () => {
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    expect(() => search.refresh()).toThrowErrorMatchingInlineSnapshot(`
"The \`start\` method needs to be called before \`refresh\`.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });
});

describe('InstantSearch', () => {
  it('calls addAlgoliaAgent', () => {
    const searchClient = createSearchClient({
      addAlgoliaAgent: jest.fn(),
    });

    // eslint-disable-next-line no-new
    new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    expect(searchClient.addAlgoliaAgent).toHaveBeenCalledTimes(1);
    expect(searchClient.addAlgoliaAgent).toHaveBeenCalledWith(
      `instantsearch.js (${version})`
    );
  });

  it('does not call algoliasearchHelper', () => {
    // eslint-disable-next-line no-new
    new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    expect(algoliasearchHelper).not.toHaveBeenCalled();
  });

  it('warns deprecated usage of `searchParameters`', () => {
    warning.cache = {};

    expect(() => {
      // eslint-disable-next-line no-new
      new InstantSearch({
        indexName: 'indexName',
        searchClient: createSearchClient(),
        searchParameters: {
          disjunctiveFacets: ['brand'],
          disjunctiveFacetsRefinements: {
            brand: ['Samsung'],
          },
        },
      });
    })
      .toWarnDev(`[InstantSearch.js]: The \`searchParameters\` option is deprecated and will not be supported in InstantSearch.js 4.x.

You can replace it with the \`configure\` widget:

\`\`\`
search.addWidgets([
  configure({
  "disjunctiveFacets": [
    "brand"
  ],
  "disjunctiveFacetsRefinements": {
    "brand": [
      "Samsung"
    ]
  }
})
]);
\`\`\`

See https://www.algolia.com/doc/api-reference/widgets/configure/js/`);
  });

  it('does store insightsClient on the instance', () => {
    const insightsClient = () => {};
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
      insightsClient,
    });

    expect(search.insightsClient).toBe(insightsClient);
  });
});

describe('addWidget(s)', () => {
  it('forwards the call to `addWidget` to the main index', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    expect(search.mainIndex.getWidgets()).toHaveLength(0);

    search.addWidget(createWidget());

    expect(search.mainIndex.getWidgets()).toHaveLength(1);
  });

  it('forwards the call to `addWidgets` to the main index', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    expect(search.mainIndex.getWidgets()).toHaveLength(0);

    search.addWidgets([createWidget()]);

    expect(search.mainIndex.getWidgets()).toHaveLength(1);
  });
});

describe('removeWidget(s)', () => {
  it('forwards the call to `removeWidget` to the main index', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    const widget = createWidget();

    search.addWidget(widget);

    expect(search.mainIndex.getWidgets()).toHaveLength(1);

    search.removeWidget(widget);

    expect(search.mainIndex.getWidgets()).toHaveLength(0);
  });

  it('forwards the call to `removeWidgets` to the main index', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    const widget = createWidget();

    search.addWidgets([widget]);

    expect(search.mainIndex.getWidgets()).toHaveLength(1);

    search.removeWidgets([widget]);

    expect(search.mainIndex.getWidgets()).toHaveLength(0);
  });
});

describe('start', () => {
  it('creates two Helper one for the instance + one for the index', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    expect(algoliasearchHelper).toHaveBeenCalledTimes(0);

    search.start();

    expect(algoliasearchHelper).toHaveBeenCalledTimes(2);
    expect(algoliasearchHelper).toHaveBeenCalledWith(searchClient);
  });

  it('replaces the regular `search` with `searchOnlyWithDerivedHelpers`', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    search.start();

    expect(
      search.mainHelper.searchOnlyWithDerivedHelpers
    ).toHaveBeenCalledTimes(1);
  });

  it('calls the provided `searchFunction` with a single request', () => {
    const searchFunction = jest.fn(helper => helper.setQuery('test').search());
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchFunction,
      searchClient,
    });

    expect(searchFunction).toHaveBeenCalledTimes(0);
    expect(searchClient.search).toHaveBeenCalledTimes(0);

    search.start();

    expect(searchFunction).toHaveBeenCalledTimes(1);
    expect(searchClient.search).toHaveBeenCalledTimes(1);
    expect(search.mainIndex.getHelper().state.query).toBe('test');
  });

  it('calls the provided `searchFunction` with multiple requests', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
      searchFunction(helper) {
        helper.addDisjunctiveFacetRefinement('brand', 'Apple');
        helper.search();
      },
      searchParameters: {
        disjunctiveFacetsRefinements: { brand: ['Apple'] },
        disjunctiveFacets: ['brand'],
      },
    });

    expect(() => {
      search.start();
    }).not.toThrow();
  });

  it('forwards the `searchParameters` to the main index', () => {
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
      searchParameters: {
        hitsPerPage: 5,
        disjunctiveFacetsRefinements: { brand: ['Apple'] },
        disjunctiveFacets: ['brand'],
      },
    });

    search.start();

    expect(search.mainIndex.getHelper().state).toEqual(
      algoliasearchHelper.SearchParameters.make({
        index: 'index_name',
        hitsPerPage: 5,
        disjunctiveFacetsRefinements: { brand: ['Apple'] },
        disjunctiveFacets: ['brand'],
      })
    );
  });

  it('calls `init` on the added widgets', () => {
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    const widget = createWidget();

    search.addWidget(widget);

    search.start();

    expect(widget.getConfiguration).toHaveBeenCalledTimes(1);
    expect(widget.init).toHaveBeenCalledTimes(1);
  });

  it('triggers a search without errors', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    expect(searchClient.search).toHaveBeenCalledTimes(0);

    search.start();

    expect(searchClient.search).toHaveBeenCalledTimes(1);
  });

  it('triggers a search with errors', done => {
    const searchClient = createSearchClient({
      search: jest.fn(() => Promise.reject(new Error('SERVER_ERROR'))),
    });

    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    expect(searchClient.search).toHaveBeenCalledTimes(0);

    search.start();

    search.on('error', event => {
      expect(searchClient.search).toHaveBeenCalledTimes(1);
      expect(event.error).toEqual(new Error('SERVER_ERROR'));
      done();
    });
  });

  it('does start without widgets', () => {
    const searchClient = createSearchClient();
    const instance = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    expect(() => instance.start()).not.toThrow();
  });

  it('does not to start twice', () => {
    const searchClient = createSearchClient();
    const instance = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    expect(() => instance.start()).not.toThrow();
    expect(() => {
      instance.start();
    }).toThrowErrorMatchingInlineSnapshot(`
"The \`start\` method has already been called once.

See documentation: https://www.algolia.com/doc/api-reference/widgets/instantsearch/js/"
`);
  });
});

describe('dispose', () => {
  it('removes the widgets from the main index', () => {
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    search.addWidgets([createWidget(), createWidget()]);

    search.start();

    expect(search.mainIndex.getWidgets()).toHaveLength(2);

    search.dispose();

    expect(search.mainIndex.getWidgets()).toHaveLength(0);
  });

  it('calls `dispose` on the main index', () => {
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    const mainIndexDispose = jest.spyOn(search.mainIndex, 'dispose');

    search.start();

    expect(mainIndexDispose).toHaveBeenCalledTimes(0);

    search.dispose();

    expect(mainIndexDispose).toHaveBeenCalledTimes(1);
  });

  it('stops the instance', () => {
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    expect(search.started).toBe(false);

    search.start();

    expect(search.started).toBe(true);

    search.dispose();

    expect(search.started).toBe(false);
  });

  it('removes the listeners on the main Helper', () => {
    const onEventName = jest.fn();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    search.start();

    const { mainHelper } = search;

    mainHelper.on('eventName', onEventName);

    mainHelper.emit('eventName');

    expect(onEventName).toHaveBeenCalledTimes(1);

    search.dispose();

    mainHelper.emit('eventName');

    expect(onEventName).toHaveBeenCalledTimes(1);
  });

  it('removes the listeners on the instance', async () => {
    const onRender = jest.fn();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    search.on('render', onRender);

    search.start();

    await runAllMicroTasks();

    expect(onRender).toHaveBeenCalledTimes(1);

    search.dispose();

    onRender.mockClear();

    search.on('render', onRender);

    search.start();

    await runAllMicroTasks();

    expect(onRender).toHaveBeenCalledTimes(1);
  });

  it('removes the Helpers references', () => {
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    search.start();

    expect(search.mainHelper).not.toBe(null);
    expect(search.helper).not.toBe(null);

    search.dispose();

    expect(search.mainHelper).toBe(null);
    expect(search.helper).toBe(null);

    search.start();

    expect(search.mainHelper).not.toBe(null);
    expect(search.helper).not.toBe(null);
  });
});

describe('scheduleSearch', () => {
  it('defers the call to the `search` method', async () => {
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    search.addWidget(createWidget());

    search.start();

    const mainHelperSearch = jest.spyOn(search.mainHelper, 'search');

    search.scheduleSearch();

    expect(mainHelperSearch).toHaveBeenCalledTimes(0);

    await runAllMicroTasks();

    expect(mainHelperSearch).toHaveBeenCalledTimes(1);
  });

  it('deduplicates the calls to the `search` method', async () => {
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    search.addWidget(createWidget());

    search.start();

    const mainHelperSearch = jest.spyOn(search.mainHelper, 'search');

    search.scheduleSearch();
    search.scheduleSearch();
    search.scheduleSearch();
    search.scheduleSearch();

    expect(mainHelperSearch).toHaveBeenCalledTimes(0);

    await runAllMicroTasks();

    expect(mainHelperSearch).toHaveBeenCalledTimes(1);
  });
});

describe('scheduleRender', () => {
  it('defers the call to the `render` method', async () => {
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    const widget = createWidget();

    search.addWidget(widget);

    search.start();

    expect(widget.render).toHaveBeenCalledTimes(0);

    await runAllMicroTasks();

    expect(widget.render).toHaveBeenCalledTimes(1);
  });

  it('deduplicates the calls to the `render` method', async () => {
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    const widget = createWidget();

    search.addWidget(widget);

    search.start();

    expect(widget.render).toHaveBeenCalledTimes(0);

    search.scheduleRender();
    search.scheduleRender();
    search.scheduleRender();
    search.scheduleRender();

    await runAllMicroTasks();

    expect(widget.render).toHaveBeenCalledTimes(1);
  });

  it('emits a `render` event once the render is complete', done => {
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
    });

    const widget = createWidget();

    search.addWidget(widget);

    search.start();

    expect(widget.render).toHaveBeenCalledTimes(0);

    search.on('render', () => {
      expect(widget.render).toHaveBeenCalledTimes(1);
      done();
    });
  });
});

describe('scheduleStalledRender', () => {
  const createControlledSearchClient = () => {
    const searches = [];
    const searchClient = {
      search: jest.fn(() => {
        let resolver;
        const promise = new Promise(resolve => {
          resolver = () => resolve(createMutliSearchResponse());
        });

        searches.push({
          promise,
          resolver,
        });

        return promise;
      }),
    };

    return {
      searchClient,
      searches,
    };
  };

  it('calls the `render` method on the main index', async () => {
    const { searches, searchClient } = createControlledSearchClient();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    const widget = createWidget();

    search.addWidget(widget);

    search.start();

    // Resolve the `search`
    searches[0].resolver();

    // Wait for the `search`
    await searches[0].promise;

    // Wait for the `render`
    await runAllMicroTasks();

    expect(widget.render).toHaveBeenCalledTimes(1);

    // Trigger a new search
    search.mainHelper.search();

    // Reaches the delay
    jest.runOnlyPendingTimers();

    // Wait for the `render`
    await runAllMicroTasks();

    expect(widget.render).toHaveBeenCalledTimes(2);
  });

  it('deduplicates the calls to the `render` method', async () => {
    const { searches, searchClient } = createControlledSearchClient();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    const widget = createWidget();

    search.addWidget(widget);

    search.start();

    // Resolve the `search`
    searches[0].resolver();

    // Wait for the `search`
    await searches[0].promise;

    // Wait for the `render`
    await runAllMicroTasks();

    expect(widget.render).toHaveBeenCalledTimes(1);

    // Trigger multiple searches
    search.mainHelper.search();
    search.mainHelper.search();
    search.mainHelper.search();
    search.mainHelper.search();

    // Reaches the delay
    jest.runOnlyPendingTimers();

    // Wait for the `render`
    await runAllMicroTasks();

    expect(widget.render).toHaveBeenCalledTimes(2);
  });

  it('triggers a `render` once the search expires the delay', async () => {
    const { searches, searchClient } = createControlledSearchClient();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    const widget = createWidget();

    search.addWidget(widget);

    expect(widget.render).toHaveBeenCalledTimes(0);

    search.start();

    expect(widget.render).toHaveBeenCalledTimes(0);

    // Resolve the `search`
    searches[0].resolver();

    // Wait for the `search`
    await searches[0].promise;

    // Wait for the `render`
    await runAllMicroTasks();

    expect(widget.render).toHaveBeenCalledTimes(1);
    expect(widget.render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        searchMetadata: {
          isSearchStalled: false,
        },
      })
    );

    // Trigger a new search
    search.mainHelper.search();

    expect(widget.render).toHaveBeenCalledTimes(1);

    // The delay is reached
    jest.runOnlyPendingTimers();

    // Wait for the `render`
    await runAllMicroTasks();

    // Widgets render because of the stalled search
    expect(widget.render).toHaveBeenCalledTimes(2);
    expect(widget.render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        searchMetadata: {
          isSearchStalled: true,
        },
      })
    );

    // Resolve the `search`
    searches[1].resolver();

    // Wait for the `search`
    await searches[1].promise;

    // Wait for the `render`
    await runAllMicroTasks();

    // Widgets render because of the results
    expect(widget.render).toHaveBeenCalledTimes(3);
    expect(widget.render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        searchMetadata: {
          isSearchStalled: false,
        },
      })
    );
  });

  // https://github.com/algolia/instantsearch.js/pull/2623
  it('does not trigger a re-`render` without results', () => {
    const { searchClient } = createControlledSearchClient();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    search.start();

    search.addWidget({
      render: () => {},
    });

    jest.runOnlyPendingTimers();

    return runAllMicroTasks();
  });
});

describe('createURL', () => {
  const createRouter = () => ({
    read: jest.fn(() => ({})),
    write: jest.fn(),
    onUpdate: jest.fn(),
    createURL: jest.fn(() => '#'),
  });

  it('returns the URL for the main index state', () => {
    const router = createRouter();
    router.createURL.mockImplementation(() => 'http://algolia.com');

    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
      routing: {
        router,
      },
    });

    search.addWidget(
      createWidget({
        getWidgetState() {
          return {
            query: 'Apple',
          };
        },
      })
    );

    search.start();

    expect(search.createURL()).toBe('http://algolia.com');
    expect(router.createURL).toHaveBeenCalledWith({
      query: 'Apple',
    });
  });

  it('returns the URL with the given `SearchParameters` applied', () => {
    const router = createRouter();
    router.createURL.mockImplementation(() => 'http://algolia.com');

    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient: createSearchClient(),
      routing: {
        router,
      },
    });

    search.addWidget(
      createWidget({
        getWidgetState(_, { searchParameters }) {
          return {
            query: 'Apple',
            page: searchParameters.page,
          };
        },
      })
    );

    search.start();

    expect(search.createURL({ page: 5 })).toBe('http://algolia.com');
    expect(router.createURL).toHaveBeenCalledWith({
      query: 'Apple',
      page: 5,
    });
  });
});

describe('refresh', () => {
  it('calls `clearCache` on the main Helper', () => {
    const clearCache = jest.fn();
    const searchClient = createSearchClient({
      clearCache,
    });

    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    search.start();

    expect(clearCache).toHaveBeenCalledTimes(0);

    search.refresh();

    expect(clearCache).toHaveBeenCalledTimes(1);
  });

  it('triggers a `search` with the cache emptied', () => {
    const searchClient = createSearchClient();
    const search = new InstantSearch({
      indexName: 'index_name',
      searchClient,
    });

    search.start();

    // it is called once with start
    expect(searchClient.search).toHaveBeenCalledTimes(1);

    search.refresh();

    expect(searchClient.search).toHaveBeenCalledTimes(2);
  });
});
