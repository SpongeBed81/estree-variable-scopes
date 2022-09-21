
<div align="center">
  
# estree-vaiable-scopes

**An NPM package that shows the top scope of defined variables and what variable can access to another specific variable**

</div>

# Usage

`Getting all of the variables and it's grandparents`

```js
import { getVariables } from "estree-variable-scopes";

const code = `
let a = "Hello!"
let b = "Hi!"

const goodMorning = () => {
 const str = "Good morning!"
}
`
console.log(getVariables(code)) //will print all of the defined variables and it's grandparents
```

```Checking a variable can access to a specific variable```

```js
import { getVariables, canAccess } from "estree-variable-scopes";

const code = `
let a = "Hello!"
let b = "Hi!"

const goodMorning = () => {
 const str = "Good morning!"
}
`

const scopes = getVariables(code)
const a_value = scopes[0].vars[0] //will point to variable "a" in global scope
const str_value = scopes[1].vars[0] //will point to variable "str" in goodMorning function 
console.log(canAccess(str_value, a_value, scopes)) //will print true because "str" can access to variable "a" in global scope
```
