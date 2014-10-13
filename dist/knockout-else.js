/*!
  Knockout Else
  By: Brian M Hunt (C) 2014
  License: MIT
*/
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['knockout'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('knockout'));
  } else {
    root.KnockoutElse = factory(root.ko);
  }
}(this, function (ko) {
var KE = {};
function startsCommentBinding(node) {
    return (node.textContent || node.innerText)
        .match(/^(<!--)?\s*ko\s+[\s\S]+/);
} 

function endsCommentBinding(node) {
    return (node.textContent || node.innerText)
        .match(/^(<!--)?\s*\/ko/);
}

var conditionalHandlerMap = {
    'if': function () {return function() {return !ko.unwrap(this()) }},
    'ifnot': function () {return function() {return ko.unwrap(this()) }},
    'foreach': function () {return function() {
        var conResult = ko.unwrap(this());
        return !conResult || conResult.length == 0; 
    }},
    'template': function () {
        return function () {
            var params = this();
            if (params.hasOwnProperty('if')) {
                return !ko.unwrap(params['if'])
            }
            if (!params.hasOwnProperty('foreach')) {
                return true
            }
            var foreach = ko.unwrap(params['foreach']);
            return !Boolean(foreach && foreach.length);
        }
    }
};

var conditionalHandlerKeys;

function getBindingConditional(node, bindings) {
    var handler;

    console.log("C", condtionalHandlerKeys);
    for (i = condtionalHandlerKeys.length - 1; i >= 0; --i) {
        handler = conditionalHandlerMap[i];
        console.log("Checking handler", handler);

        if (bindings.hasOwnProperty(handler)) {
            return fn && ko.computed({
                read: fn,
                pure: true,
                disposeWhenNodeIsRemoved: node
            }); 
        }
    }
}

function prevVirtualNode(node) {
    var depth = 0;
    do {
        if (node.nodeType === 8) {
            if (startsCommentBinding(node)) {
                if (--depth == 0) {
                    return node;
                }
            } else if (endsCommentBinding(node)) {
                depth++;
            }
        }
    } while (node = node.previousSibling);
    return;
}

function getPrecedingConditional(node, bindingContext) {
    var bindings;

    do {
        node = node.previousSibling;
    } while (node && node.nodeType !== 1 && node.nodeType !== 8);
    if (!node) {
        return;
    }
    if (node.nodeType == 8) {
        node = prevVirtualNode(node);
    }
    bindings = ko.bindingProvider.instance.getBindingAccessors(node, bindingContext);

    return bindings && getBindingConditional(node, bindings);
}

function getLastChild(node) {
    var nextChild = ko.virtualElements.firstChild(node),
        lastChild;

    do {
        lastChild = nextChild;
    } while (nextChild = ko.virtualElements.nextSibling(nextChild));

    return lastChild;
}

function wrapElementChildrenWithConditional(element) {
    // add a strut so this element has at least one item.
    if (!ko.virtualElements.firstChild(element)) {
        ko.virtualElements.setDomNodeChildren(element,
            [document.createComment('strut')]
        );
    }

    ko.virtualElements.insertAfter(element,
        document.createComment('/ko'),
        getLastChild(element)
    );

    ko.virtualElements.prepend(element,
        document.createComment('ko if: __elseCondition__')
    );
}


var elseBinding = {
    init: function (element, va, ab, vm, bindingContext) {
        var elseConditional,
            openComment,
            closeComment;

        if (va() !== void 0) {
            throw new Error("Knockout-else binding must be bare (i.e. no value given).")
        }
        
        elseConditional = getPrecedingConditional(element, bindingContext); 
        if (!elseConditional) {
            throw new Error("Knockout-else binding was not preceded by a conditional.");
        }
        wrapElementChildrenWithConditional(element, elseConditional);
        ko.applyBindingsToDescendants(bindingContext.extend({
            __elseCondition__: elseConditional
        }), element);
        return {controlsDescendantBindings: true};
    }
};

var elseIfBinding = {
    init: function (element, va, ab, vm, bindingContext) {
        var elseConditional,
            openComment,
            closeComment;

        if (va() !== void 0) {
            throw new Error("Knockout-else binding must be bare (i.e. no value given).")
        }
        
        elseConditional = getPrecedingConditional(element, bindingContext); 
        if (!elseConditional) {
            throw new Error("Knockout-else binding was not preceded by a conditional.");
        }
        wrapElementChildrenWithConditional(element, elseConditional);
        ko.applyBindingsToDescendants(bindingContext.extend({
            __elseCondition__: elseConditional
        }), element);
        return {controlsDescendantBindings: true};
    }
};

function init(spec) {
    spec |= {};
    var elseBinding = spec.hasOwnProperty('elseBinding') ? spec.elseBinding : 'else';
    var elseIfBinding = spec.hasOwnProperty('elseIfBinding') ? spec.elseIfBinding : 'elseif';
    if (elseBinding) {
        ko.bindingHandlers[elseBinding] = elseBinding;
        ko.virtualElements.allowedBindings[elseBinding] = true;
    }
    if (elseIfBinding) {
        ko.bindingHandlers[elseIfBinding] = elseIfBinding;
        ko.virtualElements.allowedBindings[elseIfBinding] = true;
    }
    conditionalHandlerKeys = Object.keys(conditionalHandlerMap);
}// Exports
  return {init: init};
}));
