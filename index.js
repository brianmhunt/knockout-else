var conditionalHandlerKeys,
    conditionalHandlerMap,
    elseBinding,
    elseIfBinding,
    elseBindingName,
    elseIfBindingName;


function startsCommentBinding(node) {
    return node.nodeValue.match(/^(<!--)?\s*ko\s+[\s\S]+/);
} 

function endsCommentBinding(node) {
    return node.nodeValue.match(/^(<!--)?\s*\/ko/);
}

// These functions return true when the respective `else` binding should be shown,
// notwithstanding when the if/else chain has already been satisfied (i.e. something above
// is already showing).
conditionalHandlerMap = {
    'if': function (bindingFn) {return function() {
        return !ko.unwrap(bindingFn()) }
    },
    'ifnot': function (bindingFn) {return function() {
        return ko.unwrap(bindingFn())
    }},
    'foreach': function (bindingFn) {return function() {
        var conResult = ko.unwrap(bindingFn());
        return !conResult || conResult.length == 0; 
    }},
    'template': function (bindingFn) {
        if (!bindingFn().hasOwnProperty('if') && !bindingFn().hasOwnProperty('foreach')) {
            return;
        }
        return function () {
            var params = bindingFn();
            var if_ = ko.unwrap(params['if']);
            if (if_) {
                return !if_;
            }
            var foreach = ko.unwrap(params['foreach']);
            return !Boolean(foreach && foreach.length);
        }
    }
};


function elseIfBindingConditionalHandler(bindingFn, node) {return function() {
        return !elseChainIsSatisfied(node) && !ko.unwrap(bindingFn());
    }
}

function elseChainIsSatisfied(node) {
    // If the preceding else/if chain is satisfied (i.e. an else block is true/shown),
    // then this else block should not be shown.
    return ko.contextFor(ko.virtualElements.firstChild(node)).__elseChainIsSatisfied__();
}

function getBindingConditional(node, bindings) {
    var key, conditionalBinding;
    for (i = conditionalHandlerKeys.length - 1; i >= 0; --i) {
        key = conditionalHandlerKeys[i];
        conditionalBinding = bindings[key];
        
        if (conditionalBinding) {
            handlerFn = conditionalHandlerMap[key].call(this, conditionalBinding, node);
            return handlerFn && ko.computed({
                read: handlerFn,
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
    var bindings, conditional;

    do {
        node = node.previousSibling;
    } while (node && node.nodeType !== 1 && node.nodeType !== 8);
    if (!node) {
        throw new Error("Knockout-else binding was not preceded by a conditional.");
    }
    if (node.nodeType == 8) {
        node = prevVirtualNode(node);
    }
    bindings = ko.bindingProvider.instance.getBindingAccessors(node, bindingContext);
    if (!bindings || !(conditional = getBindingConditional(node, bindings))) {
        throw new Error("Knockout-else binding was not preceded by a conditional.");
    }

    return {
        conditional: conditional,
        bindings: bindings,
        node: node
    }
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

function applyElseBinding(element, conditional, bindingContext, innerContext) {
    wrapElementChildrenWithConditional(element, conditional);
    ko.applyBindingsToDescendants(bindingContext.extend(innerContext), element);
    return {controlsDescendantBindings: true};
}

elseBinding = {
    init: function (element, va, ab, vm, bindingContext) {
        if (va() !== void 0) {
            throw new Error("Knockout-else binding must be bare (i.e. no value given).")
        }
        var preceding = getPrecedingConditional(element, bindingContext);
        return applyElseBinding(element, preceding.conditional, bindingContext, {
            __elseCondition__: preceding.conditional
        });
    }
};

elseIfBinding = {
    init: function (element, va, ab, vm, bindingContext) {
        var preceding,
            conditional,
            chainIsSatisfied;
        preceding = getPrecedingConditional(element, bindingContext);
        chainIsSatisfied = ko.computed({
            pure: true,
            disposeWhenNodeIsRemoved: element,
            read: function () {
                if (!preceding.conditional())
                    return true; // The previous is satisfied.
                if (preceding.bindings[elseIfBindingName] && elseChainIsSatisfied(preceding.node))
                    return true; // Something before the previous is satisfied.
                return false;
            }
        });
        conditional = ko.computed({
            pure: true,
            disposeWhenNodeIsRemoved: element,
            read: function () {
                return Boolean(ko.unwrap(va()) && preceding.conditional())
            }
        });
        return applyElseBinding(element, conditional, bindingContext, {
            __elseCondition__: conditional,
            __elseChainIsSatisfied__: chainIsSatisfied
        });
    }
};

function init(spec) {
    spec |= {};
    elseBindingName = spec.hasOwnProperty('elseBinding') ? spec.elseBinding : 'else';
    elseIfBindingName = spec.hasOwnProperty('elseIfBinding') ? spec.elseIfBinding : 'elseif';
    if (elseBindingName) {
        ko.bindingHandlers[elseBindingName] = elseBinding;
        ko.virtualElements.allowedBindings[elseBindingName] = true;
    }
    if (elseIfBindingName) {
        ko.bindingHandlers[elseIfBindingName] = elseIfBinding;
        ko.virtualElements.allowedBindings[elseIfBindingName] = true;
        conditionalHandlerMap[elseIfBindingName] = elseIfBindingConditionalHandler;
    }
    conditionalHandlerKeys = Object.keys(conditionalHandlerMap);
}