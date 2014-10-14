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

#### else and else-if blocks
```html
<!-- ko if: x -->X is true<!-- /ko -->
<!-- elseif: y -->X is not true, but Y is.<!-- /ko -->
<!-- else -->Neither X nor Y is true<!-- /ko -->
```

#### else-if chaining

```html
<!-- ko if: x -->X is true<!-- /ko -->
<!-- elseif: y -->X is not true, but Y is.<!-- /ko -->
<!-- elseif: z -->X is not true, Y is not true, but Z is true.<!-- /ko -->
```

#### inline else/else-if short-hand
```html
<!-- ko if: x -->
<!-- elseif: y -->
<!-- else -->
```

```html
<div data-bind='if: x' -->
  X
  <!-- elseif: y -->
  not X but Y
  <!-- else -->
  Neither X nor Y
</div>
```


### `spec` argument for `init`

You likely do not need to specify any, but the options are:

| Argument | Default | Meaning
|---       | ---     | ---
| inlineElse | `true`  | `<bool>` When truthy the `<!-- else -->` and `<!-- elseif: -->` short-hands will be enabled.
| elseBindingName | `else` | `<string>|falsy` The name of the binding for 'else'; falsy to disable.
| elseIfBindingName  | `elseif` | `<string>|falsy` The name of the binding for 'elseif'; falsy to disable.


ES5 things
---
The following will need to be shimmed for older browser support (i.e. IE8 and lower):

- Object.keys
