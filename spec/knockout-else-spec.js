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
  
  it("binds <element template{if}><comment else>", function () {
    var vm = {x: 1};
    var div = stringToDiv("<u data-bind='template: {if: x}'></u><!-- ko else --><!-- /ko -->");
    ko.applyBindings(vm, div);
    assert.strictEqual(ko.dataFor(div.lastChild), vm);
  })
  
  it("binds <element template{if,foreach}><comment else>", function () {
    var vm = {x: 1};
    var div = stringToDiv("<u data-bind='template: {if: x, foreach: []}'></u><!-- ko else --><!-- /ko -->");
    ko.applyBindings(vm, div);
    assert.strictEqual(ko.dataFor(div.lastChild), vm);
  })

  it("does not modify the contents of an empty else element", function () {
    var div = stringToDiv("<u data-bind='if: x'></u><u data-bind='else'></u>");
    ko.applyBindings({x: 1}, div);
    assert.equal(div.innerHTML, "<u data-bind=\"if: x\"></u><u data-bind=\"else\"></u>")
  })

  it("wraps the contents of an else element", function () {
    var div = stringToDiv("<u data-bind='if: x'>V</u><u data-bind='else'>T</u>");
    ko.applyBindings({x: true}, div);
    assert.equal(div.innerHTML, '<u data-bind="if: x">V</u><u data-bind="else"><!--ko if: __elseCondition__--><!--/ko--></u>')
  })

  it("shows the contents of an active else element", function () {
    var div = stringToDiv("<u data-bind='if: x'></u><u data-bind='else'>T</u>");
    ko.applyBindings({x: false}, div);
    assert.equal(div.innerHTML, '<u data-bind="if: x"></u><u data-bind="else"><!--ko if: __elseCondition__-->T<!--/ko--></u>')
  })

  it("updates on an expression calculation change", function () {
    var div = stringToDiv("<u data-bind='if: x() && true'>V</u><u data-bind='else'>T</u>");
    var vm = {x: ko.observable(false)};
    ko.applyBindings(vm, div);
    assert.include(div.innerHTML, "T");
    assert.notInclude(div.innerHTML, "V");
    vm.x(true);
    assert.include(div.innerHTML, "V");
    assert.notInclude(div.innerHTML, "T");
  })
  
  it("throws an error with no preceding conditional", function () {
    var div = stringToDiv("<div></div><!-- ko else --><!-- /ko -->");
    assert.throws(function () {ko.applyBindings({}, div)}, "Knockout-else binding was not preceded");
  })
  
  it("throws an error with no preceding element", function () {
    var div = stringToDiv("<!-- ko else --><!-- /ko -->");
    assert.throws(function () {ko.applyBindings({}, div)}, "Knockout-else binding was not preceded");
  })
  
  it("throws an error for preceding template: string", function () {
    var div = stringToDiv("<u data-bind='template: \"\"'></u><!-- ko else --><!-- /ko -->");
    assert.throws(function () {ko.applyBindings({}, div)}, "Knockout-else binding was not preceded");
  })
  
  it("throws an error for preceding template{} without an if|foreach", function () {
    var div = stringToDiv("<u data-bind='template: {name: ''}'></u><!-- ko else --><!-- /ko -->");
    assert.throws(function () {ko.applyBindings({}, div)}, "Knockout-else binding was not preceded");
  })
});

describe("getBindingConditional", function() {
  function testBinding(condition, expect) {
    var elseIsShown = getBindingConditional(null, condition);
    assert.equal(elseIsShown(), expect);
    return elseIsShown;
  }

  it("returns a computed observable", function () {
    var bc = getBindingConditional(null, {"if": function () {}});
    assert.ok(ko.isComputed(bc))
  })

  it("returns inverse of if: x", function () {
    testBinding({"if": function () {return true}}, false)
  })

  it("updates on if obs update", function () {
    var obs = ko.observable(), tb;
    tb = testBinding({"if": function () { return obs }}, true);
    obs(true);
    assert.equal(tb(), false);
  })

  it("returns same as ifnot: x", function () {
    testBinding({"ifnot": function () { return true }}, true);
  })

  it("returns false when foreach is empty", function () {
    testBinding({"foreach": function () { return [] }}, true);
  })

  it("returns false when foreach is undefined", function () {
    testBinding({"foreach": function () { return undefined }}, true);
  })

  it("returns false when foreach is non-empty", function () {
    testBinding({"foreach": function () { return [1, 2, 3] }}, false);
  })

  it("unwraps a foreach observable", function () {
    var obs = ko.observable()
    testBinding({"foreach": function () { return obs }}, true);
  })

  it("updates on foreach obs update", function () {
    var obs = ko.observable(), tb;
    tb = testBinding({"foreach": function () { return obs }}, true);
    obs([1,2,3]);
    assert.equal(tb(), false);
  })

  describe("when paired with the template binding", function () {
    function testTemplateBinding(params, expect) {
      return testBinding({"template": function () { return params }}, expect);
    }
    
    it("is true when `if` is false and there is no foreach", function () {
      testTemplateBinding({"if": false}, true)
    })

    it("is false when `if` is true and there is no foreach", function () {
      testTemplateBinding({"if": true}, false)
    })

    it("is false when `if` is true and foreach is []", function () {
      testTemplateBinding({"if": true, foreach: []}, false)
    })

    it("is false when `if` is true and foreach is [1,2,3]", function () {
      testTemplateBinding({"if": true, foreach: [1,2,3]}, false)
    })

    it("is false when foreach is [1,2,3]", function () {
      testTemplateBinding({foreach: [1,2,3]}, false)
    })

    it("is true when foreach is [1,2,3]", function () {
      testTemplateBinding({foreach: []}, true)
    })

    it("is true when foreach obs is update to [1,2,3]", function () {
      var obs = ko.observable()
      var ttb = testTemplateBinding({foreach: obs}, true)
      obs([1,2,3])
      assert.equal(ttb(), false)
    })





  })

})


mocha.run();