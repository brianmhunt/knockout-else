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

function getBindingConditional(node, bindingContext) {
    var conditional;
    var bindings = ko.bindingProvider.instance.getBindings(node, bindingContext);
    if (!bindings) {
        return
    } else if (conditional = bindings['if']) {
        return ko.pureComputed(function () {
            return !ko.unwrap(conditional)
        });
    } else if (conditional = bindings['ifnot']) {
        return ko.pureComputed(function () {
            return ko.unwrap(conditional)
        });
    } else if (conditional = bindings['foreach']) {
        return ko.pureComputed(function () {
            var conResult = ko.unwrap(conditional);
            return !conResult || conResult.length === 0;
        });
    }
    return
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

function getPrecedingConditional(element, bindingContext) {
    var prevSib = element;
    do {
        prevSib = prevSib.previousSibling;
    } while (prevSib && [1, 8].indexOf(prevSib.nodeType) === -1);
    if (!prevSib) {
        throw new Error("Unmatched conditionals!");
        return;
    }
    if (prevSib.nodeType == 1) {
        return getBindingConditional(prevSib, bindingContext);
    } else if (prevSib.nodeType == 8) {
        // The first previous adjacent node is a comment node.
        return getBindingConditional(prevVirtualNode(prevSib), bindingContext);
    }
    throw new Error("No.")
}

var elseBinding =  = {
    init: function (element, va, ab, vm, bindingContext) {
        var elseConditional,
            openComment,
            closeComment,
            firstChild,
            nextChild,
            lastChild;
        
        elseConditional = getPrecedingConditional(element, bindingContext); 
        if (!elseConditional) {
            throw new Error("An else binding had no sibling conditional.");
        }

        firstChild = ko.virtualElements.firstChild(element);
        nextChild = firstChild;
        do {
            lastChild = nextChild;
            nextChild = ko.virtualElements.nextSibling(nextChild);
        } while (nextChild);

        openComment = document.createComment('ko if: __elseCondition__');
        closeComment = document.createComment('/ko')
        ko.virtualElements.prepend(element, openComment);
        ko.virtualElements.insertAfter(element, closeComment, lastChild);

        ko.applyBindingsToDescendants(bindingContext.extend({
            __elseCondition__: elseConditional
        }), element);
        return {
            controlsDescendantBindings: true
        };
    }
}

function init(spec) {
    spec ||= {};
    spec.binding ||= 'else';
    ko.bindingHandlers[spec.binding] = elseBinding;
    ko.virtualElements.allowedBindings[spec.binding] = true;    
}// Exports
  return {init: init};
}));
