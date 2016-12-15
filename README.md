# Gotta Validate!  [![Build Status](https://img.shields.io/travis/madou/gotta-validate.svg)](https://travis-ci.org/madou/gotta-validate) [![NPM Version](https://img.shields.io/npm/v/gotta-validate.svg)](https://www.npmjs.com/package/gotta-validate)

> An async object validator for node.

Made for `api.gw2armory.com`. If you've stumbled upon this it's debatable if this is really worthwhile using. I'd advise using a more mature library.

To run tests use: `gulp test`.

## 1. Examples
### 1.1 General stuff
Note: Take a look at `src/example.spec.js` for these tests.

Require it!

```
import gottaValidate from 'gotta-validate';
```

Add rules you need, you can chain them too.

```
gottaValidate.addRule({
    name: 'required',
    func: (property, object) => {
        var item = object[property];
        if (!item) {
            return 'is required!';
        }
    }
})
.addRule(..);
```

Add resources you need, you can chain it too. Add the name of any property you want to validate to the rules object. It can be a single rule (string) or many rules with an array (of strings).
```
gottaValidate.addResource({
    name: 'Users',
    mode: 'create',
    rules: {
        id: 'required',
        email: ['required']
    }
})
.addResource(..);
```

Now you gotta validate! Call the constructor function every time you want a different validator. The promise will resolve if validation was a success, and reject if any validators returned an error.

```
var validator = gottaValidate({
    resource: 'Users',
    mode: 'create'
});

const user = {};

validator.validate(user)
    .catch((e) => {
        expect(e).toBe([
            '[id] is required!', 
            '[email] is required!' 
        ]);
    });
    
const validUser = {
    id: 'ayylmao',
    email: 'coolemailthough'
};

validator.validate(validUser)
    .then((e) => {
        expect(e).not.toBeDefined();
    });
```

### 1.2 Pre-defined Rules
Rules which you can use without needing to add yourself are as follows (after using the addDefaultRules method).

```
gottaValidate.addDefaultRules();

gottaValidate.addResource({
    name: 'cool-resource',
    mode: 'mode',
    rules: {
        aCoolProperty: ['email', 'no-white-space', 'password', 'required']
    }
});
```

### 1.3 Extra stuff
#### 1.3.1 Promise based rules
You can add promise based rules like the following. Just make sure you return a promise! If an error occurred return an object like in the example.

```
var async = require('something-async');

gottaValidate.addRule({
    name: 'required',
    func: (property, object) => {
        if (0 === 1) {
            return Promise.reject({
                property: property,
                message: 'was bad!'
            });
        }
        
        return async().then(function (e) {
            // resolve or reject
        });
    }
});
```
### 1.3.2 Rules with dependencies
You can also add rules that have dependencies. Promise based or synchronous!

```
gottaValidate.addRule({
    name: 'depender',
    func: (property, object, dependencies) => {
        var error = dependencies.a();
        if (error) {
            return 'oh no error!';
        }
    },
    dependencies: {
        a: function () { return true; }
    }
});
```

### 1.3.3 Rules that inherit
```
gottaValidate.addRule({
    name: 'rule-a',
    func: function () {
        return 'bad';
    }
});

gottaValidate.addRule({
    name: 'rule-b',
    func: function () {
        return 'naughty!';
    },
    inherits: ['rule-a'] // Array for multiple, string for single
});

gottaValidate.addResource({
    name: 'inherit',
    mode: 'deez',
    rules: {
        id: ['rule-b']
    }
});
```

## 2. Api
### 2.1 Instantiating
Add some rules and resources and then call the consturctor method. No need for new! 

Options properties:
resource (required), mode (required)
```
const validator = gottaValidate(options);
validator.validate(object);
```

### 2.2 Static methods
#### 2.2.1 addRule(options)
Adds a rule. Returns this.

Options properties:
name (required), func (required), inherits (optional)

#### 2.2.2 addResource(options)
Add a resource. Returns this.

Options properties:
name (required), mode (required), rules (optional)

#### 2.2.3 addDefaultRules()
Adds the default rules to the rule table.

### 2.3 Instance methods
#### 2.3.1 validate(object)
Validates an object based on an instantiated validator. Returns a promise.

## 3. License
```
Copyright (c) 2015 Michael Dougall

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
