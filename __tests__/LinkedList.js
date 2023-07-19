const { LinkedList, ListNode } = require("../build/collections/LinkedList");

describe("MultiKeyQueue", () => {
  it("basic workflow", () => {
    const list = new LinkedList([1, 2, 3]);

    expect([...list.valuesFront()]).toEqual([1, 2, 3]);
    expect([...list.valuesBack()]).toEqual([3, 2, 1]);

    let tail = list.pushBack(4);
    expect(list.contains(tail)).toBe(true);
    expect(list.remove(tail)).toBe(true);
    expect(tail).toEqual(new ListNode(4, null));
    expect(list.contains(tail)).toBe(false);
    expect(list.remove(tail)).toBe(false);
    tail = list.tail;
    expect(list.takeBack()).toEqual(3);
    expect(tail).toEqual(new ListNode(3, null));
    expect(list.contains(tail)).toBe(false);
    const head = list.head;
    expect(list.takeFront()).toEqual(1);
    expect(head).toEqual(new ListNode(1, null));
    expect(list.contains(head)).toBe(false);
  });

  it("back workflow", () => {
    const list = new LinkedList();
    const items = [1, 2, 3, 4];

    expect(list.peekBack()).toBe(null);
    expect(list.peekItemBack()).toBe(null);
    for (let i = 0; i < items.length; ++i) {
      list.pushBack(items[i]);
      expect(list.len()).toBe(items[i]);
      expect(list.isEmpty()).toBe(false);
      expect(list.peekBack()).toBe(items[i]);
      expect(list.peekItemBack()).toBe(list.tail);
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

    const prevTail = list1.tail;
    list1.insertAfter(list1.tail, -10);
    expect(list1.tail.prev).toBe(prevTail);
    expect(list1.peekBack()).toBe(-10);
  });

  it("front workflow", () => {
    const list = new LinkedList();
    const items = [1, 2, 3, 4];

    expect(list.peekFront()).toBe(null);
    expect(list.peekItemFront()).toBe(null);
    for (let i = 0; i < items.length; ++i) {
      list.pushFront(items[i]);
      expect(list.len()).toBe(items[i]);
      expect(list.isEmpty()).toBe(false);
      expect(list.peekFront()).toBe(items[i]);
      expect(list.peekItemFront()).toBe(list.head);
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

    const prevHead = list1.head;
    list1.insertBefore(list1.head, -10);
    expect(list1.head.next).toBe(prevHead);
    expect(list1.peekFront()).toBe(-10);
  });
});
