/*
 * This source code is under the Unlicense
 */
var l = LP();
var text1 = `
This is a text.
This is another text.
That is a text.
<start>
    Blocked.
    Blocked.
</start>
#ifdef
text
#ifdef
nested
nested
#endif
text
#ifdef
nested
#endif
text
#endif
out of block
`.trim();

var text2 = `
aaa
#ifdef
  aaaaa
#elseif
  aaaaa
#else
  aaaaa
#endif
aaa
`.trim();

describe("LP", function() {
    describe("test lp", function() {
        it("single match: regex", function() {
            var rules = [l.single(/This/, (n, l, a) => a + l.length)];
            expect(l.execute(rules, 0, text1)).toBe(36);
        });

        it("single match: number", function() {
            var rules = [l.single(1, (n, l, a) => a + l.length)];
            expect(l.execute(rules, 0, text1)).toBe(15);
        });

        it("single match: string", function() {
            var rules = [l.single("This is a text.", (n, l, a) => a + l.length)];
            expect(l.execute(rules, 0, text1)).toBe(15);
        });

        it("range", function() {
            var rules = [
                l.range("<start>", "</start>", (n, l, a) => a + l.length)
            ];
            expect(l.execute(rules, 0, text1)).toBe(39);
        });

        it("block", function() {
            var rules = [
                l.block("#ifdef", "#endif", (n, l, a) => a + l.length)
            ];
            expect(l.execute(rules, 0, text1)).toBe(66);
        });

        it("block 2", function() {
            var rules = [
                l.block("#ifdef", "#endif", (n, l, a) => a + l.length, (n, l, a) => a + l.length * 2, (n, l, a) => a + l.length / 2)
            ];
            expect(l.execute(rules, 0, text1)).toBe(75);
        });

        it("ifElse", function() {
            var rules = [
                l.ifElse("#ifdef", "#endif", "#else", "#elseif",
                    (n, l, a) => a + l.length,
                    (n, l, a) => a + l.length * 2,
                    (n, l, a) => a + l.length * 3,
                    (n, l, a) => a + l.length * 4,
                    (n, l, a) => a + l.length * 5)
            ];
            expect(l.execute(rules, 0, text2)).toBe(106);
        });

        it("skip", function() {
            var rules = [
                l.block("#ifdef", "#endif", (n, ln, a) => l.skip(a + ln.length * 2)),
                l.all((n, l, a) => a + l.length)
            ];
            expect(l.execute(rules, 0, text1)).toBe(234);
        });

        it("option: record separator", function() {
            var rules = [l.single(/^[a-z]+/, (n, l, a) => a + l.length)];
            expect(l.execute(rules, 0, "This is a text", { rs: / / })).toBe(7);
        });

        it("option: continue line", function() {
            var rules = [l.single(/another/, (n, l, a) => a + l.length)];
            expect(l.execute(rules, 0, text1, { continueLine: "." })).toBe(55);
        });
    });
});

