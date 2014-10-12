knockout-else
=============

(If -) Else binding for Knockout


Re. https://github.com/knockout/knockout/issues/962
Originally from http://jsfiddle.net/bmh_ca/hyrvtps4/


### Get started
Include Knockout-Else, then init with `KnockoutElse.init()`.

### How to use

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
```