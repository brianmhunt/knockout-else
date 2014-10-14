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

function textFor(node) {
  // return the text, removing all whitespace.
  return (node.textContent || node.innerText).replace(/\s+/g, '');
}

function testNestedTriad(bits, vm, div) {
  // convert 3 bits into e.g. "A+B-C+"

  var bitString = '';
  for (var i = 0; i <= 2; i++) {
    // 65 = 'A'
    bitString += String.fromCharCode(i + 65) + (bits & Math.pow(2, i) ? '+' : '-');
  }

  it("expecting (" + bits.toString(2) + ") " + bitString, function () {
    vm.a(bits & 1);
    vm.b(bits & 2);
    vm.c(bits & 4);
    assert.equal(textFor(div), bitString);
  })
}


//    ELSE
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

  it("adds a strut to the contents of an empty else element", function () {
    var div = stringToDiv("<u data-bind='if: x'></u><u data-bind='else'></u>");
    var etext = '<u data-bind="if: x"></u><u data-bind="else">' +
      '<!--ko if: __elseCondition__--><!--strut--><!--/ko--></u>';
    ko.applyBindings({x: 0}, div);
    assert.equal(div.innerHTML, etext);
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

  it("throws an error with double `else` bindings", function () {
    var div = stringToDiv("<!--ko if: 1--><!--/ko--><!--ko else--><!--/ko--><!--ko else--><!--/ko-->");
    assert.throws(function () {ko.applyBindings({}, div)}, "Knockout-else binding was not preceded");
  })

  it("throws an error when given a value", function () {
    var div = stringToDiv("<!--ko if: 1--><!--/ko--><!--ko else: false--><!--/ko-->");
    assert.throws(function () {ko.applyBindings({}, div)}, "Knockout-else binding must be bare");
  })

  describe("nested with adjacent if/else", function () {
    var vm = {
      a: ko.observable(),
      b: ko.observable(),
      c: ko.observable(),
    };
    var div = stringToDiv(
      "<u data-bind='if: a'>A+" +
      "  <u data-bind='if: b'>B+</u>" +
      "  <u data-bind='else'>B-</u>" +
      "  <u data-bind='if: c'>C+</u>" +
      "  <u data-bind='else'>C-</u>" +
      "</u>" +
      "<!-- ko else -->A-" +
      "  <u data-bind='if: b'>B+</u>" +
      "  <u data-bind='else'>B-</u>" +
      "  <u data-bind='if: c'>C+</u>" +
      "  <u data-bind='else'>C-</u>" +
      "<!-- /ko -->"
    );
    before(function () {
      ko.applyBindings(vm, div);
    });

    for (var i = 0; i < 8; i++) {
      testNestedTriad(i, vm, div);
    }
  })

  describe("three nested if/else", function () {
    var vm = {
      a: ko.observable(),
      b: ko.observable(),
      c: ko.observable(),
    };
    var div = stringToDiv(
      "<u data-bind='if: a'>A+" +
      "  <u data-bind='if: b'>B+" +
      "   <u data-bind='if:c'>C+</u>" +
      "   <u data-bind='else'>C-</u>" +
      "  </u>" +
      "  <u data-bind='else'>B-" +
      "    <u data-bind='if: c'>C+</u>" +
      "    <u data-bind='else'>C-</u>" +
      "  </u>" +
      "</u>" +
      "<u data-bind='else'>A-" +
      "  <u data-bind='if: b'>B+" +
      "   <u data-bind='if:c'>C+</u>" +
      "   <u data-bind='else'>C-</u>" +
      "  </u>" +
      "  <u data-bind='else'>B-" +
      "    <u data-bind='if: c'>C+</u>" +
      "    <u data-bind='else'>C-</u>" +
      "  </u>" +
      "</u>"
    );
    before(function () {
      ko.applyBindings(vm, div);
    });

    for (var i = 0; i < 8; i++) {
      testNestedTriad(i, vm, div);
    }
  })
});


//    getBindingConditional
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

