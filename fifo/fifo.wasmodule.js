

// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module !== 'undefined' ? Module : {};



// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = function(status, toThrow) {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string';
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;




// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_,
    readAsync,
    readBinary,
    setWindowTitle;

var nodeFS;
var nodePath;

if (ENVIRONMENT_IS_NODE) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = require('path').dirname(scriptDirectory) + '/';
  } else {
    scriptDirectory = __dirname + '/';
  }




  read_ = function shell_read(filename, binary) {
    var ret = tryParseAsDataURI(filename);
    if (ret) {
      return binary ? ret : ret.toString();
    }
    if (!nodeFS) nodeFS = require('fs');
    if (!nodePath) nodePath = require('path');
    filename = nodePath['normalize'](filename);
    return nodeFS['readFileSync'](filename, binary ? null : 'utf8');
  };

  readBinary = function readBinary(filename) {
    var ret = read_(filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };




  if (process['argv'].length > 1) {
    thisProgram = process['argv'][1].replace(/\\/g, '/');
  }

  arguments_ = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });

  process['on']('unhandledRejection', abort);

  quit_ = function(status) {
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };



} else
if (ENVIRONMENT_IS_SHELL) {


  if (typeof read != 'undefined') {
    read_ = function shell_read(f) {
      var data = tryParseAsDataURI(f);
      if (data) {
        return intArrayToString(data);
      }
      return read(f);
    };
  }

  readBinary = function readBinary(f) {
    var data;
    data = tryParseAsDataURI(f);
    if (data) {
      return data;
    }
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit === 'function') {
    quit_ = function(status) {
      quit(status);
    };
  }

  if (typeof print !== 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console === 'undefined') console = /** @type{!Console} */({});
    console.log = /** @type{!function(this:Console, ...*): undefined} */ (print);
    console.warn = console.error = /** @type{!function(this:Console, ...*): undefined} */ (typeof printErr !== 'undefined' ? printErr : print);
  }


} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
  } else {
    scriptDirectory = '';
  }


  // Differentiate the Web Worker from the Node Worker case, as reading must
  // be done differently.
  {




  read_ = function shell_read(url) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.responseText;
    } catch (err) {
      var data = tryParseAsDataURI(url);
      if (data) {
        return intArrayToString(data);
      }
      throw err;
    }
  };

  if (ENVIRONMENT_IS_WORKER) {
    readBinary = function readBinary(url) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'arraybuffer';
        xhr.send(null);
        return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
      } catch (err) {
        var data = tryParseAsDataURI(url);
        if (data) {
          return data;
        }
        throw err;
      }
    };
  }

  readAsync = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      var data = tryParseAsDataURI(url);
      if (data) {
        onload(data.buffer);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };




  }

  setWindowTitle = function(title) { document.title = title };
} else
{
}


// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.warn.bind(console);

// Merge back in the overrides
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.
if (Module['arguments']) arguments_ = Module['arguments'];
if (Module['thisProgram']) thisProgram = Module['thisProgram'];
if (Module['quit']) quit_ = Module['quit'];

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message





// {{PREAMBLE_ADDITIONS}}

var STACK_ALIGN = 16;

function dynamicAlloc(size) {
  var ret = HEAP32[DYNAMICTOP_PTR>>2];
  var end = (ret + size + 15) & -16;
  HEAP32[DYNAMICTOP_PTR>>2] = end;
  return ret;
}

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
  return Math.ceil(size / factor) * factor;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length-1] === '*') {
        return 4; // A pointer
      } else if (type[0] === 'i') {
        var bits = Number(type.substr(1));
        assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}








// Wraps a JS function as a wasm function with a given signature.
function convertJsFunctionToWasm(func, sig) {

  // If the type reflection proposal is available, use the new
  // "WebAssembly.Function" constructor.
  // Otherwise, construct a minimal wasm module importing the JS function and
  // re-exporting it.
  if (typeof WebAssembly.Function === "function") {
    var typeNames = {
      'i': 'i32',
      'j': 'i64',
      'f': 'f32',
      'd': 'f64'
    };
    var type = {
      parameters: [],
      results: sig[0] == 'v' ? [] : [typeNames[sig[0]]]
    };
    for (var i = 1; i < sig.length; ++i) {
      type.parameters.push(typeNames[sig[i]]);
    }
    return new WebAssembly.Function(type, func);
  }

  // The module is static, with the exception of the type section, which is
  // generated based on the signature passed in.
  var typeSection = [
    0x01, // id: section,
    0x00, // length: 0 (placeholder)
    0x01, // count: 1
    0x60, // form: func
  ];
  var sigRet = sig.slice(0, 1);
  var sigParam = sig.slice(1);
  var typeCodes = {
    'i': 0x7f, // i32
    'j': 0x7e, // i64
    'f': 0x7d, // f32
    'd': 0x7c, // f64
  };

  // Parameters, length + signatures
  typeSection.push(sigParam.length);
  for (var i = 0; i < sigParam.length; ++i) {
    typeSection.push(typeCodes[sigParam[i]]);
  }

  // Return values, length + signatures
  // With no multi-return in MVP, either 0 (void) or 1 (anything else)
  if (sigRet == 'v') {
    typeSection.push(0x00);
  } else {
    typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
  }

  // Write the overall length of the type section back into the section header
  // (excepting the 2 bytes for the section id and length)
  typeSection[1] = typeSection.length - 2;

  // Rest of the module is static
  var bytes = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // magic ("\0asm")
    0x01, 0x00, 0x00, 0x00, // version: 1
  ].concat(typeSection, [
    0x02, 0x07, // import section
      // (import "e" "f" (func 0 (type 0)))
      0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
    0x07, 0x05, // export section
      // (export "f" (func 0 (type 0)))
      0x01, 0x01, 0x66, 0x00, 0x00,
  ]));

   // We can compile this wasm module synchronously because it is very small.
  // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
  var module = new WebAssembly.Module(bytes);
  var instance = new WebAssembly.Instance(module, {
    'e': {
      'f': func
    }
  });
  var wrappedFunc = instance.exports['f'];
  return wrappedFunc;
}

var freeTableIndexes = [];

// Weak map of functions in the table to their indexes, created on first use.
var functionsInTableMap;

