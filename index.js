var conditionalHandlerKeys,
    conditionalHandlerMap,
    elseBinding,
    elseIfBinding;


function startsCommentBinding(node) {
    return (node.textContent || node.innerText)
        .match(/^(<!--)?\s*ko\s+[\s\S]+/);
} 

function endsCommentBinding(node) {
    return (node.textContent || node.innerText)
        .match(/^(<!--)?\s*\/ko/);
}

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
    return ko.dataFor(ko.virtualElements.firstChild(node)).__elseChainIsSatisfied__();
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
    var bindings;

    do {
        node = node.previousSibling;
    } while (node && node.nodeType !== 1 && node.nodeType !== 8);
    if (!node) {
        return { conditional: false, node: null };
    }
    if (node.nodeType == 8) {
        node = prevVirtualNode(node);
    }
    bindings = ko.bindingProvider.instance.getBindingAccessors(node, bindingContext);

    return {
        conditional: bindings && getBindingConditional(node, bindings),
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

function applyElseBinding(element, bindingContext) {

}

elseBinding = {
    init: function (element, va, ab, vm, bindingContext) {
        var preceding,
            openComment,
            closeComment;

        if (va() !== void 0) {
            throw new Error("Knockout-else binding must be bare (i.e. no value given).")
        }
        
        preceding = getPrecedingConditional(element, bindingContext); 
        if (!preceding.conditional) {
            throw new Error("Knockout-else binding was not preceded by a conditional.");
        }
        wrapElementChildrenWithConditional(element, preceding.conditional);
        ko.applyBindingsToDescendants(bindingContext.extend({
            __elseCondition__: preceding.conditional
        }), element);
        return {controlsDescendantBindings: true};
    }
};

elseIfBinding = {
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
        elseChainIsSatisfied = ko.computed({
            pure: true,
            disposeWhenNodeIsRemoved: element,
            read: function () {
                return  !elseChainIsSatisfied(elseConditional.node) && !ko.unwrap(elseConditional());
            }
        })

        wrapElementChildrenWithConditional(element, elseConditional.conditional);
        ko.applyBindingsToDescendants(bindingContext.extend({
            __elseCondition__: elseConditional.conditional,
            __elseChainIsSatisfied: elseChainIsSatisfied
        }), element);
        return {controlsDescendantBindings: true};
    }
};

function init(spec) {
    spec |= {};
    var elseBindingName = spec.hasOwnProperty('elseBinding') ? spec.elseBinding : 'else';
    var elseIfBindingName = spec.hasOwnProperty('elseIfBinding') ? spec.elseIfBinding : 'elseif';
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