//      ELSEIF
describe("The elseif binding", function () {
  describe("when bound", function () {
    var vm = {
      x: ko.observable(),
      y: ko.observable(),
    }
    var div = stringToDiv(
      "<!-- ko if: x -->X<!-- /ko -->" +
      "<!-- ko elseif: y -->Y<!-- /ko -->"
    );
    before(function () {
      ko.applyBindings(vm, div);
    })
    it("adds __elseChainIsSatisfied__ computed to node context", function () {
      // node 3 is <!--ko if: __elseCondition__-->
      vm.x(undefined);
      vm.y(undefined);
      assert.ok(ko.isComputed(ko.contextFor(div.childNodes[3]).__elseChainIsSatisfied__))
    })

    it("does not show else if original condition is true", function () {
      vm.x(true);
      vm.y(true);
      assert.equal(textFor(div), 'X');
    })

    it("shows the else if original is false", function () {
      vm.x(false);
      vm.y(true);
      assert.equal(textFor(div), 'Y');
    })
  })

  describe("the else-if chain of x, y ,z", function () {
    var vm = {
      x: ko.observable(),
      y: ko.observable(),
      z: ko.observable()
    };
    var div = stringToDiv(
      "<!-- ko if: x -->X<!-- /ko -->" +
      "<!-- ko elseif: y -->Y<!-- /ko -->" +
      "<!-- ko elseif: z -->Z<!-- /ko -->" 
    )
    before(function () {
      ko.applyBindings(vm, div);  
    })
    function set_vm(x, y, z) {vm.x(x); vm.y(y); vm.z(z); }

    it("shows only X if X is true", function () {
      set_vm(true, false, false);
      assert.equal(textFor(div), 'X')
    })

    it("shows only X if everything is true", function () {
      set_vm(true, true, true);
      assert.equal(textFor(div), 'X');
    })

    it("shows Y if !X, Y", function () {
      set_vm(false, true, false);
      assert.equal(textFor(div), 'Y')
    })

    it("shows Y if !X, Y, Z", function () {
      set_vm(false, true, true);
      assert.equal(textFor(div), 'Y')
    })

    it("shows Z if !X, !Y, Z", function () {
      window.evm = vm;
      set_vm(false, false, true);
      assert.equal(textFor(div), 'Z')
    })

    it("shows nothing if !X, !Y, !Z", function () {
      set_vm(false, false, false);
      assert.equal(textFor(div), '')
    })
  })

  describe("the x,y,z chain followed by an else binding", function () {
    var vm = {
      x: ko.observable(),
      y: ko.observable(),
      z: ko.observable()
    };
    var div = stringToDiv(
      "<!-- ko if: x -->X<!-- /ko -->" +
      "<!-- ko elseif: y -->Y<!-- /ko -->" +
      "<!-- ko elseif: z -->Z<!-- /ko -->" +
      "<!-- ko else -->G<!-- /ko -->"
    )
    before(function (){
      ko.applyBindings(vm, div);  
    });
    
    function set_vm(x, y, z) {vm.x(x); vm.y(y); vm.z(z); }

    it("does not show the else if x is true", function () {
      set_vm(true, false, false);
      assert.equal(textFor(div), "X");
    })

    it("only shows Y when it is true", function () {
      set_vm(false, true, false);
      assert.equal(textFor(div), "Y");
    })

    it("only shows Z when it is true", function () {
      set_vm(false, false, true);
      assert.equal(textFor(div), "Z");
    })

    it("shows G when everything is false", function () {
      set_vm(false, false, false);
      assert.equal(textFor(div), "G");
    })
  })
})


describe("the expression rewriters", function () {
  it("converts the default (<!--\s*else\s*-->) to <!--/ko--><!-- ko else -->", function () {
    var div = stringToDiv("<!-- else -->");
    var carr = elsePreprocessor(div.firstChild);
    assert.equal(div.innerHTML, "<!--/ko--><!--ko else-->")
    assert.equal(div.childNodes.length, 2)
  })
  
  it("converts <!-- elseif: expr -->", function () {
    var div = stringToDiv("<!-- elseif: abc -->");
    var carr = elseIfPreprocessor(div.firstChild);
    assert.equal(div.innerHTML, "<!--/ko--><!--ko elseif: abc -->")
    assert.equal(div.childNodes.length, 2)
  })

  describe("test case with if, elseif, else", function () {
    var div = stringToDiv("<!-- ko if: x -->X" +
      "<!-- elseif: y -->Y<!-- else -->Z<!--/ko-->");
    var vm = {
      x: ko.observable(),
      y: ko.observable()
    };

    before(function () {
      ko.applyBindings(vm, div);
      console.log("a", div.innerHTML)
      vm.x(true)
      console.log("b", div.innerHTML)
    });
    

    it("rewrites the html", function () {
      assert.equal(div.innerHTML, '')
    })

    it("shows Z by default", function() {
      vm.x(false); vm.y(false);
      assert.equal(textFor(div), 'Z');
    })

  })

})

mocha.run();