// Add a wasm function to the table.
function addFunctionWasm(func, sig) {
  var table = wasmTable;

  // Check if the function is already in the table, to ensure each function
  // gets a unique index. First, create the map if this is the first use.
  if (!functionsInTableMap) {
    functionsInTableMap = new WeakMap();
    for (var i = 0; i < table.length; i++) {
      var item = table.get(i);
      // Ignore null values.
      if (item) {
        functionsInTableMap.set(item, i);
      }
    }
  }
  if (functionsInTableMap.has(func)) {
    return functionsInTableMap.get(func);
  }

  // It's not in the table, add it now.


  var ret;
  // Reuse a free index if there is one, otherwise grow.
  if (freeTableIndexes.length) {
    ret = freeTableIndexes.pop();
  } else {
    ret = table.length;
    // Grow the table
    try {
      table.grow(1);
    } catch (err) {
      if (!(err instanceof RangeError)) {
        throw err;
      }
      throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.';
    }
  }

  // Set the new value.
  try {
    // Attempting to call this with JS function will cause of table.set() to fail
    table.set(ret, func);
  } catch (err) {
    if (!(err instanceof TypeError)) {
      throw err;
    }
    var wrapped = convertJsFunctionToWasm(func, sig);
    table.set(ret, wrapped);
  }

  functionsInTableMap.set(func, ret);

  return ret;
}

function removeFunctionWasm(index) {
  functionsInTableMap.delete(wasmTable.get(index));
  freeTableIndexes.push(index);
}

// 'sig' parameter is required for the llvm backend but only when func is not
// already a WebAssembly function.
function addFunction(func, sig) {

  return addFunctionWasm(func, sig);
}

function removeFunction(index) {
  removeFunctionWasm(index);
}



var funcWrappers = {};

function getFuncWrapper(func, sig) {
  if (!func) return; // on null pointer, return undefined
  assert(sig);
  if (!funcWrappers[sig]) {
    funcWrappers[sig] = {};
  }
  var sigCache = funcWrappers[sig];
  if (!sigCache[func]) {
    // optimize away arguments usage in common cases
    if (sig.length === 1) {
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func);
      };
    } else if (sig.length === 2) {
      sigCache[func] = function dynCall_wrapper(arg) {
        return dynCall(sig, func, [arg]);
      };
    } else {
      // general case
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func, Array.prototype.slice.call(arguments));
      };
    }
  }
  return sigCache[func];
}







function makeBigInt(low, high, unsigned) {
  return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
}

/** @param {Array=} args */
function dynCall(sig, ptr, args) {
  if (args && args.length) {
    return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
  } else {
    return Module['dynCall_' + sig].call(null, ptr);
  }
}

var tempRet0 = 0;

var setTempRet0 = function(value) {
  tempRet0 = value;
};

var getTempRet0 = function() {
  return tempRet0;
};


// The address globals begin at. Very low in memory, for code size and optimization opportunities.
// Above 0 is static memory, starting with globals.
// Then the stack.
// Then 'dynamic' memory for sbrk.
var GLOBAL_BASE = 1024;





// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html


var wasmBinary;if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];
var noExitRuntime;if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime'];


if (typeof WebAssembly !== 'object') {
  abort('no native wasm support detected');
}




// In MINIMAL_RUNTIME, setValue() and getValue() are only available when building with safe heap enabled, for heap safety checking.
// In traditional runtime, setValue() and getValue() are always available (although their use is highly discouraged due to perf penalties)

/** @param {number} ptr
    @param {number} value
    @param {string} type
    @param {number|boolean=} noSafe */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}

/** @param {number} ptr
    @param {string} type
    @param {number|boolean=} noSafe */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for getValue: ' + type);
    }
  return null;
}






// Wasm globals

var wasmMemory;

// In fastcomp asm.js, we don't need a wasm Table at all.
// In the wasm backend, we polyfill the WebAssembly object,
// so this creates a (non-native-wasm) table for us.

var wasmTable = new WebAssembly.Table({
  'initial': 20,
  'maximum': 20 + 0,
  'element': 'anyfunc'
});




//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS = 0;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

// C calling interface.
/** @param {string|null=} returnType
    @param {Array=} argTypes
    @param {Arguments|Array=} args
    @param {Object=} opts */
function ccall(ident, returnType, argTypes, args, opts) {
  // For fast lookup of conversion functions
  var toC = {
    'string': function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    },
    'array': function(arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };

  function convertReturnValue(ret) {
    if (returnType === 'string') return UTF8ToString(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);

  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}

/** @param {string=} returnType
    @param {Array=} argTypes
    @param {Object=} opts */
function cwrap(ident, returnType, argTypes, opts) {
  argTypes = argTypes || [];
  // When the function takes numbers and returns a number, we can just return
  // the original function
  var numericArgs = argTypes.every(function(type){ return type === 'number'});
  var numericRet = returnType !== 'string';
  if (numericRet && numericArgs && !opts) {
    return getCFunc(ident);
  }
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_DYNAMIC = 2; // Cannot be freed except through sbrk
var ALLOC_NONE = 3; // Do not allocate

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc,
    stackAlloc,
    dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var stop;
    ptr = ret;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!runtimeInitialized) return dynamicAlloc(size);
  return _malloc(size);
}




// runtime_strings.js: Strings related runtime functions that are part of both MINIMAL_RUNTIME and regular runtime.

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;

/**
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(heap, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
  while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(heap.subarray(idx, endPtr));
  } else {
    var str = '';
    // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
    while (idx < endPtr) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = heap[idx++];
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = heap[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      var u2 = heap[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heap[idx++] & 63);
      }

      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
  return str;
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
// copy of that string as a Javascript String object.
// maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
//                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
//                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
//                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
//                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
//                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
//                 throw JS JIT optimizations off, so it is worth to consider consistently using one
//                 style or the other.
/**
 * @param {number} ptr
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   heap: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 0xC0 | (u >> 6);
      heap[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 0xE0 | (u >> 12);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      heap[outIdx++] = 0xF0 | (u >> 18);
      heap[outIdx++] = 0x80 | ((u >> 12) & 63);
      heap[outIdx++] = 0x80 | ((u >> 6) & 63);
      heap[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  heap[outIdx] = 0;
  return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) ++len;
    else if (u <= 0x7FF) len += 2;
    else if (u <= 0xFFFF) len += 3;
    else len += 4;
  }
  return len;
}





// runtime_strings_extra.js: Strings related runtime functions that are available only in regular runtime.

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAPU8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;

function UTF16ToString(ptr, maxBytesToRead) {
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  var maxIdx = idx + maxBytesToRead / 2;
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  while (!(idx >= maxIdx) && HEAPU16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0 || i == maxBytesToRead / 2) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr, maxBytesToRead) {
  var i = 0;

  var str = '';
  // If maxBytesToRead is not passed explicitly, it will be undefined, and this
  // will always evaluate to true. This saves on code size.
  while (!(i >= maxBytesToRead / 4)) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0) break;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
  return str;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated
    @param {boolean=} dontAddNull */
