var conditionalHandlerKeys,
    conditionalHandlerMap,
    elseBinding,
    elseIfBinding,
    elseBindingName,
    elseIfBindingName,
    inlineElse,
    startCommentRex = /^(<!--)?\s*ko\s+[\s\S]+/,
    endCommentRex = /^(<!--)?\s*\/ko/,
    ve = ko.virtualElements, // convenience
    rewrittenBindingsName = {
        'if': '__ko_if',
        'ifnot': '__ko_ifnot',
        'template': '__ko_template',
        'foreach': '__ko_foreach'
    };


function startsCommentBinding(node) {
    return startCommentRex.test(node.nodeValue);
} 

function endsCommentBinding(node) {
    return endCommentRex.test(node.nodeValue);
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

conditionalHandlerMap[rewrittenBindingsName['if']] = conditionalHandlerMap['if'];
conditionalHandlerMap[rewrittenBindingsName['ifnot']] = conditionalHandlerMap['if'];
conditionalHandlerMap[rewrittenBindingsName['template']] = conditionalHandlerMap['template'];
conditionalHandlerMap[rewrittenBindingsName['foreach']] = conditionalHandlerMap['foreach'];


function elseIfBindingConditionalHandler(bindingFn, node) {return function() {
        return !elseChainIsSatisfied(node) && !ko.unwrap(bindingFn());
    }
}

function elseChainIsSatisfied(node) {
    // If the preceding else/if chain is satisfied (i.e. an else block is true/shown),
    // then this else block should not be shown.
    return ko.contextFor(ve.firstChild(node)).__elseChainIsSatisfied__();
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
    var nextChild = ve.firstChild(node),
        lastChild;

    do {
        lastChild = nextChild;
    } while (nextChild = ve.nextSibling(nextChild));

    return lastChild;
}

function wrapElementChildrenWithConditional(element) {
    var conditionComment;
    // add a strut so this element has at least one item.
    if (!ve.firstChild(element)) {
        // Every if/block needs at least one element so we can call
        // contextFor on it.
        ve.setDomNodeChildren(element,
            [document.createComment('strut')]
        );
    }

    ve.insertAfter(element,
        document.createComment('/ko'),
        getLastChild(element)
    );

    if (inlineElse) {
        conditionComment = document.createComment(
            'ko ' + rewrittenBindingsName['if'] + ': __elseCondition__'
        );
    } else {
        conditionComment = document.createComment('ko if: __elseCondition__');
    }
    ve.prepend(element, conditionComment);   
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


var inlineElseRex = /^\s*else\s*$/,
    inlineElseIfRex = /^\s*else\s*if:\s*([\s\S]+)$/;
function replaceBinding(handlerName) {
    var savedHandlerName = rewrittenBindingsName[handlerName],
        originalHandler = ko.bindingHandlers[handlerName];

    if (ko.bindingHandlers[handlerName].originalHandler) {
        throw new Error('Knockout-else replaceBinding cannot be applied twice.');
    }

    // Save the old binding.
    ko.bindingHandlers[savedHandlerName] = originalHandler;
    ko.bindingHandlers[handlerName] = {
        originalHandler: originalHandler,
        init: function (element, valueAccessor, ab, vm, bindingContext) {
            var openComment = document.createComment('ko ' +
                    savedHandlerName + ": __elseWrapperValueAccessor__()"),
                closeComment = document.createComment("/ko"),
                node = ve.firstChild(element),
                lastNode = null;

            if (node) do {
                if (node.nodeType === 8) {
                    if (inlineElseRex.test(node.nodeValue)) {
                        ve.insertAfter(element, document.createComment('ko else'), lastNode);
                        ve.insertAfter(element, document.createComment('/ko'), lastNode);
                        node.nodeValue = '';
                    } else if (match = inlineElseIfRex.exec(node.nodeValue)) {
                        ve.insertAfter(element, document.createComment('ko elseif: ' + match[1]), lastNode);
                        ve.insertAfter(element, document.createComment('/ko'), lastNode)
                        node.nodeValue = '';
                    }
                }
                lastNode = node;
            } while (node = ve.nextSibling(node));

            ve.insertAfter(element, closeComment, lastNode);
            ve.prepend(element, openComment);
            var innerContext = {
                __elseWrapperValueAccessor__: valueAccessor
            };
            ko.applyBindingsToDescendants(bindingContext.extend(innerContext), element);
            return {controlsDescendantBindings: true};
        },
        // Add hook for the `foreach` binding.
        makeTemplateValueAccessor: originalHandler.makeTemplateValueAccessor
    };
    ve.allowedBindings[savedHandlerName] = true;
}


function init(spec) {
    if (!spec) {
        spec = {};
    }
    inlineElse = spec.hasOwnProperty('inlineElse') ? spec.inlineElse : false;
    elseBindingName = spec.hasOwnProperty('elseBinding') ? spec.elseBinding : 'else';
    elseIfBindingName = spec.hasOwnProperty('elseIfBinding') ? spec.elseIfBinding : 'elseif';

    if (elseBindingName) {
        ko.bindingHandlers[elseBindingName] = elseBinding;
        ve.allowedBindings[elseBindingName] = true;
    }
    if (elseIfBindingName) {
        ko.bindingHandlers[elseIfBindingName] = elseIfBinding;
        ve.allowedBindings[elseIfBindingName] = true;
        conditionalHandlerMap[elseIfBindingName] = elseIfBindingConditionalHandler;
    }
    if (inlineElse) {
        // Replace if, ifnot, template & foreach with our wrappers that support
        // <!-- else --> and <!-- elseif -->.
        replaceBinding('if');
        replaceBinding('ifnot');
        replaceBinding('foreach');
    }
    conditionalHandlerKeys = Object.keys(conditionalHandlerMap);
}
