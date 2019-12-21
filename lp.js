(function(root) {
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
            if(typeof pred === "string") {
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

            single: function(pred, action) {
                pred = wrap(pred);
                return function(lineNo, line, attr, state) {
                    if(pred(lineNo, line, attr)) {
                        return {
                            attr: action(lineNo, line, attr),
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

            block: function(predBegin, predEnd, action, actionBegin, actionEnd) {
                var id = {};

                predBegin = wrap(predBegin);
                predEnd = wrap(predEnd);
                actionBegin = actionBegin ? actionBegin : action;
                actionEnd = actionEnd ? actionEnd : action;
                return function(lineNo, line, attr, state) {
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

            execute: function(rules, initAttr, text) {
                var state = [],
                    attr = initAttr,
                    lines = text.split(/\r\n|\r|\n/),
                    result,
                    i,
                    j;

                for(i = 0; i < lines.length; i++) {
                    for(j = 0; j < rules.length; j++) {
                        result = rules[j](i + 1, lines[i], attr, state);
                        state = result.state;
                        if(result.attr instanceof Skip) {
                            attr = result.attr.attr;
                            break;
                        } else {
                            attr = result.attr;
                        }
                    }
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