function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  HEAP8.set(array, buffer);
}

/** @param {boolean=} dontAddNull */
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}



// Memory management

var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  Module['HEAP8'] = HEAP8 = new Int8Array(buf);
  Module['HEAP16'] = HEAP16 = new Int16Array(buf);
  Module['HEAP32'] = HEAP32 = new Int32Array(buf);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
}

var STATIC_BASE = 1024,
    STACK_BASE = 5246912,
    STACKTOP = STACK_BASE,
    STACK_MAX = 4032,
    DYNAMIC_BASE = 5246912,
    DYNAMICTOP_PTR = 3872;



var TOTAL_STACK = 5242880;

var INITIAL_INITIAL_MEMORY = Module['INITIAL_MEMORY'] || 16777216;









// In non-standalone/normal mode, we create the memory here.



// Create the main memory. (Note: this isn't used in STANDALONE_WASM mode since the wasm
// memory is created in the wasm, not in JS.)

  if (Module['wasmMemory']) {
    wasmMemory = Module['wasmMemory'];
  } else
  {
    wasmMemory = new WebAssembly.Memory({
      'initial': INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE
      ,
      'maximum': INITIAL_INITIAL_MEMORY / WASM_PAGE_SIZE
    });
  }


if (wasmMemory) {
  buffer = wasmMemory.buffer;
}

// If the user provides an incorrect length, just use that length instead rather than providing the user to
// specifically provide the memory length with Module['INITIAL_MEMORY'].
INITIAL_INITIAL_MEMORY = buffer.byteLength;
updateGlobalBufferAndViews(buffer);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;














function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback(Module); // Pass the module as the first argument.
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func);
      } else {
        Module['dynCall_vi'](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {

  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  runtimeInitialized = true;
  
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  runtimeExited = true;
}

function postRun() {

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

/** @param {number|boolean=} ignore */
function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
/** @param {number|boolean=} ignore */
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}




// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_max = Math.max;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;



// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function getUniqueRunDependency(id) {
  return id;
}

function addRunDependency(id) {
  runDependencies++;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

}

function removeRunDependency(id) {
  runDependencies--;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data

/** @param {string|number=} what */
function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  what += '';
  err(what);

  ABORT = true;
  EXITSTATUS = 1;

  what = 'abort(' + what + '). Build with -s ASSERTIONS=1 for more info.';

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  var e = new WebAssembly.RuntimeError(what);

  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}


var memoryInitializer = null;












function hasPrefix(str, prefix) {
  return String.prototype.startsWith ?
      str.startsWith(prefix) :
      str.indexOf(prefix) === 0;
}

// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  return hasPrefix(filename, dataURIPrefix);
}

var fileURIPrefix = "file://";

// Indicates whether filename is delivered via file protocol (as opposed to http/https)
function isFileURI(filename) {
  return hasPrefix(filename, fileURIPrefix);
}




var wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABUw1gAAF/YAF/AGABfwF/YAV/f39/fwBgBH9/f38AYAZ/f39/f38AYAN/f38Bf2AAAGACf38AYAN/f38AYAJ/fwF/YAR/f39/AX9gB39/f39/f38AAtICDANlbnYVX2VtYmluZF9yZWdpc3Rlcl92b2lkAAgDZW52FV9lbWJpbmRfcmVnaXN0ZXJfYm9vbAADA2VudhtfZW1iaW5kX3JlZ2lzdGVyX3N0ZF9zdHJpbmcACANlbnYcX2VtYmluZF9yZWdpc3Rlcl9zdGRfd3N0cmluZwAJA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2VtdmFsAAgDZW52GF9lbWJpbmRfcmVnaXN0ZXJfaW50ZWdlcgADA2VudhZfZW1iaW5kX3JlZ2lzdGVyX2Zsb2F0AAkDZW52HF9lbWJpbmRfcmVnaXN0ZXJfbWVtb3J5X3ZpZXcACQNlbnYWZW1zY3JpcHRlbl9yZXNpemVfaGVhcAACA2VudhVlbXNjcmlwdGVuX21lbWNweV9iaWcABgNlbnYGbWVtb3J5AgGAAoACA2VudgV0YWJsZQFwABQDpQGjAQAHAgIHAAABAQEBAQEBAQEBAQAAAAAAAAEBAQEBAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHAgECCgIBAQYGCgYLBAQEBAQDBAMFAwMDBQUFAAIBAgYGAgABAgIKCAsMBQMGDwJ/AUHAn8ACC38AQZQeCwemAhERX193YXNtX2NhbGxfY3RvcnMACwZtYWxsb2MAnQENX19nZXRUeXBlTmFtZQAMKl9fZW1iaW5kX3JlZ2lzdGVyX25hdGl2ZV9hbmRfYnVpbHRpbl90eXBlcwAOEF9fZXJybm9fbG9jYXRpb24AnAEJc3RhY2tTYXZlAKMBDHN0YWNrUmVzdG9yZQCkAQpzdGFja0FsbG9jAKUBBGZyZWUAngEKX19kYXRhX2VuZAMBEF9fZ3Jvd1dhc21NZW1vcnkApgEKZHluQ2FsbF9paQCnAQpkeW5DYWxsX3ZpAKgBDGR5bkNhbGxfaWlpaQCpAQ9keW5DYWxsX3ZpaWlpaWkAqgEOZHluQ2FsbF92aWlpaWkAqwEN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Ahg2AhggAiABKAIcNgIcIAIgASgCIDYCICACIAEoAiQ2AiQgAiABKAIoNgIoIAIgASgCLDYCLCACIAEoAjA2AjAgAiABKAI0NgI0IAIgASgCODYCOCACIAEoAjw2AjwgAUFAayEBIAJBQGsiAiAFTQ0ACwsgAiAETw0BA0AgAiABKAIANgIAIAFBBGohASACQQRqIgIgBEkNAAsMAQsgA0EESQRAIAAhAgwBCyADQXxqIgQgAEkEQCAAIQIMAQsgACECA0AgAiABLQAAOgAAIAIgAS0AAToAASACIAEtAAI6AAIgAiABLQADOgADIAFBBGohASACQQRqIgIgBE0NAAsLIAIgA0kEQANAIAIgAS0AADoAACABQQFqIQEgAkEBaiICIANHDQALCyAAC/MCAgJ/AX4CQCACRQ0AIAAgAmoiA0F/aiABOgAAIAAgAToAACACQQNJDQAgA0F+aiABOgAAIAAgAToAASADQX1qIAE6AAAgACABOgACIAJBB0kNACADQXxqIAE6AAAgACABOgADIAJBCUkNACAAQQAgAGtBA3EiBGoiAyABQf8BcUGBgoQIbCIBNgIAIAMgAiAEa0F8cSIEaiICQXxqIAE2AgAgBEEJSQ0AIAMgATYCCCADIAE2AgQgAkF4aiABNgIAIAJBdGogATYCACAEQRlJDQAgAyABNgIYIAMgATYCFCADIAE2AhAgAyABNgIMIAJBcGogATYCACACQWxqIAE2AgAgAkFoaiABNgIAIAJBZGogATYCACAEIANBBHFBGHIiBGsiAkEgSQ0AIAGtIgVCIIYgBYQhBSADIARqIQEDQCABIAU3AxggASAFNwMQIAEgBTcDCCABIAU3AwAgAUEgaiEBIAJBYGoiAkEfSw0ACwsgAAuUAQEDfyAAIQECQAJAIABBA3FFDQAgAC0AAEUEQEEADwsgACEBA0AgAUEBaiIBQQNxRQ0BIAEtAAANAAsMAQsDQCABIgJBBGohASACKAIAIgNBf3MgA0H//ft3anFBgIGChHhxRQ0ACyADQf8BcUUEQCACIABrDwsDQCACLQABIQMgAkEBaiIBIQIgAw0ACwsgASAAawsEACMACwYAIAAkAAsQACMAIABrQXBxIgAkACAACwYAIABAAAsJACABIAARAgALCQAgASAAEQEACw0AIAEgAiADIAARBgALEwAgASACIAMgBCAFIAYgABEFAAsRACABIAIgAyAEIAUgABEDAAsPACABIAIgAyAEIAARBAALC6ISAQBBgAgLmhJ2b2lkAGJvb2wAY2hhcgBzaWduZWQgY2hhcgB1bnNpZ25lZCBjaGFyAHNob3J0AHVuc2lnbmVkIHNob3J0AGludAB1bnNpZ25lZCBpbnQAbG9uZwB1bnNpZ25lZCBsb25nAGZsb2F0AGRvdWJsZQBzdGQ6OnN0cmluZwBzdGQ6OmJhc2ljX3N0cmluZzx1bnNpZ25lZCBjaGFyPgBzdGQ6OndzdHJpbmcAc3RkOjp1MTZzdHJpbmcAc3RkOjp1MzJzdHJpbmcAZW1zY3JpcHRlbjo6dmFsAGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGNoYXI+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBjaGFyPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxzaG9ydD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgc2hvcnQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8dW5zaWduZWQgaW50PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1bnNpZ25lZCBsb25nPgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQ4X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGludDE2X3Q+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PHVpbnQxNl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzxpbnQzMl90PgBlbXNjcmlwdGVuOjptZW1vcnlfdmlldzx1aW50MzJfdD4AZW1zY3JpcHRlbjo6bWVtb3J5X3ZpZXc8ZmxvYXQ+AGVtc2NyaXB0ZW46Om1lbW9yeV92aWV3PGRvdWJsZT4ATlN0M19fMjEyYmFzaWNfc3RyaW5nSWNOU18xMWNoYXJfdHJhaXRzSWNFRU5TXzlhbGxvY2F0b3JJY0VFRUUATlN0M19fMjIxX19iYXNpY19zdHJpbmdfY29tbW9uSUxiMUVFRQAARAwAAFUHAADIDAAAFgcAAAAAAAABAAAAfAcAAAAAAABOU3QzX18yMTJiYXNpY19zdHJpbmdJaE5TXzExY2hhcl90cmFpdHNJaEVFTlNfOWFsbG9jYXRvckloRUVFRQAAyAwAAJwHAAAAAAAAAQAAAHwHAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSXdOU18xMWNoYXJfdHJhaXRzSXdFRU5TXzlhbGxvY2F0b3JJd0VFRUUAAMgMAAD0BwAAAAAAAAEAAAB8BwAAAAAAAE5TdDNfXzIxMmJhc2ljX3N0cmluZ0lEc05TXzExY2hhcl90cmFpdHNJRHNFRU5TXzlhbGxvY2F0b3JJRHNFRUVFAAAAyAwAAEwIAAAAAAAAAQAAAHwHAAAAAAAATlN0M19fMjEyYmFzaWNfc3RyaW5nSURpTlNfMTFjaGFyX3RyYWl0c0lEaUVFTlNfOWFsbG9jYXRvcklEaUVFRUUAAADIDAAAqAgAAAAAAAABAAAAfAcAAAAAAABOMTBlbXNjcmlwdGVuM3ZhbEUAAEQMAAAECQAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJY0VFAABEDAAAIAkAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWFFRQAARAwAAEgJAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0loRUUAAEQMAABwCQAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJc0VFAABEDAAAmAkAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SXRFRQAARAwAAMAJAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0lpRUUAAEQMAADoCQAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJakVFAABEDAAAEAoAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWxFRQAARAwAADgKAABOMTBlbXNjcmlwdGVuMTFtZW1vcnlfdmlld0ltRUUAAEQMAABgCgAATjEwZW1zY3JpcHRlbjExbWVtb3J5X3ZpZXdJZkVFAABEDAAAiAoAAE4xMGVtc2NyaXB0ZW4xMW1lbW9yeV92aWV3SWRFRQAARAwAALAKAABTdDl0eXBlX2luZm8AAAAARAwAANgKAABOMTBfX2N4eGFiaXYxMTZfX3NoaW1fdHlwZV9pbmZvRQAAAABsDAAA8AoAAOgKAABOMTBfX2N4eGFiaXYxMTdfX2NsYXNzX3R5cGVfaW5mb0UAAABsDAAAIAsAABQLAAAAAAAAlAsAAAIAAAADAAAABAAAAAUAAAAGAAAATjEwX19jeHhhYml2MTIzX19mdW5kYW1lbnRhbF90eXBlX2luZm9FAGwMAABsCwAAFAsAAHYAAABYCwAAoAsAAGIAAABYCwAArAsAAGMAAABYCwAAuAsAAGgAAABYCwAAxAsAAGEAAABYCwAA0AsAAHMAAABYCwAA3AsAAHQAAABYCwAA6AsAAGkAAABYCwAA9AsAAGoAAABYCwAAAAwAAGwAAABYCwAADAwAAG0AAABYCwAAGAwAAGYAAABYCwAAJAwAAGQAAABYCwAAMAwAAAAAAABECwAAAgAAAAcAAAAEAAAABQAAAAgAAAAJAAAACgAAAAsAAAAAAAAAtAwAAAIAAAAMAAAABAAAAAUAAAAIAAAADQAAAA4AAAAPAAAATjEwX19jeHhhYml2MTIwX19zaV9jbGFzc190eXBlX2luZm9FAAAAAGwMAACMDAAARAsAAAAAAAAQDQAAAgAAABAAAAAEAAAABQAAAAgAAAARAAAAEgAAABMAAABOMTBfX2N4eGFiaXYxMjFfX3ZtaV9jbGFzc190eXBlX2luZm9FAAAAbAwAAOgMAABECw==';
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary() {
  try {
    if (wasmBinary) {
      return new Uint8Array(wasmBinary);
    }

    var binary = tryParseAsDataURI(wasmBinaryFile);
    if (binary) {
      return binary;
    }
    if (readBinary) {
      return readBinary(wasmBinaryFile);
    } else {
      throw "sync fetching of the wasm failed: you can preload it to Module['wasmBinary'] manually, or emcc.py will do that for you when generating HTML (but not JS)";
    }
  }
  catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  // If we don't have the binary yet, and have the Fetch api, use that;
  // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function'
      // Let's not use fetch to get objects over file:// as it's most likely Cordova which doesn't support fetch for file://
      && !isFileURI(wasmBinaryFile)
      ) {
    return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
      if (!response['ok']) {
        throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
      }
      return response['arrayBuffer']();
    }).catch(function () {
      return getBinary();
    });
  }
  // Otherwise, getBinary should be able to get it synchronously
  return new Promise(function(resolve, reject) {
    resolve(getBinary());
  });
}



// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1': asmLibraryArg
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    var exports = instance.exports;
    Module['asm'] = exports;
    removeRunDependency('wasm-instantiate');
  }
  // we can't run yet (except in a pthread, where we have a custom sync instantiator)
  addRunDependency('wasm-instantiate');


  function receiveInstantiatedSource(output) {
    // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
    receiveInstance(output['instance']);
  }


  function instantiateArrayBuffer(receiver) {
    return getBinaryPromise().then(function(binary) {
      return WebAssembly.instantiate(binary, info);
    }).then(receiver, function(reason) {
      err('failed to asynchronously prepare wasm: ' + reason);


      abort(reason);
    });
  }

  // Prefer streaming instantiation if available.
  function instantiateSync() {
    var instance;
    var module;
    var binary;
    try {
      binary = getBinary();
      module = new WebAssembly.Module(binary);
      instance = new WebAssembly.Instance(module, info);
    } catch (e) {
      var str = e.toString();
      err('failed to compile wasm module: ' + str);
      if (str.indexOf('imported Memory') >= 0 ||
          str.indexOf('memory import') >= 0) {
        err('Memory size incompatibility issues may be due to changing INITIAL_MEMORY at runtime to something too large. Use ALLOW_MEMORY_GROWTH to allow any size memory (and also make sure not to set INITIAL_MEMORY at runtime to something smaller than it was at compile time).');
      }
      throw e;
    }
    receiveInstance(instance, module);
  }
  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
  // to any other async startup actions they are performing.
  if (Module['instantiateWasm']) {
    try {
      var exports = Module['instantiateWasm'](info, receiveInstance);
      return exports;
    } catch(e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
      return false;
    }
  }

  instantiateSync();
  return Module['asm']; // exports were assigned here
}


// Globals used by JS i64 conversions
var tempDouble;
var tempI64;

// === Body ===

var ASM_CONSTS = {
  
};




// STATICTOP = STATIC_BASE + 3008;
/* global initializers */  __ATINIT__.push({ func: function() { ___wasm_call_ctors() } });




