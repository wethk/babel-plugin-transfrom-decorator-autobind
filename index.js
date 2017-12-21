const fs  = require('fs');
const generate = require('babel-generator')

const { writeFileSync } = fs;

const keyPathVisitor = (obj,path,setValue) =>{
    const pathLength = path.length;
    return path.reduce((pre,next)=>{
        if(pre !== setValue ){
            const preValue = pre;
            const nextvalue =  preValue[next]
            return !nextvalue?
                setValue || undefined
                :
                nextvalue;
        }else{
            return setValue || undefined
        }
    },obj)
}

const a = {
    a:
}


module.exports = function(babel){

    const {types:t, template} = babel;

    const needBindThisFuncSet = []
    
    let existConstructor = false;


    const astFactory = {
        // 为下次做准备
        buildAssignment(left, right) {
            return t.assignmentExpression("=", left, right);
        },
        // 为下次做准备
        buildMemberExpression(arg){
            return arg.reduce((pre,next,index)=>{
                if(index === 0){
                    return  t.memberExpression(
                        t.identifier(pre),
                        t.identifier(next)
                    )
                }else{
                    return t.memberExpression(
                        t.memberExpression(pre),
                        t.identifier(next)
                    )
                }
            })
            return t.memberExpression
        },
        bindThisTemplate(funcName){
            const buildRequire = template(`
                this.FUNCNAME = this.FUNCNAME.bind(this);
            `);
          
          const ast = buildRequire({
            FUNCNAME: t.identifier(funcName),
          });

          return ast;
        }
        
    }

    const visitForInitConfig = {
        ClassMethod(path){
            
            const node = path.node;
            const classMethodName = keyPathVisitor(node,['key','name'])
            const decoratorName = keyPathVisitor(node,['decorators',0,'expression','name'])
            if(decoratorName === 'autobind'){
                const funcName = keyPathVisitor(node,['key','name'])
                needBindThisFuncSet.push(funcName);

            }
            if(classMethodName === 'constructor'){
                existConstructor = true
            }
        }
    }

    const visitForGenerate = {
        ClassMethod(path,state){
            const node = path.node;
            const classMethodName = keyPathVisitor(node,['key','name'])

            if(classMethodName === 'constructor'){
                needBindThisFuncSet.forEach((funcName)=>{
                    path.get('body').pushContainer('body', astFactory.bindThisTemplate(funcName));
                })
            }
        },
        Decorator(path){
            path.remove()
        }
    }

    const visitor = {
        ClassDeclaration(path,state){
            path.traverse(visitForInitConfig, state);

            if(!existConstructor){
                path.get('body').unshiftContainer('body', t.classMethod(
                    "constructor",
                    t.identifier("constructor"),
                    [],
                    t.blockStatement([]),
                ));
            }

            path.traverse(visitForGenerate, state);
        }
    }
    
    return {
        visitor
    }
} 