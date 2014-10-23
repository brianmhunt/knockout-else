knockout-else
=============

else/elseif binding for Knockout


Re. https://github.com/knockout/knockout/issues/962
Originally from http://jsfiddle.net/bmh_ca/hyrvtps4/


### Get started
Get it with `npm install knockout-else` or `bower install knockout-else`.

Include the `dist/knockout-else.js`, then init with `KnockoutElse.init([spec={}])`.

It should work fine in the ordinary with AMD/CommonJS.

### How to use

#### Two block elements

```html
<div data-bind='if: x'>X</div>
<div data-bind='else'>!X</div>
```

#### Two virtual elements
```html
<!-- ko if: x -->
X is truthy
<!-- /ko -->
<!-- ko else -->
X is not truthy.
<!-- /ko -->
```

#### An Element + virtual else
```html
<div data-bind='template: {if: x, foreach: arr}'></div>
<!-- ko else -->
X is false or arr is empty/undefined.
<!-- /ko -->
```


#### A virtual if and else-element
```html
<!-- ko foreach: arr -->
<!-- /ko -->
<div data-bind='else'>
arr is empty or undefined.
</div>
```

#### else and else-if
```html
<!-- ko if: x -->X is true<!-- /ko -->
<!-- elseif: y -->X is not true, but Y is.<!-- /ko -->
<div data-bind='elseif: z'>Z, but not X nor Y.</div>
<!-- else -->It's all pie.<!-- /ko -->
```


#### inline else/else-if short-hand

Within an `if`, `ifnot` and `foreach` bindings, one can use HTML comments to indicate `else` and `elseif`. These are respectively rewritten as `<!--/ko--><!--ko else-->` and `<!--/ko--><!-- ko elseif: expression -->`.

You need to pass `inlineElse: true` to the `init` function to turn this feature on.

You can use inline short-hand with regular tags:
```html
<div data-bind='if: x' -->
  X
  <!-- elseif: y -->
  not X but Y
  <!-- else -->
  Neither X nor Y
</div>
```

... and with virtual elements:
```html
<!-- ko if: x -->X
<!-- elseif: y -->Y
<!-- else -->~X and ~Y
<!-- /ko -->
```

The `else`/`elseif` comments will be rewritten as:

```html
<!-- ko if: x -->X
<!--/ko-->
<!-- ko elseif: y -->Y
<!--/ko-->
<!-- else -->~X and ~Y
<!-- /ko -->
```

The `else` and `elseif` bindings then add inner conditionals, resulting in a DOM tree that looks like this:

```html
  <!--ko if: x-->
    <!--ko __ko_if: __elseWrapperValueAccessor__()-->
      X
    <!--/ko-->
    <!--ko elseif: y-->
      <!--ko __ko_if: __elseCondition__-->
        Y
      <!--/ko-->
    <!--/ko-->
    <!-- ko else -->
      <!--ko __ko_if: __elseCondition__-->
        ~X and ~Y
      <!--/ko-->
    <!-- /ko -->
  <!--/ko-->
```

The `__elseCondition__` is a computed value that is true when the prior conditions are false and, in the case of `elseif` the given conditional is true.

The "inline else/if" short-hand replaces the knockout 
bindings for `if`, `ifnot`, `foreach` and `template`.
The original bindings `if`, `ifnot`, `template` and `foreach` are
accessible still through `ko.bindingHandlers.__ko_BINDING` e.g. `ko.bindingHandlers.__ko_if`,



### `spec` argument for `init`

You likely do not need to specify any, but the options are:

| Argument | Default | Meaning
|---       | ---     | ---
| inlineElse | `false`  | `<bool>` When truthy the `<!-- else -->` and `<!-- elseif: -->` short-hands will be enabled.
| elseBindingName | `else` | `<string> or falsy` The name of the binding for 'else'; falsy to disable.
| elseIfBindingName  | `elseif` | `<string> or falsy` The name of the binding for 'elseif'; falsy to disable.


ES5 things
---
The following will need to be shimmed for older browser support (i.e. IE8 and lower):

- Object.keys
