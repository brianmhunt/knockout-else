knockout-else
=============

(If -) Else binding for Knockout


Re. https://github.com/knockout/knockout/issues/962
Originally from http://jsfiddle.net/bmh_ca/hyrvtps4/


### Get started
Get it with `npm install knockout-else` or `bower install knockout-else`.

Include the `dist/knockout-else.js`, then init with `KnockoutElse.init([spec={}])`.

It should work fine in the ordinary with AMD/CommonJS.

### How to use

Some examples:

```html
<div data-bind='if: x'>X</div>
<div data-bind='else'>!X</div>


<!-- ko if: x -->
X is truthy
<!-- /ko -->
<!-- ko else -->
X is not truthy.
<!-- /ko -->


<div data-bind='template: {if: x, foreach: arr}'></div>
<!-- ko else -->
X is false or arr is empty/undefined.
<!-- /ko -->


<!-- ko foreach: arr -->
<!-- /ko -->
<div data-bind='else'>
arr is empty or undefined.
</div>


<!-- ko if: x -->X is true<!-- /ko -->
<!-- elseif: y -->X is not true, but Y is.<!-- /ko -->
<!-- else -->Neither X nor Y is true<!-- /ko -->

<!-- ko if: x -->X is true<!-- /ko -->
<!-- elseif: y -->X is not true, but Y is.<!-- /ko -->
<!-- elseif: z -->X is not true, Y is not true, but Z is true.<!-- /ko -->

```

### `spec` argument for `init`

You likely do not need to specify any, but the options are:

| Argument | Default | Meaning
|---       | ---     | ---
| elseBindingName  | `else` | `<string>` The name of the binding for 'else'; falsy to disable.
| elseIfBindingName  | `elseif` | `<string>` The name of the binding for 'elseif'; falsy to disable.


ES5 things
---
The following will need to be shimmed for older browser support (i.e. IE8 and lower):

- Object.keys