/* no memory initializer */
// {{PRE_LIBRARY}}


  function demangle(func) {
      return func;
    }

  function demangleAll(text) {
      var regex =
        /\b_Z[\w\d_]+/g;
      return text.replace(regex,
        function(x) {
          var y = demangle(x);
          return x === y ? x : (y + ' [' + x + ']');
        });
    }

  function jsStackTrace() {
      var err = new Error();
      if (!err.stack) {
        // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
        // so try that as a special-case.
        try {
          throw new Error();
        } catch(e) {
          err = e;
        }
        if (!err.stack) {
          return '(no stack trace available)';
        }
      }
      return err.stack.toString();
    }

  function stackTrace() {
      var js = jsStackTrace();
      if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
      return demangleAll(js);
    }

  
  function getShiftFromSize(size) {
      switch (size) {
          case 1: return 0;
          case 2: return 1;
          case 4: return 2;
          case 8: return 3;
          default:
              throw new TypeError('Unknown type size: ' + size);
      }
    }
  
  
  
  function embind_init_charCodes() {
      var codes = new Array(256);
      for (var i = 0; i < 256; ++i) {
          codes[i] = String.fromCharCode(i);
      }
      embind_charCodes = codes;
    }var embind_charCodes=undefined;function readLatin1String(ptr) {
      var ret = "";
      var c = ptr;
      while (HEAPU8[c]) {
          ret += embind_charCodes[HEAPU8[c++]];
      }
      return ret;
    }
  
  
  var awaitingDependencies={};
  
  var registeredTypes={};
  
  var typeDependencies={};
  
  
  
  
  
  
  var char_0=48;
  
  var char_9=57;function makeLegalFunctionName(name) {
      if (undefined === name) {
          return '_unknown';
      }
      name = name.replace(/[^a-zA-Z0-9_]/g, '$');
      var f = name.charCodeAt(0);
      if (f >= char_0 && f <= char_9) {
          return '_' + name;
      } else {
          return name;
      }
    }function createNamedFunction(name, body) {
      name = makeLegalFunctionName(name);
      /*jshint evil:true*/
      return new Function(
          "body",
          "return function " + name + "() {\n" +
          "    \"use strict\";" +
          "    return body.apply(this, arguments);\n" +
          "};\n"
      )(body);
    }function extendError(baseErrorType, errorName) {
      var errorClass = createNamedFunction(errorName, function(message) {
          this.name = errorName;
          this.message = message;
  
          var stack = (new Error(message)).stack;
          if (stack !== undefined) {
              this.stack = this.toString() + '\n' +
                  stack.replace(/^Error(:[^\n]*)?\n/, '');
          }
      });
      errorClass.prototype = Object.create(baseErrorType.prototype);
      errorClass.prototype.constructor = errorClass;
      errorClass.prototype.toString = function() {
          if (this.message === undefined) {
              return this.name;
          } else {
              return this.name + ': ' + this.message;
          }
      };
  
      return errorClass;
    }var BindingError=undefined;function throwBindingError(message) {
      throw new BindingError(message);
    }
  
  
  
  var InternalError=undefined;function throwInternalError(message) {
      throw new InternalError(message);
    }function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
      myTypes.forEach(function(type) {
          typeDependencies[type] = dependentTypes;
      });
  
      function onComplete(typeConverters) {
          var myTypeConverters = getTypeConverters(typeConverters);
          if (myTypeConverters.length !== myTypes.length) {
              throwInternalError('Mismatched type converter count');
          }
          for (var i = 0; i < myTypes.length; ++i) {
              registerType(myTypes[i], myTypeConverters[i]);
          }
      }
  
      var typeConverters = new Array(dependentTypes.length);
      var unregisteredTypes = [];
      var registered = 0;
      dependentTypes.forEach(function(dt, i) {
          if (registeredTypes.hasOwnProperty(dt)) {
              typeConverters[i] = registeredTypes[dt];
          } else {
              unregisteredTypes.push(dt);
              if (!awaitingDependencies.hasOwnProperty(dt)) {
                  awaitingDependencies[dt] = [];
              }
              awaitingDependencies[dt].push(function() {
                  typeConverters[i] = registeredTypes[dt];
                  ++registered;
                  if (registered === unregisteredTypes.length) {
                      onComplete(typeConverters);
                  }
              });
          }
      });
      if (0 === unregisteredTypes.length) {
          onComplete(typeConverters);
      }
    }/** @param {Object=} options */
  function registerType(rawType, registeredInstance, options) {
      options = options || {};
  
      if (!('argPackAdvance' in registeredInstance)) {
          throw new TypeError('registerType registeredInstance requires argPackAdvance');
      }
  
      var name = registeredInstance.name;
      if (!rawType) {
          throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
      }
      if (registeredTypes.hasOwnProperty(rawType)) {
          if (options.ignoreDuplicateRegistrations) {
              return;
          } else {
              throwBindingError("Cannot register type '" + name + "' twice");
          }
      }
  
      registeredTypes[rawType] = registeredInstance;
      delete typeDependencies[rawType];
  
      if (awaitingDependencies.hasOwnProperty(rawType)) {
          var callbacks = awaitingDependencies[rawType];
          delete awaitingDependencies[rawType];
          callbacks.forEach(function(cb) {
              cb();
          });
      }
    }function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
      var shift = getShiftFromSize(size);
  
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(wt) {
              // ambiguous emscripten ABI: sometimes return values are
              // true or false, and sometimes integers (0 or 1)
              return !!wt;
          },
          'toWireType': function(destructors, o) {
              return o ? trueValue : falseValue;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': function(pointer) {
              // TODO: if heap is fixed (like in asm.js) this could be executed outside
              var heap;
              if (size === 1) {
                  heap = HEAP8;
              } else if (size === 2) {
                  heap = HEAP16;
              } else if (size === 4) {
                  heap = HEAP32;
              } else {
                  throw new TypeError("Unknown boolean type size: " + name);
              }
              return this['fromWireType'](heap[pointer >> shift]);
          },
          destructorFunction: null, // This type does not need a destructor
      });
    }

  
  
  var emval_free_list=[];
  
  var emval_handle_array=[{},{value:undefined},{value:null},{value:true},{value:false}];function __emval_decref(handle) {
      if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
          emval_handle_array[handle] = undefined;
          emval_free_list.push(handle);
      }
    }
  
  
  
  function count_emval_handles() {
      var count = 0;
      for (var i = 5; i < emval_handle_array.length; ++i) {
          if (emval_handle_array[i] !== undefined) {
              ++count;
          }
      }
      return count;
    }
  
  function get_first_emval() {
      for (var i = 5; i < emval_handle_array.length; ++i) {
          if (emval_handle_array[i] !== undefined) {
              return emval_handle_array[i];
          }
      }
      return null;
    }function init_emval() {
      Module['count_emval_handles'] = count_emval_handles;
      Module['get_first_emval'] = get_first_emval;
    }function __emval_register(value) {
  
      switch(value){
        case undefined :{ return 1; }
        case null :{ return 2; }
        case true :{ return 3; }
        case false :{ return 4; }
        default:{
          var handle = emval_free_list.length ?
              emval_free_list.pop() :
              emval_handle_array.length;
  
          emval_handle_array[handle] = {refcount: 1, value: value};
          return handle;
          }
        }
    }
  
  function simpleReadValueFromPointer(pointer) {
      return this['fromWireType'](HEAPU32[pointer >> 2]);
    }function __embind_register_emval(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(handle) {
              var rv = emval_handle_array[handle].value;
              __emval_decref(handle);
              return rv;
          },
          'toWireType': function(destructors, value) {
              return __emval_register(value);
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: null, // This type does not need a destructor
  
          // TODO: do we need a deleteObject here?  write a test where
          // emval is passed into JS via an interface
      });
    }

  
  function _embind_repr(v) {
      if (v === null) {
          return 'null';
      }
      var t = typeof v;
      if (t === 'object' || t === 'array' || t === 'function') {
          return v.toString();
      } else {
          return '' + v;
      }
    }
  
  function floatReadValueFromPointer(name, shift) {
      switch (shift) {
          case 2: return function(pointer) {
              return this['fromWireType'](HEAPF32[pointer >> 2]);
          };
          case 3: return function(pointer) {
              return this['fromWireType'](HEAPF64[pointer >> 3]);
          };
          default:
              throw new TypeError("Unknown float type: " + name);
      }
    }function __embind_register_float(rawType, name, size) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              return value;
          },
          'toWireType': function(destructors, value) {
              // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
              // avoid the following if() and assume value is of proper type.
              if (typeof value !== "number" && typeof value !== "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              return value;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': floatReadValueFromPointer(name, shift),
          destructorFunction: null, // This type does not need a destructor
      });
    }

  
  function integerReadValueFromPointer(name, shift, signed) {
      // integers are quite common, so generate very specialized functions
      switch (shift) {
          case 0: return signed ?
              function readS8FromPointer(pointer) { return HEAP8[pointer]; } :
              function readU8FromPointer(pointer) { return HEAPU8[pointer]; };
          case 1: return signed ?
              function readS16FromPointer(pointer) { return HEAP16[pointer >> 1]; } :
              function readU16FromPointer(pointer) { return HEAPU16[pointer >> 1]; };
          case 2: return signed ?
              function readS32FromPointer(pointer) { return HEAP32[pointer >> 2]; } :
              function readU32FromPointer(pointer) { return HEAPU32[pointer >> 2]; };
          default:
              throw new TypeError("Unknown integer type: " + name);
      }
    }function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
      name = readLatin1String(name);
      if (maxRange === -1) { // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come out as 'i32 -1'. Always treat those as max u32.
          maxRange = 4294967295;
      }
  
      var shift = getShiftFromSize(size);
  
      var fromWireType = function(value) {
          return value;
      };
  
      if (minRange === 0) {
          var bitshift = 32 - 8*size;
          fromWireType = function(value) {
              return (value << bitshift) >>> bitshift;
          };
      }
  
      var isUnsignedType = (name.indexOf('unsigned') != -1);
  
      registerType(primitiveType, {
          name: name,
          'fromWireType': fromWireType,
          'toWireType': function(destructors, value) {
              // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
              // avoid the following two if()s and assume value is of proper type.
              if (typeof value !== "number" && typeof value !== "boolean") {
                  throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
              }
              if (value < minRange || value > maxRange) {
                  throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
              }
              return isUnsignedType ? (value >>> 0) : (value | 0);
          },
          'argPackAdvance': 8,
          'readValueFromPointer': integerReadValueFromPointer(name, shift, minRange !== 0),
          destructorFunction: null, // This type does not need a destructor
      });
    }

  function __embind_register_memory_view(rawType, dataTypeIndex, name) {
      var typeMapping = [
          Int8Array,
          Uint8Array,
          Int16Array,
          Uint16Array,
          Int32Array,
          Uint32Array,
          Float32Array,
          Float64Array,
      ];
  
      var TA = typeMapping[dataTypeIndex];
  
      function decodeMemoryView(handle) {
          handle = handle >> 2;
          var heap = HEAPU32;
          var size = heap[handle]; // in elements
          var data = heap[handle + 1]; // byte offset into emscripten heap
          return new TA(buffer, data, size);
      }
  
      name = readLatin1String(name);
      registerType(rawType, {
          name: name,
          'fromWireType': decodeMemoryView,
          'argPackAdvance': 8,
          'readValueFromPointer': decodeMemoryView,
      }, {
          ignoreDuplicateRegistrations: true,
      });
    }

  function __embind_register_std_string(rawType, name) {
      name = readLatin1String(name);
      var stdStringIsUTF8
      //process only std::string bindings with UTF8 support, in contrast to e.g. std::basic_string<unsigned char>
      = (name === "std::string");
  
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              var length = HEAPU32[value >> 2];
  
              var str;
              if (stdStringIsUTF8) {
                  var decodeStartPtr = value + 4;
                  // Looping here to support possible embedded '0' bytes
                  for (var i = 0; i <= length; ++i) {
                      var currentBytePtr = value + 4 + i;
                      if (i == length || HEAPU8[currentBytePtr] == 0) {
                          var maxRead = currentBytePtr - decodeStartPtr;
                          var stringSegment = UTF8ToString(decodeStartPtr, maxRead);
                          if (str === undefined) {
                              str = stringSegment;
                          } else {
                              str += String.fromCharCode(0);
                              str += stringSegment;
                          }
                          decodeStartPtr = currentBytePtr + 1;
                      }
                  }
              } else {
                  var a = new Array(length);
                  for (var i = 0; i < length; ++i) {
                      a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
                  }
                  str = a.join('');
              }
  
              _free(value);
  
              return str;
          },
          'toWireType': function(destructors, value) {
              if (value instanceof ArrayBuffer) {
                  value = new Uint8Array(value);
              }
  
              var getLength;
              var valueIsOfTypeString = (typeof value === 'string');
  
              if (!(valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
                  throwBindingError('Cannot pass non-string to std::string');
              }
              if (stdStringIsUTF8 && valueIsOfTypeString) {
                  getLength = function() {return lengthBytesUTF8(value);};
              } else {
                  getLength = function() {return value.length;};
              }
  
              // assumes 4-byte alignment
              var length = getLength();
              var ptr = _malloc(4 + length + 1);
              HEAPU32[ptr >> 2] = length;
              if (stdStringIsUTF8 && valueIsOfTypeString) {
                  stringToUTF8(value, ptr + 4, length + 1);
              } else {
                  if (valueIsOfTypeString) {
                      for (var i = 0; i < length; ++i) {
                          var charCode = value.charCodeAt(i);
                          if (charCode > 255) {
                              _free(ptr);
                              throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
                          }
                          HEAPU8[ptr + 4 + i] = charCode;
                      }
                  } else {
                      for (var i = 0; i < length; ++i) {
                          HEAPU8[ptr + 4 + i] = value[i];
                      }
                  }
              }
  
              if (destructors !== null) {
                  destructors.push(_free, ptr);
              }
              return ptr;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  function __embind_register_std_wstring(rawType, charSize, name) {
      name = readLatin1String(name);
      var decodeString, encodeString, getHeap, lengthBytesUTF, shift;
      if (charSize === 2) {
          decodeString = UTF16ToString;
          encodeString = stringToUTF16;
          lengthBytesUTF = lengthBytesUTF16;
          getHeap = function() { return HEAPU16; };
          shift = 1;
      } else if (charSize === 4) {
          decodeString = UTF32ToString;
          encodeString = stringToUTF32;
          lengthBytesUTF = lengthBytesUTF32;
          getHeap = function() { return HEAPU32; };
          shift = 2;
      }
      registerType(rawType, {
          name: name,
          'fromWireType': function(value) {
              // Code mostly taken from _embind_register_std_string fromWireType
              var length = HEAPU32[value >> 2];
              var HEAP = getHeap();
              var str;
  
              var decodeStartPtr = value + 4;
              // Looping here to support possible embedded '0' bytes
              for (var i = 0; i <= length; ++i) {
                  var currentBytePtr = value + 4 + i * charSize;
                  if (i == length || HEAP[currentBytePtr >> shift] == 0) {
                      var maxReadBytes = currentBytePtr - decodeStartPtr;
                      var stringSegment = decodeString(decodeStartPtr, maxReadBytes);
                      if (str === undefined) {
                          str = stringSegment;
                      } else {
                          str += String.fromCharCode(0);
                          str += stringSegment;
                      }
                      decodeStartPtr = currentBytePtr + charSize;
                  }
              }
  
              _free(value);
  
              return str;
          },
          'toWireType': function(destructors, value) {
              if (!(typeof value === 'string')) {
                  throwBindingError('Cannot pass non-string to C++ string type ' + name);
              }
  
              // assumes 4-byte alignment
              var length = lengthBytesUTF(value);
              var ptr = _malloc(4 + length + charSize);
              HEAPU32[ptr >> 2] = length >> shift;
  
              encodeString(value, ptr + 4, length + charSize);
  
              if (destructors !== null) {
                  destructors.push(_free, ptr);
              }
              return ptr;
          },
          'argPackAdvance': 8,
          'readValueFromPointer': simpleReadValueFromPointer,
          destructorFunction: function(ptr) { _free(ptr); },
      });
    }

  function __embind_register_void(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
          isVoid: true, // void return values can be optimized out sometimes
          name: name,
          'argPackAdvance': 0,
          'fromWireType': function() {
              return undefined;
          },
          'toWireType': function(destructors, o) {
              // TODO: assert if anything else is given?
              return undefined;
          },
      });
    }

  function _emscripten_get_sbrk_ptr() {
      return 3872;
    }

  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.copyWithin(dest, src, src + num);
    }

  
  function _emscripten_get_heap_size() {
      return HEAPU8.length;
    }
  
  function abortOnCannotGrowMemory(requestedSize) {
      abort('OOM');
    }function _emscripten_resize_heap(requestedSize) {
      requestedSize = requestedSize >>> 0;
      abortOnCannotGrowMemory(requestedSize);
    }
