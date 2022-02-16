/* eslint-disable */
module.exports = {
    rules: {
        // This produces a warning for identifiers like 'pObject', 'strMessage' or 'iNumberOfObjects'
        "no-hungarian-notation": {
            create: function(context) {
                return {
                    // callback functions
                    Identifier(node) {
                        let capitalIndex = node.name.split('').findIndex((c) => c >= 'A' && c <= 'Z');
                        if (capitalIndex < 0 || capitalIndex > 3) {
                            return;
                        }
                        let prefix = node.name.slice(0, capitalIndex);
                        if (['c', 'b', 'f', 'p', 'i', 'str', 'vec'].indexOf(prefix) > -1) {
                            context.report({
                                node,
                                message: "Avoid Hungarian notation",
                                data: {
                                    identifier: node.name,
                                }
                            });
                        }
                    }
                };
            }
        },
        // This produces a warning for lines like '/***************/' or '///////////////////'
        "no-comment-separators": {
            create: function(context) {
                const sourceCode = context.getSourceCode();

                function classifyChar(c) {
                    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') {
                        return ' ';
                    } else if (c === '*' || c === '/') {
                        return 'C';
                    }
                    return 'X';
                }

                return {
                    Program() {
                        const comments = sourceCode.getAllComments();
                        //console.log(JSON.stringify(comments));

                        comments.filter(token => token.type !== "Shebang").forEach((comment) => {

                            // compute the maximum length of consecutive '/' or '*' characters
                            const txt = comment.value;
                            
                            let classification = txt.split('').map(classifyChar);
                            if (classification.some(c => c === 'X')) {
                                return;
                            }

                            let consecutiveChunkLengths = classification
                                .join('')
                                .split(' ')
                                .filter(x => x !== '')
                                .map(x => x.length);

                            if (consecutiveChunkLengths.length === 0) {
                                return;
                            }

                            let maxConsecutiveCommentChars =
                                consecutiveChunkLengths.reduce((a, b) => Math.max(a, b));

                            let lineFraction = maxConsecutiveCommentChars / txt.length;
                            if (maxConsecutiveCommentChars > 10 && lineFraction > 0.75) {
                                context.report({
                                    node: comment,
                                    message: "Avoid using comments as separators"
                                });
                            }
                        });
                    }
                };
            }
        },
        "airbnb-style-block-comments": {
            /**
             * Please note: we only need to check if a block comment starts with a '*' + line feed (LF)
             * because we set  'multiline-comment-style' to 'starred-block'. See eslintrc file.
             */
            meta: {
                fixable: "code"
            },
            create: function(context) {
                const sourceCode = context.getSourceCode();
                return {
                    Program() {
                        const comments = sourceCode.getAllComments();

                        comments.filter(token => token.type === "Block").forEach((blockComment) => {
                            const { value } = blockComment;

                            if (value.indexOf('eslint-disable') === 1) {
                                return;
                            }

                            const isDoubleStarSignature = (value[0] === '*' && !(value[1] !== '\n' && value[1] !== '\r'));

                            if (!isDoubleStarSignature) {
                                context.report({
                                    node: blockComment,
                                    message: 'Use airbnb-style comment blocks',
                                    fix: (fixer) => {
                                        const { range } = blockComment;
                                        //console.log(blockComment);
                                        return fixer.insertTextBeforeRange(
                                            [range[0] + 2, range[1]], '*'
                                        );
                                    }
                                });
                            }
                        });
                    }
                };
            }
        },
        "no-constructor-name": {
            create: function(context) {
                const sourceCode = context.getSourceCode();
                return {
                    Program() {
                        function getOccurrences(inputString, searchString) {
                            const result = [];
                            let index = inputString.indexOf(searchString);
                            while (index !== -1) {
                                result.push(index);
                                index = inputString.indexOf(searchString, index + 1);
                            }
                            return result;
                        }

                        const { text } = sourceCode;

                        getOccurrences(text, 'constructor.name')
                            .map((index) => ({
                                index,
                                node: sourceCode.getNodeByRangeIndex(index),
                                location: sourceCode.getLocFromIndex(index)
                            }))
                            .filter(({ node }) => !node || (node.type !== 'BlockStatement'))
                            .forEach(({ index, location }) => {
                                let reportContext = { node: context };
                                if (location) {
                                    reportContext = {
                                        loc: {
                                            start: { ...location },
                                            /**
                                             * TODO: This end location seems to have no effect:
                                             * https://eslint.org/docs/developer-guide/working-with-rules#contextreport
                                             */
                                            end: sourceCode.getLocFromIndex(index + 16)
                                        }
                                    };
                                }
                                console.log(JSON.stringify(reportContext));
                                context.report({
                                    ...reportContext,
                                    message: "Avoid using 'constructor.name' pattern. Code deployment involves minification, which mangles such functionality.",
                                });
                            });
                    }
                };
            }
        },
    }
}
