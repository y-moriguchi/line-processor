/*
 * This source code is under the Unlicense
 */
(function(root) {
    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    function LP() {
        var me;

        function Skip(attr) {
            this.attr = attr;
        }

        function setState(state, id, val) {
            var i,
                result = [],
                notSet = true;

            for(i = 0; i < state.length; i++) {
                if(state[i][0] === id) {
                    result[i] = [id, val];
                    notSet = false;
                } else {
                    result[i] = state[i];
                }
            }

            if(notSet) {
                result.push([id, val]);
            }
            return result;
        }

        function delState(state, id) {
            var i,
                result = [];

            for(i = 0; i < state.length; i++) {
                if(state[i][0] !== id) {
                    result[i] = state[i];
                }
            }
            return result;
        }

        function getState(state, id) {
            var i;

            for(i = 0; i < state.length; i++) {
                if(state[i][0] === id) {
                    return state[i][1];
                }
            }
            return null;
        }

        function wrap(pred) {
            if(pred === null) {
                return function() {
                    return false;
                };
            } else if(typeof pred === "string") {
                return function(lineNo, line, attr) {
                    return line === pred;
                };
            } else if(typeof pred === "number") {
                return function(lineNo, line, attr) {
                    return lineNo === pred;
                };
            } else if(pred instanceof RegExp) {
                return function(lineNo, line, attr) {
                    return pred.test(line);
                };
            } else {
                return pred;
            }
        }

        me = {
            skip: function(attr) {
                return new Skip(attr);
            },

            nop: function(lineNo, line, attr) {
                return attr;
            },

            all: function(action) {
                return function(lineNo, line, attr, state) {
                    return {
                        attr: action(lineNo, line, attr),
                        state: state
                    };
                };
            },

            single: function(pred, action) {
                pred = wrap(pred);
                return function(lineNo, line, attr, state) {
                    if(pred(lineNo, line, attr)) {
                        return {
                            attr: action(lineNo, line, attr),
                            state: state
                        };
                    } else {
                        return {
                            attr: attr,
                            state: state
                        };
                    }
                };
            },

            range: function(predBegin, predEnd, action) {
                var id = {},
                    result;

                predBegin = wrap(predBegin);
                predEnd = wrap(predEnd);
                return function(lineNo, line, attr, state) {
                    if(getState(state, id)) {
                        if(predEnd(lineNo, line, attr)) {
                            return {
                                attr: action(lineNo, line, attr),
                                state: delState(id)
                            };
                        } else {
                            return {
                                attr: action(lineNo, line, attr),
                                state: state
                            };
                        }
                    } else {
                        if(predBegin(lineNo, line, attr)) {
                            return {
                                attr: action(lineNo, line, attr),
                                state: setState(state, id, 1)
                            };
                        } else {
                            return {
                                attr: attr,
                                state: state
                            };
                        }
                    }
                };
            },

            ifElse: function(predBegin, predEnd, predElse, predElseIf, action, actionBegin, actionEnd, actionElse, actionElseIf) {
                var id = {};

                predBegin = wrap(predBegin);
                predEnd = wrap(predEnd);
                predElse = wrap(predElse);
                predElseIf = wrap(predElseIf);
                actionBegin = actionBegin ? actionBegin : action;
                actionEnd = actionEnd ? actionEnd : action;
                actionElse = actionElse ? actionElse : action;
                actionElseIf = actionElseIf ? actionElseIf : action;
                return function(lineNo, line, attr, state) {
                    var selectedAction;

                    if(predBegin(lineNo, line, attr)) {
                        return {
                            attr: actionBegin(lineNo, line, attr),
                            state: setState(state, id, getState(state, id) ? getState(state, id) + 1 : 1)
                        };
                    } else if(getState(state, id) && predEnd(lineNo, line, attr)) {
                        if(getState(state, id) > 1) {
                            return {
                                attr: actionEnd(lineNo, line, attr),
                                state: setState(state, id, getState(state, id) - 1)
                            };
                        } else {
                            return {
                                attr: actionEnd(lineNo, line, attr),
                                state: delState(state, id)
                            }
                        }
                    } else if(getState(state, id)) {
                        if(predElse(lineNo, line, attr)) {
                            selectedAction = actionElse;
                        } else if(predElseIf(lineNo, line, attr)) {
                            selectedAction = actionElseIf;
                        } else {
                            selectedAction = action;
                        }
                        return {
                            attr: selectedAction(lineNo, line, attr),
                            state: state
                        };
                    } else {
                        return {
                            attr: attr,
                            state: state
                        };
                    }
                };
            },

            block: function(predBegin, predEnd, action, actionBegin, actionEnd) {
                return me.ifElse(predBegin, predEnd, null, null, action, actionBegin, actionEnd, null, null);
            },

            getExecuter: function(rules, option) {
                var state = [],
                    contLine = option && option.continueLine,
                    line = "",
                    lineNo = 0;

                return function(oneline, attr) {
                    var result,
                        j;

                    line += oneline;
                    if(contLine &&
                            line.length > contLine.length &&
                            line.substring(line.length - contLine.length, line.length) === contLine) {
                        line = line.substring(0, line.length - contLine.length);
                    } else {
                        for(j = 0; j < rules.length; j++) {
                            result = rules[j](lineNo + 1, line, attr, state);
                            state = result.state;
                            if(result.attr instanceof Skip) {
                                attr = result.attr.attr;
                                break;
                            } else {
                                attr = result.attr;
                            }
                        }
                        line = "";
                    }
                    lineNo++;
                    return attr;
                }
            },

            execute: function(rules, initAttr, text, option) {
                var executer = me.getExecuter(rules, option),
                    attr = initAttr,
                    lines = typeof text === "string" ? textFunction(text) : isArray(text) ? arrayFunction(text) : text,
                    oneline;

                function arrayFunction(lines) {
                    var count = 0;

                    return function() {
                        return count < lines.length ? lines[count++] : null;
                    }
                }

                function textFunction(text) {
                    return arrayFunction(text.split(option && option.rs ? option.rs : /\r\n|\r|\n/));
                }

                for(i = 0; (oneline = lines()) !== null; i++) {
                    attr = executer(oneline, attr);
                }
                return attr;
            }
        };
        return me;
    }

    if(typeof module !== "undefined" && module.exports) {
        module.exports = LP;
    } else {
        root["LP"] = LP;
    }
})(this);