embind_init_charCodes();
BindingError = Module['BindingError'] = extendError(Error, 'BindingError');;
InternalError = Module['InternalError'] = extendError(Error, 'InternalError');;
init_emval();;
var ASSERTIONS = false;



/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}


// Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

/**
 * Decodes a base64 string.
 * @param {string} input The string to decode.
 */
var decodeBase64 = typeof atob === 'function' ? atob : function (input) {
  var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  var output = '';
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  do {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);
  return output;
};

// Converts a string of base64 into a byte array.
// Throws error on invalid input.
function intArrayFromBase64(s) {
  if (typeof ENVIRONMENT_IS_NODE === 'boolean' && ENVIRONMENT_IS_NODE) {
    var buf;
    try {
      // TODO: Update Node.js externs, Closure does not recognize the following Buffer.from()
      /**@suppress{checkTypes}*/
      buf = Buffer.from(s, 'base64');
    } catch (_) {
      buf = new Buffer(s, 'base64');
    }
    return new Uint8Array(buf['buffer'], buf['byteOffset'], buf['byteLength']);
  }

  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0 ; i < decoded.length ; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error('Converting base64 string to bytes failed.');
  }
}

// If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }

  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}


var asmGlobalArg = {};
var asmLibraryArg = { "_embind_register_bool": __embind_register_bool, "_embind_register_emval": __embind_register_emval, "_embind_register_float": __embind_register_float, "_embind_register_integer": __embind_register_integer, "_embind_register_memory_view": __embind_register_memory_view, "_embind_register_std_string": __embind_register_std_string, "_embind_register_std_wstring": __embind_register_std_wstring, "_embind_register_void": __embind_register_void, "emscripten_get_sbrk_ptr": _emscripten_get_sbrk_ptr, "emscripten_memcpy_big": _emscripten_memcpy_big, "emscripten_resize_heap": _emscripten_resize_heap, "memory": wasmMemory, "table": wasmTable };
var asm = createWasm();
/** @type {function(...*):?} */
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = asm["__wasm_call_ctors"]

