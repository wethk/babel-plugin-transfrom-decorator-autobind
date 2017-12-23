'use strict';

var generate = require('babel-generator');

var keyPathVisitor = function keyPathVisitor(obj, path, setValue) {
    return path.reduce(function (pre, next) {
        if (pre !== setValue) {
            var preValue = pre;
            var nextvalue = preValue[next];
            return !nextvalue ? setValue || undefined : nextvalue;
        } else {
            return setValue || undefined;
        }
    }, obj);
};

module.exports = function (babel) {
    var t = babel.types,
        template = babel.template;


    var needBindThisFuncSet = [];

    var existConstructor = false;

    var astFactory = {
        // 为下次做准备
        buildAssignment: function buildAssignment(left, right) {
            return t.assignmentExpression("=", left, right);
        },

        // 为下次做准备
        buildMemberExpression: function buildMemberExpression(arg) {
            return arg.reduce(function (pre, next, index) {
                if (index === 0) {
                    return t.memberExpression(t.identifier(pre), t.identifier(next));
                } else {
                    return t.memberExpression(t.memberExpression(pre), t.identifier(next));
                }
            });
            return t.memberExpression;
        },
        bindThisTemplate: function bindThisTemplate(funcName) {
            var buildRequire = template('\n                this.FUNCNAME = this.FUNCNAME.bind(this);\n            ');

            var ast = buildRequire({
                FUNCNAME: t.identifier(funcName)
            });

            return ast;
        }
    };

    var visitForInitConfig = {
        ClassMethod: function ClassMethod(path) {

            var node = path.node;
            var classMethodName = keyPathVisitor(node, ['key', 'name']);
            var decoratorName = keyPathVisitor(node, ['decorators', 0, 'expression', 'name']);
            if (decoratorName === 'autobind') {
                var funcName = keyPathVisitor(node, ['key', 'name']);
                needBindThisFuncSet.push(funcName);
            }
            if (classMethodName === 'constructor') {
                existConstructor = true;
            }
        }
    };

    var visitForGenerate = {
        ClassMethod: function ClassMethod(path, state) {
            var node = path.node;
            var classMethodName = keyPathVisitor(node, ['key', 'name']);

            if (classMethodName === 'constructor') {
                needBindThisFuncSet.forEach(function (funcName) {
                    path.get('body').pushContainer('body', astFactory.bindThisTemplate(funcName));
                });
            }
        },
        Decorator: function Decorator(path) {
            var node = path.node;
            var decoratorName = keyPathVisitor(node, ['expression', 'name']);
            if (decoratorName === 'autobind') {
                path.remove();
            }
        }
    };

    var visitor = {
        ClassDeclaration: function ClassDeclaration(path, state) {
            path.traverse(visitForInitConfig, state);

            if (!existConstructor) {
                path.get('body').unshiftContainer('body', t.classMethod("constructor", t.identifier("constructor"), [], t.blockStatement([])));
            }

            path.traverse(visitForGenerate, state);
        }
    };

    return {
        visitor: visitor
    };
};
