import {
 parse
} from 'acorn';
import {
 walk
} from 'estree-walker';

class Node {
 constructor() {}
}

export function getVariables(code) {
 if (code !== undefined && code !== null && code.toString().trim() === "") throw new Error("Code is empty");

 let ast = parse(code, {
  ecmaVersion: 2020
 });
 let scopeChain = [];
 let fn_s = []

 let grandparents = []


 walk(ast, {
  enter: enter,
  leave: leave
 });

 function enter(node) {
  if (createsNewScope(node)) {
   scopeChain.push([]);
  }
  if (node.type === 'VariableDeclarator') {
   var currentScope = scopeChain[scopeChain.length - 1];
   currentScope.push(node);
  }
 }

 function leave(node) {
  if (createsNewScope(node)) {
   if (Object.keys(createsNewScope(node)).length > 0) {
    createsNewScope(node).spec = true
   }
   var currentScope = scopeChain.pop();
   printScope(currentScope, node);
  }
 }

 function printScope(scope, node) {
  if (node.type === 'Program' || node.spec === true) {
   fn_s.push(scope)
  } else {
   walk(node, {
    enter(n) {
     if (n.type === "VariableDeclaration") {
      if (grandparents.find(g_p => g_p.grandparent === node) === undefined) {
       grandparents.push({
        grandparent: node,
        vars: []
       })
      }
      n.declarations.forEach((d) => {
       grandparents[grandparents.length - 1].vars.push(d)
      })
     }
    },
   });
  }
 }

 function createsNewScope(node) {
  if (node.type === "VariableDeclaration") {
   if (node.declarations[0].init !== undefined && node.declarations[0].init !== null) {
    if (node.declarations[0].init.type === "ArrowFunctionExpression" || node.declarations[0].init.type === "FunctionExpression") {
     node.type = "FunctionDeclaration";
     node.id = node.declarations[0].id;
     ["params", "body", "generator", "expression", "async"].forEach(key => {
      node[key] = node.declarations[0].init[key]
     })
     node.convertedKind = node.kind
     node.str_decs = node.declarations
     delete node.declarations
     delete node.kind
    }
   }
  }
  return node.type === 'FunctionDeclaration' ||
   node.type === 'FunctionExpression' ||
   node.type === 'ForStatement' ||
   node.type === 'IfStatement' ||
   node.type === "WhileStatement" ||
   node.type === 'DoWhileStatement' ||
   node.type === "ExpressionStatement" ||
   node.type === "ForInStatement" ||
   node.type === "ForOfStatement" ||
   node.type === 'Program';
 }

 let gp_var = []
 grandparents.forEach(gpa => {
  gpa.vars.forEach(varib => {
   if (Object.keys(gpa.grandparent).includes("convertedKind")) {
    gpa.grandparent.type = "VariableDeclaration"
    gpa.grandparent.declarations = [{
     "type": "VariableDeclarator",
     "id": gpa.grandparent.id,
     "init": {
      "type": "ArrowFunctionExpression",
      "id": null,
      "params": gpa.grandparent.params,
      "body": gpa.grandparent.body,
      "generator": gpa.grandparent.generator,
      "expression": gpa.grandparent.expression,
      "async": gpa.grandparent.async
     }
    }]
    gpa.grandparent.kind = gpa.grandparent.convertedKind;
    ["id", "params", "body", "generator", "expression", "async", "convertedKind", "str_decs"].forEach(key => {
     delete gpa.grandparent[key]
    })
   }
   varib.gp = gpa.grandparent
   if (gp_var.includes(varib)) return
   gp_var.push(varib)
  })
 })
 let st_gp_var = []
 gp_var.forEach(vari => {
  if (st_gp_var.find(g_p => g_p.grandparent === vari.gp) === undefined) {
   st_gp_var.push({
    grandparent: vari.gp,
    vars: []
   })
  }
  delete vari.gp
  st_gp_var[st_gp_var.length - 1].vars.push(vari)
 })

 let pr = {}
 pr.grandparent = new Node()
 pr.grandparent.type = "Global"
 pr.vars = [];
 pr.grandparent.declarations = [];
 fn_s.forEach(fn => {
  pr.vars.push(fn)
  pr.grandparent.declarations.push(fn)
 })
 if (pr.vars.length > 0) {
  pr.vars = pr.vars[0]
  pr.grandparent.declarations = pr.grandparent.declarations[0]
 }

 st_gp_var.unshift(pr)
 return st_gp_var
}



export function canAccess(what, target, inp) {
 if ([null, undefined].includes(what) || [null, undefined].includes(target) || [null, undefined].includes(inp)) return false
 const find_target_loc = inp.find(n => n.vars.includes(target))
 const find_what_loc = inp.find(n => n.vars.includes(what))
 const find_target_global = inp.find(n => n.grandparent.type === "Global" && n.vars.includes(target))
 if (find_target_loc === undefined || find_what_loc === undefined) return false
 if (JSON.stringify(find_target_loc) === JSON.stringify(find_what_loc)) { //same scope
  const target_index = find_target_loc.vars.indexOf(target)
  const what_index = find_target_loc.vars.indexOf(what)
  if (target_index < what_index) {
   return true
  }
 }
 //if target is in global scope and the target index is less than what index(by characters)
 if (find_target_global !== undefined) {
  const target_index = target.start
  const what_index = what.start
  if (target_index < what_index) {
   return true
  }
 }
 return false
}