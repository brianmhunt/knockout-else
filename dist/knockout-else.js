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

function getBindingConditional(node, bindings) {
    var accessorFn, templateParams, fn;
    if (accessorFn = bindings['if']) {
        fn = function () {return !ko.unwrap(accessorFn()) };
    } else if (accessorFn = bindings['ifnot']) {
        fn = function () {return ko.unwrap(accessorFn()) };
    } else if (accessorFn = bindings['foreach']) {
        fn = function () {
            var conResult = ko.unwrap(accessorFn());
            return !conResult || conResult.length == 0; 
        }
    } else if (accessorFn = bindings['template']) {
        if (accessorFn().hasOwnProperty('if') || accessorFn().hasOwnProperty('foreach')) {
            fn = function () {
                console.log("AFN", accessorFn, "()", accessorFn())
                var params = accessorFn();
                var foreach;
                if (params.hasOwnProperty('if')) {
                    return !ko.unwrap(params['if'])
                }
                if (!params.hasOwnProperty('foreach')) {
                    return true
                }
                foreach = ko.unwrap(params['foreach']);
                return !Boolean(foreach && foreach.length);
            }
        }
    }
    return fn && ko.computed({
        read: fn,
        disposeWhenNodeIsRemoved: node
    }); 
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
    if (!element.firstChild) {
        return;
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
}

function init(spec) {
    spec |= {};
    var binding = spec.binding || 'else';
    ko.bindingHandlers[binding] = elseBinding;
    ko.virtualElements.allowedBindings[binding] = true;    
}// Exports
  return {init: init};
}));
