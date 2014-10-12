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
    } while (prevSib && prevSib.nodeType !== 1 && prevSib.nodeType !== 8);
    if (!prevSib) {
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

function getLastChild(node) {
    var nextChild = ko.virtualElements.firstChild(node),
        lastChild;

    while (nextChild) {
        lastChild = nextChild;
        nextChild = ko.virtualElements.nextSibling(nextChild);
    }

    return lastChild;
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

        if (element.firstChild) {
            ko.virtualElements.prepend(element,
                document.createComment('ko if: __elseCondition__')
            );
            ko.virtualElements.insertAfter(element,
                document.createComment('/ko'),
                getLastChild(element)
            );
        }

        ko.applyBindingsToDescendants(bindingContext.extend({
            __elseCondition__: elseConditional
        }), element);
        return {
            controlsDescendantBindings: true
        };
    }
}

function init(spec) {
    spec |= {};
    var binding = spec.binding || 'else';
    ko.bindingHandlers[binding] = elseBinding;
    ko.virtualElements.allowedBindings[binding] = true;    
}