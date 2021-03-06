var assert = require('assert');
var fs = require('fs');
var PO = require('..');

describe('Parse', function () {
    it('Parses the big po file', function () {
        var po = PO.parse(fs.readFileSync(__dirname + '/fixtures/big.po', 'utf8'));
        assert.notEqual(po, null);
        assert.equal(po.items.length, 70);

        var item = po.items[0];
        assert.equal(item.msgid, 'Title');
        assert.equal(item.msgstr, 'Titre');
    });

    it('Handles multi-line strings', function () {
        var po = PO.parse(fs.readFileSync(__dirname + '/fixtures/multi-line.po', 'utf8'));
        assert.notEqual(po, null);
        assert.equal(po.items.length, 1);

        var item = po.items[0];
        assert.equal(item.msgid, 'The following placeholder tokens can be used in both paths and titles. When used in a path or title, they will be replaced with the appropriate values.');
        assert.equal(item.msgstr, 'Les ébauches de jetons suivantes peuvent être utilisées à la fois dans les chemins et dans les titres. Lorsqu\'elles sont utilisées dans un chemin ou un titre, elles seront remplacées par les valeurs appropriées.');
    });

    it('Handles multi-line headers', function () {
        var po = PO.parse(fs.readFileSync(__dirname + '/fixtures/multi-line.po', 'utf8'));
        assert.notEqual(po, null);
        assert.equal(po.items.length, 1);

        assert.equal(po.headers['Plural-Forms'], 'nplurals=3; plural=n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2;');
    });

    it('Handle empty comments', function (done) {
        PO.load(__dirname + '/fixtures/comment.po', function (err, po) {
            assert.equal(err, null);

            var item = po.items[1];
            assert.equal(item.msgid, 'Empty comment');
            assert.equal(item.msgstr, 'Empty');
            assert.deepEqual(item.comments, ['']);
            assert.deepEqual(item.extractedComments, ['']);
            assert.deepEqual(item.references, ['']);
            done();
        });
    });

    it('Handles translator comments', function () {
        var po = PO.parse(fs.readFileSync(__dirname + '/fixtures/comment.po', 'utf8'));
        assert.notEqual(po, null);
        assert.equal(po.items.length, 2);

        var item = po.items[0];
        assert.equal(item.msgid, 'Title, as plain text');
        assert.equal(item.msgstr, 'Attribut title, en tant que texte brut');
        assert.deepEqual(item.comments, ['Translator comment']);
    });

    it('Handles extracted comments', function () {
        var po = PO.parse(fs.readFileSync(__dirname + '/fixtures/comment.po', 'utf8'));
        assert.notEqual(po, null);
        assert.equal(po.items.length, 2);

        assert.equal(po.extractedComments.length, 1);
        assert.equal(po.extractedComments[0], 'extracted from test');

        var item = po.items[0];
        assert.equal(item.msgid, 'Title, as plain text');
        assert.equal(item.msgstr, 'Attribut title, en tant que texte brut');
        assert.deepEqual(item.extractedComments, ['Extracted comment']);
    });

    describe('Handles string references', function () {
        var po = PO.parse(fs.readFileSync(__dirname + '/fixtures/reference.po', 'utf8'));
        assert.notEqual(po, null);
        assert.equal(po.items.length, 3);

        it('in simple cases', function () {
            var item = po.items[0];
            assert.equal(item.msgid, 'Title, as plain text');
            assert.equal(item.msgstr, 'Attribut title, en tant que texte brut');
            assert.deepEqual(item.comments, ['Comment']);
            assert.deepEqual(item.references, ['.tmp/crm/controllers/map.js']);
        });

        it('with two different references', function () {
            var item = po.items[1];
            assert.equal(item.msgid, 'X');
            assert.equal(item.msgstr, 'Y');
            assert.deepEqual(item.references, ['a', 'b']);
        });

        it('and does not process reference items', function () {
            var item = po.items[2];
            assert.equal(item.msgid, 'Z');
            assert.equal(item.msgstr, 'ZZ');
            assert.deepEqual(item.references, ['standard input:12 standard input:17']);
        });
    });

    it('Parses flags', function () {
        var po = PO.parse(fs.readFileSync(__dirname + '/fixtures/fuzzy.po', 'utf8'));
        assert.notEqual(po, null);
        assert.equal(po.items.length, 1);

        var item = po.items[0];
        assert.equal(item.msgid, 'Sources');
        assert.equal(item.msgstr, 'Source');
        assert.notEqual(item.flags, null);
        assert.equal(item.flags.fuzzy, true);
    });

    it('Parses item context', function () {
        var po = PO.parse(fs.readFileSync(__dirname + '/fixtures/big.po', 'utf8'));

        var ambiguousItems = po.items.filter(function (item) {
            return item.msgid === 'Empty folder';
        });

        assert.equal(ambiguousItems[0].msgctxt, 'folder display');
        assert.equal(ambiguousItems[1].msgctxt, 'folder action');
    });

    it('Parses item multiline context', function () {
        var po = PO.parse(fs.readFileSync(__dirname + '/fixtures/big.po', 'utf8'));

        var item = po.items.find(function (item) {
            return item.msgid === 'Created Date' && item.msgctxt === 'folder meta';
        });

        assert.notEqual(item, undefined);
        assert.equal(item.msgctxt, 'folder meta');
    });

    it('Handles obsolete items', function () {
        var po = PO.parse(fs.readFileSync(__dirname + '/fixtures/commented.po', 'utf8'));

        assert.equal(po.items.length, 4);
        var item = po.items[0];
        assert.equal(item.obsolete, false);
        assert.equal(item.msgid, '{{dataLoader.data.length}} results');
        assert.equal(item.msgstr, '{{dataLoader.data.length}} resultaten');

        item = po.items[1];
        assert.equal(item.obsolete, true);
        assert.equal(item.msgid, 'Add order');
        assert.equal(item.msgstr, 'Order toevoegen');

        item = po.items[2];
        assert.equal(item.obsolete, true);
        assert.equal(item.msgid, 'Commented item');
        assert.equal(item.msgstr, 'not sure');

        item = po.items[3];
        assert.equal(item.obsolete, true);
        assert.equal(item.msgid, 'Second commented item');
        assert.equal(item.msgstr, 'also not sure');
    });

    describe('C-Strings', function () {
        var po = PO.parse(fs.readFileSync(__dirname + '/fixtures/c-strings.po', 'utf8'));
        it('should parse the c-strings.po file', function () {
            assert.notEqual(po, null);
        });

        it('should extract strings containing " and \\ characters', function () {
            var items = po.items.filter(function (item) {
                return (/^The name field must not contain/).test(item.msgid);
            });
            assert.equal(items[0].msgid, 'The name field must not contain characters like " or \\');
        });

        it('should handle \\n characters', function () {
            var item = po.items[1];
            assert.equal(item.msgid, '%1$s\n%2$s %3$s\n%4$s\n%5$s');
        });

        it('should handle \\t characters', function () {
            var item = po.items[2];
            assert.equal(item.msgid, 'define(\'some/test/module\', function () {\n' +
                '\t\'use strict\';\n' +
                '\treturn {};\n' +
                '});\n');
        });
    });
});
