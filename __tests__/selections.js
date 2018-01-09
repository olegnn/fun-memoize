import { createObjectSelector } from '../src';

describe('It tests reselect-like behaviour', () => {
  test('primitive selectors', () => {
    const shopItemsSelector = state => state.shop.items;
    const taxPercentSelector = state => state.shop.taxPercent;

    const subtotalSelector = createObjectSelector(
      shopItemsSelector,
      items => items.reduce((acc, item) => acc + item.value, 0),
    );

    const taxSelector = createObjectSelector(
      subtotalSelector,
      taxPercentSelector,
      (subtotal, taxPercent) => subtotal * (taxPercent / 100),
    );

    const totalSelector = createObjectSelector(
      subtotalSelector,
      taxSelector,
      (subtotal, tax) => ({ total: subtotal + tax }),
    );

    const exampleState = {
      shop: {
        taxPercent: 8,
        items: [
          { name: 'apple', value: 1.20 },
          { name: 'orange', value: 0.95 },
        ],
      },
    };

    expect(subtotalSelector(exampleState)).toBe(2.15);
    expect(taxSelector(exampleState)).toBe(0.172);
    expect(totalSelector(exampleState)).toEqual({ total: 2.322 });
  });
});
