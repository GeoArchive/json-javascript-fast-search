# json javascript : simple & fast Search
You have a json object that is an array of objects containing a primary key? Find things FAST with this function, it's just under 200 lines of commented and uncompressed code!

This function was developed for the GeoArchive project.\
**Take a look**: [general info Geoarchive >>](https://www.geoarchief.eu)  /  [image library 'in action' >>](https://www.geoarchief.nl/C001)

Json objects can becomde **big**. In our case easily over 10Mb. Creating a simple "for loop" to match what was needed to be found could take up to several minutes. Then [mrAceT](https://github.com/mrAceT) had a great idea.. splitting things up via the native JavaScript split function.. and after some extra nifty regular expressions.. the created search function gives results in a split second! (litteraly;)

# The settings
The basics are quite self explanetory:
```
  let defaults = {
    delimiter    : '"',    // the character that is the delimiter of the key / value
    id           : 'id',   // primary key
    search       : '',     // search string / 'regex' => [*] = special wildcard : negativeIdPattern
    searchSpecial: true,   // match special characters, like: match an a-acute char to an a and &aacute;
    idPos        : 'auto', // auto | before | after (where is the id relative to the search)
    //                        Only when set to 'auto' there will be validation
    idPosLast    : 'after',// before | after (last result, default expectation: after )
    return       : 'first',// first | firstpos | object | array
    Str          : '',     // stringified json data
    Obj          : null,   // json object
    debug        : 0,      // set to > 0 for debugging
  };
```
you can choose server results to be returned:
**first**: get the first complete object that contains the search result
**firstpos**: get the index position of the first object that contains the search result
**object**: get all the results in an object matching the search
**array**: get all the id's in an array matching the search

The exiting part is the **search** variable!
**simply a string?**: simply put it in there\
Want a wildcard? use the character `*` like: `this*that` (the `*` will be replaced by a nifty regex excluding the id field, to that a match will be only be made within one record\
Want the result to start with your search string? use the `^` like: `^word` (the `^` will be replaced by the 'delimiter')\
Want the result to end with your search string? use the `$` like: `word$` (the `$` will be replaced by the 'delimiter')

**regular expression?**: are the extra options not enough, you can unleash the full power of regular expressions!\
There is one important note: **do not use `.*`** to catch "anything". That could bleed into multiple id's! use: **`[*]`** in stead!\

## Examples:
Lets assume you have an object that could contain the key `image` (using the default settings shown above):

You want to get the **first object** that contains the word image:\
`let result = jsonFastSearch(jsonData, 'image' );`\
The first variable in the function call can be a stringified json string, or a json object (there is no speed difference, both are needed, so the other must be created).\
When the second variable in the function call is a string, that will become the search command, otherwise it needs to be an object with what you want different then your set defaults.

You want to get the first key of an object that contains the word image:\
`let result = jsonFastSearch(jsonData, { search: 'image', return : 'firstpos' );`\
Now you have the position, **not** the key, so to get the key: `result = jsonData[result].id;` 

You want to get all the keys that have an image value:\
`let result = jsonFastSearch(jsonData, { search: '/"image"\s*:\s*"[^"]/',return: 'array' });`\
Where `"` is the same as your delimiter

You want to get all the objects that have an image value:\
`let result = jsonFastSearch(jsonData, { search: '/"image"\s*:\s*"[^"]/',return: 'object' });`\
Where `"` is the same as your delimiter

# I give to you, you..
The GeoARchive project contains quite a bit of FOSS software, so I think it's only fair to give something back every now and then and you might have the need fot this tool also, so here it is!

**Like the work?** You'll be surprised how much time goes into things like this..\
Be my hero, think about the time this script saved you, and (offcourse) how happy you are now that you found it and it works just like you wanted.
Support my work, buy me a cup of coffee, give what its worth to you, or give me half the time this script saved you ;)
- [donate with ko-fi](https://ko-fi.com/mrAceT)
- [donate with paypal](https://www.paypal.com/donate?hosted_button_id=W52D2EYLREJU4)

## Contributing
If you find this script useful and you make some modifications please make a pull request so that others can benefit from it. This would be highly appreciated!

## License
This script is open-sourced software licensed under the GNU GENERAL PUBLIC LICENSE. Please see [LICENSE](LICENSE.md) for details.
