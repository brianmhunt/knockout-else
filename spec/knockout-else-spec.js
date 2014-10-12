/*

  Knockout Else --- Tests

 */

init();
mocha.setup('bdd')
assert = chai.assert;

function stringToDiv(xml) {
  var frag = document.createElement('div');
  frag.innerHTML = xml;
  return frag;
}


describe("The `else` binding", function () {
  it("binds <element if><element else>", function () {
    var vm = {x: 1};
    var div = stringToDiv("<u data-bind='if: x'></u><u data-bind='else'></u>");
    ko.applyBindings(vm, div);
    assert.strictEqual(ko.dataFor(div.lastChild), vm);
  })
  it("binds <comment if><element else>", function () {
    var vm = {x: 1};
    var div = stringToDiv("<!-- ko if: x --><!-- /ko --><u data-bind='else'></u>");
    ko.applyBindings(vm, div);
    assert.strictEqual(ko.dataFor(div.lastChild), vm);
  })
  it("binds <comment if><comment else>", function () {
    var vm = {x: 1};
    var div = stringToDiv("<!-- ko if: x --><!-- /ko --><!-- ko else --><!-- /ko -->");
    ko.applyBindings(vm, div);
    assert.strictEqual(ko.dataFor(div.lastChild), vm);
  })
  it("binds <element if><comment else>", function () {
    var vm = {x: 1};
    var div = stringToDiv("<u data-bind='if: x'></u><!-- ko else --><!-- /ko -->");
    ko.applyBindings(vm, div);
    assert.strictEqual(ko.dataFor(div.lastChild), vm);
  })
  it("binds <element ifnot><comment else>", function () {
    var vm = {x: 1};
    var div = stringToDiv("<u data-bind='ifnot: x'></u><!-- ko else --><!-- /ko -->");
    ko.applyBindings(vm, div);
    assert.strictEqual(ko.dataFor(div.lastChild), vm);
  })
  it("binds <element foreach[]><comment else>", function () {
    var vm = {x: []};
    var div = stringToDiv("<u data-bind='foreach: x'></u><!-- ko else --><!-- /ko -->");
    ko.applyBindings(vm, div);
    assert.strictEqual(ko.dataFor(div.lastChild), vm);
  })
  it("binds <element foreach(undefined)><comment else>", function () {
    var vm = {x: ko.observable(undefined)};
    var div = stringToDiv("<u data-bind='foreach: x'></u><!-- ko else --><!-- /ko -->");
    ko.applyBindings(vm, div);
    assert.strictEqual(ko.dataFor(div.lastChild), vm);
  })
  it("throws an error with no preceding conditional", function () {
    var div = stringToDiv("<div></div><!-- ko else --><!-- /ko -->");
    assert.throws(function () {ko.applyBindings({}, div)}, "Knockout-else binding was not preceded");
  })
  it("throws an error with no preceding element", function () {
    var div = stringToDiv("<!-- ko else --><!-- /ko -->");
    assert.throws(function () {ko.applyBindings({}, div)}, "Knockout-else binding was not preceded");
  })
});


mocha.run();