# Morilib Line Processor
Morilib Line Processor is a library which parses text by line.  
Morilib Line Processor scans lines by patterns and process the line if the line matches pattern.

## Preparation
To use Morilib Line Processor, call LP function.
```js
var l = LP();
```

## Parses the lines
Call l.execute() method to parse the lines.
```
var result = l.execute(
  an array of rules,
  initial attribute,
  the text,
  options
);
```

The rule is a set of pattern and action. Detail of the rule will shown later.  
Initial attribute is a initial value of attribute. The value of attribute changes by actions.  
The text is a string to be parsed.  
Options are shown as follow table.

|Option|Description|
|:----|:----|
|rs|Regular expression of line separator. Default value is /\r\n\|\r\|\n/|
|continueLine|If this string value is set, a line terminated by the string is concatenated to next line.|

## Rules

### Predicate and Action
The rule is a set of predicate and action.

Predicate is an object shown as follow table.  

|Predicate|Description|
|:---|:---|
|string|matches the line equals the string entirely|
|regular expression|match the line which matches the regular expression|
|number|matches the line whose number is equals to the number|
|function|matches the line with which the result of the function called is true|

Action is a function which has 3 arguments and returns attribute.  
The argument are shown as follow items.  
1. line number
2. matched line string
3. attribute

Rules are executed by order of the array.  
To change flow of execution, l.skip(value) method can be used in action.  
If l.skip() is used, the later pattern matching is canceled.

### Single line
Use l.single() method to match single line.
```
l.single(predicate, action);
```

### All lines
Use l.all() method to match all lines.
```
l.all(action);
```

### Range of line
Use l.range() method to match lines which begins a specified pattern and ends another pattern.
```
l.range(begin predicate, end predicate, action)
```

### Block of line
Use l.block() method to match a block of lines which begins a specified pattern and ends another pattern.  
Nested block can be matched.
```
l.block(begin predicate, end predicate, action, [action of beginning, [action of ending]]);
```

"Action of beginning" and "Action of ending" are optional.  
If these action are not specified, third argument will be specified.

### If/ElseIf/Else/End block
Use l.ifElse() method to match a If/ElseIf/Else/End structure.
```
l.ifElse(
  if predicate,
  elseIf predicate,
  else predicate,
  end predicate,
  action,
  [if action,
  [elseIf action,
  [else action,
  [end action]]]]
);
```

Action of if/elseIf/else/end are optional.  
If these action are not specified, fifth argument will be specified.

