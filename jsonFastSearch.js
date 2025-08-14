/* *********************************************************************************** */
/*    version: 2025-08 * code created by Eesger Toering / knoop.frl / GeoArchive.eu    */
/*                 You are ALLOWED to use this library at your own risk                */
/*     Like the work? You'll be surprised how much time goes into things like this..   */
/*                Keep this text in place & be my hero, support my work:               */
/*          https://github.com/GeoArchive/json-javascript-simple-fast-search           */
/* *********************************************************************************** */
function jsonFastSearch(jsonData, vars = {}) {
  // Default vars
  let defaults = {
    delimiter    : '"',    // the character that is the delimiter of the key / value
    id           : 'id',   // primary key
    search       : '',     // search string / 'regex' => [*] = special wildcard : negativeIdPattern
    searchSpecial: 'auto', // match special characters, like: match an a-acute char to an a and &aacute; auto = not for regex (gets messy fast..)
    seachIgnore  : ['id'], // exclude key values from positive search result for thset to []
    idPos        : 'auto', // auto | before | after (where is the id relative to the search)
    //                        Only when set to 'auto' there will be validation
    idPosLast    : 'after',// before | after (last result, default expectation: after )
    return       : 'first',// first | firstpos | object | array
    Str          : '',     // stringified json data
    Obj          : null,   // json object
    debug        : 0,      // set to > 0 for debugging
  };

  if (typeof vars === 'string') { vars = { search: vars }; }
  vars = { ...defaults, ...vars };
  vars.debug>0 && console.log('jsonFastSearch vars :',vars);

  /* Process input ------------------------------------------------------------------- */
  try {
    if (typeof jsonData === 'string') {
      vars.Str = jsonData;
      vars.Obj = JSON.parse(vars.Str);
    } else {
      vars.Obj = jsonData;
      vars.Str = JSON.stringify(vars.Obj);
    }
    jsonData = null; // free the memory
  } catch (e) {
    console.error('Invalid JSON');
    return null;
  }

  /* Regex compile ------------------------------------------------------------------- */
  function parseSearchRegexSpecial(input, vars= {}) {
    if ( vars.searchSpecial === true
     || (vars.searchSpecial === 'auto' && !(input.startsWith('/') && input.lastIndexOf('/') > 0) )
    ) {
      input = input.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/(ae|[aeoui])/g, '(?:$1|&$1[a-z]{1,5};)');
    }
    return input;
  }

  function parseSearchRegex(input, vars= {}) {
    if (typeof input !== 'string') return null;

    if (input.startsWith('/') && input.lastIndexOf('/') > 0) {
      input = parseSearchRegexSpecial(input,vars);
      if (typeof vars.id != 'undefined' && vars.id.length > 0) {
        const negativeIdPattern = `.(?!${vars.delimiter}${vars.id}${vars.delimiter}\s*:)*`;
        input = input.replace('[*]',negativeIdPattern);
      }
      const lastSlash = input.lastIndexOf('/');
      const pattern = input.slice(1, lastSlash).replace(/(^|[^\\])\((?!\?\:)/g,'$1(?:'); // make groups non capturing!
      const flags = input.slice(lastSlash + 1);
      vars.debug>0 && console.log('jsonFastSearch regex > '+pattern+' | '+flags);
      try {
        return new RegExp('('+pattern+')', flags);
      } catch (e) {
        console.warn('jsonFastSearch Invalid regex flags or pattern:', input);
        return null;
      }
    } else {
      input = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (typeof vars.id != 'undefined' && vars.id.length > 0) {
        const negativeIdPattern = `.(?!${vars.delimiter}${vars.id}${vars.delimiter}\s*:)*`;
        input = input.replace(/([^\.\{\}\)\(])\*/,'$1'+negativeIdPattern);
      }
      input = input.replace(/^\^/,vars.delimiter);
      input = input.replace(/\$$/,vars.delimiter);
      input = parseSearchRegexSpecial(input,vars);
    }
    // Fallback: escape and make case-insensitive by default
    return new RegExp('('+input+')', 'i');
  }
  vars.searchRegex = parseSearchRegex(vars.search,vars);
  if (!vars.searchRegex) {
    console.error('jsonFastSearch: search regex');
    return null;
  }

  if (!vars.search) return vars.return === 'object' ? vars.Obj : vars.Obj.map(x => x[vars.id]);

  /* Search for id in string part ---------------------------------------------------- */
  function extractId(part, direction) {
    let splitParts2 = part.split(new RegExp(`${vars.delimiter}${vars.id}${vars.delimiter}\\s*:\\s*`));
    let result = null;
    
    if (splitParts2.length > 1) {
      const matchPos = direction === 'after' ? 1 : splitParts2.length - 1;
      let match;
      if ( (match = new RegExp(`^${vars.delimiter}?((?:\\.|[^${vars.delimiter},}\\]])+)${vars.delimiter}?`).exec(splitParts2[ matchPos ])) !== null) {
        //if (validateIdInData(match[1], vars)) {
          result = match[1];
        //}
      }
      if (vars.debug) {
        let validated = match !== null ? validateIdInData(match) : null;
        console.log('-extid:'+vars.pos+(direction=='after'?'+1':'')+
                    "\t"+direction+
                    "\t"+matchPos+
                    "\t"+'|'+result+'|'+
                    "\t"+((match = /^"?([^",}\]]+)"?/.exec(splitParts2[ matchPos ])) !== null)+
                    "\t"+validated+
                    "\t"+splitParts2[ matchPos ].length+
                    "\t"+splitParts2[ matchPos ]+' (jsonFastSearch)'
                   );
      }
    }
    return result; // No valid ID match found
  }

  /* Validate id in data ------------------------------------------------------------- */
  function validateIdInData(candidateId) {
    const item = vars.Obj.find(obj => String(obj[vars.id]) === String(candidateId));
    if (!item) return false;
    if (!vars.searchRegex) return true;
    if (vars.seachIgnore.length) {
      for (let i = 0; i < vars.seachIgnore.length; i++) {
        delete item[ vars.seachIgnore[i] ] ;
      }      
    }
    return vars.searchRegex.test(JSON.stringify(item));
  }
  
  /* Create map for faster lookup ---------------------------------------------------- */
  let idMap = null;
  if (['first', 'object'].includes(vars.return)) {
    idMap = new Map();
    for (let i = 0; i < vars.Obj.length; i++) {
      idMap.set(String(vars.Obj[i][vars.id]), vars.Obj[i]);
    }
  } else
  if (vars.return === 'firstpos') {
    idMap = new Map();
    for (let i = 0; i < vars.Obj.length; i++) {
      idMap.set(String(vars.Obj[i][vars.id]), i);
    }
  }
  vars.debug>0 && console.log(vars,' (jsonFastSearch)');
  
  /* Split for search! --------------------------------------------------------------- */
  let splitParts = vars.Str.split(vars.searchRegex);
  let results = [];

  vars.debug>0 && console.log(splitParts,'jsonFastSearch length:'+splitParts.length);

  for (let i = 0; i < splitParts.length - 2; i+=2) {
    let splitStr = splitParts[i + 1];
    let idCandidate = null;
    vars.pos = i;

    if (vars.idPos === 'after' || (vars.idPos === 'auto' && vars.idPosLast === 'after')) {
      idCandidate = extractId(splitStr+splitParts[i + 2], 'after');
      vars.debug>0 && console.log('jsonFastSearch after1:'+i+"+1\t"+idCandidate+"\t"+validateIdInData(idCandidate)+"\t"+splitStr+splitParts[i+2]+' (jsonFastSearch)');
      if (idCandidate && vars.idPos === 'auto' && !validateIdInData(idCandidate)) {
        idCandidate = null;
      }
      if (idCandidate) {
        vars.idPosLast = 'after';
        vars.debug>0 && console.log('jsonFastSearch B:'+vars.idPosLast);
      }
    }

    if (!idCandidate && (vars.idPos === 'before' || vars.idPos === 'auto')) {
      idCandidate = extractId(splitParts[i]+splitStr,'before');
      vars.debug>0 && console.log('jsonFastSearch before:'+i+"\t"+idCandidate+"\t"+validateIdInData(idCandidate)+"\t"+splitParts[i]+splitStr+' (jsonFastSearch)');
      if (idCandidate && vars.idPos === 'auto' && !validateIdInData(idCandidate)) {
        idCandidate = null;
      }
      if (idCandidate) {
        vars.idPosLast = 'before';
        vars.debug>0 && console.log('jsonFastSearch A:'+vars.idPosLast);
      }
    }
 
    if (!idCandidate && vars.idPos === 'auto' && vars.idPosLast === 'before') {
      idCandidate = extractId(splitStr+splitParts[i + 2], 'after');
      vars.debug>0 && console.log('jsonFastSearch after2:'+i+"+1\t"+idCandidate+"\t"+validateIdInData(idCandidate)+"\t"+splitStr+splitParts[i+2]+' (jsonFastSearch)');
      if (idCandidate && vars.idPos === 'auto' && !validateIdInData(idCandidate)) {
        idCandidate = null;
      }
      if (idCandidate) {
        vars.idPosLast = 'after';
        vars.debug>0 && console.log('jsonFastSearch B:'+vars.idPosLast);
      }
    }

    vars.debug>0 && console.log('jsonFastSearch final :'+i+"\t"+vars.idPosLast+"\t"+idCandidate+"\n____________________________________________________"+' (jsonFastSearch)');
    if (idCandidate) {
      if (vars.return === 'first'
       || vars.return === 'firstpos') return idMap.get(idCandidate);
      if (vars.return === 'array'   ) results.push(idCandidate);
      if (vars.return === 'object'  ) results.push(idMap.get(idCandidate));
    }
  }
  return results;
}