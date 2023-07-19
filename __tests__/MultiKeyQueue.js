const { MultiKeyQueue, Single } = require("../build/collections");
const { SingleKeyQueue } = require("../build/collections/SingleKeyQueue");
const { NO_VALUE } = require("../build/value");

describe("MultiKeyQueue", () => {
  it("basic workflow front", () => {
    let inner = new SingleKeyQueue([1, 2, 3]);
    let queue = new MultiKeyQueue([inner]);
    expect(queue.len()).toBe(3);
    expect(queue.isEmpty()).toBe(false);

    const keys = [1, 2, 3];
    expect([...queue.keysFront()]).toEqual(keys);
    expect([...queue.valuesFront()]).toEqual([inner]);
    for (const key of keys) {
      const peeked = queue.peekKeyFront();
      const item = queue.takeKeyFront();
      expect(item).toBe(key);
      expect(item).toBe(peeked);
    }

    inner = new MultiKeyQueue([new Single(1), new Single(2), new Single(3)]);
    queue = new MultiKeyQueue([inner]);

    expect(queue.peekFront()).toEqual(inner);
    expect(queue.peekItemFront()).toEqual(queue.list.head);
    expect(queue.takeFront()).toEqual(inner);
    expect(queue.takeFront()).toEqual(NO_VALUE);

    for (const key of keys) {
      const item = inner.takeKeyFront();
      expect(item).toEqual(key);
    }

    queue = new MultiKeyQueue([new SingleKeyQueue([1, 2, 3])]);
    expect(() =>
      queue.addKeyFront(1, queue.get(queue.peekKeyFront()))
    ).toThrowErrorMatchingSnapshot();
  });

  it("basic workflow back", () => {
    let inner = new SingleKeyQueue([1, 2, 3]);
    let queue = new MultiKeyQueue([inner]);
    expect(queue.len()).toBe(3);
    expect(queue.isEmpty()).toBe(false);

    const keys = [3, 2, 1];
    expect([...queue.keysBack()]).toEqual(keys);
    expect([...queue.valuesBack()]).toEqual([inner]);
    for (const key of keys) {
      const peeked = queue.peekKeyBack();
      const item = queue.takeKeyBack();
      expect(item).toBe(key);
      expect(item).toBe(peeked);
    }

    inner = new MultiKeyQueue([new Single(1), new Single(2), new Single(3)]);
    queue = new MultiKeyQueue([inner]);

    expect(queue.peekBack()).toEqual(inner);
    expect(queue.peekItemBack()).toEqual(queue.list.tail);
    expect(queue.takeBack()).toEqual(inner);
    expect(queue.takeBack()).toEqual(NO_VALUE);

    for (const key of keys) {
      const item = inner.takeKeyBack();
      expect(item).toEqual(key);
    }

    queue = new MultiKeyQueue([new SingleKeyQueue([1, 2, 3])]);
    expect(() =>
      queue.addKeyBack(1, queue.get(queue.peekKeyBack()))
    ).toThrowErrorMatchingSnapshot();
  });

  it("assoc/dissoc", () => {
    const queue = new MultiKeyQueue([new SingleKeyQueue([1, 2, 3])]);
    queue.dissocKeys(queue.peekFront());
    expect(queue.isEmpty()).toBe(true);
    queue.assocKeys(queue.peekFront());
    expect(queue.len()).toBe(3);
  });

  it("front keys workflow", () => {
    let queue = new MultiKeyQueue();
    queue.pushFront(new Single(1));
    queue.pushFront(new Single(2));
    queue.pushFront(new Single(3));

    const keys = [3, 2, 1];
    expect([...queue.keysBack()]).toEqual([...queue.keysFront()].reverse());
    expect([...queue.valuesBack()]).toEqual([...queue.valuesFront()].reverse());
    for (const key of keys) {
      const peeked = queue.peekKeyFront();
      const item = queue.takeKeyFront();
      expect(item).toBe(key);
      expect(item).toBe(peeked);
    }
  });

  it("back keys workflow", () => {
    let queue = new MultiKeyQueue();
    queue.pushBack(new Single(1));
    queue.pushBack(new Single(2));
    queue.pushBack(new Single(3));

    const keys = [3, 2, 1];
    expect([...queue.valuesFront()]).toEqual([...queue.valuesBack()].reverse());
    for (const key of keys) {
      const peeked = queue.peekKeyBack();
      const item = queue.takeKeyBack();
      expect(item).toBe(key);
      expect(item).toBe(peeked);
    }
  });
});
