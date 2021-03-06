// the xquery-hint is
//   Copyright (C) 2013 by Angelo ZERR <angelo.zerr@gmail.com>
// released under the MIT license (../../LICENSE) like the rest of CodeMirror
(function() {
  var Pos = CodeMirror.Pos;
  var XQuery = CodeMirror.XQuery;

  // --------------- token utils ---------------------

  function getToken(editor, pos) {
    return editor.getTokenAt(pos);
  }

  function getPreviousToken(editor, cur, token) {
    return getToken(editor, Pos(cur.line, token.start));
  }

  // --------------- string utils ---------------------

  function startsWithString(str, token) {
    return str.slice(0, token.length).toUpperCase() == token.toUpperCase();
  }

  function trim(str) {
    if (str.trim) {
      return str.trim();
    }
    return str.replace(/^\s+|\s+$/g, '');
  }

  function getStartsWith(cur, token, startIndex) {
    var length = cur.ch - token.start;
    if (!startIndex)
      startIndex = 0;
    var startsWith = token.string.substring(startIndex, length);
    return trim(startsWith);
  }

  // --------------- populate variables functions ---------------------

  function getVarLabel(varDecl) {
    var dataType = varDecl.dataType || varDecl.dataType || 'any';
    var name = varDecl.name;
    var funcName = '';
    if (varDecl.functionDecl) {
      funcName = ' - ' + varDecl.functionDecl.name;
    }
    return name + ' : ' + dataType + funcName;
  }

  function populateVars(s, vars, completions) {
    while (vars) {
      var varDecl = vars.varDecl;
      var name = varDecl.name;
      if (name && startsWithString(name, s)) {
        var completion = varDecl.completion;
        if (!completion) {
          completion = {
            "text" : getVarLabel(varDecl),
            "className" : "CodeMirror-hint-var-" + varDecl.scope,
            "varDecl" : varDecl
          };
          completion.hint = function(cm, data, completion) {
            var from = Pos(data.from.line, data.from.ch);
            var to = Pos(data.to.line, data.to.ch);
            cm.replaceRange(completion.varDecl.name, from, to);
          };
          varDecl.completion = completion;
        }
        completions.push(completion);
      }
      vars = vars.next;
    }
  }

  // --------------- populate function functions ---------------------

  function getParamLabel(varDecl) {
    var dataType = varDecl.dataType || varDecl.dataType || 'any';
    var name = varDecl.name;
    return name + ' as ' + dataType;
  }

  function getFunctionLabel(functionDecl) {
    var name = functionDecl.name;
    var params = functionDecl.params;
    var label = name + '(';
    var p = '';
    while (params) {
      var varDecl = params.varDecl;
      p = getParamLabel(varDecl) + p;
      params = params.next;
      if (params != null)
        p = ', ' + p;
    }
    label += p;
    label += ')';
    return label;
  }

  function populateDeclaredFunctions(s, declaredFunctions, completions) {
    if (declaredFunctions) {
      for ( var i = 0; i < declaredFunctions.length; i++) {
        var functionDecl = declaredFunctions[i];
        var name = functionDecl.name;
        if (name && startsWithString(name, s)) {
          var completion = functionDecl.completion;
          if (!completion) {
            completion = {
              "text" : getFunctionLabel(functionDecl),
              "className" : "CodeMirror-hint-function",
              "functionDecl" : functionDecl
            };
            completion.hint = function(cm, data, completion) {

              var functionDecl = completion.functionDecl;
              var name = functionDecl.name;
              // create content to insert
              var firstParam = null;
              var name = functionDecl.name;
              var params = functionDecl.params;
              var content = name + '(';
              var p = '';
              while (params) {
                var varDecl = params.varDecl;
                firstParam = varDecl.name;
                p = varDecl.name + p;
                params = params.next;
                if (params != null)
                  p = ',' + p;
              }
              content += p;
              content += ')';

              var from = Pos(data.from.line, data.from.ch);
              var to = Pos(data.to.line, data.to.ch);
              cm.replaceRange(content, from, to);
              cm.setCursor(Pos(data.from.line, data.from.ch + name.length + 1));
              if (firstParam != null) {
                // the function to insert has parameters, select the first
                // parameter.
                cm.setSelection(Pos(data.from.line, data.from.ch + name.length
                    + 1), Pos(data.to.line, data.from.ch + name.length + 1
                    + firstParam.length));
              }
            };
            functionDecl.completion = completion;
          }
          completions.push(completion);
        }
      }
    }
  }

  // --------------- populate imported modules functions ---------------------

  function populateImportedModules(s, importedModules, completions) {
    if (importedModules) {
      for ( var i = 0; i < importedModules.length; i++) {
        var importedModule = importedModules[i];
        populateModulePrefix(s, importedModule, completions);
      }
    }
  }

  function populateModulePrefix(s, importedModule, completions) {
    var name = importedModule.prefix;
    if (name && startsWithString(name, s)) {
      var completion = importedModule.completion;
      if (!completion) {
        completion = {
          "text" : importedModule.prefix + ' - ' + importedModule.namespace,
          "className" : "CodeMirror-hint-module",
          "importedModule" : importedModule
        };
        completion.hint = function(cm, data, completion) {
          var from = Pos(data.from.line, data.from.ch);
          var to = Pos(data.from.line, data.to.ch);
          cm.replaceRange(importedModule.prefix, from, to);
        };
        completion.info =  function(completion) {
        	
        }
        importedModule.completion = completion;
      }
      completions.push(completion);
    }
  }

  function populateModuleNamespaces(s, quote, completions, editor, options) {
    var moduleNamespaces = XQuery.getModuleNamespaces();
    for ( var i = 0; i < moduleNamespaces.length; i++) {
      var namespace = moduleNamespaces[i];
      var module = XQuery.findModuleByNamespace(namespace);//modules[namespace];
      populateNamespace(s, quote, module, completions);
    }
    // TODO : manage dynamicly the add module
    /*
     * if (options && options.populateModuleNamespaces) {
     * options.populateModuleNamespaces(populateNamespace, s, completions,
     * editor, options); }
     */
  }

  function populateNamespace(s, quote, module, completions) {
    if (startsWithString(module.namespace, s)) {
      var completion = module.completion;
      if (!completion) {
    	var className = startsWithString(module.namespace, 'java:') ? 'CodeMirror-hint-module-java' : 'CodeMirror-hint-module-xml';
        completion = {
          "text" : module.namespace,
          "className" : className,
          "module" : module
        };
        completion.hint = function(cm, data, completion) {
          var label = completion.module.namespace;
          var from = Pos(data.from.line, data.from.ch + 1), to = null;
          var location = completion.module.location;
          if (location) {            
            label += quote + ' at ' + quote + location + quote + ';';
          } else {
            label = label + quote + ';';
          }
          var length = cm.getLine(cm.getCursor().line).length;
          to = Pos(data.from.line, length);
          cm.replaceRange(label, from, to);
        };
        completion.info =  function(completion) {
        	var module = completion.module;
        	var html = ''
        	html+='<b>';
        	html+=module.namespace;
        	html+='</b>';
        	if(module.location) {
        		html+='<br />';
        		html+='Location : <b>';
            	html+=module.location;
            	html+='</b>';
        	}
        	if(module.resource) {
        		html+='<br />';
        		html+='Resource : <b>';
            	html+=module.resource;
            	html+='</b>';
        	}
        	return html;
        }
        module.completion = completion;
      }
      completions.push(completion);
    }
  }

  function populateModuleFunction(prefix, f, completions) {
    var label = f.name;
    if (prefix != null) {
      label = prefix + ':' + label;
    }
    label += '(';
    var params = f.params;
    if (params) {
      for ( var i = 0; i < params.length; i++) {
        if (i > 0)
          label += ', ';
        var param = params[i];
        label += '$' + param.name;
        var as = param.as;
        if (as && as.length > 0)
          label += ' as ' + as;
      }
    }
    label += ')';
    var as = f.as;
    if (as && as.length > 0)
      label += ' as ' + as;

    var completion = {
      "moduleFunction" : f,
      "text" : label,
      "className" : "CodeMirror-hint-function"
    };
    completion.hint = function(cm, data, completion) {
      var firstParam = null;
      var name = completion.moduleFunction.name;
      if (prefix != null) {
        name = prefix + ':' + name;
      }
      var label = name;
      label += '(';
      var params = completion.moduleFunction.params;
      if (params) {
        for ( var i = 0; i < params.length; i++) {
          var param = params[i];
          var paramName = '$' + param.name;
          if (i == 0) {
            firstParam = paramName;
          } else {
            label += ', ';
          }
          label += paramName;
        }
      }
      label += ')';
      var from = Pos(data.from.line, data.from.ch);
      var to = Pos(data.from.line, data.to.ch);
      cm.replaceRange(label, from, to);
      cm.setCursor(Pos(data.from.line, data.from.ch + name.length + 1));
      if (firstParam != null) {
        cm.setSelection(Pos(data.from.line, data.from.ch + name.length + 1),
            Pos(data.from.line, data.from.ch + name.length + 1
                + firstParam.length));
      }
    };
    completion.info = function(completion) {
      return completion.moduleFunction.doc;
    };
    completions.push(completion);
  }

  function populateModuleFunctions(module, prefix, funcName, completions) {
    // loop for each function
    var functions = module.functions;
    for ( var i = 0; i < functions.length; i++) {
      var f = functions[i];
      var name = f.name;
      if (name && startsWithString(name, funcName)) {
        populateModuleFunction(prefix, f, completions);
      }
    }
  }

  function populateDefaultModulePrefix(s, completions) {
    var defaultModulePrefixes = XQuery.getDefaultModulePrefixes();
    for ( var i = 0; i < defaultModulePrefixes.length; i++) {
      var prefix = defaultModulePrefixes[i];
      var module = XQuery.findDefaultModuleByPrefix(prefix);
      populateModulePrefix(s, module, completions);
    }
  }

  function populateModuleFunctionsNoNeedsPrefix(s, completions) {
    var modulesNoNeedsPrefix = XQuery.getModulesNoNeedsPrefix();
    for ( var i = 0; i < modulesNoNeedsPrefix.length; i++) {
      populateModuleFunctions(modulesNoNeedsPrefix[i], null, s, completions)
    }
  }

  // --------------- completion utils ---------------------

  function getCompletions(completions, cur, token, options, showHint) {
    var sortedCompletions = completions.sort(function(a, b) {
      var s1 = a.text;// getKeyWord(a);
      var s2 = b.text;// getKeyWord(b);
      var nameA = s1.toLowerCase(), nameB = s2.toLowerCase()
      if (nameA < nameB) // sort string ascending
        return -1
      if (nameA > nameB)
        return 1
      return 0 // default return value (no sorting)
    });
    var data = {
      list : sortedCompletions,
      from : Pos(cur.line, token.start),
      to : Pos(cur.line, token.end)
    };
    if (CodeMirror.attachContextInfo) {
      // if context info is available, attach it
      CodeMirror.attachContextInfo(data);
    }
    if (options && options.async) {
      showHint(data);
    } else {
      return data;
    }
  }

  CodeMirror.xqueryHint = function(editor, showHint, options) {
    if (showHint instanceof Function) {
      return internalXQueryHint(editor, options, showHint);
    }
    return internalXQueryHint(editor, showHint, options);
  }

  function internalXQueryHint(editor, options, showHint) {
    var completions = [];
    // Find the token at the cursor
    var cur = editor.getCursor(), token = getToken(editor, cur), tprop = token;
    switch (tprop.type) {
    case "keyword":
      var s = getStartsWith(cur, token);
      // templates
      if (CodeMirror.templatesHint) {
        CodeMirror.templatesHint.getCompletions(editor, completions, s);
      }
      break;
    case "string":
      // completion started inside a string, test if it's import/declaration of
      // module
      if (tprop.state.tokenModuleParsing) {
        var s = getStartsWith(cur, token, 1);
        var quote = token.string.charAt(0);
        populateModuleNamespaces(s, quote, completions, editor, options);
      }
      break;
    case "variable def":
    case "variable":
    case null:
      // do the completion about variable, declared functions and modules.

      // completion should be ignored for parameters function declaration :
      // check if the current token is not inside () of a declared function.
      var functionDecl = token.state.functionDecl;
      if (functionDecl && functionDecl.paramsParsing == true) {
        return getCompletions(completions, cur, token, options, showHint);
      }
      // completion should be ignored for variable declaration : check if there
      // are not "let", "for" or "variable" keyword before the current token
      var previous = getPreviousToken(editor, cur, tprop);
      if (previous) {
        previous = getPreviousToken(editor, cur, previous);
        if (previous
            && previous.type == "keyword"
            && (previous.string == "let" || previous.string == "variable"
                || previous.string == "for" || previous.string == "function"))
          // ignore completion
          return getCompletions(completions, cur, token, options, showHint);
      }

      // show let, declared variables.
      var s = null;
      if (previous && previous.type == "keyword" && previous.string == "if"
          && token.string == "(") {
        // in the case if(, the search string should be empty.
        s = "";
      } else {
        s = getStartsWith(cur, token);
      }

      // test if s ends with ':'
      var prefix = null;
      var funcName = null;
      var prefixIndex = s.lastIndexOf(':');
      if (prefixIndex != -1) {
        // retrieve the prfix anf function name.
        prefix = s.substring(0, prefixIndex);
        funcName = s.substring(prefixIndex + 1, s.length);
      }

      if (prefix) {
        // test if it's default prefix
        var module = XQuery.findModuleByPrefix(prefix, token.state.importedModules);
        if (module) {
          populateModuleFunctions(module, prefix, funcName, completions);
        }
      }

      // local vars (let, for, ...)
      var vars = token.state.localVars;
      populateVars(s, vars, completions);

      var context = token.state.context;
      while (context) {
        if (context.keepLocals) {
          vars = context.vars;
          populateVars(s, vars, completions);
          context = context.prev;
        } else {
          context = null;
        }
      }

      // global vars (declare ...)
      var globalVars = token.state.globalVars;
      populateVars(s, globalVars, completions);

      // parametres of the function (if token is inside a function)
      if (functionDecl) {
        var vars = functionDecl.params;
        populateVars(s, vars, completions);
      }

      // declared functions
      var declaredFunctions = token.state.declaredFunctions
      populateDeclaredFunctions(s, declaredFunctions, completions);

      // imported modules
      var importedModules = token.state.importedModules
      populateImportedModules(s, importedModules, completions);

      // default module
      populateDefaultModulePrefix(s, completions);

      // populate functions of modules which no needs prefix(ex: fn)
      populateModuleFunctionsNoNeedsPrefix(s, completions);

      // templates
      if (CodeMirror.templatesHint) {
        CodeMirror.templatesHint.getCompletions(editor, completions, s);
      }
    }
    return getCompletions(completions, cur, token, options, showHint)
  }
  ;
})();
