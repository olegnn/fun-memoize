const { LinkedList } = require("../build/collections/LinkedList");

describe("MultiKeyQueue", () => {
  it("basic workflow", () => {
    const list = new LinkedList([1, 2, 3]);

    expect([...list.valuesFront()]).toEqual([1, 2, 3]);
    expect([...list.valuesBack()]).toEqual([1, 2, 3].reverse());
  });

  it("back workflow", () => {
    const list = new LinkedList();
    const items = [1, 2, 3, 4];

    expect(list.peekBack()).toBe(null);
    for (let i = 0; i < items.length; ++i) {
      list.pushBack(items[i]);
      expect(list.len()).toBe(items[i]);
      expect(list.isEmpty()).toBe(false);
      expect(list.peekBack()).toBe(items[i]);
    }

    expect([...list.valuesBack()]).toEqual([...items].reverse());

    for (let i = items.length; i--; ) {
      expect(list.takeBack()).toBe(items[i]);
      if (i) expect(list.peekBack()).toBe(items[i - 1]);
    }

    const list1 = new LinkedList([1, 2, 3, 4]);
    const head = list1.head;
    list1.moveBack(head);

    expect([...list1.valuesFront()]).toEqual([2, 3, 4, 1]);
  });

  it("front workflow", () => {
    const list = new LinkedList();
    const items = [1, 2, 3, 4];

    expect(list.peekFront()).toBe(null);
    for (let i = 0; i < items.length; ++i) {
      list.pushFront(items[i]);
      expect(list.len()).toBe(items[i]);
      expect(list.isEmpty()).toBe(false);
      expect(list.peekFront()).toBe(items[i]);
    }

    expect([...list.valuesFront()]).toEqual([...items].reverse());

    for (let i = items.length; i--; ) {
      expect(list.takeFront()).toBe(items[i]);
      if (i) expect(list.peekFront()).toBe(items[i - 1]);
    }

    const list1 = new LinkedList([1, 2, 3, 4]);
    const back = list1.tail;
    list1.moveFront(back);

    expect([...list1.valuesFront()]).toEqual([4, 1, 2, 3]);
  });
});
