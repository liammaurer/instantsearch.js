import { SearchParameters } from 'algoliasearch-helper';
import enhanceConfiguration from '../enhanceConfiguration';

const createWidget = (configuration = {}) => ({
  getConfiguration: () => configuration,
});

describe('enhanceConfiguration', () => {
  it('should return the same object if widget does not provide a configuration', () => {
    const configuration = new SearchParameters({ analytics: true, page: 2 });
    const widget = {};

    const output = enhanceConfiguration(configuration, widget);
    expect(output).toBe(configuration);
  });

  it('should return a new object if widget does provide a configuration', () => {
    const configuration = new SearchParameters({ analytics: true, page: 2 });
    const widget = createWidget(configuration);

    const output = enhanceConfiguration(configuration, widget);
    expect(output).not.toBe(configuration);
  });

  it('should add widget configuration to an empty state', () => {
    const configuration = new SearchParameters({ analytics: true, page: 2 });
    const widget = createWidget(configuration);

    const output = enhanceConfiguration(configuration, widget);
    expect(output).toEqual(expect.objectContaining(configuration));
  });

  it('should call `getConfiguration` from widget correctly', () => {
    const widget = { getConfiguration: jest.fn() };

    const configuration = new SearchParameters({});

    enhanceConfiguration(configuration, widget);

    expect(widget.getConfiguration).toHaveBeenCalled();
    expect(widget.getConfiguration).toHaveBeenCalledWith(configuration);
  });

  it('should replace boolean values', () => {
    const actualConfiguration = new SearchParameters({ analytics: false });
    const widget = createWidget({ analytics: true });

    const output = enhanceConfiguration(actualConfiguration, widget);
    expect(output.analytics).toBe(true);
  });

  it('should union facets', () => {
    {
      const actualConfiguration = new SearchParameters({ facets: ['foo'] });
      const widget = createWidget({ facets: ['foo', 'bar'] });

      const output = enhanceConfiguration(actualConfiguration, widget);
      expect(output.facets).toEqual(['foo', 'bar']);
    }

    {
      const actualConfiguration = new SearchParameters({ facets: ['foo'] });
      const widget = createWidget({ facets: ['bar'] });

      const output = enhanceConfiguration(actualConfiguration, widget);
      expect(output.facets).toEqual(['foo', 'bar']);
    }

    {
      const actualConfiguration = new SearchParameters({
        facets: ['foo', 'bar'],
      });
      const widget = createWidget({ facets: [] });

      const output = enhanceConfiguration(actualConfiguration, widget);
      expect(output.facets).toEqual(['foo', 'bar']);
    }
  });

  it('should replace unknown deep values', () => {
    const actualConfiguration = new SearchParameters({
      refinements: { lvl1: ['foo'], lvl2: false },
    });
    const widget = createWidget({ refinements: { lvl1: ['bar'], lvl2: true } });

    const output = enhanceConfiguration(actualConfiguration, widget);
    expect(output).toEqual(
      expect.objectContaining({
        refinements: { lvl1: ['bar'], lvl2: true },
      })
    );
  });

  it('does not duplicate hierarchicalFacets (object in array)', () => {
    const actualConfiguration = new SearchParameters({
      hierarchicalFacets: [{ attribute: 'duplicate' }],
    });
    const widget = createWidget({
      hierarchicalFacets: [{ attribute: 'duplicate' }],
    });
    const output = enhanceConfiguration(actualConfiguration, widget);

    expect(output).toEqual(
      expect.objectContaining({
        hierarchicalFacets: [{ attribute: 'duplicate' }],
      })
    );
  });
});
