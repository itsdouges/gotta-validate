# Gotta Validate!
A POJO object validator for node, built with resources, promises, and testing in mind. 

Currently being used on armory.net.au's node backend. Still a work in progress and missing many common validators. If you're using **Gotta Validate!** please submit pull requests to add validators you've made! Make sure to add tests else it will be rejected.

To run tests use: `gulp test`.

## 1. Examples
## 1.1 General stuff
Note: Take a look at src/example.spec.js for these tests.
1. Require it!
```
var GottaValidate = require('gotta-validate');
```

2. Add rules you need, you can chain it too.
```
GottaValidate.addRule({
    name: 'required',
    func: function (property, object) {
        var item = object[property];
        if (!item) {
            return 'is required!';
        }
    }
})
.addRule(..);
```

3. Add resources you need, you can chain it too. Add the name of any property you want to validate to the rules object. It can be a single rule (string) or many rules with an array (of strings).
```
GottaValidate.addResource({
    name: 'Users',
    mode: 'create',
    rules: {
        id: 'required',
        email: ['required']
    }
})
.addResource(..);
```

4. Now you gotta validate! Call the constructor function every time you want a different validator. The promise will resolve if validation was a success, and reject if any validators returned an error.
```
var validator = GottaValidate({
    resource: 'Users',
    mode: 'create'
});

var my_object = {};

validator
    .validate(my_object)
    .then(null, function (e) {
        expect(e).toBe([
            '[id] is required!', 
            '[email] is required!' 
        ]);
    });
    
my_object = {
    id: 'ayylmao',
    email: 'coolemailthough'
};

validator
    .validate(my_object)
    .then(function (e) {
        expect(e).not.toBeDefined();
        done();
    });
```

### 1.2 Extra stuff
#### 1.2.1 Promise based rules
You can add promise based rules like the following. You can use any library that will work with **q**. Just make sure you return a promise! If an error occurred return an object like in the example.

```
var somethingAsync = require('something-async');

GottaValidate.addRule({
    name: 'required',
    func: function (property, object) {
        var defer = q.defer();
        
        if (something_bad_happened_immediately) {
            return q.reject({
                property: property,
                message: 'was bad!'
            });
        }
        
        somethingAsync.then(function (e) {
            // resolve or reject
        });
        
        return defer.promise;
    }
});
```
### 1.2.2 Rules with dependencies
You can also add rules that have dependencies. Promise based or synchronous!

```
GottaValidate.addRule({
    name: 'depender',
    func: function (property, object, dependencies) {
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

### 1.2.3 Rules that inherit
```
    GottaValidate.addRule({
        name: 'rule-a',
        func: function () {
            return 'bad';
        }
    });

    GottaValidate.addRule({
        name: 'rule-b',
        func: function () {
            return 'naughty!';
        },
        inherits: ['rule-a'] // Array for multiple, string for single
    });

    GottaValidate.addResource({
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
var validator = GottaValidate(options);
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