/** @type {function(...*):?} */
var _malloc = Module["_malloc"] = asm["malloc"]

/** @type {function(...*):?} */
var ___getTypeName = Module["___getTypeName"] = asm["__getTypeName"]

/** @type {function(...*):?} */
var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = asm["__embind_register_native_and_builtin_types"]

/** @type {function(...*):?} */
var ___errno_location = Module["___errno_location"] = asm["__errno_location"]

/** @type {function(...*):?} */
var stackSave = Module["stackSave"] = asm["stackSave"]

/** @type {function(...*):?} */
var stackRestore = Module["stackRestore"] = asm["stackRestore"]

/** @type {function(...*):?} */
var stackAlloc = Module["stackAlloc"] = asm["stackAlloc"]

/** @type {function(...*):?} */
var _free = Module["_free"] = asm["free"]

/** @type {function(...*):?} */
var __growWasmMemory = Module["__growWasmMemory"] = asm["__growWasmMemory"]

/** @type {function(...*):?} */
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"]

/** @type {function(...*):?} */
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"]

/** @type {function(...*):?} */
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"]

/** @type {function(...*):?} */
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"]

/** @type {function(...*):?} */
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"]

/** @type {function(...*):?} */
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"]





// === Auto-generated postamble setup entry stuff ===






























































































































































































































































var calledRun;

/**
 * @constructor
 * @this {ExitStatus}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}

var calledMain = false;


dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};





/** @type {function(Array=)} */
function run(args) {
  args = args || arguments_;

  if (runDependencies > 0) {
    return;
  }


  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    preMain();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();


    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
}
Module['run'] = run;


/** @param {boolean|number=} implicit */
function exit(status, implicit) {

  // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)
  if (implicit && noExitRuntime && status === 0) {
    return;
  }

  if (noExitRuntime) {
  } else {

    ABORT = true;
    EXITSTATUS = status;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  quit_(status, new ExitStatus(status));
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}


  noExitRuntime = true;

run();






// {{MODULE_ADDITIONS}}



module.exports=Module;
